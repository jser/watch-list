// feed-list.json to feed-list.opml

import { FeedItem } from "./rss-list";
import FeedList from "../data/feed-list.json";
import * as fs from "fs";
import path from "path";
import { createOPML } from "./libs/to-opml";

// OPMLフィードには含めないサイト
// ニュースサイト、RSS向きではないサイト、フォーラム、流量が多すぎるサイトは除外する
const EXCLUDE_OPML_FEEDS = [
    // 汎用ニュースサイト
    "www.theverge.com",
    // コミュニティ
    "community.redwoodjs.com",
    // 流量が多い
    "scrapbox.io",
    // リリースノートの粒度にばらつきがあるので、流量が多い
    "github.com"
];
const DATA_DIR = path.join(__dirname, "..", "data");
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
    const sortedList = withoutDuplicate.sort((a, b) => {
        const domainA = new URL(a.url).hostname;
        const domainB = new URL(b.url).hostname;
        return domainA.localeCompare(domainB);
    });
    console.debug("Feed Count:", feeds.length);
    console.debug("Filtered Feed Count:", sortedList.length);
    const opml = createOPML(sortedList);
    // write to data/opml-list.opml
    fs.writeFileSync(path.join(DATA_DIR, "opml-list.opml"), opml);
    // write to data/opml-list.json
    fs.writeFileSync(path.join(DATA_DIR, "opml-list.json"), JSON.stringify(sortedList, null, 2));
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
