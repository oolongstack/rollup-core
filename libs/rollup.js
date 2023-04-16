import Bundle from "./bundle.js";
function rollup(entry, output) {
  // 处理
  const bundle = new Bundle({ entry });
  // 打包
  bundle.build(output);
}

export default rollup;
