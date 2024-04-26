#!/usr/bin/env node

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

async function build() {
    const outputDir = "./dist";
    const publicDir = "./public";
    const entryDir = "./entry";

    let isDev = false;

    if (process.argv.includes("-d")) {
        isDev = true;
    }

    let watch = false;
    if (process.argv.includes("-w")) {
        watch = true;
    }

    await fs.promises.mkdir(`${outputDir}/js`, {recursive: true});

    for (let file of await fs.promises.readdir(publicDir)) {
        await fs.promises.cp(`${publicDir}/${file}`, `${outputDir}/${file}`, {recursive: true});
    }

    let entryPoints = [];
    let entryFiles = await fs.promises.readdir(entryDir);
    for (let entryFile of entryFiles) {
        if (!entryFile.endsWith(".js")) {
            continue;
        }
        entryPoints.push(path.join(entryDir, entryFile));
    }

    let ctx = await esbuild.context({
        entryPoints: entryPoints,
        outdir: `${outputDir}/js`,
        bundle: true,
        minify: !isDev,
        format: "esm"
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

build().catch((err) => {
    console.log(err);
    process.exit(1);
});
