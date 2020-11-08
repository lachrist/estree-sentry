"use strict";

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;
const global_Reflect_apply = global.Reflect.apply;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_JSON_stringify = global.JSON.stringify;

const ArrayLite = require("array-lite");
const Estree = require("./estree.js");
const State = require("./state.js");
const Token = require("./token.js");
const Assert = require("./assert.js");

const make_false = () => false;

const print_label = (label) => (
  label === null ?
  `<empty>` :
  `'${label}'`);

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

const test_marker_identifier_await = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_IDENTIFIER_AWAIT]: null});

const test_marker_identifier_yield = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_IDENTIFIER_YIELD]: null});

const test_marker_new_target = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_NEW_TARGET]: null});

const test_marker_super_member = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_SUPER_MEMBER]: null});

const test_marker_super_call = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_SUPER_CALL]: null});

const test_marker_yield = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_YIELD]: null});

const test_marker_await = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_AWAIT]: null,
    [Token.KIND_MARKER_AWAIT_FOR_OF]: null});

const test_marker_return = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_RETURN]: null});

const test_variable_param_duplicate_enum = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM]: null};
const test_variable_param_duplicate = (token, index, tokens) => (
  test_variable_param(token) &&
  (
    ArrayLite.filter(
      tokens,
      Token.test(
        test_variable_param_duplicate_enum,
        Token.to_variable(token).name)).length >
    1));

const test_marker_pattern_member = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_PATTERN_MEMBER]: null});

const test_marker_eval = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_EVAL]: null});

const test_marker_strict = Token.test(
  {
    __proto__: null,
    [Token.KIND_STRICT]: null});

const test_label_empty = Token.test(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: null,
    [Token.KIND_LABEL_CONTINUE]: null},
  null);

const test_marker_module = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_IMPORT_DECLARATION]: null,
    [Token.KIND_MARKER_EXPORT_DECLARATION]: null,
    [Token.KIND_MARKER_IMPORT_META]: null});

const test_label_break_empty = Token.test(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: null},
  null);

const make_test_label_break_enum = {
  __proto__: null,
  [Token.KIND_LABEL_BREAK]:null};
const make_test_label_break = (label) => Token.test(make_test_label_break_enum, label);

const make_test_label_enum = {
  __proto__: null,
  [Token.KIND_LABEL_BREAK]:null,
  [Token.KIND_LABEL_CONTINUE]: null};
const make_test_label = (label) => Token.test(make_test_label_enum, label);

///////////
// Raise //
///////////

const raise_marker_await_yield = Token.raise(
  {
    __proto__: null,
    [Token.KIND_MARKER_AWAIT]: `AwaitExpression cannot appear in this context`,
    [Token.KIND_MARKER_YIELD]: `YieldExpression cannot appear in this context`});

const raise_label_continue_empty = Token.raise(
  {
    __proto__: null,
    [Token.KIND_LABEL_CONTINUE]: `ContinueStatement.label (empty) must be bound to a loop statement`},
  null);

const raise_marker_pattern_member = Token.raise(
  {
    __proto__: null,
    [Token.KIND_MARKER_PATTERN_MEMBER]: `MemberExpression cannot be used as a pattern in a declaration context`});

const make_raise_label_continue_object = {
  __proto__: null,
  [Token.KIND_LABEL_CONTINUE]: (kind, data) => `ContinueStatement.label '${data}' must be bound to a loop statement`};
const make_raise_label_continue = (label) => Token.raise(make_raise_label_continue_object, label);

const raise_strict = Token.raise(
  {
    __proto__: null,
    [Token.KIND_STRICT]: (kind, data) => data});

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

