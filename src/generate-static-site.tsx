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
                <meta name="description" content="JavaScript information source on JSer.info">
                <style>${baseCSS}${appCSS}</style>
            </head>
            <body>
                <header>
                    <h1>JSer.info Watch List</h1>
                    <p>A collection of items that are explained in <a href="https://jser.info">JSer.info</a>.<br/>
                    You can found JavaScript resource from <a href="https://jser.info">JSer.info</a> resources.</p>
                    <ul>
                    <li>Last Updated: <time datetime="${isoString}">${isoString}</time></li>
                    <li>Source: <a href="https://github.com/jser/watch-list">@jser/watch-list</a></li>
                    </ul>
                </header>
                <main role="main" id="main">${html}</main>
            </body>
        </html>
    `;
};
