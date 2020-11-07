// (class C extends Object { constructor() { (() => { super() }); } })


// (class C extends Object { constructor() { function f () { super() }; } })
const ast = require("acorn").parse(`let x = 1; x = 2`, {ecmaVersion:2020});
console.log(require("../lib/index.js").script(ast));