const raise_garbage_unexpected = (kind, data) => { throw new global_Error(`Unexpected token ${kind} carrying ${data}`) };
const raise_garbage_enum = {
  __proto__: null,
  // Generator / Asynchronous //
  [Token.KIND_MARKER_IDENTIFIER_AWAIT]: `'await' must not be used as an identifier in asynchronous closures`,
  [Token.KIND_MARKER_IDENTIFIER_YIELD]: `'yield' must not be used as an identifier in generator closures`,
  [Token.KIND_MARKER_AWAIT]: `AwaitExpression must be directly in a asynchronous closure`,
  [Token.KIND_MARKER_AWAIT_FOR_OF]: `ForOfStatement with await must be directly in a asynchronous closure`,
  [Token.KIND_MARKER_YIELD]: `YieldExpression must be directly in a generator closure`,
  // Label //
  [Token.KIND_LABEL_BREAK]: (kind, data) => `Unbound break label: ${print_label(data)}`,
  [Token.KIND_LABEL_CONTINUE]: (kind, data) => `Unbound continue label: ${print_label(data)}`,
  // Variable //
  [Token.KIND_VARIABLE_PARAM]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_VAR]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_FUNCTION]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_LET]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_CONST]: raise_garbage_unexpected,
  [Token.KIND_VARIABLE_CLASS]: raise_garbage_unexpected,
  // Other //
  [Token.KIND_MARKER_RETURN]: raise_garbage_unexpected,
  [Token.KIND_MARKER_EVAL]: raise_garbage_unexpected,
  [Token.KIND_MARKER_PATTERN_MEMBER]: raise_garbage_unexpected,
  // Module //
  [Token.KIND_MARKER_IMPORT_DECLARATION]: raise_garbage_unexpected,
  [Token.KIND_MARKER_EXPORT_DECLARATION]: raise_garbage_unexpected};

const raise_garbage_arrow = Token.raise(raise_garbage_enum);

const raise_garbage_function = Token.raise(
  {
    __proto__: raise_garbage_enum,
    [Token.KIND_MARKER_NEW_TARGET]: raise_garbage_unexpected,
    [Token.KIND_MARKER_SUPER_CALL]: `CallExpression with Super callee must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `MemberExpression with Super object must be directly in a method or a constructor`});

const raise_garbage_program = Token.raise(
  {
    __proto__: raise_garbage_enum,
    // Closure //
    [Token.KIND_MARKER_IDENTIFIER_AWAIT]: raise_garbage_unexpected,
    [Token.KIND_MARKER_IDENTIFIER_YIELD]: raise_garbage_unexpected,
    [Token.KIND_MARKER_NEW_TARGET]: `MetaProperty 'new.target' must be (possibly deep) inside a FunctionExpression`,
    [Token.KIND_MARKER_SUPER_CALL]: `CallExpression with Super callee must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `MemberExpression with Super object must be directly in a method or a constructor`,
    [Token.KIND_MARKER_RETURN]: `ReturnStatement must be (directly) inside a closure`,
    [Token.KIND_MARKER_NEW_TARGET]: `MetaProperty 'new.target' must be (possibly deep) inside a FunctionExpression`,
    // Module //
    [Token.KIND_MARKER_IMPORT_META]: `MetaProperty 'import.meta' must be in a module`,
    [Token.KIND_MARKER_IMPORT_DECLARATION]: `ImportDeclaration must be at the top-level of a module`,
    [Token.KIND_MARKER_EXPORT_DECLARATION]: `ExportDeclaration must be at the top-level of a module`,
    // Strict //
    [Token.KIND_STRICT]: raise_garbage_unexpected});

///////////////
// Transform //
///////////////

const transform_variable_void_enum = {
  __proto__: null,
  [Token.KIND_VARIABLE_VOID]: null};
