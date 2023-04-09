import walk from "./walk.js";
import Scope from "./scope.js";
/**
 * 分析语法树
 * @param {*} ast
 * @param {*} code
 * @param {*} module
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
      // 记录该表达式（语句）记录了哪些变量
      _dependsOn: {
        value: {},
        writable: true,
      },
      // 记录该表达式 声明了哪些变量
      _defines: {
        value: {},
        writable: true,
      },
      definitions: {
        value: {},
        writable: true,
      },
    });

    // 找出倒入了哪些变量
    if (statement.type === "ImportDeclaration") {
      const source = statement.source.value;
      // 导入的ast变量数组
      statement.specifiers.forEach((specifier) => {
        const importName = specifier.imported.name; // import {name as cName} => name
        const localName = specifier.local.name; // cName
        // 当前模块的某一变量来自于用 源模块的某一变量
        module.imports[localName] = {
          source,
          importName,
        };
      });
    }
    // 找到导出了什么(该分支没处理重命名导出 默认导出)
    else if (statement.type === "ExportNamedDeclaration") {
      const declaration = statement.declaration;
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
  let currentScope = new Scope({ name: "top_level_scope" });
  // 并且要知道当前模块用了什么引入的变量
  ast.body.forEach((statement) => {
    function addToScope(name) {
      currentScope.add(name);
      // 说明是顶级作用域
      if (!currentScope.parent) {
        // 顶级作用域内自己定义的变量
        statement._defines[name] = true;
        module.definitions[name] = statement;
      }
    }

    // console.log("statement: ", statement);
    walk(statement, {
      enter(node) {
        // 说明用到了某一属性(还需要判断是否为模块内声明的属性)
        if (node.type === "Identifier") {
          statement._dependsOn[node.name] = true;
        }
        let newScope;
        // 遇到函数等就要创建新的作用域
        switch (node.type) {
          case "FunctionDeclaration": {
            // 当前函数添加到当前作用域中
            addToScope(node.id.name);
            // 函数的参数
            const names = node.params.map((param) => param.name);
            newScope = new Scope({
              name: node.id.name,
              parent: currentScope,
              names: names || [],
            });
            break;
          }
          case "VariableDeclaration": {
            node.declarations.forEach((declaration) => {
              addToScope(declaration.id.name);
            });
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
        // scope退回
        if (Object.prototype.hasOwnProperty.call(node, "_scope")) {
          // console.log("scope:", node._scope);
          currentScope = currentScope.parent;
        }
      },
    });
  });

  // ast.body.forEach((statement) => {
  //   console.log("statement defines:", statement._defines);
  //   console.log("statement dependsOn", statement._dependsOn);
  // });
}

export default analyse;
