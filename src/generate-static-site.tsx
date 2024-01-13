import React from "react";
import ReactDOMServer from "react-dom/server";
import * as fs from "fs";
import path from "path";
import { App } from "./App";

export const generateStaticSite = () => {
    const baseCSS = fs.readFileSync(path.join(__dirname, "index.css"), "utf-8");
    const appCSS = fs.readFileSync(path.join(__dirname, "App.css"), "utf-8");
    const isoString = new Date().toISOString();
    const html = ReactDOMServer.renderToString(<App />);

    return `
        <!DOCTYPE html>
        <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <title>JSer.info Watch List</title>
                <meta name="description" content="JavaScript information source of JSer.info">
                <style>${baseCSS}${appCSS}</style>
            </head>
            <body>
                <header>
                    <h1>JSer.info Watch List</h1>
                    <p><a href="https://jser.info">JSer.info</a>で2年以内に紹介したことがあるサイトの一覧です。<br/>
                    生きているJavaScriptの情報源として利用できます。<br/>
                    OPML Feedを使い、サイトのRSSフィードをまとめて購読できます。</p>
                    <ul>
                    <li>OPML Feed: <a href="https://jser.info/watch-list/data/feed-list.opml">feed-list.opml</a></li>
                    <li>Source: <a href="https://github.com/jser/watch-list">@jser/watch-list</a></li>
                    <li>Last Updated: <time datetime="${isoString}">${isoString}</time></li>
                    </ul>
                </header>
                <main role="main" id="main">${html}</main>
            </body>
        </html>
    `;
};
