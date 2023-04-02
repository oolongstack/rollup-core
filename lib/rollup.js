import { Bundle } from "./bundle.js";
function rollup(entry, output) {
  const bundle = new Bundle({ entry });
  bundle.build(output);
}

export default rollup;
