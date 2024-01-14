import React, { useState } from "react";
import indexJSON from "../data/web-list.json";

type ItemType = (typeof indexJSON)[0];

interface TagsProps {
    tags: string[];
    toggleTag: (tag: string) => void;
}

const Tags: React.FC<TagsProps> = ({ tags, toggleTag }) => {
    return (
        <>
            {tags.map((tag: string) => (
                <span key={tag} role="button" className={"Item-Tag"} onClick={() => toggleTag(tag)}>
                    {tag}
                </span>
            ))}
        </>
    );
};

type ItemProps = ItemType & {
    toggleTag: TagsProps["toggleTag"];
};

export const Item = (props: ItemProps) => {
    return (
        <div className={"Item"}>
            <div className={"Item-Main"}>
                <h3>
                    <a href={props.url}>{props.url}</a>
                    {props.rssUrl ? (
                        <a href={props.rssUrl} className={"Item-RSS"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path
                                    fill="#ffffff"
                                    d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z"
                                ></path>
                            </svg>
                        </a>
                    ) : undefined}
                </h3>
                <span className={"Item-Count"}>{props.count}+</span>
            </div>
            <footer>
                <p>
                    <Tags tags={props.tags} toggleTag={props.toggleTag} />
                </p>
                <p>
                    Example: <a href={props.example.url}>{props.example.title}</a>
                </p>
            </footer>
        </div>
    );
};

interface State {
    items: ItemType[];
    tags: string[];
}

export const App = () => {
    const [state, setState] = useState<State>({ items: indexJSON, tags: [] });

    const toggleTag = (tag: string) => {
        const tags = [...state.tags];
        const index = tags.findIndex((el) => el === tag);
        if (index > -1) {
            tags.splice(index, 1);
        } else {
            tags.push(tag);
        }
        const items = tags.length
            ? indexJSON.filter((item) => tags.every((tag) => item.tags.includes(tag)))
            : indexJSON;

        setState({ items, tags });
    };

    return (
        <div className={"App"}>
            {state.tags.length ? (
                <p>
                    Selected Tags: <Tags tags={state.tags} toggleTag={toggleTag} />
                </p>
            ) : undefined}

            {state.items.map((item) => (
                <Item {...item} key={item.url} toggleTag={toggleTag} />
            ))}
        </div>
    );
};
