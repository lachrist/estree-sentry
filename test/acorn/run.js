"use strict";

// nyc --reporter=html --include lib/index.js node test/acorn/run.js ; open coverage/index.html

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
const signal = (id, code, failure, name, message) => {
  problems.push({id, code, failure, name, message});
};

const test = (code, options = {}, failure) => {
  counter++;
  process.stdout.write(Chalk[failure === null ? "blue" : "bgBlue"](counter) + " ");
  if (counter === 367) {
    console.log(code);
  }
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
  let syntax_error_array = null;
  let sentry_error = null;
  try {
    syntax_error_array = EstreeSentry[source](ast);
  } catch (error) {
    if (error.name !== "SentryError") {
      throw error;
    }
    sentry_error = error;
  }
  // Report //
  if (failure === null) {
    if (sentry_error !== null) {
      process.stdout.write(Chalk.red("SentryError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + sentry_error.message + "\n");
    } else if (syntax_error_array.length > 0) {
      process.stdout.write(Chalk.yellow("SyntaxError\n"));
      process.stdout.write("    " + code + "\n");
      for (let index = 0; index < syntax_error_array.length; index++) {
        process.stdout.write("    " + syntax_error_array[index].message + "\n");
      }
    } else {
      process.stdout.write(Chalk.green("Passed\n"));
    }
  } else {
    if (sentry_error !== null) {
      process.stdout.write(Chalk.red("SentryError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
      process.stdout.write("    " + sentry_error.message + "\n");
    } else if (syntax_error_array.length > 0) {
      process.stdout.write(Chalk.green("SyntaxError\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
      for (let index = 0; index < syntax_error_array.length; index++) {
        process.stdout.write("    " + syntax_error_array[index].message + "\n");
      }
    } else {
      process.stdout.write(Chalk.yellow("Passed\n"));
      process.stdout.write("    " + code + "\n");
      process.stdout.write("    " + failure + "\n");
    }
  }
  // Triage //
  if (failure === null) {
    if (sentry_error !== null) {
      signal(counter, code, null, "SentryError", sentry_error.message);
    }
    for (let index = 0; index < syntax_error_array.length; index++) {
      signal(counter, code, null, "SyntaxError", syntax_error_array[index].message);
    }
  } else {
    if (sentry_error !== null) {
      if (sentry_error.message !== "Literal.regex.pattern is undefined and must be a string") {
        signal(counter, code, failure, "SentryError", sentry_error.message);
      }
    }
    if (syntax_error_array > 0) {
      for (let index = 0; index < syntax_error_array.length; index++) {
        if (syntax_error_array[index].message !== "Identifier.name is invalid, got: ✖") {
          signal(counter, code, failure, "SyntaxError", syntax_error_array[index].message);
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

for (let {id, code, failure, name, message} of problems) {
  console.log(id);
  console.log("    " + code.split("\n").join("\n    "));
  console.log("    " + failure);
  console.log("    " + name + " >> " + message);
}
