const Fs = require("fs");
const Acorn = require("acorn");
const Assert = require("assert").strict;
const Path = require("path");
let counter = 0;
global.test = (code, ast, options) => {
  Assert.deepEqual(Acorn.parse(code, options), ast);
  console.log(counter++);
};
global.testFail = (code, message, options) => {
  Assert.throws(() => Acorn.parse(code, options), new SyntaxError(message));
  console.log(counter++);
};
Fs.readdirSync(Path.join(__dirname, "acorn-test")).forEach((filename) => {
  if (/^tests-.+\.js$/.test(filename)) {
    console.log(filename + "...");
    global.eval(Fs.readFileSync(Path.join(__dirname, "acorn-test", filename), "utf8"));
  }
});
