const Acorn = require("acorn");
const EstreeSentry = require("../../lib/index.js");
const Chalk = require("chalk");
const acorn = {
  __proto__: Acorn,
  parse: (code, options) => {
    if (options.preserveParens) {
      console.log("Skipping test because options.preserveParens");
      return Acorn.parse(code, options);
    }
    const ast = Acorn.parse(code, options);
    try {
      const errors = EstreeSentry[options.sourceType ===  "module" ? "module" : "script"](ast);
      if (errors.length === 0) {
        console.log(Chalk.green("Pased"));
      } else {
        console.log(Chalk.yellow("SyntaxError"));
        console.log(options);
        console.log(code);
        console.log(JSON.stringify(errors, null, 2));
      }

    } catch (error) {
      if (error.name !== "SentryError") {
        throw error;
      }
      console.log(Chalk.red("SentryError"));
      console.log(options);
      console.log(code);
      console.log(error);
    }
    return ast;
  }
};
module.exports = acorn;
