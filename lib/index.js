"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Estree = require("./estree.js");
const State = require("./state.js");
const Token = require("./token.js");
const Assert = require("./assert.js");

const make_false = () => false;

/////////
// Key //
/////////

const KEY_CAPTURE = "__estree_sentry_capture__";
const KEY_RELEASE = "__estree_sentry_release__";
const KEY_USE_STRICT = "__estree_sentry_use_strict__";
const KEY_EVAL_CALL = "__estree_sentry_eval_call__";

//////////
// Test //
//////////

// Variable: Block vs Closure vs Param //

const test_variable_block = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null});

const test_variable_closure = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null});

const test_variable_param = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_PARAM]: null});

const test_variable_block_closure = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null});

const test_variable_closure_param = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null,
    [Token.KIND_VARIABLE_PARAM]: null});

// Variable >> Void vs Non-Void //

const test_variable_void = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VOID]: null});

const test_variable_non_void = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VOID]: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null,
    [Token.KIND_VARIABLE_GENERIC_RIGID]: null,
    [Token.KIND_VARIABLE_GENERIC_LOOSE]: null});

// Variable >> Generic vs Non-Generic //

const test_variable_generic = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GENERIC_RIGID]: null,
    [Token.KIND_VARIABLE_GENERIC_LOOSE]: null});

const test_variable_non_generic = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null,
    [Token.KIND_VARIABLE_PARAM]: null});

// Variable >> Regid vs Loose //

const test_variable_rigid = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GENERIC_RIGID]: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null});

const test_variable_loose = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GENERIC_LOOSE]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null,
    [Token.KIND_VARIABLE_PARAM]: null});

// Other //

const test_marker_eval = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_EVAL]: null});

const test_marker_strict = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_WITH]: null,
    [Token.KIND_MARKER_DISCARD]: null,
    [Token.KIND_MARKER_PATTERN_EVAL]: null,
    [Token.KIND_MARKER_PATTERN_ARGUMENTS]: null,
    [Token.KIND_MARKER_PARAM_DUPLICATE]: null});

const test_label_empty = Token.test(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: null,
    [Token.KIND_LABEL_CONTINUE]: null},
  null);

const test_module = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_IMPORT]: null,
    [Token.KIND_MARKER_EXPORT]: null,
    [Token.KIND_MARKER_IMPORT_META]: null});

const make_test_label_enum = {
  __proto__: null,
  [Token.KIND_LABEL_BREAK]:null};
const make_test_label = (data) => Token.test(make_test_label_enum, data);

///////////
// Raise //
///////////

const make_raise_label_continue_object = {
  __proto__: null,
  [Token.KIND_LABEL_CONTINUE]: (data) => `Continue label '${data}' must be bound to a loop statement`};
const make_raise_label_continue = (label) => Token.raise(make_raise_label_continue_object, data);

const raise_marker_strict = Token.raise(
  {
    [Token.KIND_MARKER_WITH]: `WithStatement is forbidden in strict mode`,
    [Token.KIND_MARKER_DISCARD]: `Deleting an identifier is forbidden in strict mode`,
    [Token.KIND_MARKER_PATTERN_EVAL]: `'eval' as a pattern is forbidden in strict mode`,
    [Token.KIND_MARKER_PATTERN_ARGUMENTS]: `'arguments' as a pattern is forbidden in strict mode`,
    [Token.KIND_MARKER_PARAM_DUPLICATE]: `Duplicate parameters is forbidden in strict mode`});

const raise_variable_duplicate_unexpected = (kind, data) => { throw new global_Error(`Unexpected loose variable token ${kind} carrying ${data}`) };
const raise_variable_duplicate = Token.raise(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_PARAM]: (kind, data) => `Parameter variables must not be duplicated in this context: '${data}'`,
    [Token.KIND_VARIABLE_GENERIC_RIGID]: (kind, data) => `Generic non-duplicable variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_LET]: (kind, data) => `Let variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_CONST]: (kind, data) => `Const variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_CLASS]: (kind, data) => `Class variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_VAR]: raise_variable_duplicate_unexpected,
    [Token.KIND_VARIABLE_FUNCTION]: raise_variable_duplicate_unexpected,
    [Token.KIND_VARIABLE_GENERIC_LOOSE]: raise_variable_duplicate_unexpected});

const raise_variable_rigid_duplicate_enum = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM]: null,
  [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: null,
  [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: null,
  [Token.KIND_VARIABLE_VAR]: null,
  [Token.KIND_VARIABLE_FUNCTION]: null,
  [Token.KIND_VARIABLE_LET]: null,
  [Token.KIND_VARIABLE_CONST]: null,
  [Token.KIND_VARIABLE_CLASS]: null};
const raise_variable_rigid_duplicate = (token, index, tokens) => (
  (
    test_variable_rigid(token) &&
    (
      ArrayLite.filter(
        tokens,
        Token.test(
          raise_variable_rigid_duplicate_enum,
          Token.to_variable(token).name)).length >
      1)) ?
  raise_variable_duplicate(token) :
  token);

const raise_variable_param_duplicate_enum = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM]: null};
const raise_variable_param_duplicate = (token, index, tokens) => (
  (
    test_variable_param(token) &&
    (
      ArrayLite.filter(
        tokens,
        Token.test(
          raise_variable_param_duplicate_enum,
          Token.to_variable(token).name)).length >
      1)) ?
  raise_variable_duplicate(token) :
  token);

