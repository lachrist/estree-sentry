
const EstreeSentry = require("../lib/index.js");
const Acorn = require("acorn");
const AcornLoose = require("acorn-loose");
const Assert = require("assert").strict;

class AcornError extends Error {};

const test = (code, source, options) => {
  const acorn_option_object = {
    ecmaVersion: 2020,
    sourceType: source === "module" ? "module" : "script"
  };
  let estree = null
  try {
    estree = Acorn.parse(code, acorn_option_object);
  } catch (error) {
    try {
      estree = AcornLoose.parse(code, acorn_option_object);
    } catch (error) {
      throw new AcornError(error.message);
    }
  }
  let errors = null;
  errors = EstreeSentry[source](estree, options);
  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length === 0) {
    return estree;
  }
  throw new global.Error(`Multiple syntax error:\n${errors.map(({message}) => message).join("\n")}`);
};

const assert_key = (node, key, value) => {
  if (value === global.undefined) {
    Assert.ok(!(key in node));
  } else {
    Assert.deepEqual(node[key], value);
  }
};

const assert_node = (node, use_strict, eval_call, capture, release) => {
  assert_key(node, "__sentry_use_strict__", use_strict);
  assert_key(node, "__sentry_eval_call__", eval_call);
  assert_key(node, "__sentry_capture__", capture);
  assert_key(node, "__sentry_release__", release);
};

///////////
// Scope //
///////////
{
  const name = "x";
  const error = {
    name: "SyntaxSentryError",
    message: new global.RegExp(`^Duplicate [a-z\\-]+ variable named ${name}`)
  };
  const data = {
    "module": {
      strict: ["var", "function", "let", "const", "class"],
      normal: ["var", "function", "let", "const", "class"]
    },
    "script": {
      strict: [],
      normal: []
    },
    "eval": {
      strict: ["var", "function", "let", "const", "class"],
      normal: ["let", "const", "class"]
    }
  };
  for (let source in data) {
    [true, false].forEach((strict) => {
      ["var", "function", "let", "const", "class"].forEach((kind) => {
        const duplicable = kind === "var" || kind === "function";
        let code = strict ? `'use strict';\n` : '';
        if (kind === "class") {
          code += `class ${name} {}`;
        } else if (kind === "function") {
          code += `function ${name} () {}`;
        } else {
          code += `${kind} ${name};`
        }
        if (data[source][strict ? "strict" : "normal"].includes(kind)) {
          assert_node(test(code, source, {
            scope:[{duplicable:false, name}]
          }), strict, false, [{kind, duplicable, name}], []);
        } else {
          Assert.throws(() => test(code, source, {
            scope:[{duplicable:false, name}]
          }), error);
          if (duplicable) {
            assert_node(test(code, source, {
              scope:[{duplicable:true, name}]
            }), strict, false, [], [{kind, duplicable, name}]);
          } else {
            Assert.throws(() => test(code, source, {
              scope:[{duplicable:true, name}]
            }), error);
          }
        }
      });
    });
  }
}

///////////////
// NewTarget //
///////////////

{

  const error = {
    name: "SyntaxSentryError",
    message: "MetaProperty 'new.target' must be (possibly deep) inside a FunctionExpression"
  };

  Assert.throws(() => test(`new.target;`, "module", {
    "function-expression-ancestor": true
  }), error);

  Assert.throws(() => test(`new.target;`, "script", {
    "function-expression-ancestor": true
  }), error);

  [null, "arrow"].forEach((context) => {
    test(`new.target;`, "eval", {
      "function-expression-ancestor": true,
      "closure-context": context
    });
    Assert.throws(() => test(`new.target;`, "eval", {
      "function-expression-ancestor": false,
      "closure-context": context
    }), error);
  });

  ["method", "function", "constructor", "derived-constructor"].forEach((context) => {
    test(`new.target;`, "eval", {
      "function-expression-ancestor": false,
      "closure-context": context
    });
  });

}

///////////////
// SuperCall //
///////////////

{

  const error = {
    name: "SyntaxSentryError",
    message: "CallExpression with Super callee must be directly in a derived constructor"
  };

  Assert.throws(() => test(`super();`, "module", {
    "closure-context": "derived-constructor"
  }), error);

  Assert.throws(() => test(`super();`, "script", {
    "closure-context": "derived-constructor"
  }), error);

  [null, "method", "constructor", "arrow", "function"].forEach((context) => {
    Assert.throws(() => test(`super();`, "eval", {
      "closure-context": context
    }), error);
  });

  test(`super();`, "eval", {
    "closure-context": "derived-constructor"
  });

}

//////////////////
// Super Member //
//////////////////

{

  const error = {
    name: "SyntaxSentryError",
    message: "MemberExpression with Super object must be directly in a method or a constructor"
  };

  Assert.throws(() => test(`super.foo;`, "module", {
    "closure-context": "method"
  }), error);

  Assert.throws(() => test(`super.foo;`, "script", {
    "closure-context": "method"
  }), error);

  [null, "arrow", "function"].forEach((context) => {
    Assert.throws(() => test(`super.foo;`, "eval", {
      "closure-context": context
    }), error);
  });

  ["method", "constructor", "derived-constructor"].forEach((context) => {
    test(`super.foo;`, "eval", {
      "closure-context": context
    });
  });

}
