// Success //
var errors = require("../lib").script({
  type: "Program",
  source: "script",
  body: []
});
console.assert(errors.length === 0);
// Estree Failure //
var errors = require("../").script({
  type: "Program",
  source: "script",
  body: [{
    type: "BreakStatement",
    label: null
  }]
});
console.assert(errors.length === 1);
console.assert(errors[0] instanceof require("../").SyntaxSentryError);
console.assert(errors[0].message === "Unbound break label: (empty)");
// Syntax Failure //
try {
  require("../").script({
    type: "Program",
    source: "script",
    body: [{
      type: "Literal",
      value: 123
    }]
  })
} catch (error) {
  console.assert(error instanceof require("../").EstreeSentryError);
  console.assert(error.message.startsWith(`Note.type is "Literal" and must be one of`));
}