const raise_garbage_closure_unexpected = (kind, data) => { throw new global_Error(`Unexpected token ${kind} carrying ${data} escaped a closure`) }
const raise_garbage_closure = Token.raise(
  {
    __proto__: null,
    // Error //
    // [Token.KIND_ERROR]
    // Super //
    [Token.KIND_MARKER_SUPER_CALL]: `CallExpression with Super callee must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `MemberExpression with Super object must be directly in a method or a constructor`,
    // Generator / Asynchronous //
    [Token.KIND_MARKER_AWAIT]: `AwaitExpression must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_AWAIT_FOR_OF]: `ForOfStatement with await must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_YIELD]: `YieldExpression must be directly in a generator closure`,
    // Label //
    [Token.KIND_LABEL_BREAK]: (kind, data) => `Unbound break label: ${print_label(data)}`,
    [Token.KIND_LABEL_CONTINUE]: (kind, data) => `Unbound continue label: ${print_label(data)}`,
    // Closure //
    [Token.KIND_MARKER_RETURN]: raise_garbage_closure_unexpected,
    // [Token.KIND_MARKER_NEW_TARGET]
    // Module //
    // [Token.KIND_MARKER_IMPORT_META]
    [Token.KIND_MARKER_IMPORT]: raise_garbage_closure_unexpected,
    [Token.KIND_MARKER_EXPORT]: raise_garbage_closure_unexpected,
    // Strict //
    // [Token.KIND_MARKER_WITH]
    // [Token.KIND_MARKER_PATTERN_EVAL]
    // [Token.KIND_MARKER_PATTERN_ARGUMENTS]
    // [Token.KIND_MARKER_DISCARD]
    // [Token.KIND_MARKER_PARAM_DUPLICATE]
    // // Variable //
    [Token.KIND_VARIABLE_PARAM]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_VAR]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_FUNCTION]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_LET]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_CONST]: raise_garbage_closure_unexpected,
    [Token.KIND_VARIABLE_CLASS]: raise_garbage_closure_unexpected,
    // Other //
    [Token.KIND_MARKER_EVAL]: raise_garbage_closure_unexpected,
    [Token.KIND_MARKER_PATTERN_MEMBER]: raise_garbage_closure_unexpected});

const raise_garbage_program_unexpected = (kind, data) => { throw new global_Error(`Unexpected token ${kind} carrying ${data} escaped a closure`) }
const raise_garbage_program = Token.raise(
  {
    __proto__: null,
    // Error //
    // [Token.KIND_ERROR]
    // Super //
    [Token.KIND_MARKER_SUPER_CALL]: `CallExpression with Super callee must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `MemberExpression with Super object must be directly in a method or a constructor`,
    // Generator / Asynchronous //
    [Token.KIND_MARKER_AWAIT]: `AwaitExpression must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_AWAIT_FOR_OF]: `ForOfStatement with await must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_YIELD]: `YieldExpression must be directly in a generator closure`,
    // Label //
    [Token.KIND_LABEL_BREAK]: (kind, data) => `Unbound break label: ${print_label(data)}`,
    [Token.KIND_LABEL_CONTINUE]: (kind, data) => `Unbound continue label: ${print_label(data)}`,
    // Closure //
    [Token.KIND_MARKER_RETURN]: `ReturnStatement must be (directly) inside a closure`,
    [Token.KIND_MARKER_NEW_TARGET]: `MetaProperty 'new.target' must be (possibly deep) inside a FunctionExpression`,
    // Module //
    [Token.KIND_MARKER_IMPORT_META]: `MetaProperty 'import.meta' must be in a module`,
    [Token.KIND_MARKER_IMPORT]: `ImportDeclaration must be at the top-level of a module`,
    [Token.KIND_MARKER_EXPORT]: `ExportDeclaration must be at the top-level of a module`,
    // Strict //
    [Token.KIND_MARKER_WITH]: "WithStatement is forbidden in strict mode",
    [Token.KIND_MARKER_PATTERN_EVAL]: "Identifier 'eval' as a pattern is forbidden in strict mode",
    [Token.KIND_MARKER_PATTERN_ARGUMENTS]: "Identifier 'arguments' as a pattern is forbidden in strict mode",
    [Token.KIND_MARKER_DISCARD]: `UnaryExpresion which deletes an identifier is forbidden in strict mode`,
    [Token.KIND_MARKER_PARAM_DUPLICATE]: `Duplicate parameters is forbidden in strict mode`,
    // Variable //
    [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_PARAM]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_VAR]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_FUNCTION]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_LET]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_CONST]: raise_garbage_program_unexpected,
    [Token.KIND_VARIABLE_CLASS]: raise_garbage_program_unexpected,
    // Other //
    [Token.KIND_MARKER_EVAL]: raise_garbage_program_unexpected,
    [Token.KIND_MARKER_PATTERN_MEMBER]: raise_garbage_program_unexpected});

///////////////
// Transform //
///////////////

const transform_variable_param = {
  __proto__: null,
  ["var"]: Token.transform(Token.KIND_VARIABLE_PARAM, Token.KIND_VARIABLE_VAR),
  ["function"]: Token.transform(Token.KIND_VARIABLE_PARAM, Token.KIND_VARIABLE_FUNCTION),
  ["let"]: Token.transform(Token.KIND_VARIABLE_PARAM, Token.KIND_VARIABLE_LET),
  ["const"]: Token.transform(Token.KIND_VARIABLE_PARAM, Token.KIND_VARIABLE_CONST),
  ["class"]: Token.transform(Token.KIND_VARIABLE_PARAM, Token.KIND_VARIABLE_CLASS)};

