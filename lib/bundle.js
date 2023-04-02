import path from "path";
import fs from "fs";
import { Module } from "./module.js";
export class Bundle {
  constructor(options) {
    // 入口文件路径（转为绝对路径）
    this.entryPath = path.resolve(options.entry);
  }
  build(output) {
    const entryModule = this.fetchModule(this.entryPath);
    console.log("entryModule: ", entryModule);
  }
  fetchModule(importee) {
    let route = importee;
    if (route) {
      const code = fs.readFileSync(route, "utf-8");
      const module = new Module({
        code,
        path: route,
        bundle: this,
      });

      return module;
    }
  }
}