const transform_variable_void = {
  __proto__: null,
  ["param"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_PARAM),
  ["var"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_VAR),
  ["function"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_FUNCTION),
  ["let"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_LET),
  ["const"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_CONST),
  ["class"]: Token.transform(transform_variable_void_enum, Token.KIND_VARIABLE_CLASS)};

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
    set_release(
      set_capture(
        ArrayLite.filterOut(
          ArrayLite.filterOut(
            ArrayLite.map(
              visit(
                node.left,
                null,
                "VariableDeclaration",
                Estree.ENUM_TYPE_EXPRESSION,
                Estree.ENUM_TYPE_PATTERN),
              raise_variable_rigid_duplicate),
            test_marker_pattern_member),
          test_variable_void),
        test_variable_block,
        node),
      node),
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
    Token.guard(
      (
        node.type === "ForOfStatment" &&
        node.await),
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
        ArrayLite.every(node.left.declarations, Estree.is_declaration_non_initialized)),
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
          transform_variable_void["function"]) :
        ArrayLite.filterOut( // console.assert(node.type === "FunctionExpression")
          visit(node.id, "pattern", "Identifier"),
          test_variable_void))),
    visit(
      node.body,
      ArrayLite.map(
        ArrayLite.map(
          ArrayLite.map(
            ArrayLite.flatMap(
              node.params,
              (node) => visit(
                node,
                "pattern",
                Estree.ENUM_TYPE_PATTERN)),
            transform_variable_void["param"]),
          raise_marker_pattern_member),
        raise_marker_await_yield),
      "BlockStatement")),
  _use_strict = set_use_strict(node.body.body, node),
  _tokens = ArrayLite.concat(
    _tokens,
    Token.check(
      node.type === "FunctionExpression" || node.id !== null || context === "anonymous",
      `FunctionDeclaration.id must not be null when not inside an anonymous declaration`),
    (
      ArrayLite.every(node.params, Estree.is_pattern_identifier) ?
      Token.guard(
        ArrayLite.some(_tokens, test_variable_param_duplicate),
        Token.KIND_STRICT,
        `In strict mode, ${node.type}.params must not contain duplicate variables`) :
      ArrayLite.concat(
        Token.check(
          !_use_strict,
          `${node.type} with non-simple parameter list must not have a 'use strict' directive`),
        Token.check(
          !ArrayLite.some(_tokens, test_variable_param_duplicate),
          `${node.type} with non-simple parameter list must not have duplicate parameters`)))),
  _tokens = set_eval_call(_tokens, node),
  _tokens = set_capture(_tokens, test_variable_closure_param, node),
  _tokens = set_release(_tokens, node),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_new_target),
  _tokens = (
    _use_strict ?
    ArrayLite.map(_tokens, raise_marker_strict) :
    _tokens),
  _tokens = (
    node.generator ?
    ArrayLite.filterOut(_tokens, test_marker_yield) :
    ArrayLite.filterOut(_tokens, test_marker_identifier_yield)),
  _tokens = (
    node.async ?
    ArrayLite.filterOut(_tokens, test_marker_await) :
    ArrayLite.filterOut(_tokens, test_marker_identifier_await)),
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
  _tokens = ArrayLite.map(_tokens, raise_garbage_function),
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
          transform_variable_void[Token.KIND_VARIABLE_CLASS]) :
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
      node.superClass === null ? null : "derived",
      "ClassBody"),
    Token.check(
      (
        node.type !== "ClassDeclaration" ||
        node.id !== null ||
        context === "anonymous"),
      `ClassDeclaration must either be named or be in an anonymous context`)),
  raise_marker_strict);

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
        "module": true,
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
        "module": false,
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
        "module": false,
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
    _tokens = ArrayLite.concat(
      ArrayLite.flatMap(
        node.body,
        (node) => visit(
          node,
          null,
          "ImportDeclaration",
          "ExportDefaultDeclaration",
          "ExportNamedDeclaration",
          "ExportAllDeclaration",
          Estree.ENUM_TYPE_STATEMENT)),
      Token.check(
        ArrayLite.filter(node.body, Estree.is_node_export_default_declaration).length <= 1,
        `Program.body cannot have more than one ExportDefaultDeclaration`)),
    // Eval //
    _tokens = set_eval_call(_tokens, node),
    // Strict //
    _strict = set_use_strict(_tokens, node) || context["strict-mode"],
    _tokens = (
      _strict ?
      ArrayLite.map(_tokens, raise_marker_strict) :
      ArrayLite.filterOut(_tokens, test_marker_strict)),
    // Hoisting //
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_capture(
      _tokens,
      _strict ? context["capture-strict"] : context["capture-normal"],
      node),
    _tokens = ArrayLite.concat(
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
    // Asynchronous && Generator //
    _tokens = ArrayLite.filterOut(_tokens, test_marker_identifier_await),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_identifier_yield),
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
  ImportSpecifier: (node, context) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.imported, null, "Identifier")),
  ImportDefaultSpecifier: (node, context) => visit(node.local, null, "Identifier"),
  ImportNamespaceSpecifier: (node, context) => visit(node.local, null, "Identifier"),
  ImportDeclaration: (node, context) => (
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
      Token.guard(
        true,
        Token.KIND_MARKER_IMPORT_DECLARATION,
        null),
      Token.check(
        typeof node.source.value === "string",
        `ImportDeclaration.source must be a string literal`))),
  ExportSpecifier: (node, context) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.exported, null, "Identifier")),
  ExportNamedDeclaration: (node, context) => (
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
      Token.guard(
        true,
        Token.KIND_MARKER_EXPORT_DECLARATION,
        null),
      Token.check(
        node.source === null || typeof node.source.value === "string",
        `ExportNamedDeclaration.source must either be null or a string literal`),
      Token.check(
        node.declaration === null || node.source === null,
        `ExportNamedDeclaration.declaration and ExportNamedDeclaration.source cannot be both non-null`))),
  ExportDefaultDeclaration: (node, context) => ArrayLite.concat(
    visit(
      node.declaration,
      "anonymous",
      "FunctionDeclaration",
      "ClassDeclaration",
      Estree.ENUM_TYPE_EXPRESSION),
    Token.guard(
      true,
      Token.KIND_MARKER_EXPORT_DECLARATION,
      null)),
  ExportAllDeclaration: (node, context) => ArrayLite.concat(
    visit(node.source, null, "Literal"),
    Token.guard(
      true,
      Token.KIND_MARKER_EXPORT_DECLARATION,
      null),
    Token.check(
      typeof node.source.value === "string",
      `ExportAllDeclaration.source must be a string Literal`)),
  /////////////
  // Pattern //
  /////////////
  // context = "key" || "label" || "expression" || "pattern"
  Identifier: (node, context) => (
    Assert.typeof(node, "name", "string"),
    ArrayLite.concat(
      Token.check(
        Estree.is_identifier_name_valid(node.name),
        `Identifier.name is invalid, got: ${node.name}`),
      // Nice-to-have: Token.check for keywords based on strict mode and context (key, label, pattern, null)
      Token.guard(
        context === "pattern",
        Token.KIND_VARIABLE_PARAM,
        node.name),
      Token.check(
        (
          context === "key" ||
          node.name === "await" ||
          node.name === "yield" ||
          !(node.name in Estree.ENUM_RESERVED_WORD)),
        `Identifier.name is reserved word, got: '${node.name}'`),
      Token.guard(
        context.key !== "key" && node.name === "await",
        Token.KIND_MARKER_IDENTIFIER_AWAIT,
        null),
      Token.guard(
        context !== "key" && node.name === "yield",
        Token.KIND_MARKER_IDENTIFIER_YIELD,
        null),
      Token.guard(
        context !== "key" && node.name in Estree.ENUM_RESERVED_WORD_STRICT,
        Token.KIND_STRICT,
        `In strict mode, Identifier.name is a reserved word, got: ${node.name}`),
      Token.guard(
        context === "pattern" && node.name === "eval",
        Token.KIND_STRICT,
        `In strict mode, Identifier.name must not be 'eval' when the node is used as a pattern`),
      Token.guard(
        context === "pattern" && node.name === "arguments",
        Token.KIND_STRICT,
        `In strict mode, Identifier.name must not be 'arguments' when the node is used as a pattern`))),
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
        !node.optional || context === "chain",
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
  RestElement: (node, context) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_PATTERN),
    Token.check(
      node.argument.type !== "AssignmentPattern",
      `RestElement.argument cannot be an assignment pattern`),
    Token.check(
      node.argument.type !== "RestElement",
      `RestElement.argument cannot be a RestElement itself`)),
  AssignmentPattern: (node, context) => ArrayLite.concat(
    visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN),
    visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.check(
      node.left.type !== "RestElement",
      `AssignmentPattern.left cannot be a RestElement`)),
  ObjectPattern: (node, context) => (
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
  ArrayPattern: (node, context) => (
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
    Assert.enum(node, "kind", Estree.ENUM_KIND_PROPERTY),
    Assert.typeof(node, "method", "boolean"),
    Assert.typeof(node, "computed", "boolean"),
    Assert.typeof(node, "shorthand", "boolean"),
    ArrayLite.concat(
      visit(
        node.key,
        node.computed ? null : "key",
        Estree.ENUM_TYPE_EXPRESSION),
      (
        context === "pattern" ?
        visit(
          node.value,
          "pattern",
          Estree.ENUM_TYPE_PATTERN) :
        visit(
          node.value,
          (
            (
              node.method ||
              node.kind !== "init") ?
            "method" :
            null),
          Estree.ENUM_TYPE_EXPRESSION)),
      Token.check(
        (
          node.computed ||
          node.key.type === "Identifier" ||
          node.key.type === "Literal"),
        `The key of a non-computed property must either be an identifier or a literal`),
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
  VariableDeclarator: (node, context) => ArrayLite.concat(
    ArrayLite.map(
      visit(node.id, "pattern", Estree.ENUM_TYPE_PATTERN),
      raise_marker_pattern_member),
    (
      node.init === null ?
      [] :
      visit(node.init, null, Estree.ENUM_TYPE_EXPRESSION)),
    Token.check(
      node.id.type !== "AssignmentPattern",
      `VariableDeclarator.id cannot be an AssignmentPattern`)),
  VariableDeclaration: (node, context) => (
    Assert.enum(node, "kind", Estree.ENUM_KIND_VARIABLE),
    Assert.array(node, "declarations"),
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(
          node.declarations,
          (node) => visit(
            node,
            null,
            "VariableDeclarator")),
        transform_variable_void[node.kind]),
      Token.check(
        node.declarations.length > 0,
        `VariableDeclaration.declarations must not be an empty array`))),
  FunctionDeclaration: helper_function,
  ClassDeclaration: helper_class,
  //////////////////////
  // Atomic Statement //
  //////////////////////
  EmptyStatement: (node, context) => [],
  DebuggerStatement: (node, context) => [],
  ThrowStatement: (node, context) => visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
  ExpressionStatement: (node, context) => visit(node.expression, null, Estree.ENUM_TYPE_EXPRESSION),
  ReturnStatement: (node, context) => (
    node.argument === null ?
    [] :
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION)),
  BreakStatement: (node, context) => ArrayLite.concat(
    (
      node.label === null ?
      [] :
      visit(node.label, "label", "Identifier")),
    Token.guard(
      true,
      Token.KIND_LABEL_BREAK,
      node.label === null ? null : node.label.name)),
  ContinueStatement: (node, context) => ArrayLite.concat(
    (
      node.label === null ?
      [] :
      visit(node.label, "label", "Identifier")),
    Token.guard(
      true,
      Token.KIND_LABEL_CONTINUE,
      node.label === null ? null : node.label.name)),
  /////////////////////////
  // Commpound Statement //
  /////////////////////////
  LabeledStatement: (node, context, _tokens) => (
    _tokens = ArrayLite.concat(
      visit(node.label, "label", "Identifier"),
      visit(node.body, null, Estree.ENUM_TYPE_STATEMENT)),
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
  IfStatement: (node, context) => ArrayLite.concat(
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
  WithStatement: (node, context) => ArrayLite.concat(
    visit(node.object, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
    Token.guard(
      true,
      Token.KIND_STRICT,
      `In strict mode, WithStatement is forbidden`),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `WithStatement.body must not be a let/const/class declaration`)),
  CatchClause: (node, context, _tokens) => (
    _tokens = visit(
        node.body,
        (
          node.param === null ?
          [] :
          ArrayLite.map(
            visit(node.param, "pattern", Estree.ENUM_TYPE_PATTERN),
            transform_variable_void["param"])),
        "BlockStatement"),
    _tokens = ArrayLite.concat(
      _tokens,
      Token.check(
        !ArrayLite.some(_tokens, test_variable_param_duplicate),
        `CatchClause must not have duplicate parameter`)),
    _tokens = set_capture(_tokens, test_variable_param, node),
    _tokens = set_release(_tokens, node),
    _tokens),
  TryStatement: (node, context) => ArrayLite.concat(
    visit(node.block, null, "BlockStatement"),
    (
      node.handler === null ?
      [] :
      visit(node.handler, null, "CatchClause")),
    (
      node.finalizer === null ?
      [] :
      visit(node.finalizer, null, "BlockStatement"))),
  WhileStatement: (node, context) => ArrayLite.concat(
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
  DoWhileStatement: (node, context) => ArrayLite.concat(
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
  ForStatement: (node, context) => ArrayLite.concat(
    (
      node.init === null ?
      [] :
      set_release(
        set_capture(
          ArrayLite.map(
            visit(
              node.init,
              null,
              "VariableDeclaration",
              Estree.ENUM_TYPE_EXPRESSION),
            raise_variable_rigid_duplicate),
          test_variable_block,
          node),
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
  SwitchCase: (node, context) => (
    Assert.array(node, "consequent"),
    ArrayLite.concat(
      (
        node.test === null ?
        [] :
        visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION)),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(node, null, Estree.ENUM_TYPE_STATEMENT)))),
  SwitchStatement: (node, context, _tokens) => (
    Assert.array(node, "cases"),
    _tokens = ArrayLite.concat(
      ArrayLite.flatMap(
        node.cases,
        (node) => visit(node, null, "SwitchCase")),
      Token.check(
        ArrayLite.filter(node.cases, Estree.is_case_default).length <= 1,
        `SwitchStatement must not have more than one default case`)),
    _tokens = ArrayLite.map(_tokens, raise_variable_rigid_duplicate),
    _tokens = set_capture(_tokens, test_variable_block, node),
    _tokens = set_release(_tokens, node),
    _tokens = ArrayLite.map(_tokens, raise_label_continue_empty),
    _tokens = ArrayLite.filterOut(_tokens, test_label_break_empty),
    _tokens),
  ////////////////////////
  // Expression Special //
  ////////////////////////
  ImportExpression: (node, context) => visit(node.source, null, Estree.ENUM_TYPE_EXPRESSION),
  YieldExpression: (node, context) => (
    Assert.typeof(node, "delegate", "boolean"),
    ArrayLite.concat(
      (
        node.argument === null ?
        [] :
        visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION)),
      Token.guard(true, Token.KIND_MARKER_YIELD, null))),
  AwaitExpression: (node, context) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.guard(true, Token.KIND_MARKER_AWAIT, null)),
  ///////////////////////////
  // Expression >> Literal //
  ///////////////////////////
  Literal: (node, context) => (
    (
      "regex" in node ?
      (
        Assert.object(node, "regex"),
        Assert.typeof(node.regex, "pattern", "string", "Literal.regex"),
        Assert.typeof(node.regex, "flags", "string", "Literal.regex")) :
      null),
    (
      "bigint" in node ?
      Assert.typeof(node, "bigint", "string") :
      null),
    Assert.literal(node, "value"),
    ArrayLite.concat(
      Token.check(
        (
          !("bigint" in node) ||
          Estree.is_literal_bigint_valid(node.bigint)),
        `Literal.bigint is invalid, got: ${global_JSON_stringify(node.bigint)}`),
      Token.check(
        (
          !("regex" in node) ||
          is_literal_regex_valid(node.regex)),
        `Literal.regex is invalid, got: ${global_JSON_stringify({__proto__: null, pattern:node.regex.pattern, flags.node.regex.flags})}`),
      Token.check(
        !("regex" in node) || !("bigint" in node),
        `Literal.regex and Literal.bigint cannot be both present`))),
  TemplateElement: (node, context) => (
    Assert.typeof(node, "tail", "boolean"),
    Assert.object(node, "value"),
    (
      node.value.cooked === null ||
      Assert.typeof(node.value, "cooked", "string", "TemplateElement.value")),
    Assert.typeof(node.value, "raw", "string", "TemplateElement.value"),
    []),
  TemplateLiteral: (node, context) => (
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
        node.quasis.length === node.expressions.length + 1,
        `TemplateLiteral.quasis must have exacly one additional element over TemplateLiteral.expressions`))),
  TaggedTemplateExpression: (node, context) => ArrayLite.concat(
    visit(node.tag, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.quasi, null, "TemplateLiteral")),
  ArrowFunctionExpression: (node, context, _tokens, _use_strict) => (
    Assert.typeof(node, "async", "boolean"),
    Assert.typeof(node, "expression", "boolean"),
    Assert.array(node, "params"),
    // Only instance where we need to lookup node before visiting
    _tokens = (
      (
        (tokens) => (
          node.body !== null &&
          node.body !== void 0 &&
          node.body.type === "BlockStatement") ?
          visit(
            node.body,
            tokens,
            "BlockStatement") :
          ArrayLite.concat(
            tokens,
            visit(
              node.body,
              null,
              Estree.ENUM_TYPE_EXPRESSION)))
      (
        ArrayLite.map(
          ArrayLite.map(
            ArrayLite.map(
              ArrayLite.flatMap(
                node.params,
                (node) => visit(
                  node,
                  "pattern",
                  Estree.ENUM_TYPE_PATTERN)),
              transform_variable_void["param"]),
            raise_marker_pattern_member),
          raise_marker_await_yield))),
    _use_strict = set_use_strict(
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        []),
      node),
    _tokens = ArrayLite.concat(
      _tokens,
      Token.check(
        !ArrayLite.some(_tokens, test_variable_param_duplicate),
        `ArrowFunctionExpression must not have duplicate parameters`),
      Token.check(
        node.expression === (node.body.type !== "BlockStatement"),
        `ArrowFunctionExpression.expression must indicate whether its body is an expression or a block statement`),
      Token.check(
        (
          !_use_strict ||
          ArrayLite.every(node.params, Estree.is_pattern_identifier)),
        `ArrowFunctionExpression with non-simple parameter list must not have a 'use-strict' directive`)),
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
      ArrayLite.filterOut(_tokens, test_marker_identifier_await)),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_identifier_yield),
    _tokens = ArrayLite.map(_tokens, raise_garbage_arrow),
    _tokens),
  FunctionExpression: helper_function,
  ClassExpression: helper_class,
  ///////////
  // Class //
  ///////////
  ClassBody: (node, context) => (
    Assert.array(node, "body"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.body,
        (node) => visit(
          node,
          context,
          "MethodDefinition")),
      Token.check(
        ArrayLite.filter(node.body, Estree.is_method_constructor).length <= 1,
        `ClassBody cannot have more than one constructor`))),
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
      Token.check(
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
  Super: (node) => [],
  ThisExpression: (node, context) => [],
  MetaProperty: (node, context) => ArrayLite.concat(
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
  UpdateExpression: (node, context) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UPDATE),
    ArrayLite.concat(
      ArrayLite.filterOut(
        ArrayLite.filterOut(
          visit(node.argument, "pattern", Estree.ENUM_TYPE_EXPRESSION),
          test_marker_pattern_member),
        test_variable_void),
      Token.check(
        (
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`))),
  AssignmentExpression: (node, context) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_ASSIGNMENT),
    ArrayLite.concat(
      ArrayLite.filterOut(
        ArrayLite.filterOut(
          visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN, Estree.ENUM_TYPE_EXPRESSION),
          test_marker_pattern_member),
        test_variable_void),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        (
          node.operator === "=" ||
          node.left.type === "Identifier" ||
          node.left.type === "MemberExpression" ||
          node.left.type === "CallExpression"),
        `When not performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, or a MemberExpression`),
      Token.check(
        (
          node.operator !== "=" ||
          node.left.type === "Identifier" ||
          node.left.type === "CallExpression" ||
          node.left.type === "MemberExpression" ||
          node.left.type === "ObjectPattern" ||
          node.left.type === "ArrayPattern"),
        `When performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, a MemberExpression, an ObjectPattern, or an ArrayPattern`))),
  ///////////////////////////////
  // Expression >> ControlFlow //
  ///////////////////////////////
  ChainExpression: (node, context) => visit(node.expression, "chain", "MemberExpression", "CallExpression"),
  ConditionalExpression: (node, context) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.consequent, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.alternate, null, Estree.ENUM_TYPE_EXPRESSION)),
  LogicalExpression: (node, context) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_LOGICAL),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
  SequenceExpression: (node, context) => (
    Assert.array(node, "expressions"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.expressions,
        (node) => (
          node === null ?
          [] :
          visit(node, null, Estree.ENUM_TYPE_EXPRESSION))),
      Token.check(
        node.expressions.length > 0,
        `LogicalExpression.expressions must not be an empty array`))),
  UnaryExpression: (node, context) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UNARY),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        node.prefix,
        `UpdateExpression.prefix must be true`),
      Token.guard(
        (node.operator === "delete" && node.argument.type === "Identifier"),
        Token.KIND_STRICT,
        `In strict mode, UnaryExpression.operator must be 'delete' while UnaryExpression.argument is an Identifier`))),
  BinaryExpression: (node, context) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_BINARY),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
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
        Token.KIND_MARKER_EVAL,
        null),
      Token.guard(
        node.callee.type === "Super",
        Token.KIND_MARKER_SUPER_CALL,
        null))),
  NewExpression: (node, context) => (
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
  SpreadElement: (node, context) => visit(
    node.argument,
    null,
    Estree.ENUM_TYPE_EXPRESSION),
  ArrayExpression: (node, context) => (
    Assert.array(node, "elements"),
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
  ObjectExpression: (node, context) => (
    Assert.array(node, "properties"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(node, null, "SpreadElement", "Property")),
      Token.check(
        ArrayLite.filter(node.properties, Estree.is_property_proto).length <= 1,
        `Duplicate '__proto__' fields are not allowed in object literals`)))};
