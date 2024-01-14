// feed-list.json to feed-list.opml

import { FeedItem } from "./rss-list";
import FeedList from "../data/feed-list.json";
import * as fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "..", "data");
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
            const title = feed.url.replace(/^https?:\/\//, "");
            // 先頭のフィードがRSSフィードとして扱われる
            // 本文、コメントとなってるケースが多いため
            const xmlUrl = feed.feeds[0];
            return `<outline text="${escapeXML(title)}" title="${escapeXML(title)}" type="rss" xmlUrl="${xmlUrl}"/>`;
        })
        .join("\n");
    return header + body + footer;
};

// OPMLフィードには含めないサイト
// ニュースサイト、RSS向きではないサイト、フォーラム、流量が多すぎるサイトは除外する
const EXCLUDE_OPML_FEEDS = [
    // 汎用ニュースサイト
    "www.theverge.com",
    // コミュニティ
    "community.redwoodjs.com",
    // 流量が多い
    "scrapbox.io"
];

// フィードの重複を取り除く
const filterDuplicate = (feeds: FeedItem[]) => {
    const usedFeedUrlSet = new Set<string>();
    return feeds.filter((feedItem) => {
        const feedUrl = feedItem.feeds[0];
        if (!feedUrl) {
            return false;
        }
        if (usedFeedUrlSet.has(feedUrl)) {
            return false;
        }
        usedFeedUrlSet.add(feedUrl);
        return true;
    });
};

async function main() {
    const feeds = FeedList as FeedItem[];
    // remove ignore feeds
    const filteredList = feeds.filter((feed) => {
        const domain = new URL(feed.url).hostname;
        return !EXCLUDE_OPML_FEEDS.includes(domain);
    });
    const withoutDuplicate = filterDuplicate(filteredList);
    console.debug("Feed Count:", feeds.length);
    const opml = createOPML(withoutDuplicate);
    // write to data/feed-list.opml
    fs.writeFileSync(path.join(DATA_DIR, "feed-list.opml"), opml);
}

if (require.main === module) {
    main()
        .then(() => {
            console.log("done");
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