///////////
// Hoist //
///////////

const set_capture = (tokens, test, node) => (
  node[KEY_CAPTURE] = ArrayLite.map(
    ArrayLite.filter(tokens, test),
    Token.to_variable),
  ArrayLite.filterOut(tokens, test));

const set_release = (tokens, node) => (
  node[KEY_CAPTURE] = ArrayLite.map(
    ArrayLite.filter(tokens, test_variable_non_void),
    Token.to_variable),
  tokens);

const set_use_strict = (nodes, node) => node[KEY_USE_STRICT] = Estree.has_use_strict(nodes, 0);

const set_eval_call = (tokens, node) => (
  node[KEY_EVAL_CALL] = ArrayLite.some(tokens, test_marker_eval),
  ArrayLite.filterOut(tokens, test_marker_eval));

////////////
// Helper //
////////////

const helper_for = (node) => (
  (
    node.type === "ForOfStatment" ?
    Assert.typeof(node, "await", "boolean") :
    null),
  ArrayLite.concat(
    visit(
      node.left,
      null,
      "VariableDeclaration",
      Estree.ENUM_TYPE_EXPRESSION,
      Estree.ENUM_TYPE_PATTERN),
    visit(
      node.right,
      null,
      Estree.ENUM_TYPE_EXPRESSION),
    ArrayLite.filterOut(
      visit(
        node.body,
        null,
        Estree.ENUM_TYPE_STATEMENT),
      test_label_empty),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `${node.type}.body cannot be a let/const/class declaration`),
    Token.mark(
      node.type === "ForOfStatment",
      Token.KIND_MARKER_AWAIT_FOR_OF,
      null),
    Token.check(
      (
        node.left.type === "VariableDeclaration" ||
        node.left.type === "CallExpression" ||
        node.left.type === "Identifier" ||
        node.left.type === "MemberExpression" ||
        node.left.type === "ObjectPattern" ||
        node.left.type === "ArrayPattern"),
      `${node.type}.left must be one of: VariableDeclaration, CallExpression, Identifier, MemberExpression, ObjectPattern, ArrayPattern`),
    Token.check(
      (
        node.left.type !== "VariableDeclaration" ||
        node.left.declarations.length === 1),
      `${node.type}.left must not be a VariableDeclaration with more than one declaration`),
    Token.check(
      (
        node.left.type !== "VariableDeclaration" ||
        ArrayLite.every(node.declarations, (node) => node.init === null)),
      `${node.type}.left must not be a VariableDeclaration with initializers`)));

const helper_function = (node, context, _tokens, _use_strict) => (
  Assert.typeof(node, "generator", "boolean"),
  Assert.typeof(node, "async", "boolean"),
  Assert.array(node, "params"),
  _tokens = ArrayLite.concat(
    (
      node.id === null ?
      [] :
      (
        node.type === "FunctionDeclaration" ?
        ArrayLite.map(
          visit(node.id, "pattern", "Identifier"),
          transform_variable_param["function"]) :
        ArrayLite.filterOut( // console.assert(node.type === "FunctionExpression")
          visit(node.id, "pattern", "Identifier"),
          test_variable_void))),
    visit(
      node.body,
      ArrayLite.flatMap(
        node.params,
        (node) => visit(
          node,
          "pattern",
          Estree.ENUM_TYPE_PATTERN)),
      "BlockStatement")),
  _use_strict = set_use_strict(node.body.body, node),
  _tokens = ArrayLite.concat(
    _tokens,
    check(
      node.type === "FunctionExpression" || node.id !== null || context === "anonymous",
      `FunctionDeclaration.id must not be null when not inside an anonymous declaration`),
    (
      ArrayLite.every(node.params, Estree.is_pattern_identifier) ?
      guard(
        ArrayLite.some(_tokens, test_variable_param_duplicate),
        Token.KIND_MARKER_PARAM_DUPLICATE,
        null) :
      check(
        ArrayLite.some(_tokens, test_variable_param_duplicate),
        `${node.type} with complex parameter list must not have duplicate parameters`))),
  _tokens = set_eval_call(_tokens, node),
  _tokens = set_capture(_tokens, test_variable_closure_param, node),
  _tokens = set_release(_tokens, node),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
  _tokens = (
    _use_strict ?
    ArrayLite.map(_tokens, raise_strict) :
    _tokens),
  _tokens = (
    node.generator ?
    ArrayLite.filterOut(_tokens, test_marker_yield) :
    _tokens),
  _tokens = (
    node.async ?
    ArrayLite.filterOut(_tokens, test_marker_await) :
    tokens),
  _tokens = (
    (
      context === "method" ||
      context === "constructor" ||
      context === "derived-constructor") ?
    ArrayLite.filterOut(_tokens, test_marker_super_member) :
    _tokens),
  _tokens = (
    context === "derived-constructor" ?
    ArrayLite.filterOut(_tokens, test_marker_super_call) :
    _tokens),
  _tokens = ArrayLite.map(_tokens, raise_garbage_closure),
  _tokens);

