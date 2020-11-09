"use strict";

const Fs = require("fs");
const Acorn = require("acorn");
const AcornLoose = require("acorn-loose");
const Assert = require("assert").strict;
const Path = require("path");
const Chalk = require("chalk");
const EstreeSentry = require("../lib/index.js");

let counter = 0;

const forbidden = [
  "allowReserved",
  "allowAwaitOutsideFunction",
  "allowImportExportEverywhere",
  "allowReturnOutsideFunction",
  "allowReserved"
];

const test = (code, options, failure) => {
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
};

global.test = (code, ast, options) => test(code, options, null);

global.testFail = (code, message, options) => test(code, options, message);

global.testAssert = (code, assert, option) => test(code, options, null);

Fs.readdirSync(Path.join(__dirname, "acorn-test")).sort().forEach((filename) => {
  if (/^tests-.+\.js$/.test(filename)) {
    process.stdout.write("\n" + filename + "\n\n");
    global.eval(Fs.readFileSync(Path.join(__dirname, "acorn-test", filename), "utf8"));
  }
});
