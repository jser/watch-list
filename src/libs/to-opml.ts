import type { FeedItem } from "../rss-list";

export const createOPML = (feeds: FeedItem[]) => {
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
