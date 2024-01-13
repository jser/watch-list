import * as fs from "node:fs/promises";
import path from "node:path";
import type { WatchItem } from "./watch-list";
import { chromium } from "playwright";

const DATA_DIR = path.join(__dirname, "../data");
// get RSS feed from the url
const RSS_LINK_TYPES = [
    "application/rss+xml",
    "application/atom+xml",
    "application/rdf+xml",
    "application/rss",
    "application/atom",
    "application/rdf",
    "text/rss+xml",
    "text/atom+xml",
    "text/rdf+xml",
    "text/rss",
    "text/atom",
    "text/rdf"
];
export const getFeeds = async (url: string) => {
    const browser = await chromium.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(url);
    // get link rel for RSS
    const linkSelector = RSS_LINK_TYPES.map((type) => `link[type="${type}"]`).join(",");
    const links = await page.$$(linkSelector);
    const feedLinks = await Promise.all(
        links.map(async (link) => {
            const href = (await link.getAttribute("href")) ?? "";
            return new URL(href, url).href;
        })
    );
    // collection links to /rss/ or /feed/ or rss.xml or feed.xml or atom.xml or feed.rss
    const feedLinks2 = await page.$$eval("a", (links) => {
        const feedLinks = [];
        for (const link of links) {
            const href = link.getAttribute("href");
            if (!href) {
                continue;
            }
            const url = new URL(href, location.href);
            if (
                url.pathname.includes("/rss/") ||
                url.pathname.includes("/feed/") ||
                url.pathname.endsWith("rss.xml") ||
                url.pathname.endsWith("feed.xml") ||
                url.pathname.endsWith("atom.xml") ||
                url.pathname.endsWith("feed.rss")
            ) {
                feedLinks.push(url.href);
            }
        }
        return feedLinks;
    });
    await page.close();
    await browser.close();
    return [...feedLinks, ...feedLinks2].filter((feedUrl) => {
        // remove empty and self url and duplicated
        return feedUrl && feedUrl !== url && !feedLinks.includes(feedUrl);
    });
};
type FeedItem = {
    domain: string;
    feeds: string[];
};
// data/feed-list.json as storage
const createOPML = (feeds: FeedItem[]) => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
<head>
    <title>JSer.info Watch List</title>
</head>
<body>
`;
    const footer = `
</body>
</opml>
`;
    const escapeXML = (text: string) => {
        return text.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case "&":
                    return "&amp;";
                case "'":
                    return "&apos;";
                case '"':
                    return "&quot;";
            }
            return c;
        });
    };
    const body = feeds
        .map((feed) => {
            // remove https:// or http://
            const title = feed.domain.replace(/^https?:\/\//, "");
            const xmlUrl = feed.feeds[0];
            return `<outline text="${escapeXML(title)}" title="${escapeXML(title)}" type="rss" xmlUrl="${xmlUrl}"/>`;
        })
        .join("\n");
    return header + body + footer;
};

export const storage = {
    get: async (): Promise<FeedItem[]> => {
        try {
            return JSON.parse(await fs.readFile(path.join(DATA_DIR, "feed-list.json"), "utf8"));
        } catch {
            return [];
        }
    },
    set: async (feeds: FeedItem[]) => {
        await fs.writeFile(path.join(DATA_DIR, "feed-list.json"), JSON.stringify(feeds, null, 2));
        await fs.writeFile(path.join(DATA_DIR, "feed-list.opml"), createOPML(feeds));
    }
};
const main = async () => {
    const watchList: WatchItem[] = JSON.parse(await fs.readFile(path.join(DATA_DIR, "watch-list.json"), "utf8"));
    const feeds = await storage.get();
    const feedsMap = new Map(feeds.map((feed) => [feed.domain, feed]));
    const newFeeds: FeedItem[] = [];
    const processItem = async (item: WatchItem) => {
        const { domain, rssUrl } = item;
        const cached = feedsMap.get(domain);
        if (cached) {
            console.debug("Hit cache", domain, cached.feeds);
            return cached;
        }
        if (rssUrl) {
            console.debug("Hit rssUrl", domain, rssUrl);
            return {
                domain: domain,
                feeds: [rssUrl]
            };
        }
        console.debug("try feed from domain", domain);
        const feeds = await getFeeds(domain).catch(() => []);
        if (feeds.length > 0) {
            console.debug("Got feeds", domain, feeds);
            return {
                domain: domain,
                feeds
            };
        }
        // example
        const normalizeExample = (url: string) => {
            // if /blog/ included, remove it
            // https://example.com/blog/<title> => https://example.com/blog/
            if (url.includes("/blog/")) {
                return url.replace(/\/blog\/.*/, "/blog/");
            }
            return url;
        };
        const normalizedExampleUrl = normalizeExample(item.example.url);
        console.debug("try feed from example", normalizedExampleUrl);
        const feedsForExample = await getFeeds(normalizedExampleUrl).catch(() => []);
        if (feedsForExample.length > 0) {
            console.debug("Got feeds for example", item.example.url, feedsForExample);
            return {
                domain: item.domain,
                feeds: feedsForExample
            };
        }
        console.debug("No feeds", domain);
        return;
    };
    for (const item of watchList) {
        const feedItem = await processItem(item);
        if (feedItem) {
            newFeeds.push(feedItem);
        }
    }
    await storage.set(newFeeds);
};

if (require.main === module) {
    main()
        .then(() => {
            console.log("Done");
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
