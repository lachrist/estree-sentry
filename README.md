# estree-sentry

This module investigates whether a value is a valid ESTree program node.
This entails two kinds of checks: the ones that verify that the value adheres to the interface defined by the [ESTree 2020 specification](https://github.com/estree/estree) and the ones that verify that generating (e.g. using a module such as [escodegen](https://www.npmjs.com/package/escodegen)) and evaluating that value would not result into an early syntactic error as defined by the [ECMAScript 2020 specification](https://www.ecma-international.org/ecma-262/2020).

```js
// Success //
var errors = require("estree-sentrylib").script({
  type: "Program",
  source: "script",
  body: []
});
console.assert(errors.length === 0);
// Syntax Failure //
var errors = require("estree-sentry").script({
  type: "Program",
  source: "script",
  body: [{
    type: "BreakStatement",
    label: null
  }]
});
console.assert(errors.length === 1);
console.assert(errors[0] instanceof require("estree-sentry").SyntaxSentryError);
console.assert(errors[0].message === "Unbound break label: (empty)");
// ESTree Failure //
try {
  require("estree-sentry").script({
    type: "Program",
    source: "script",
    body: [{
      type: "Literal",
      value: 123
    }]
  })
} catch (error) {
  console.assert(error instanceof require("estree-sentry").EstreeSentryError);
  console.assert(error.message.startsWith(`Note.type is "Literal" and must be one of`));
}
```

## Why does this exist?

The primary motivation for developing this module lies in the fact that popular ECMAScript parsers such as [acorn](https://github.com/acornjs/acorn) and [esprima](https://github.com/jquery/esprima) do not properly detect early syntactic errors which are dependent on the context where the code is intended to run.

1. The parser considers that the code is in normal mode when it is intended to be fed to a direct eval call which resides in strict mode code.
    As a result, the parser is too tolerant and fails to raise some early syntactic errors:
    ```js
    "use strict";
    eval("delete foo;"); // SyntaxError: Delete of an unqualified identifier in strict mode.
    require("acorn").parse("delete foo;", {ecmaVersion:2020}); // Ok
    ```
    Note that this issue can be alleviated by prepending `'use strict'; void 0;` to the program.
    The purpose of the `void 0;` statement is to reset the completion valued of the eval script to `undefined`.
    ```js
    "use strict";
    eval("delete foo;"); // SyntaxError: Delete of an unqualified identifier in strict mode.
    require("acorn").parse("'use strict'; void 0; delete foo;", {ecmaVersion:2020}); // SyntaxError: Deleting local variable in strict mode
    eval("'use strict'; void 0; var x = 123"); // returns undefined and not 'use strict';
    ```

2.
    The parser do not consider the closure context of code intended to be fed to a direct eval call.
    As a result, the parser is not tolerant enough and raises too many syntactic errors:
    ```js
    // new.target //
    (function () {
      eval("new.target") // Ok
      require("acorn").parse("new.target;", {ecmaVersion:2020}); // SyntaxError: 'new.target' can only be used in functions
    } ());
    // super call //
    (new (class extends Object {
      constructor () {
        eval("super();"); // Ok
        require("acorn").parse("super();", {ecmaVersion:2020}) // SyntaxError: 'new.target' can only be used in functions
      }
    }) ());
    // super property access //
    ({
      foo () {
        eval("super.bar;") // Ok
        require("acorn").parse("super.bar;", {ecmaVersion:2020}) // SyntaxError: 'super' keyword outside a method
      }
    }).foo();
    ```
    Unfortunately, popular ECMAScript parsers do not provide options to configure the access to these context-dependent features.

3. The parser do not detect duplicated variable declaration at the top level.
As a result, the parser is too tolerant and fails to raise some early syntactic errors:
    ```js
    ///////////////////////////////
    // Local Lexical Environment //
    ///////////////////////////////
    {
      let x = 123;
      require("acorn").parse("var x = 456", {ecmaVersion:2020}); // Ok
      // Direct eval call //
      eval("var x = 456"); // SyntaxError: Identifier 'x' has already been declared
      eval("'use strict'; var x = 456"); // Ok
    }
    ////////////////////////////////
    // Global Lexical Environment //
    ////////////////////////////////
    require("vm").runInThisContext("let x = 123;");
    // Direct eval call //
    eval("var x = 456"); // SyntaxError: Identifier 'x' has already been declared
    eval("'use strict'; var x = 456"); // Ok
    // Indirect eval call //
    global.eval("var x = 456;"); // SyntaxError: Identifier 'x' has already been declared
    global.eval("'use strict'; var x = 456;"); // Ok
    // Script (global lexical scope) //
    require("vm").runInThisContext("var x = 456"); // SyntaxError: Identifier 'x' has already been declared
    require("vm").runInThisContext("'use strict'; var x = 456"); // SyntaxError: Identifier 'x' has already been declared
    // Module (global lexical scope) //
    const module = new (require("vm").SourceTextModule)("var x = 456;");
    module.link(() => {}).then((x) => module.evaluate()); // Ok
    ```

Aside from hard-to-maintain forks and plugins, the only solution consists in relying on the tolerant mode often provided by popular ECMAScript parsers (e.g.: [acorn-loose](https://github.com/acornjs/acorn/tree/master/acorn-loose) and [esprima-tolerant](https://esprima.readthedocs.io/en/4.0/syntactic-analysis.html#tolerant-mode)).
Unfortunately, these tolerant modes cannot be fined-tuned hence the detection of early syntactic error must be entirely outsourced.
This explains why this module aim at detecting *all* early syntactic errors of ESTree programs and not just the ones dependent on the execution context.

## API

This module exports one arrow property for each of the type of ECMAScript programs: scripts, modules, and eval codes.
Each one of these arrow expect a value to check as a valid `estree.Program` and an options object which provides the information about the execution context necessary to detect early syntax errors.
Each one of these arrows can have four outcomes:

1. The arrow throws an `EstreeSentryError` which indicates that the provided value does not conform to the `estree.Program` interface.
2. The arrow throws a `OptionSentryError` which indicates that the provided options are invalid.
3. The arrow throws any other error which indicates an unexpected internal failure.
4. The arrow returns an array of `SyntaxSentryError` which each indicate an early syntactic failure. Note that the order of these errors is not fixed by the [ECMASCript spec](https://www.ecma-international.org/ecma-262/#sec-parse-script) however this module will attempt to order them based on their code location in a depth-first manner.

```
interface Value = *

interface Variable = {
  kind: null | "let" | "const" | "class" | "var" | "function" | "param",
  duplicable: null | boolean
  name: string
}

// Module //
[SyntaxSentryError] = require("estree-sentry").module(Value, {
  "scope": [Variable] = [] // The variables present in the global declarative environment frame (without effect)
}) throws EstreeSentryError, OptionSentryError

// Script //
[SyntaxSentryError] = require("estree-sentry").script(Value, {
  "scope": [Variable] = [] // The variables present in the global declarative environment frame
}) throws EstreeSentryError, OptionSentryError

// (Direct) Eval Call //
[SyntaxSentryError] = require("estree-sentry").eval(Value, {
  "scope": [Variable] = [] // The variables present in the scope of the direct eval call
  "closure-context": ("program" | "function" | "arrow" | "method" | "constructor" | "derived-constructor") = "program", // A description of the closure enclosing the direct eval call
  "function-expression-ancestor": boolean = false, // Indicates whether the direct eval call have a FunctionExpression node in its ancestors
  "strict-mode": boolean = false, // Indicates whether the direct eval call in strict mode
}) throws EstreeSentryError, OptionSentryError

// Error //
interface EstreeSentryError {
  name: "EstreeSentryError",
  message: string,
  loc: estree.SourceLocation
}
interface SyntaxSentryError {
  name: "SyntaxSentryError",
  message: string,
  loc: estree.SourceLocation
}
interface OptionSentryError {
  name: "OptionSentryError",
  message: string,
}
```

In addition, this module annotates several ESTree nodes in the following way:

```
interface Variable {
  kind: "param" | "var" | "function" | "let" | "const" | "class",
  duplicable: boolean,
  name: string
}

extend interface Program, Function {
  __sentry_use_strict__: boolean, // Indicates whether the program has a use strict directive
  __sentry_eval_call__: boolean, // Indicates whether the program contains a direct eval call which is not encapsulated by a closure
  __sentry_capture__: [Variable], // The variable declarations captured by the node
  __sentry_release__: [Variable] // The variable declarations released by the node
}

extend interface BlockStatement, CatchClause, ForStatement, ForInStatment, ForOfStatement, SwitchStatement {
  __sentry_capture__: [Variable], // The variable declarations captured by the node
  __sentry_release__: [Variable] // The variable declarations released by the node
}
```
