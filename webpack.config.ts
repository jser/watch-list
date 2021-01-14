const HtmlWebpackPlugin = require("html-webpack-plugin");
import * as path from "path";
import { generateStaticSite } from "./src/generate-static-site";

module.exports = () => {
    const config = {
        entry: path.resolve("./src/index.tsx"),
        output: {
            path: path.resolve("./dist")
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"]
        },
        module: {
            rules: [
                {
                    test: /\.(jsx|tsx|js|ts)$/,
                    include: path.resolve("./src"),
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true,
                                silent: true
                            }
                        }
                    ]
                }
            ]
        },
        devServer: {
            port: 3001
        },
        plugins: [
            new HtmlWebpackPlugin({
                templateContent: generateStaticSite
            })
        ]
    };

    return config;
};
