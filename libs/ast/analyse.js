import walk from "./walk.js";
import Scope from "./scope.js";
import { hasOwnProperty } from "../utils.js";
/**
 *
 * @param {*} ast  语法🌲
 * @param {*} code 源代码
 * @param {*} module 模块
 */
function analyse(ast, code, module) {
  ast.body.forEach((statement) => {
    Object.defineProperties(statement, {
      _included: {
        value: false,
        writable: true,
      },
      _module: {
        value: module,
      },
      _source: {
        value: code.snip(statement.start, statement.end),
      },
      // 依赖的变量
      _dependsOn: {
        value: {},
        writable: true,
      },
      // 自己定义的变量
      _defines: {
        value: {},
        writable: true,
      },
      _modifies: {
        value: {},
        writable: true,
      },
    });
    // 找出导入的变量
    if (statement.type === "ImportDeclaration") {
      // 来源文件的相对路径
      const source = statement.source.value;
      // 导入变量数组
      const specifiers = statement.specifiers;
      // console.log("specifiers: ", specifiers);
      specifiers.forEach((specifier) => {
        const importName = specifier.imported.name;
        const localName = specifier.local.name;
        // 导入的变量处理
        module.imports[localName] = {
          source,
          importName,
        };
      });
    } else if (statement.type === "ExportNamedDeclaration") {
      const declaration = statement.declaration;
      // export const abc = 'abc'
      if (declaration && declaration.type === "VariableDeclaration") {
        const declarations = declaration.declarations;
        declarations.forEach((VariableDeclarator) => {
          const localName = VariableDeclarator.id.name;
          const exportName = localName;
          module.exports[exportName] = {
            localName,
          };
        });
      }
    }
  });
  // console.log("module", module);

  let currentScope = new Scope({ name: "top_level_scope" });
  // 创建作用域链，分析模块内使用的变量是本地还是引入的
  ast.body.forEach((statement) => {
    function addToScope(name) {
      currentScope.add(name);
      // 当前作用域是顶级作用域
      if (!currentScope.parent) {
        statement._defines[name] = true;
        // 模块定义的函数语句（此语句定义了一个顶级变量
        module.definitions[name] = statement;
      }
    }
    function checkForReads(node) {
      if (node.type === "Identifier") {
        // console.log(node.name, "namemeee ");
        // statement 语句依赖了哪些变量
        statement._dependsOn[node.name] = true;
      }
    }
    function checkForWrites(node) {
      function addNode(node) {
        const { name } = node;
        statement._modifies[name] = true;
        // 模块的修改
        if (!hasOwnProperty.call(module.modifications, name)) {
          // 修改不止一次
          module.modifications[name] = [];
        }
        module.modifications[name].push(statement);
      }
      if (node.type === "AssignmentExpression") {
        addNode(node.left);
      } else if (node.type === "UpdateExpression") {
        addNode(node.argument);
      }
    }
    // 深度优先遍历每一个语句
    walk(statement, {
      enter(node) {
        checkForReads(node);
        checkForWrites(node);
        let newScope;
        switch (node.type) {
          case "FunctionDeclaration":
          case "ArrowFunctionDeclaration": {
            addToScope(node.id.name);
            const names = node.params.map((param) => param.name);
            newScope = new Scope({
              name: node.id.name,
              parent: currentScope,
              names, // 默认依赖的变量（参数）
            });
            break;
          }
          case "VariableDeclaration": {
            node.declarations.forEach((declaration) => {
              addToScope(declaration.id.name);
            });
            break;
          }
          default:
            break;
        }

        if (newScope) {
          Object.defineProperty(node, "_scope", {
            value: newScope,
          });
          currentScope = newScope;
        }
      },
      leave(node) {
        if (Object.prototype.hasOwnProperty.call(node, "_scope")) {
          currentScope = currentScope.parent;
        }
      },
    });
  });

  // ast.body.forEach((statement) => {
  //   console.log("defines", statement._defines);
  //   console.log("_dependsOn", statement._dependsOn);
  // });
}

export default analyse;
