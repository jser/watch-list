import React, { useState } from "react";
import indexJSON from "../data/watch-list.json";

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
                    <a href={props.domain}>{props.domain}</a>
                </h3>
                <span>{props.count}+</span>
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
                <Item {...item} key={item.domain} toggleTag={toggleTag} />
            ))}
        </div>
    );
};
