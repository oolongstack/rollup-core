import { parse } from "acorn";
import MagicString from "magic-string";
import analyse from "./ast/analyse.js";
import { hasOwnProperty } from "./utils.js";
export class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code);
    this.path = path;
    this.bundle = bundle;
    this.ast = parse(code, {
      ecmaVersion: 8,
      sourceType: "module",
    });
    // 该模块的导入导出
    this.imports = {};
    this.exports = {};

    // 定义语句
    this.definitions = {};
    // 分析语法树
    analyse(this.ast, this.code, this);

    // console.log(this.imports);
    // console.log(this.definitions, "1");
  }
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach((statement) => {
      // 导入语句
      if (statement.type === "ImportDeclaration") return;
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });

    return allStatements;
  }
  expandStatement(statement) {
    statement._included = true;
    let result = [];
    const _dependsOn = Object.keys(statement._dependsOn);
    console.log("_dependsOn: ", _dependsOn);
    _dependsOn.forEach((name) => {
      // 找到此变量的定义语句
      let definitions = this.define(name);
      result.push(...definitions);
    });
    result.push(statement);
    return result;
  }
  define(name) {
    // 区分此变量是函数内变量还是外部导入的
    if (hasOwnProperty(this.imports, name)) {
      // source ./msg
      const { source, importName } = this.imports[name];
      // source 是相对于当前模块的路径 this.path 是当前模块的绝对路径
      const importedModule = this.bundle.fetchModule(source, this.path);
      console.log("importedModule: ", importedModule);
      const { localName } = importedModule.exports[importName]; // msg.js exports
      // 递归查找
      return importedModule.define(localName);
    } else {
      // 本地模块 非导入模块
      let statement = this.definitions[name];
      console.log("statement: ", statement);
      if (statement && !statement._included) {
        return this.expandStatement(statement);
      } else {
        return [];
      }
    }
  }
}
