import core from "@babel/core";
import types from "@babel/types";
// import arrowFunctionPlugin from "babel-plugin-transform-es2015-arrow-functions";

const arrowFunctionPlugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      const { node } = path;
      console.log("node: ", node);
      node.type = "FunctionExpression";
      // 处理this
      hoistFunctionEnvironment(path);
      // 处理 箭头函数省略函数块的写法
      if (!types.isBlockStatement(node.body)) {
        node.body = types.blockStatement([types.returnStatement(node.body)]);
      }
    },
  },
};

function hoistFunctionEnvironment(path) {
  // 判断有没有使用到this
  const thisPaths = getThisPath(path);
  if (thisPaths.length > 0) {
    const thisEnv = path.findParent((parent) => {
      return (
        (parent.isFunction() && !path.isArrowFunctionExpression()) ||
        parent.isProgram()
      );
    });
    let thisBindings = "_this";
    if (!thisEnv.scope.hasBinding(thisBindings)) {
      thisEnv.scope.push({
        id: types.identifier(thisBindings),
        init: types.thisExpression(),
      });
    }
  }
}

function getThisPath(path) {
  let thisPaths = [];
  path.traverse({
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    },
  });
  return thisPaths;
}
const sourceCode = `
  const sum = (a,b) =>{
    console.log(this)
    return a + b
  }
`;

const result = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin],
});

console.log(result.code);
