import MagicString from "magic-string";
import { parse } from "acorn";
import analyse from "./ast/analyse.js";
import { hasOwnProperty } from "./utils.js";
class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code);
    this.path = path;
    this.bundle = bundle;
    this.ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    });
    this.imports = {};
    this.exports = {};
    // 存放变量修改语句
    this.modifications = {};

    // 存放该模块定义的顶级变量名字以及对应的语句
    this.definitions = {};
    // 分析语法树
    analyse(this.ast, this.code, this);
    // console.log(this.definitions, "definitions");
    // console.log(this.imports, "imports");
    // console.log(this.exports, "exports");
  }

  expandAllStatements() {
    const allStatements = [];
    this.ast.body.forEach((statement) => {
      // 不需要import语句了
      if (statement.type === "ImportDeclaration") return;
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });

    return allStatements;
  }
  expandStatement(statement) {
    statement._included = true;
    let result = [];
    // 找到使用的变量
    const _dependsOn = Object.keys(statement._dependsOn);
    _dependsOn.forEach((name) => {
      let definitions = this.define(name);
      result.push(...definitions);
    });
    result.push(statement);
    // 找到语句定义的变量，并且把变量的修改更新语句复制过来
    const defines = Object.keys(statement._defines);
    console.log("defines: ", defines);
    defines.forEach((name) => {
      // 找到该变量的修改语句
      const modifications =
        hasOwnProperty.call(this.modifications, name) &&
        this.modifications[name];

      if (modifications) {
        modifications.forEach((modification) => {
          if (!modification._included) {
            let statements = this.expandStatement(modification);
            result.push(...statements);
          }
        });
      }
    });
    return result;
  }
  define(name) {
    // 区分该变量是外部导入还是自己声明
    if (hasOwnProperty.call(this.imports, name)) {
      const { source, importName } = this.imports[name];
      // 加载另一个模块
      const importedModule = this.bundle.fetchModule(source, this.path);

      // console.log(importedModule.exports);
      const { localName } = importedModule.exports[importName];
      // 递归查找
      return importedModule.define(localName);
    } else {
      const statement = this.definitions[name];
      // console.log("statement: ", statement);
      if (statement && !statement._included) {
        return this.expandStatement(statement);
      } else {
        return [];
      }
    }
  }
}

export default Module;
