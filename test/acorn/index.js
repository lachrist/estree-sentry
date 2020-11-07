const Acorn = require("acorn");
const EstreeSentry = require("../../lib/index.js");
const Chalk = require("chalk");
let counter = 0;
module.exports = {
  __proto__: Acorn,
  parse: (code, options) => {
    process.stdout.write("1");
    process.stdout.write(Chalk.blue(counter++) + " " + global.JSON.stringify(options) + "...");
    process.stdout.write("2");
    if (options.preserveParens) {
      process.stdout.write(Chalk.blue(" Skipping (because options.preserveParens)\n"));
      return Acorn.parse(code, options);
    }
    process.stdout.write("3");
    const ast = Acorn.parse(code, options);
    try {
      process.stdout.write("4");
      const errors = EstreeSentry[options.sourceType ===  "module" ? "module" : "script"](ast);
      process.stdout.write("5");
      if (errors.length === 0) {
        process.stdout.write(Chalk.green(" Passed\n"));
      } else {
        process.stdout.write(Chalk.yellow(" SyntaxError\n"));
        process.stdout.write(code + "\n");
        for (let index = 0; index < errors.length; index++) {
          process.stdout.write(errors[index].message + "\n");
        }
      }
    } catch (error) {
      if (error.name !== "SentryError") {
        throw error;
      }
      process.stdout.write(Chalk.red(" SentryError\n"));
      process.stdout.write(code + "\n");
      process.stdout.write(error.message + "\n");
    }
    return ast;
  }
};
