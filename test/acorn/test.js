"use strict";

// nyc --reporter=html --include lib/index.js node test/acorn/test.js ; open coverage/index.html

const Fs = require("fs");
const Acorn = require("acorn");
const AcornLoose = require("acorn-loose");
const Assert = require("assert").strict;
const Path = require("path");
const Chalk = require("chalk");
const EstreeSentry = require("../../lib/index.js");

let counter = 0;

const forbidden = [
  "allowReserved",
  "allowAwaitOutsideFunction",
  "allowImportExportEverywhere",
  "allowReturnOutsideFunction",
  "allowReserved"
];

const problems = [];
const signal = (id, code, failure, error) => {
  problems.push({id, code, failure, error});
};

const test = (code, options = {}, failure) => {
  counter++;
  process.stdout.write(Chalk[failure === null ? "blue" : "bgBlue"](counter) + " ");
  for (let index = 0; index < forbidden.length; index++) {
    if (forbidden[index] in options) {
      process.stdout.write("Skipped because " + forbidden[index] + "\n");
      return null;
    }
  }
  const source = "sourceType" in options ? options.sourceType : "script";
  let ast = null;
  try {
    ast = (failure === null ? Acorn : AcornLoose).parse(code, {
      sourceType: source,
      ecmaVersion: 2021
    });
  } catch (error) {
    process.stdout.write("Skipped because acorn failure: " + error.message + "\n");
    return null;
  }
  let syntax_sentry_error_array = null;
  let estree_sentry_error = null;
  try {
    syntax_sentry_error_array = EstreeSentry[source](ast);
  } catch (error) {
    if (error instanceof EstreeSentry.EstreeSentryError) {
      estree_sentry_error = error;
    } else {
      throw error;
    }
  }
  // Report //
  if (failure === null) {
    if (estree_sentry_error !== null) {
      process.stdout.write(Chalk.red("EstreeSentryError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + estree_sentry_error.message + "\n");
    } else if (syntax_sentry_error_array.length > 0) {
      process.stdout.write(Chalk.yellow("SyntaxError\n"));
      process.stdout.write("    " + code + "\n");
      for (let index = 0; index < syntax_sentry_error_array.length; index++) {
        process.stdout.write("    " + syntax_sentry_error_array[index].message + "\n");
      }
    } else {
      process.stdout.write(Chalk.green("Passed\n"));
    }
  } else {
    if (estree_sentry_error !== null) {
      process.stdout.write(Chalk.red("SentryError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
      process.stdout.write("    " + estree_sentry_error.message + "\n");
    } else if (syntax_sentry_error_array.length > 0) {
      process.stdout.write(Chalk.green("SyntaxSentryError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
      for (let index = 0; index < syntax_sentry_error_array.length; index++) {
        process.stdout.write("    " + syntax_sentry_error_array[index].message + "\n");
      }
    } else {
      process.stdout.write(Chalk.yellow("Passed\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
    }
  }
  // Triage //
  if (failure === null) {
    if (estree_sentry_error !== null) {
      signal(counter, code, null, estree_sentry_error);
    }
    for (let index = 0; index < syntax_sentry_error_array.length; index++) {
      signal(counter, code, null, syntax_sentry_error_array[index]);
    }
  } else {
    if (estree_sentry_error !== null) {
      if (estree_sentry_error.message !== "Literal.regex.pattern is undefined and must be a string") {
        signal(counter, code, failure, estree_sentry_error);
      }
    }
    if (syntax_sentry_error_array > 0) {
      for (let index = 0; index < syntax_sentry_error_array.length; index++) {
        if (syntax_sentry_error_array[index].message !== "Identifier.name is invalid, got: ✖") {
          signal(counter, code, failure, syntax_sentry_error_array[index]);
        }
      }
    }
  }
};

global.acorn = {tokTypes: Acorn.tokTypes};

global.test = (code, ast, options) => test(code, options, null);

global.testFail = (code, message, options) => test(code, options, message);

global.testAssert = (code, assert, options) => test(code, options, null);

Fs.readdirSync(Path.join(__dirname, "test")).sort().forEach((filename) => {
  if (/^tests.*\.js$/.test(filename)) {
    process.stdout.write("\n" + filename + "\n\n");
    global.eval(Fs.readFileSync(Path.join(__dirname, "test", filename), "utf8"));
  }
});

console.log(``);

for (let {id, code, failure, error} of problems) {
  console.log(id);
  console.log(`  ${code.split("\n").join("\n    ")}`);
  console.log(`  ${failure}`);
  console.log(`  ${error.name} >> ${error.message}`);
}

console.log(`\n${problems.length} problematic tests\n`);
