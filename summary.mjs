import fs from "node:fs";
import util from "node:util";
// --title <title>
const options = util.parseArgs({
    options: {
        title: {
            type: "string"
        }
    }
});

const title = options.values.title ?? "Summary";
const readJSON = async (path) => {
    return JSON.parse(fs.readFileSync(path, "utf8"));
};
/** @type import("./src/watch-list.ts").WatchItem[] **/
const watchList = await readJSON("data/watch-list.json");
/** @type import("./src/rss-list.ts").FeedItem[] **/
const feedList = await readJSON("data/feed-list.json");
/** @type import("./src/rss-list.ts").FeedItem[] **/
const opmlList = await readJSON("data/opml-list.json");
const noHaveFeedList = watchList.filter((site) => {
    return !feedList.some((feed) => {
        return feed.url === site.url;
    });
});

const summary = {
    total: watchList.length,
    feeds: feedList.length,
    opmls: opmlList.length
};
console.log(`# ${title}
- total: ${summary.total}
- feeds: ${summary.feeds}
- opmls: ${summary.opmls}

<details>
<summary>No RSS list: ${noHaveFeedList.length}</summary>

${noHaveFeedList.map((site) => {
    return `- <${site.url}>`;
}).join("\n")}

</details>

`);
