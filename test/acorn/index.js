const Acorn = require("acorn");
const EstreeSentry = require("../../lib/index.js");
const acorn = {
  __proto__: Acorn,
  parse: (code, options) => {
    const ast = Acorn.parse(code, options);
    const errors = EstreeSentry[options.sourceType ===  "module" ? "module" : "script"](ast);
    console.log(JSON.stringify(errors, null, 2));
    return ast;
  }
};
module.exports = acorn;
