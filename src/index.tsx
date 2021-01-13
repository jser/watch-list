import React from "react";
import ReactDOMServer from "react-dom/server";
import indexJSON from "../build/index.json";
import * as fs from "fs";
import path from "path";

export const Item = (props: typeof indexJSON[0]) => {
    return (
        <div className={"Item"}>
            <div className={"Item-Main"}>
                <h3>
                    <a href={props.domain}>{props.domain}</a>
                </h3>
                <span>{props.count}+</span>
            </div>
            <footer>
                <p>
                    {props.tags.map((tag: string) => (
                        <span key={tag} className={"Item-Tag"}>
                            {tag}
                        </span>
                    ))}
                </p>
                <p>
                    Example: <a href={props.example.url}>{props.example.title}</a>
                </p>
            </footer>
        </div>
    );
};
export const App = () => {
    return (
        <div className={"App"}>
            {indexJSON.map((item) => (
                <Item {...item} key={item.domain} />
            ))}
        </div>
    );
};

if (require.main === module) {
    const html = ReactDOMServer.renderToStaticMarkup(<App />);
    fs.mkdirSync(path.join(__dirname, "../dist/"), {
        recursive: true
    });
    const baseCSS = fs.readFileSync(path.join(__dirname, "index.css"), "utf-8");
    fs.writeFileSync(
        path.join(__dirname, "../dist/index.html"),
        `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>JSer.info Watch List</title>
    <style>
${baseCSS}
</style>
<style>
.Item-Main{
    display: flex;
}
.Item-Tag{
    border-radius: 12px;
    padding: 4px 8px;
    background: var(--nc-bg-1);
    color: var(--nc-tx-2);
    border: 1px solid var(--nc-lk-1);
}
</style>
</head>
<body>
<header>
    <h1>JSer.info Watch List</h1>
    <p>A collection of items that are explained in <a href="https://jser.info">JSer.info</a>.</p>
    <p>You can found JavaScript resource from <a href="https://jser.info">JSer.info</a> resources.</p>
    <p>Source: <a href="https://github.com/jser/watch-list">@jser/watch-list</a></p>
</header>
${html}
</body>
</html>
`,
        "utf-8"
    );
}
