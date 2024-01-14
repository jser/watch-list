import * as fs from "node:fs/promises";
import path from "node:path";
import type { WatchItem } from "./watch-list";
import { chromium } from "playwright";
// get RSS feed from the url
const DATA_DIR = path.join(__dirname, "../data");
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
export type FeedItem = {
    url: string;
    feeds: string[];
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
    }
};
const main = async () => {
    const watchList: WatchItem[] = JSON.parse(await fs.readFile(path.join(DATA_DIR, "watch-list.json"), "utf8"));
    const feeds = await storage.get();
    const pAll = await import("p-all").then((m) => m.default);
    const feedsMap = new Map(feeds.map((feed) => [feed.url, feed]));
    const newFeeds: FeedItem[] = [];
    const processItem = async (
        item: WatchItem,
        meta: {
            logNamespace: string;
        }
    ) => {
        const { url, rssUrl } = item;
        if (rssUrl) {
            console.debug(`[${meta.logNamespace}] Hit rssUrl`, url, rssUrl);
            return {
                url,
                feeds: [rssUrl]
            };
        }
        const cached = feedsMap.get(url);
        if (cached) {
            console.debug(`[${meta.logNamespace}] Hit cache`, url, cached.feeds);
            return cached;
        }
        console.debug(`[${meta.logNamespace}] try feed from url`, url);
        const feeds = await getFeeds(url).catch(() => []);
        if (feeds.length > 0) {
            console.debug(`[${meta.logNamespace}] Got feeds`, url, feeds);
            return {
                url,
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
        console.debug(`[${meta.logNamespace}] try feed from example`, normalizedExampleUrl);
        const feedsForExample = await getFeeds(normalizedExampleUrl).catch(() => []);
        if (feedsForExample.length > 0) {
            console.debug(`[${meta.logNamespace}] Got feeds for example`, item.example.url, feedsForExample);
            return {
                url,
                feeds: feedsForExample
            };
        }
        console.debug(`[${meta.logNamespace}] No feeds`, url);
        return;
    };
    const promises = watchList.map((item, index) => {
        return async function processWork() {
            const feedItem = await processItem(item, {
                logNamespace: `${index + 1}/${watchList.length}`
            });
            if (feedItem) {
                newFeeds.push(feedItem);
            }
        };
    });
    await pAll(promises, { concurrency: 24 });
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
