#! /usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import rollup from "./lib/rollup.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const entry = path.resolve(__dirname, "src/main.js");
const output = path.resolve(__dirname, "./dist/bundle.js");

rollup(entry, output);
