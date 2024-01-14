import { fetchItems } from "@jser/data-fetcher";
import type { JserItem } from "@jser/data-fetcher";
import dayjs from "dayjs";
import groupBy from "lodash.groupby";
import * as fs from "fs";
import path from "path";

export type WatchItem = {
    count: number;
    domain: string;
    tags: string[];
    example: {
        title: string;
        url: string;
    };
    rssUrl?: string;
};
// Match →　title and url
type RuleItem<T extends RegExpMatchArray = RegExpMatchArray> = {
    match: (item: JserItem) => T | null;
    // title: ({ item, match }: { item: JserItem; match: T }) => string;
    url: ({ item, match }: { item: JserItem; match: T }) => string;
    rssUrl?: ({ item, match }: { item: JserItem; match: T }) => string;
};
const Rules: RuleItem[] = [
    // Zenn
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/zenn\.dev\/(?<name>[-\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // qiita
    // https://qiita.com/koedamon/items/3e64612d22f3473f36a4
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/qiita\.com\/(?<name>[-\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // Note
    // https://note.com/takamoso/n/n32c4e6904cf7
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/note\.com\/(?<name>[-\w+])\//);
        },
        url: ({ match }) => match[0]
    },
    // Medium
    // https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/medium\.com\/(?<name>[-@\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // https://dev.to
    // https://dev.to/voraciousdev/a-practical-guide-to-the-web-cryptography-api-4o8n
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/dev\.to\/(?<name>[-\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // speakerdeck
    // https://speakerdeck.com/jmblog
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/speakerdeck\.com\/(?<name>[-\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // slideshare
    // https://www2.slideshare.net/techblogyahoo
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/(www\d)\.slideshare\.net\/(?<name>[-\w]+)\//);
        },
        url: ({ match }) => match[0]
    },
    // GitHub
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/github\.com\/(?<name>[^/]+)\/(?<repo>[^/]+)\/?.*?/);
        },
        url: ({ match }) => `https://github.com/${match[1]}/${match[2]}`,
        // e.g. https://github.com/vuejs/core/releases.atom
        rssUrl: ({ match }) => `https://github.com/${match[1]}/${match[2]}/releases.atom`
    },
    // gist.github.com
    // https://gist.github.com/andrewbranch/79f872a8b9f0507c9c5f2641cfb3efa6
    // url
    // https://gist.github.com/andrewbranch
    // RSS
    // https://gist.github.com/andrewbranch.atom
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/gist\.github\.com\/(?<name>[^/]+)\/?.*?/);
        },
        url: ({ match }) => `https://gist.github.com/${match[1]}`,
        rssUrl: ({ match }) => `https://gist.github.com/${match[1]}.atom`
    },
    // docswell
    // e.g. https://www.docswell.com/s/takuyaot/5DE47L-entraid
    // url
    // https://www.docswell.com/user/takuyaot
    // RSS
    // https://www.docswell.com/user/takuyaot/feed
    {
        match: (item: JserItem) => {
            return item.url.match(/https:\/\/www\.docswell\.com\/s\/(?<name>[^/]+)\/[^/]+/);
        },
        url: ({ match }) => `https://www.docswell.com/user/${match[1]}`,
        rssUrl: ({ match }) => `https://www.docswell.com/user/${match[1]}/feed`
    }
];
const ignoreDomains: string[] = [
    // "github.com",
    "npmjs.com",
    "shop.oreilly.com",
    "oreilly.co.jp",
    "amazon.com",
    "www.amazon.co.jp"
];

export const createInfo = (item: JserItem) => {
    for (const rule of Rules) {
        const matchRule = rule.match(item);
        if (matchRule) {
            return {
                domain: rule.url({ item, match: matchRule }),
                item,
                rssUrl: rule.rssUrl ? rule.rssUrl({ item, match: matchRule }) : undefined
            };
        }
    }
    // default
    return {
        title: item.title,
        domain: new URL(item.url).origin.replace(/^https?/, "https"),
        item
    };
};

export const collection = async ({ since }: { since: Date }) => {
    const items = await fetchItems();
    const filteredItems = items.filter((item) => {
        if (dayjs(item.date).isBefore(since)) {
            return false;
        }
        return !ignoreDomains.some((domain) => new URL(item.url).origin.includes(domain));
    });
    return groupBy(
        filteredItems.map((item) => createInfo(item)),
        (r) => r.domain
    );
};

if (require.main === module) {
    (async function () {
        const r = await collection({ since: dayjs().subtract(2, "year").toDate() });
        const results: WatchItem[] = [];
        Object.entries(r)
            .sort(([, aItems], [, bItems]) => {
                return bItems.length - aItems.length;
            })
            .forEach(([domain, items]) => {
                console.log(items.length, domain);
                const latestItem = items.at(-1);
                if (!latestItem) {
                    return;
                }
                results.push({
                    count: items.length,
                    domain: domain,
                    tags: Array.from(new Set(items.flatMap((item) => item.item.tags || []))),
                    example: {
                        title: latestItem.item.title,
                        url: latestItem.item.url
                    },
                    rssUrl: latestItem.rssUrl
                });
            });
        fs.mkdirSync(path.join(__dirname, "../data/"), {
            recursive: true
        });
        fs.writeFileSync(path.join(__dirname, "../data/watch-list.json"), JSON.stringify(results, null, 2), "utf-8");
    })();
}
