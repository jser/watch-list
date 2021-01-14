import React from "react";
import indexJSON from "../build/index.json";

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
