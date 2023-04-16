import path from "path";
import fs from "fs";
import Module from "./module.js";
import { Bundle as MagicStringBundle } from "magic-string";
class Bundle {
  constructor(options) {
    // 入口文件的绝对路径
    this.entryPath = path.resolve(options.entry.replace(/\.js/, "") + ".js");
    // 所有模块
    this.modules = new Set();
  }
  build(output) {
    // 处理模块
    const entryModule = this.fetchModule(this.entryPath);
    this.statements = entryModule.expandAllStatements();
    // console.log("this.statements: ", this.statements);
    const { code } = this.generate();
    console.log("code: ", code);
    fs.writeFileSync(output, code);
  }
  /**
   * 处理模块
   * @param {*} importee 被引入的模块
   * @param {*} importer 引入的模块
   */
  fetchModule(importee, importer) {
    let route;
    if (!importer) {
      route = importee.replace(/\.js/, "") + ".js";
    } else {
      if (path.isAbsolute(importee)) {
        route = importee.replace(/\.js/, "") + ".js";
      } else {
        route =
          path.resolve(path.dirname(importer), importee).replace(/\.js/, "") +
          ".js";
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
    let bundle = new MagicStringBundle();
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

    return {
      code: bundle.toString(),
    };
  }
}

export default Bundle;
