"use strict";

const Fs = require("fs");
const Acorn = require("acorn");
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

global.test = (code, ast, options) => {
  process.stdout.write(Chalk.blue(counter++) + " ");
  for (let index = 0; index < forbidden.length; index++) {
    if (forbidden[index] in options) {
      process.stdout.write("Skipped because " + forbidden[index] + "\n");
      return null;
    }
  }
  const source = "sourceType" in options ? options.sourceType : "script";
  try {
    ast = Acorn.parse(code, {
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
};

global.testFail = (code, message, options) => {
  // Assert.throws(() => Acorn.parse(code, options), new SyntaxError(message));
  // console.log(counter++);
};

global.testAssert = (code, assert, option) => {

};

Fs.readdirSync(Path.join(__dirname, "acorn-test")).sort().forEach((filename) => {
  if (/^tests-.+\.js$/.test(filename)) {
    process.stdout.write("\n" + filename + "\n\n");
    global.eval(Fs.readFileSync(Path.join(__dirname, "acorn-test", filename), "utf8"));
  }
});



//
// exports.runTests = function(config, callback) {
//   var parse = config.parse;
//
//   for (var i = 0; i < tests.length; ++i) {
//     var test = tests[i];
//     if (config.filter && !config.filter(test)) continue;
//     var testOpts = test.options || {locations: true};
//     if (!testOpts.ecmaVersion) testOpts.ecmaVersion = 5;
//     var expected = {};
//     if (expected.onComment = testOpts.onComment)
//       testOpts.onComment = []
//     if (expected.onToken = testOpts.onToken)
//       testOpts.onToken = [];
//
//     try {
//       var ast = parse(test.code, testOpts);
//     } catch(e) {
//       if (!(e instanceof SyntaxError)) { console.log(e.stack); throw e; }
//       if (test.error) {
//         if (test.error.charAt(0) == "~" ? e.message.indexOf(test.error.slice(1)) > -1 : e.message == test.error)
//           callback("ok", test.code);
//         else
//           callback("fail", test.code, "Expected error message: " + test.error + "\nGot error message: " + e.message);
//       } else {
//         callback("error", test.code, e.message || e.toString());
//       }
//       continue
//     }
//
//     if (test.error) {
//       if (config.loose) callback("ok", test.code);
//       else callback("fail", test.code, "Expected error message: " + test.error + "\nBut parsing succeeded.");
//     } else if (test.assert) {
//       var error = test.assert(ast);
//       if (error) callback("fail", test.code, "\n  Assertion failed:\n " + error);
//       else callback("ok", test.code);
//     } else {
//       var mis = misMatch(test.ast, ast);
//       for (var name in expected) {
//         if (mis) break;
//         if (expected[name]) {
//           mis = misMatch(expected[name], testOpts[name]);
//           testOpts[name] = expected[name];
//         }
//       }
//       if (mis) callback("fail", test.code, mis);
//       else callback("ok", test.code);
//     }
//   }
// };
