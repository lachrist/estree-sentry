# estree-sentry

This module investigates whether an ESTree refers to a valid ECMAScript program -- i.e. a ECMAScript program which does not result in [an early syntactic error](https://www.ecma-international.org/ecma-262/#early-error).
Indeed, an object may adhere to the program node interface defined by the [estree specification](https://github.com/estree/estree) but may not refer to a valid ECMAScript program.

```js
require("vm").runInThisContext(require("escodegen").generate({
  type: "Program",
  source: "script",
  body: [{
    type: "BreakStatement",
    label: null
  }]
})); // SyntaxError: Illegal break statement
```

## Why does this exist?

The primary motivation for developing this module lies in the fact that popular ECMAScript parsers such as [acorn](https://github.com/acornjs/acorn) and [esprima](https://github.com/jquery/esprima) do not properly detect early syntactic errors which are dependent on the context where the code is intended to run.

1. The parser considers that the code is in normal mode when it is intended to be fed to a direct eval call which resides in strict mode code. As a result, the parser is too tolerant and fails to raise some early syntactic errors:

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

2. The parse do not consider the closure context of code intended to be fed to a direct eval call. As a result, the parse is not tolerant enough and raises too many syntactic errors:

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

3. The parser do not detect duplicated variable declaration at the top level. As a result, the parser is too tolerant and fails to raise some early syntactic errors:

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
Each one of these arrow expect an ESTree program and an option object which provides the information about the execution context required to detect early syntactic error.
And each one these arrow returns a list of early syntactic errors under the form of a string message and an [estree source location](https://github.com/estree/estree/blob/master/es5.md#node-objects).
Note that the order of these errors is not fixed by the [ECMASCript spec](https://www.ecma-international.org/ecma-262/#sec-parse-script) however this module will attempt to order them based on their code location in a depth-first manner.

```
Errors :: [{message:string, loc:estree.SourceLocation}]

Variable: {
  kind: ("let" | "const" | "class" | "var" | "function" | "param"),
  name: string
}

Errors = require("estree-sentry").module(estree.Program, {})

Errors = require("estree-sentry").script(estree.Program, {
  "scope": [[Variable] = []] // The variables present in the global lexical frame
})

Errors = require("estree-sentry").eval(estree.Program, {
  "closure-tag": [("program" | "function" | "arrow" | "method" | "constructor" | "derived-constructor") = "program"], // A description of the directly enclosing closure
  "function-ancestor": [boolean = false], // Has a function expression in its ancestors
  "strict-mode": [boolean = false], // Is in strict mode
  "scope": [[Variable] = []] // The variables present in the global lexical frame and in the local scope
})
```

<!-- Examples:

```js
require("estree-sentry").eval(require("acorn-loose").parse("new.target"), {
  "function-ancestor": false
}).forEach(({message, loc}) => {
  throw new SyntaxError(message, loc.start.line);
}); // Throws
```



// A reification of the global lexical frame (different from the global object)
// cf: https://www.ecma-international.org/ecma-262/#sec-global-environment-records
// Unfortunately, the ECMAScript specification do not provide any mechanism to reify
// this structure. Hence, collecting this information requires bookkeeping. -->

In addition, this module annotates several ESTree nodes in the following way:

* `Program`:

  ```
  extend interface Program {
    __sentry_use_strict__: boolean, // Indicates whether the program has a use strict directive
    __sentry_eval_call__: boolean, // Indicates whether the program contains a direct eval call not encapsulated by a closure
    __sentry_hoisting__: [ProgramVariable], // The (local) variable hoisting of the program
    __sentry_hoisting_global__: [ProgramVariable] // The global variable hoisting of the program
  }

  interface ProgramVariable {
    kind: "var" | "function" | "let" | "const" | "class",
    name: string
  }
  ```

* `FunctionExpression`, `FunctionDeclaration`, and `ArrowFunctionExpression`:

  ```
  extend interface Function {
    __simple_param_list__: boolean, // Indicates whether every parameter is a simple identifier
    __sentry_use_strict__: boolean, // Indicates whether the closure has a use strict directive
    __sentry_eval_call__: boolean, // Indicates whether the closure contains a direct eval call not encapsulated by another closure
    __sentry_hoisting__: [ClosureVariable] // The variable hoisting of the closure
  }

  interface ClosureVariable {
    kind: "param" | "var" | "function",
    name: string
  }
  ```

* `BlockStatement` and `SwitchStatement`:

  ```
  extend interface BlockStatement {
    __sentry_hoisting__: [BlockVariable] // The variable hoisting of the block
  }

  extends SwitchStatement {
    ___sentry_hoisting__: [BlockVariable] // The variable hoisting of the switch statement
  }

  interface BlockVariable {
    kind: "let" | "const" | "class",
    name: string
  }
  ```

* `CatchClause`:

  ```
  extends CatchClause {
    __sentry_hoisting__: [CatchVariable] // The variable hoisting of the catch clause
  }

  interface CatchVariable {
    kind: "param",
    name: string
  }
  ```
