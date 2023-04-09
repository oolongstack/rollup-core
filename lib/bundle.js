import path from "path";
import { Bundle as MSBubdle } from "magic-string";
import fs from "fs";
import { Module } from "./module.js";
export class Bundle {
  constructor(options) {
    // 入口文件路径（转为绝对路径）
    this.entryPath = path.resolve(options.entry.replace(/\.js$/, "") + ".js");
    // 模块集合
    this.modules = new Set();
  }
  build(output) {
    const entryModule = this.fetchModule(this.entryPath);
    this.statements = entryModule.expandAllStatements();
    console.log("this.statements: ", this.statements);
    const { code } = this.generate();
    //
    fs.writeFileSync(output, code);
  }
  /**
   * 创建模块实例，
   * @param {*} importee 被引入的模块
   * @param {*} importer 主动引入的模块
   * @returns
   */
  fetchModule(importee, importer) {
    let route;
    if (!importer) {
      route = importee;
    } else {
      if (path.isAbsolute(importee)) {
        route = importee.replace(/\.js$/, "") + ".js";
      } else {
        route = path.resolve(
          path.dirname(importer),
          importee.replace(/\.js$/, "") + ".js"
        );
      }
    }
    if (route) {
      const code = fs.readFileSync(route, "utf-8");
      const module = new Module({
        code,
        path: route,
        bundle: this,
      });
      this.modules.add(module);
      return module;
    }
  }
  generate() {
    let bundle = new MSBubdle();
    this.statements.forEach((statement) => {
      const source = statement._source.clone();
      if (statement.type === "ExportNamedDeclaration") {
        source.remove(statement.start, statement.declaration.start);
      }
      bundle.addSource({
        content: source,
        separator: "\n",
      });
    });
    return { code: bundle.toString() };
  }
}