const helper_class = (node, context) => ArrayLite.map(
  ArrayLite.concat(
    (
      node.id === null ?
      [] :
      (
        node.type === "ClassDeclaration" ?
        ArrayLite.map(
          visit(
            node.id,
            "pattern",
            "Identifier"),
          transform_variable_param[Token.KIND_VARIABLE_CLASS]) :
        ArrayLite.filterOut(
          visit(
            node.id,
            "pattern",
            "Identifier"),
          test_variable_void))),
    (
      node.superClass === null ?
      [] :
      visit(node.superClass, null, Estree.ENUM_TYPE_EXPRESSION)),
    visit(
      node.body,
      noe.superClass === null ? null : "derived",
      "ClassBody"),
    check(
      (
        node.type !== "ClassDeclaration" ||
        node.id !== null ||
        context === "anonymous"),
      `ClassDeclaration must either be named or be in an anonymous context`)),
  raise_strict);

///////////////
// Top-Level //
///////////////

exports.module = (node, options) => ArrayLite.map(
  visit(
    node,
    global_Object_assign(
      {
        __proto__: null,
        "scope-frame": []},
      options,
      {
        __proto__: null,
        "capture-strict": test_variable_block_closure,
        "capture-normal": null,
        "function-ancestor": false,
        "closure-tag": null,
        "strict-mode": true}),
    "Program"),
  Token.to_error);

exports.script = (node, options) => ArrayLite.map(
  visit(
    node,
    global_Object_assign(
      {
        __proto__: null,
        "scope-frame": []},
      options,
      {
        __proto__: null,
        "capture-strict": make_false,
        "capture-normal": make_false,
        "function-ancestor": false,
        "closure-tag": null,
        "strict-mode": false}),
    "Program"),
  Token.to_error);

exports.eval = (node, options) => ArrayLite.map(
  visit(
    node,
    global_Object_assign(
      {
        __proto__: null,
        "scope-frame": [],
        "strict-mode": false,
        "function-ancestor": false,
        "closure-tag": null},
      options,
      {
        __proto__: null,
        "capture-strict": test_variable_block_closure,
        "capture-normal": test_variable_block,
        "function-ancestor": false}),
    "Program"),
  Token.to_error);

///////////
// Visit //
///////////

const visit = (node, context, ...discriminants) => {
  const loc = State.loc;
  State.loc = node.loc;
  Assert.node(node, discriminants);
  const tokens = visitors[node.type](node, context);
  State.loc = loc;
  return tokens;
};

