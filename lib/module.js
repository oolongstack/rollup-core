import { parse } from "acorn";
import MagicString from "magic-string";
import analyse from "./ast/analyse.js";
export class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code);
    this.path = path;
    this.bundle = bundle;
    this.ast = parse(code, {
      ecmaVersion: 8,
      sourceType: "module",
    });
    // 分析语法树
    analyse(this.ast, this.code, this);
  }
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach((statement) => {
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });

    return allStatements;
  }
  expandStatement(statement) {
    statement._included = true;
    let result = [];
    result.push(statement);
    return result;
  }
}
