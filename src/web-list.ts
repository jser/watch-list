// merge watch-list and rss-list for website
import watchList from "../data/watch-list.json";
import rssList from "../data/feed-list.json";
import path from "path";
import * as fs from "fs";

const DATA_DIR = path.join(__dirname, "../data");
export type WebItem = {
    count: number;
    url: string;
    tags: string[];
    example: {
        title: string;
        url: string;
    };
    rssUrl?: string;
};
const main = async () => {
    const webList: WebItem[] = [];
    for (const item of watchList) {
        const rssItem = rssList.find((rss) => rss.url === item.url);
        const rssUrl = rssItem?.feeds[0];
        const webItem: WebItem = {
            count: item.count,
            url: item.url,
            tags: item.tags,
            example: item.example,
            rssUrl
        };
        webList.push(webItem);
    }
    // write to file
    const webListFile = path.join(DATA_DIR, "web-list.json");
    await fs.promises.writeFile(webListFile, JSON.stringify(webList, null, 2));
};
if (require.main === module) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