const visitors = {
  __proto__: null,
  /////////////
  // Program //
  /////////////
  Program: (node, context, _tokens, _strict) => (
    // Setup //
    Assert.array(node, "body"),
    _tokens = ArrayLite.flatMap(
      node.body,
      (node) => visit(
        node,
        null,
        "ImportDeclaration",
        "ExportDefaultDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
        Estree.ENUM_TYPE_STATEMENT)),
    // Eval //
    _tokens = set_eval_call(_tokens, node),
    // Strict //
    _strict = set_use_strict(_tokens, node) || context["strict-mode"],
    _tokens = (
      _strict ?
      _tokens :
      ArrayLite.filterOut(_tokens, test_marker_strict)),
    // Hoisting //
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_capture(
      _tokens,
      _strict ? context["capture-strict"] : context["capture-normal"],
      node),
    _tokens = ArryLite.concat(
      ArrayLite.map(context["scope-frame"], Token.from_variable),
      _tokens),
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_release(_tokens, node),
    _tokens = ArrayLite.filterOut(_tokens, test_variable_non_void),
    // Module //
    _tokens = (
      context["module"] ?
      ArrayLite.filterOut(_tokens, test_marker_module) :
      _tokens),
    // NewTarget //
    _tokens = (
      context["function-ancestor"] ?
      ArrayLite.filterOut(_tokens, test_marker_new_target) :
      _tokens),
    // Super //
    _tokens = (
      context["closure-tag"] == "derived-constructor" ?
      ArrayLite.filterOut(_tokens, test_marker_super_call) :
      _tokens),
    _tokens = (
      (
        context["closure-tag"] == "derived-constructor" ||
        context["closure-tag"] == "constructor" ||
        context["closure-tag"] == "method") ?
       ArrayLite.filterOut(_tokens, test_marker_super_member) :
      _tokens),
    // Garbage //
    _tokens = ArrayLite.map(_tokens, raise_garbage_program),
    // Return //
    _tokens),
  ////////////
  // Module //
  ////////////
  ImportSpecifier: (node) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.imported, null, "Identifier")),
  ImportDefaultSpecifier: (node) => visit(node.local, null, "Identifier"),
  ImportNamespaceSpecifier: (node) => visit(node.local, null, "Identifier"),
  ImportDeclaration: (node) => (
    Assert.array(node, "specifiers"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.specifiers,
        (node) => visit(
          node,
          null,
          "ImportSpecifier",
          "ImportDefaultSpecifier",
          "ImportNamespaceSpecifier")),
      visit(node.source, null, "Literal"),
      Token.check(
        typeof node.source.value === "string",
        `ImportDeclaration.source must be a string literal`))),
  ExportSpecifier: (node) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.exported, null, "Identifier")),
  ExportNamedDeclaration: (node) => (
    Assert.array(node, "specifiers"),
    ArrayLite.concat(
      (
        node.declaration === null ?
        [] :
        visit(
          node.declaration,
          null,
          "VariableDeclaration",
          "FunctionDeclaration",
          "ClassDeclaration")),
      ArrayLite.flatMap(
        node.specifiers,
        (node) => visit(node, null, "ExportSpecifier")),
      (
        node.source === null ?
        [] :
        visit(node.source, null, "Literal")),
      Token.check(
        node.source === null || typeof node.source.value === "string",
        `ExportNamedDeclaration.source must either be null or a string literal`),
      Token.check(
        node.declaration !== null && node.source !== null,
        `ExportNamedDeclaration.declaration and ExportNamedDeclaration.source cannot be both non-null`))),
  ExportDefaultDeclaration: (node) => visit(
    node.declaration,
    "anonymous",
    "FunctionDeclaration",
    "ClassDeclaration",
    Estree.ENUM_TYPE_EXPRESSION),
  ExportAllDeclaration: (node) => ArrayLite.concat(
    visit(node.source, null, "Literal"),
    Token.check(
      typeof node.source.value === "string",
      `ExportAllDeclaration.source must be a string Literal`)),
  /////////////
  // Pattern //
  /////////////
  // context = "key" || "label" || "expression" || "pattern"
  Identifier: (node, context) => (
    Assert.typeof(node.name, "string"),
    ArrayLite.concat(
      Token.check(
        global_Reflect_apply(
          global_RegExp_prototype_test,
          /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
          [node.name]),
      `Identifier.name is invalid, got: ${global_JSON_stringify(node.name)}`),
      // Nice-to-have: Token.check for keywords based on strict mode and label
      Token.guard(
        context === "pattern",
        Token.KIND_VARIABLE_PARAM,
        node.name),
      Token.guard(
        context === "pattern" && node.name === "eval",
        Token.KIND_MARKER_PATTERN_EVAL),
      Token.guard(
        context === "pattern" && node.name === "arguments",
        Token.KIND_MARKER_PATTERN_ARGUMENTS))),
  MemberExpression: (node, context) => (
    Assert.typeof(node, "computed", "boolean"),
    Assert.typeof(node, "optional", "boolean"),
    ArrayLite.concat(
      visit(
        node.object,
        context === "chain" ? "chain" : null,
        "Super",
        Estree.ENUM_TYPE_EXPRESSION),
      visit(
        node.property,
        node.computed ? null : "key",
        Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        node.optional && context !== "chain",
        `MemberExpression.optional must be false when outside a chain`),
      Token.check(
        node.computed || node.property.type === "Identifier",
        `MemberExpression.property must be an identifier when non-computed`),
      Token.guard(
        context === "pattern",
        Token.KIND_MARKER_PATTERN_MEMBER),
      Token.guard(
        node.object.type === "Super",
        Token.KIND_MARKER_SUPER_MEMBER))),
  RestElement: (node) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_PATTERN),
    Token.check(
      node.argument.type !== "RestElement",
      `RestElement.argument cannot be a RestElement itself`)),
  AssignmentPattern: (node) => ArrayLite.concat(
    visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN),
    visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.check(
      node.left.type !== "RestElement",
      `AssignmentPattern.left cannot be a RestElement`)),
  ObjectPattern: (node) => (
    Assert.array(node, "properties"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(
          node,
          "pattern",
          "Property",
          "RestElement")),
      Token.check(
        ArrayLite.every(
          node.properties,
          (node, index, array) => (
            index === array.length - 1 ||
            node.type !== "RestElement")),
        `RestElement must only appear in last position`))),
  ArrayPattern: (node) => (
    Assert.array(node, "elements"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.elements,
        (node) => (
          node === null ?
          [] :
          visit(
            node,
            "pattern",
            Estree.ENUM_TYPE_PATTERN))),
      Token.check(
        ArrayLite.every(
          node.elements,
          (node, index, array) => (
            node === null ||
            index === array.length - 1 ||
            node.type !== "RestElement")),
        `RestElement must only appear in last position`))),
  //////////////
  // Property //
  //////////////
  Property: (node, context) => (
    Assert.enum(node, "kind", Estree.ENUM_PROPERTY_KIND),
    Assert.typeof(node, "method", "boolean"),
    Assert.typeof(node, "computed", "boolean"),
    Assert.typeof(node, "shorthand", "boolean"),
    ArrayLite.concat(
      visit(
        node.key,
        node.computed ? null : "key",
        Estree.ENUM_TYPE_EXPRESSION),
      (
        context === "Pattern" ?
        visit(
          node.value,
          "pattern",
          Estree.ENUM_TYPE_PATTERN) :
        ArrayLite.filter(
          visit(
            node.value,
            null,
            Estree.ENUM_TYPE_EXPRESSION),
          (
            node.method ?
            Token.test(Token.KIND_MARKER_SUPER_MEMBER) :
            identity))),
      Token.check(
        (
          node.computed ||
          node.key.type === "Identifier" ||
          (node.key.type === "Literal" && typeof node.key.value === "string")),
        `The key of a non-computed property must either be an identifier or a string literal`),
      Token.check(
        node.kind === "init" || !node.method,
        `A property cannot be both a method and an accessor at the same time`),
      Token.check(
        node.kind === "init" || node.value.type === "FunctionExpression",
        `The value of an accessor property must be a function`),
      Token.check(
        node.kind !== "get" || node.value.params.length === 0,
        `The value of an getter property must be a function with no parameters`),
      Token.check(
        node.kind !== "set" || node.value.params.length === 1,
        `The value of an setter property must be a function with exactly one parameter`))),
  /////////////////
  // Declaration //
  /////////////////
  VariableDeclarator: (node) => ArrayLite.concat(
    ArrayLite.map(
      visit(node.id, "pattern", Estree.ENUM_TYPE_PATTERN),
      Token.raise(
        Token.KIND_MEMBER_PATTERN,
        `MemberExpression cannot be used as a pattern in a declaration context`)),
    (
      node.init === null ?
      [] :
      visit(node.init, null, Estree.ENUM_TYPE_EXPRESSION)),
    Token.check(
      node.id.type !== "AssignmentPattern",
      `VariableDeclarator.id cannot be an AssignmentPattern`)),
  VariableDeclaration: (node) => (
    Assert.enum(node, "kind", Estree.ENUM_KIND_VARIABLE),
    Assert.array(node, "declarations"),
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(
          node.declarations,
          (node) = visit(
            node,
            null,
            "VariableDeclarator")),
        transform_variable_param[node.kind]),
      Token.check(
        node.declarations.length > 0,
        `VariableDeclaration.declarations must not be an empty array`))),
  FunctionDeclaration: helper_function,
  ClassDeclaration: helper_function,
  //////////////////////
  // Atomic Statement //
  //////////////////////
  EmptyStatement: (node) => [],
  DebuggerStatement: (node) => [],
  ThrowStatement: (node) => visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
  ExpressionStatement: (node) => visit(node.expressionm, null, Estree.ENUM_TYPE_EXPRESSION),
  ReturnStatement: (node) => (
    node.argument === null ?
    [] :
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION)),
  BreakStatement: (node) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    Token.guard(
      true,
      Token.KIND_LABEL_BREAK,
      node.label === null ? node.label.name : null)),
  ContinueStatement: (node) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    Token.guard(
      true,
      Token.KIND_LABEL_CONTINUE,
      node.label === null ? node.label.name : null)),
  /////////////////////////
  // Commpound Statement //
  /////////////////////////
  LabeledStatement: (node, context, _tokens) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    _tokens = visit(node.body, null, Estree.ENUM_TYPE_STATEMENT)
    (
      Estree.has_loop_body(node) ?
      ArrayLite.filterOut(
        _tokens,
        make_test_label(node.label.name)) :
      ArrayLite.filterOut(
        ArrayLite.map(
          _tokens,
          make_raise_label_continue(node.label.name)),
        make_test_label_break(node.label.name)))),
  BlockStatement: (node, context, _tokens) => (
    Assert.array(node, "body"),
    _tokens = ArrayLite.concat(
      context || [],
      ArrayLite.flatMap(
        node.body,
        (node) => visit(
          node,
          null,
          Estree.ENUM_TYPE_STATEMENT))),
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_capture(_tokens, test_variable_block, node),
    _tokens = set_release(_tokens, node),
    _tokens),
  IfStatement: (node) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.consequent, null, Estree.ENUM_TYPE_STATEMENT),
    (
      node.alternate === null ?
      [] :
      visit(node.alternate, null, Estree.ENUM_TYPE_STATEMENT)),
    Token.check(
      (
        node.consequent.type !== "ClassDeclaration" &&
        (
          node.consequent.type !== "VariableDeclaration" ||
          node.consequent.kind === "var")),
      `IfStatement.consequent must not be a let/const/class declaration`),
    Token.check(
      (
        node.alternate === null ||
        (
          node.alternate.type !== "ClassDeclaration" &&
          (
            node.alternate.type !== "VariableDeclaration" ||
            node.alternate.kind === "var"))),
      `IfStatement.alternate must not be a let/const/class declaration`)),
  WithStatement: (node) => ArrayLite.concat(
    visit(node.object, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `WithStatement.body must not be a let/const/class declaration`)),
  CatchClause: (node, context, _tokens) => (
    _tokens = visit(
        node
        (
          node.param === null ?
          [] :
          visit(node.param, "pattern", null)),
        "BlockStatement"),
    _tokens = ArrayLite.concat(
      _tokens,
      check(
        !ArrayLite.some(_tokens, test_variable_param_duplicate),
        `CatchClause must not have duplicate parameter`)),
    _tokens = set_capture(_tokens, test_variable_param, node),
    _tokens = set_release(_tokens, node),
    _tokens),
  TryStatment: (node) => ArrayLite.concat(
    visit(node.block, null, "BlockStatement"),
    (
      node.handler === null ?
      [] :
      visit(node.handler, null, "CatchClause")),
    (
      node.finalizer === null ?
      [] :
      visit(node.finalizer, null, "BlockStatement"))),
  WhileStatement: (node) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    ArrayLite.filterOut(
      visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
      test_label_empty),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `WileStatement.body cannot be a let/const/class declaration`)),
  DoWhileStatement: (node) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    ArrayLite.filterOut(
      visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
      test_label_empty),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `DoWileStatement.body cannot be a let/const/class declaration`)),
  ForStatement: (node) => ArrayLite.concat(
    (
      node.init === null ?
      [] :
      capture(
        visit(node.init, null, "VariableDeclaration", Estree.ENUM_TYPE_EXPRESSION),
        test_variable_block,
        node)),
    (
      node.test === null ?
      [] :
      visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION)),
    (
      node.update === null ?
      [] :
      visit(node.update, null, Estree.ENUM_TYPE_EXPRESSION)),
    ArrayLite.filterOut(
      visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
      test_label_empty),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `ForStatement.body cannot be a let/const/class declaration`)),
  ForInStatement: helper_for,
  ForOfStatement: helper_for,
  SwitchCase: (node) => (
    Assert.array(node, "consequent"),
    ArrayLite.concat(
      visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(node.consequent[index], null, Estree.ENUM_TYPE_STATEMENT)))),
  SwitchStatement: (node) => (
    Assert.array(node, "cases"),
    _tokens = ArrayLite.concat(
      ArrayLite.flatMap(
        node.cases,
        (node) => visit(node, null, "SwitchCase")),
      Token.check(
        ArrayLite.filter(node.cases, (node) => node.test === null).length > 1,
        `SwitchStatement must not have more than one default case`)),
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_capture(_tokens, test_variable_block, node),
    _tokens = set_release(_tokens, node),
    _tokens),
  ////////////////////////
  // Expression Special //
  ////////////////////////
  YieldExpression: (node) => (
    Assert.typeof(node, "delegate", "boolean"),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.mark(true, Token.KIND_MARKER_YIELD, null))),
  AwaitExpression: (node) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.mark(true, Token.KIND_MARKER_AWAIT, null)),
  ///////////////////////////
  // Expression >> Literal //
  ///////////////////////////
  Literal: (node, context) => (
    (
      "regex" in node ?
      Assert.object(node, "regex", {__proto__: null, pattern:"string", flags:"string"}) :
      null),
    (
      "bigint" in node ?
      Assert.typeof(node, "bigint", "string") :
      null),
    Assert.json(node, "value"),
    ArrayLite.concat(
      Token.check(
        (
          !("bigint" in node) ||
          node.bigint === "0n" ||
          global_Reflect_apply(
            global_RegExp_prototype_test,
            /^[1-9][0-9]+n$/,
            [node.bigint])),
        `Literal.bigint is invalid`),
      Token.check(
        !("regex" in node) || !("bigint" in node),
        `Literal.regex and Literal.bigint cannot be both present`))),
  TemplateElement: (node) => (
    Assert.typeof(node, "tail", "boolean"),
    Assert.object(node, "value", {cooked:"string", raw:"string"}),
    []),
  TemplateLiteral: (node) => (
    Assert.array(node, "quasis"),
    Assert.array(node, "expressions"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.quasis,
        (node) => visit(node, null, "TemplateElement")),
      ArrayLite.flatMap(
        node.expressions,
        (node) => visit(node, null, Estree.ENUM_TYPE_EXPRESSION)),
      Token.check(
        ArrayLite.every(node.quasis, (node, index, array) => node.tail === (index === array.length - 1)),
        `TemplateLiteral: the tail property of its elements must reflect its position`),
      Token.check(
        node.quasis.length === node.expression.length + 1,
        `TemplateLiteral.quasis must have exacly one additional element over TemplateLiteral.expressions`))),
  TaggedTemplateLiteral: (node) => ArrayLite.concat(
    visit(node.tag, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.quasi, null, "TemplateLiteral")),
  ArrowFunctionExpression: (node, context, _tokens, _use_strict) => (
    Assert.typeof(node, "async", "boolean"),
    Assert.typeof(node, "expression", "boolean"),
    Assert.array(node, "params"),
    // Only instance where we need to lookup node before visiting
    _tokens = (
      (
        node.body !== null &&
        node.body !== void 0 &&
        node.body.type === "BlockStatement") ?
      visit(
        node,
        ArrayLite.flatMap(
          node.params,
          (node) => visit(
            node,
            "pattern",
            Estree.ENUM_TYPE_PATTERN)),
        "BlockStatement") :
      ArrayLite.concat(
        ArrayLite.flatMap(
          node.params,
          (node) => visit(
            node,
            "pattern",
            Estree.ENUM_TYPE_PATTERN)),
        visit(
          node,
          null,
          Estree.ENUM_TYPE_EXPRESSION))),
    _use_strict = set_use_strict(
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        []),
      node),
    _tokens = ArrayLite.concat(
      _tokens,
      check(
        !ArrayLite.some(_tokens, test_variable_param_duplicate),
        `ArrowFunctionExpression must not have duplicate parameters`),
      check(
        node.expression === (node.body.type !== "BlockStatement"),
        `ArrowFunctionExpression.expression must indicate whether its body is an expression or a block statement`),
      check(
        (
          !_use_strict ||
          ArrayLite.every(node.params, Estree.is_pattern_identifier)),
        `ArrowFunctionExpression with not simple parameter list must not have a 'use-strict' directive`)),
    _tokens = set_eval_call(_tokens, node),
    _tokens = set_capture(_tokens, test_variable_closure_param, node),
    _tokens = set_release(_tokens, node),
    _tokens = (
      _use_strict ?
      ArrayLite.map(_tokens, raise_marker_strict) :
      _tokens),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
    _tokens = (
      node.async ?
      ArrayLite.filterOut(_tokens, test_marker_await) :
      _tokens),
    _tokens = ArrayLite.map(_tokens, raise_marker_super_member),
    _tokens = ArrayLite.map(_tokens, raise_marker_super_call),
    _tokens = ArrayLite.map(_tokens, raise_garbage_closure),
    _tokens),
  FunctionExpression: helper_function,
  ClassExpression: helper_class,
  ///////////
  // Class //
  ///////////
  ClassBody: (node, context) => (
    Assert.array(node.body),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.body,
        (node) => visit(
          node,
          context,
          "MethodDefinition")),
      Token.check(
        ArrayLite.filter(node.body, (node) => node.kind === "constructor").length > 1,
        `Class body cannot have more than one constructor`))),
  MethodDefinition: (node, context) => (
    Assert.typeof(node, "computed", "boolean"),
    Assert.typeof(node, "static", "boolean"),
    Assert.enum(node, "kind", Estree.ENUM_KIND_METHOD),
    ArrayLite.concat(
      visit(
        node.key,
        node.computed ? null : "key",
        Estree.ENUM_TYPE_EXPRESSION),
      visit(
        node.value,
        (
          node.kind === "constructor" ?
          (
            context === "derived" ?
            "derived-constructor" :
            "constructor") :
          "method"),
        "FunctionExpression"),
      check(
        (
          node.computed ||
          node.key.type === "Identifier" ||
          (
            node.key.type === "Literal" &&
            typeof node.key.value === "string")),
        `Non-computed method name must either be an identifier or a string literal`))),

  ///////////////////////////////
  // Expression >> Environment //
  ///////////////////////////////
  MetaProperty: (node) => ArrayLite.concat(
    visit(node.meta, "meta-object", "Identifier"),
    visit(node.property, "meta-property", "Identifier"),
    Token.guard(
      (node.meta.name === "new" && node.property.name === "target"),
      Token.KIND_MARKER_NEW_TARGET,
      null),
    Token.guard(
      (node.meta.name === "import" && node.property.name === "meta"),
      Token.KIND_MARKER_IMPORT_META,
      null),
    Token.check(
      (
        (node.meta.name === "new" && node.property.name === "target") ||
        (node.meta.name === "import" && node.property.name === "meta")),
      `Meta property must either be 'new.target' or 'import.meta'`)),
  UpdateExpression: (node) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UPDATE),
    ArrayLite.concat(
      visit(node.argument, "pattern", Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        (
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`))),
  AssignmentExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_ASSIGNMENT),
    ArrayLite.concat(
      visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        (
          node.operator === "=" ||
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `When not performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, or a MemberExpression`),
      Token.check(
        (
          node.operator !== "=" ||
          node.argument.type === "Identifier" ||
          node.argument.type === "CallExpression" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "ObjectPattern" ||
          node.argument.type === "ArrayPattern"),
        `When performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, a MemberExpression, an ObjectPattern, or an ArrayPattern`))),
  ///////////////////////////////
  // Expression >> ControlFlow //
  ///////////////////////////////
  ChainExpression: (node) => visit(node.expression, "chain", "MemberExpression", "CallExpression"),
  ConditionalExpression: (node) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.consequent, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.alternate, null, Estree.ENUM_TYPE_EXPRESSION)),
  LogicalExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_LOGICAL),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
  SequenceExpression: (node) => (
    Assert.array(node, "expressions"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.expressions,
        (node) => (
          node === null ?
          [] :
          visit(node.expressions[index], null, Estree.ENUM_TYPE_EXPRESSION))),
      Token.check(
        node.expressions.length > 0,
        `LogicalExpression.expressions must not be an empty array`))),
  UnaryExpression: (node) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UNARY),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        node.prefix,
        `UpdateExpression.prefix must be true`),
      Token.guard(
        (node.operator === "delete" && node.argument.type === "Identifier"),
        Token.KIND_EXPRESSION_UNARY_DELETE_IDENTIFIER,
        null))),
  BinaryExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_BINARAY),
    ArrayLite.concat(
      visit(node.left, null, ENUM_TYPE_EXPRESSION),
      visit(node.right, null, ENUM_TYPE_EXPRESSION))),
  CallExpression: (node, context) => (
    Assert.array(node, "arguments"),
    Assert.typeof(node, "optional", "boolean"),
    ArrayLite.concat(
      visit(
        node.callee,
        context === "chain" ? "chain" : null,
        "Super",
        Estree.ENUM_TYPE_EXPRESSION),
      ArrayLite.flatMap(
        node.arguments,
        (node) => visit(
          node,
          null,
          "SpreadElement",
          Estree.ENUM_TYPE_EXPRESSION)),
      Token.check(
        !node.optional || context === "chain",
        `CallExpression.optional must be false when outside a chain`),
      Token.guard(
        node.callee.type === "Identifier" && node.callee.type.name === "eval",
        Token.KIND_CALL_EVAL,
        null),
      Token.guard(
        node.callee.type === "Super",
        Token.KIND_CALL_SUPER,
        null))),
  NewExpression: (node) => (
    Assert.array(node, "arguments"),
    ArrayLite.concat(
      visit(node.callee, null, Estree.ENUM_TYPE_EXPRESSION),
      ArrayLite.flatMap(
        node.arguments,
        (node) => visit(
          node,
          null,
          "SpreadElement",
          Estree.ENUM_TYPE_EXPRESSION)))),
  ArrayExpression: (node) => (
    Assert.array(node.elements),
    ArrayLite.flatMap(
      node.elements,
      (node) => (
        node === null ?
        [] :
        visit(
          node,
          null,
          "SpreadElement",
          Estree.ENUM_TYPE_EXPRESSION)))),
  ObjectExpression: (node) => (
    Assert.array(node.properties),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(node, null, "SpreadElement", "Property")),
      Token.check(
        ArrayLite.filter(node.propertiers, Estree.is_proto_property).length > 1,
        `Duplicate '__proto__' fields are not allowed in object literals`)))};
