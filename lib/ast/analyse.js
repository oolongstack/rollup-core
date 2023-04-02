/**
 * 分析语法树
 * @param {*} ast
 * @param {*} code
 * @param {*} module
 */
function analyse(ast, code, module) {
  ast.body.forEach((statement) => {
    Object.defineProperties(statement, {
      _module: {
        value: module,
      },
      _source: {
        value: code.snip(statement.start, statement.end),
      },
    });
  });
}

export default analyse;
