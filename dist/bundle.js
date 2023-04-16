const sum = (a, b) => {
  return a + b;
};
const res = sum(1, 2);
let msg = res;
msg += 2;
msg *= 10;
function say(times) {
  console.log("msg", msg);
}
say();
const time = Date.now();
function foo() {
  console.log(1);
}