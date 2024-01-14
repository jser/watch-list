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
const watchList = await readJSON("data/watch-list.json");
const feedList = await readJSON("data/feed-list.json");
const opmlList = await readJSON("data/opml-list.json");
const summary = {
    total: watchList.length,
    feeds: feedList.length,
    opmls: opmlList.length
};
console.log(`# ${title}
- total: ${summary.total}
- feeds: ${summary.feeds}
- opmls: ${summary.opmls}
`);
