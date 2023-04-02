import MagicString from "magic-string";
import { parse } from "acorn";
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
}
