"use strict";

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Array_isArray = global.Array.isArray;

const ArrayLite = require("array-lite");
const Estree = require("./estree.js");
const Error = require("./error.js");
const State = require("./state.js");
const Token = require("./token.js");
const AssertEstree = require("./assert-estree.js");

const identity = (arg) => arg;

const print_label = (label) => (
  label === null ?
  `(empty)` :
  `'${label}'`);

const unexpected_token = (kind, data) => {
  throw new global_Error(`Unexpected token ${kind} carrying ${data}`);
};

const assert_option = (boolean, message) => {
  if (!boolean) {
    throw new Error.OptionSentryError(message, null);
  }
};

/////////
// Key //
/////////

const KEY_CAPTURE = "__sentry_captured_hoisting__";
const KEY_RELEASE = "__sentry_released_hoisting__";
const KEY_USE_STRICT = "__sentry_has_use_strict_directive__";
const KEY_EVAL_CALL = "__sentry_has_direct_eval_call__";
const KEY_HEAD_EVAL_CALL = "__sentry_has_head_direct_eval_call__";
const KEY_BODY_EVAL_CALL = "__sentry_has_body_direct_eval_call__";
const KEY_HEAD_CLOSURE = "__sentry_has_head_closure__";
const KEY_ARGUMENTS_READ = "__sentry_has_arguments_read__";
const KEY_ARGUMENTS_WRITE = "__sentry_has_arguments_write__";
const KEY_THIS_READ = "__sentry_has_this_read__";
const KEY_NEW_TARGET_READ = "__sentry_has_new_target_read__";

//////////
// Test //
//////////

const test_variable_program = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GENERIC_LOOSE]: null,
    [Token.KIND_VARIABLE_GENERIC_RIGID]: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
    [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null,
    [Token.KIND_VARIABLE_FUNCTION_BURIED]: null});

const test_variable_void = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VOID]: null});

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

const test_marker_pattern_let = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_PATTERN_LET]: null});

const test_marker_await = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_AWAIT]: null,
    [Token.KIND_MARKER_AWAIT_FOR_OF]: null});

const test_marker_return = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_RETURN]: null});

const test_duplicate_variable_param = Token.test_duplicate(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_PARAM]: {
      __proto__: null,
      [Token.KIND_VARIABLE_PARAM]: null}});

const test_assignment = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_PATTERN_MEMBER]: null,
    [Token.KIND_MARKER_PATTERN_LET]: null,
    [Token.KIND_VARIABLE_VOID]: null});

const test_marker_arguments_read = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_ARGUMENTS_READ]: null});

const test_marker_arguments_write = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_ARGUMENTS_WRITE]: null});

const test_marker_this = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_THIS]: null});

const test_marker_eval = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_EVAL]: null});

const test_marker_closure = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_CLOSURE]: null});

const test_strict = Token.test(
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

const raise_marker_pattern_let = Token.raise(
  {
    __proto__: null,
    [Token.KIND_MARKER_PATTERN_LET]: `Identifier.name must not be 'let' when the node is used as a pattern for a let/const/class declaration`});

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

const raise_duplicate_variable_enum_rigid = {
  __proto__: null,
  [Token.KIND_VARIABLE_GENERIC_RIGID]: null,
  [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
  [Token.KIND_VARIABLE_LET]: null,
  [Token.KIND_VARIABLE_CONST]: null,
  [Token.KIND_VARIABLE_CLASS]: null};
const raise_duplicate_variable_enum_loose = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM]: null,
  [Token.KIND_VARIABLE_GENERIC_LOOSE]: null,
  [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null,
  [Token.KIND_VARIABLE_VAR]: null};
const raise_duplicate_variable_enum = global_Object_assign(
  {__proto__:null},
  raise_duplicate_variable_enum_rigid,
  raise_duplicate_variable_enum_loose);
const raise_duplicate_variable = Token.raise_duplicate(
  ArrayLite.reduce(
    global_Reflect_ownKeys(raise_duplicate_variable_enum),
    (object, kind) => (
      object[kind] = (
        kind in raise_duplicate_variable_enum_rigid ?
        raise_duplicate_variable_enum :
        raise_duplicate_variable_enum_rigid),
      object),
    {__proto__:null}),
  (kind, data) => `Duplicate ${kind} variable named ${data}`);

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
  [Token.KIND_VARIABLE_PARAM]: unexpected_token,
  [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: unexpected_token,
  [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: unexpected_token,
  [Token.KIND_VARIABLE_VAR]: unexpected_token,
  [Token.KIND_VARIABLE_VAR_DISTANT]: unexpected_token,
  [Token.KIND_VARIABLE_FUNCTION]: unexpected_token,
  [Token.KIND_VARIABLE_FUNCTION_DISTANT]: unexpected_token,
  [Token.KIND_VARIABLE_LET]: unexpected_token,
  [Token.KIND_VARIABLE_CONST]: unexpected_token,
  [Token.KIND_VARIABLE_CLASS]: unexpected_token,
  // Other //
  [Token.KIND_MARKER_RETURN]: unexpected_token,
  [Token.KIND_MARKER_EVAL]: unexpected_token,
  [Token.KIND_MARKER_PATTERN_MEMBER]: unexpected_token,
  // Module //
  [Token.KIND_MARKER_IMPORT_DECLARATION]: unexpected_token,
  [Token.KIND_MARKER_EXPORT_DECLARATION]: unexpected_token};

const raise_garbage_arrow = Token.raise(raise_garbage_enum);

const raise_garbage_function = Token.raise(
  {
    __proto__: raise_garbage_enum,
    [Token.KIND_MARKER_NEW_TARGET]: unexpected_token,
    [Token.KIND_MARKER_SUPER_CALL]: `CallExpression with Super callee must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `MemberExpression with Super object must be directly in a method or a constructor`});

const raise_garbage_program = Token.raise(
  {
    __proto__: raise_garbage_enum,
    // Closure //
    [Token.KIND_MARKER_IDENTIFIER_AWAIT]: unexpected_token,
    [Token.KIND_MARKER_IDENTIFIER_YIELD]: unexpected_token,
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
    [Token.KIND_STRICT]: unexpected_token});

///////////////
// Transform //
///////////////

const transform_variable_qualify = {
  __proto__: null,
  ["param"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_PARAM}),
  ["var"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_VAR}),
  ["function"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_FUNCTION_RIGID}),
  ["let"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_LET}),
  ["const"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_CONST}),
  ["class"]: Token.transform(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_VOID]: Token.KIND_VARIABLE_CLASS})};

const transform_variable_function_bury = Token.transform(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_FUNCTION_LOOSE]: Token.KIND_VARIABLE_FUNCTION_BURIED,
    [Token.KIND_VARIABLE_FUNCTION_RIGID]: Token.KIND_VARIABLE_FUNCTION_BURIED});

const transform_variable_function_loosen = Token.transform(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_FUNCTION_RIGID]: Token.KIND_VARIABLE_FUNCTION_LOOSE});

///////////
// Hoist //
///////////

const set_hoisting_object = {
  __proto__: null,
  "script-normal": Token.test(
    {
      __proto__: null}),
  "script-strict": Token.test(
    {
      __proto__: null}),
  "eval-normal": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_LET]: null,
      [Token.KIND_VARIABLE_CONST]: null,
      [Token.KIND_VARIABLE_CLASS]: null}),
  "eval-strict": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_LET]: null,
      [Token.KIND_VARIABLE_CONST]: null,
      [Token.KIND_VARIABLE_CLASS]: null,
      [Token.KIND_VARIABLE_VAR]: null,
      [Token.KIND_VARIABLE_FUNCTION_BURIED]: null,
      [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
      [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null}),
  // module-normal
  "module-strict": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_LET]: null,
      [Token.KIND_VARIABLE_CONST]: null,
      [Token.KIND_VARIABLE_CLASS]: null,
      [Token.KIND_VARIABLE_VAR]: null,
      [Token.KIND_VARIABLE_FUNCTION_BURIED]: null,
      [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
      [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null}),
  "catch": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_PARAM]: null}),
  "block": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_LET]: null,
      [Token.KIND_VARIABLE_CONST]: null,
      [Token.KIND_VARIABLE_CLASS]: null}),
  "closure": Token.test(
    {
      __proto__: null,
      [Token.KIND_VARIABLE_LET]: null,
      [Token.KIND_VARIABLE_CONST]: null,
      [Token.KIND_VARIABLE_CLASS]: null,
      [Token.KIND_VARIABLE_VAR]: null,
      [Token.KIND_VARIABLE_FUNCTION_BURIED]: null,
      [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
      [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null,
      [Token.KIND_VARIABLE_PARAM]: null})};
const set_hoisting_test_variable = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION_BURIED]: null,
    [Token.KIND_VARIABLE_FUNCTION_RIGID]: null,
    [Token.KIND_VARIABLE_FUNCTION_LOOSE]: null,
    [Token.KIND_VARIABLE_PARAM]: null});
const set_hoisting = (tokens, tag, node) => (
  tokens = ArrayLite.map(tokens, raise_duplicate_variable),
  node[KEY_CAPTURE] = ArrayLite.map(
    ArrayLite.filter(tokens, set_hoisting_object[tag]),
    Token.to_variable),
  tokens = ArrayLite.filterOut(tokens, set_hoisting_object[tag]),
  node[KEY_RELEASE] = ArrayLite.map(
    ArrayLite.filter(tokens, set_hoisting_test_variable),
    Token.to_variable),
  tokens);

const set_use_strict = (nodes, node) => node[KEY_USE_STRICT] = Estree.has_use_strict(nodes, 0);

const make_set_marker = (key, test) => (tokens, node) => (
  node[key] = ArrayLite.some(tokens, test),
  ArrayLite.filterOut(tokens, test));

const set_eval_call = make_set_marker(KEY_EVAL_CALL, test_marker_eval);
const set_head_eval_call = make_set_marker(KEY_HEAD_EVAL_CALL, test_marker_eval);
const set_body_eval_call = make_set_marker(KEY_BODY_EVAL_CALL, test_marker_eval);
const set_head_closure = make_set_marker(KEY_HEAD_CLOSURE, test_marker_closure);
const set_arguments_read = make_set_marker(KEY_ARGUMENTS_READ, test_marker_arguments_read);
const set_arguments_write = make_set_marker(KEY_ARGUMENTS_WRITE, test_marker_arguments_write);
const set_this_read = make_set_marker(KEY_THIS_READ, test_marker_this);
const set_new_target_read = make_set_marker(KEY_NEW_TARGET_READ, test_marker_new_target);

////////////
// Helper //
////////////

const helper_for = (node) => (
  (
    node.type === "ForOfStatement" ?
    AssertEstree.typeof(node, "await", "boolean") :
    null),
  ArrayLite.concat(
    set_hoisting(
      ArrayLite.filterOut(
        visit(
          node.left,
          null,
          "VariableDeclaration",
          Estree.ENUM_TYPE_EXPRESSION,
          Estree.ENUM_TYPE_PATTERN),
        test_assignment),
      "block",
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
    check_single(node, "body", false),
    Token.guard(
      (
        node.type === "ForOfStatement" &&
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
        node.type !== "ForOfStatement" ||
        node.left.type !== "VariableDeclaration" ||
        ArrayLite.every(node.left.declarations, Estree.is_declaration_non_initialized)),
      `ForOfStatement.left must not be a VariableDeclaration with initializers`)));

const helper_function = (node, context, _tokens, _use_strict) => (
  AssertEstree.typeof(node, "generator", "boolean"),
  AssertEstree.typeof(node, "async", "boolean"),
  AssertEstree.array(node, "params"),
  (
    node.id === null ?
    null :
    AssertEstree.node(node.id, ["Identifier"])),
  _tokens = visit(
    node.body,
    {
      __proto__: null,
      closure: true,
      tokens: ArrayLite.filterOut(
        ArrayLite.map(
          ArrayLite.map(
            ArrayLite.flatMap(
              node.params,
              (node) => visit(
                node,
                "pattern",
                Estree.ENUM_TYPE_PATTERN)),
            transform_variable_qualify["param"]),
          raise_marker_pattern_member),
        test_marker_pattern_let)},
    "BlockStatement"),
  _tokens = set_head_eval_call(_tokens, node),
  _tokens = set_head_closure(_tokens, node),
  _use_strict = set_use_strict(node.body.body, node),
  _tokens = ArrayLite.concat(
    _tokens,
    Token.check(
      node.type === "FunctionExpression" || node.id !== null || context === "anonymous",
      `FunctionDeclaration.id must not be null when not inside an anonymous declaration`),
    (
      ArrayLite.every(node.params, Estree.is_pattern_identifier) ?
      Token.guard(
        ArrayLite.some(_tokens, test_duplicate_variable_param),
        Token.KIND_STRICT,
        `In strict mode, ${node.type}.params must not contain duplicate variables`) :
      ArrayLite.concat(
        Token.check(
          !_use_strict,
          `${node.type} with non-simple parameter list must not have a 'use strict' directive`),
        Token.check(
          !ArrayLite.some(_tokens, test_duplicate_variable_param),
          `${node.type} with non-simple parameter list must not have duplicate parameters`)))),
  _tokens = set_body_eval_call(_tokens, node),
  _tokens = set_arguments_read(_tokens, node),
  _tokens = set_arguments_write(_tokens, node),
  _tokens = set_this_read(_tokens, node),
  _tokens = set_new_target_read(_tokens, node),
  _tokens = set_hoisting(_tokens, "closure", node),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
  _tokens = (
    node.generator ?
    ArrayLite.filterOut(_tokens, test_marker_yield) :
    ArrayLite.filterOut(_tokens, test_marker_identifier_yield)),
  _tokens = (
    node.async ?
    ArrayLite.filterOut(_tokens, test_marker_await) :
    ArrayLite.filterOut(_tokens, test_marker_identifier_await)),
  _tokens = (
    _use_strict ?
    ArrayLite.map(_tokens, raise_strict) :
    _tokens),
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
  // ok: async () => { var f = function await () {} }
  // not-ok: () => { "use strict"; var f = function eval () {} }
  _tokens = ArrayLite.concat(
    (
      node.id === null ?
      [] :
      ArrayLite.filterOut(
        (
          node.type === "FunctionDeclaration" ?
          ArrayLite.map(
            visit(node.id, "pattern", "Identifier"),
            transform_variable_qualify["function"]) :
          ArrayLite.filterOut(
            ArrayLite.filterOut(
              ArrayLite.filterOut(
                visit(node.id, "pattern", "Identifier"),
                test_variable_void),
              test_marker_identifier_await),
            test_marker_identifier_yield)),
        test_marker_pattern_let)),
    _tokens),
  _tokens = (
    _use_strict ?
    ArrayLite.map(_tokens, raise_strict) :
    _tokens),
  ArrayLite.concat(
    _tokens,
    Token.guard(
      true,
      Token.KIND_MARKER_CLOSURE,
      null)));

const helper_class = (node, context) => ArrayLite.map(
  ArrayLite.concat(
    (
      node.id === null ?
      [] :
      (
        node.type === "ClassDeclaration" ?
        ArrayLite.map(
          ArrayLite.map(
            visit(
              node.id,
              "pattern",
              "Identifier"),
            transform_variable_qualify["class"]),
          raise_marker_pattern_let) :
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
  raise_strict);

///////////////
// Top-Level //
///////////////

global_Object_assign(exports, Error);

exports.module = (node, options) => (
  options = global_Object_assign(
    {
      __proto__: null,
      "scope": []},
    options,
    {
      __proto__: null,
      "strict-mode": true,
      "closure-context": "program",
      "function-expression-ancestor": false,
      "module": true,
      "capture-strict": "module-strict",
      "capture-normal": "module-normal"}),
  assert_option(
    global_Array_isArray(options.scope),
    `options["scope"] must be an array`),
  options.scope = ArrayLite.map(options.scope, Token.from_variable),
  ArrayLite.map(
    visit(node, options, "Program"),
    Token.to_error));

exports.script = (node, options) => (
  options = global_Object_assign(
    {
      __proto__: null,
      "scope": []},
    options,
    {
      __proto__: null,
      "strict-mode": false,
      "closure-context": "program",
      "function-expression-ancestor": false,
      "module": false,
      "capture-strict": "script-strict",
      "capture-normal": "script-normal"}),
  assert_option(
    global_Array_isArray(options.scope),
    `options["scope"] must be an array`),
  options.scope = ArrayLite.map(options.scope, Token.from_variable),
  ArrayLite.map(
    visit(node, options, "Program"),
    Token.to_error));

exports.eval = (node, options) => (
  options = global_Object_assign(
    {
      __proto__: null,
      "scope": [],
      "strict-mode": false,
      "closure-context": "program",
      "function-expression-ancestor": false},
    options,
    {
      __proto__: null,
      "module": false,
      "capture-strict": "eval-strict",
      "capture-normal": "eval-normal"}),
  assert_option(
    (
      options["closure-context"] === "program" ||
      options["closure-context"] === "method" ||
      options["closure-context"] === "arrow" ||
      options["closure-context"] === "function" ||
      options["closure-context"] === "constructor" ||
      options["closure-context"] === "derived-constructor"),
    `options["closure-context"] is invalid, it must be one of: "program", "method", "arrow", "function", "constructor", or "derived-constructor"`),
  assert_option(
    (
      !options["function-expression-ancestor"] ||
      (
        options["closure-context"] !== "method" &&
        options["closure-context"] !== "function" &&
        options["closure-context"] !== "constructor" &&
        options["closure-context"] !== "derived-constructor")),
    `options["function-expression-ancestor"] must not be truthy while options["closure-context"] is either: "method", "function", "constructor", or "derived-constructor"`),
  assert_option(
    global_Array_isArray(options.scope),
    `options["scope"] must be an array`),
  options.scope = ArrayLite.map(options.scope, Token.from_variable),
  ArrayLite.map(
    visit(node, options, "Program"),
    Token.to_error));

/////////////////
// CheckSingle //
/////////////////

const check_single = (node, key, boolean) => ArrayLite.concat(
  (
    boolean ?
    Token.guard(
      node[key].type === "FunctionDeclaration",
      Token.KIND_STRICT,
      `In strict mode, ${node.type}.${key} must not be a FunctionDeclaration`) :
    Token.check(
      node[key].type !== "FunctionDeclaration",
      `${node.type}.${key} must not be a FunctionDeclaration`)),
  Token.check(
    node[key].type !== "ClassDeclaration",
    `${node.type}.${key} must not be a ClassDeclaration`),
  Token.check(
    (
      node[key].type !== "VariableDeclaration" ||
      node[key].kind === "var"),
    `${node.type}.${key} must not be a let/const VariableDeclaration`));

///////////
// Visit //
///////////

const visit = (node, context, ...discriminants) => {
  const loc = State.loc;
  State.loc = node.loc;
  AssertEstree.node(node, discriminants);
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
    AssertEstree.array(node, "body"),
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
    // Setter //
    _tokens = set_eval_call(_tokens, node),
    _tokens = set_this_read(_tokens, node),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_closure),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_arguments_read),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_arguments_write),
    // Strict //
    _strict = set_use_strict(node.body, node) || context["strict-mode"],
    _tokens = (
      _strict ?
      ArrayLite.map(_tokens, raise_strict) :
      ArrayLite.filterOut(_tokens, test_strict)),
    // Hoisting //
    _tokens = ArrayLite.map(_tokens, transform_variable_function_loosen),
    _tokens = set_hoisting(
      _tokens,
      _strict ? context["capture-strict"] : context["capture-normal"],
      node),
    _tokens = ArrayLite.concat(context["scope"], _tokens),
    _tokens = ArrayLite.map(_tokens, raise_duplicate_variable),
    _tokens = ArrayLite.filterOut(_tokens, test_variable_program),
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
      context["function-expression-ancestor"] ?
      ArrayLite.filterOut(_tokens, test_marker_new_target) :
      _tokens),
    // Super //
    _tokens = (
      context["closure-context"] == "derived-constructor" ?
      ArrayLite.filterOut(_tokens, test_marker_super_call) :
      _tokens),
    _tokens = (
      (
        context["closure-context"] == "derived-constructor" ||
        context["closure-context"] == "constructor" ||
        context["closure-context"] == "method") ?
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
    visit(node.imported, "key", "Identifier")),
  ImportDefaultSpecifier: (node, context) => visit(node.local, null, "Identifier"),
  ImportNamespaceSpecifier: (node, context) => visit(node.local, null, "Identifier"),
  ImportDeclaration: (node, context) => (
    AssertEstree.array(node, "specifiers"),
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
    visit(node.local, context, "Identifier"),
    visit(node.exported, "key", "Identifier")),
  ExportNamedDeclaration: (node, context) => (
    AssertEstree.array(node, "specifiers"),
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
        (node) => visit(
          node,
          node.source === null ? null : "key",
          "ExportSpecifier")),
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
    AssertEstree.typeof(node, "name", "string"),
    ArrayLite.concat(
      Token.check(
        Estree.is_identifier_name_valid(node.name),
        `Identifier.name is invalid, got: ${node.name}`),
      // Nice-to-have: Token.check for keywords based on strict mode and context (key, label, pattern, null)
      Token.guard(
        context === "pattern",
        Token.KIND_VARIABLE_VOID,
        node.name),
      Token.check(
        (
          context === "key" ||
          node.name === "await" ||
          node.name === "yield" ||
          !(node.name in Estree.ENUM_RESERVED_WORD)),
        `Identifier.name is a reserved word, got: ${node.name}`),
      Token.guard(
        context !== "key" && node.name === "await",
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
        context === "pattern" && node.name === "let",
        Token.KIND_MARKER_PATTERN_LET,
        null),
      Token.guard(
        context === "pattern" && node.name === "arguments",
        Token.KIND_MARKER_ARGUMENTS_WRITE,
        null),
      Token.guard(
        context === "expression" && node.name === "arguments",
        Token.KIND_MARKER_ARGUMENTS_READ,
        null),
      Token.guard(
        context === "pattern" && node.name === "eval",
        Token.KIND_STRICT,
        `In strict mode, Identifier.name must not be 'eval' when the node is used as a pattern`),
      Token.guard(
        context === "pattern" && node.name === "arguments",
        Token.KIND_STRICT,
        `In strict mode, Identifier.name must not be 'arguments' when the node is used as a pattern`))),
  MemberExpression: (node, context) => (
    AssertEstree.typeof(node, "computed", "boolean"),
    AssertEstree.typeof(node, "optional", "boolean"),
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
    visit(node.argument, "pattern", Estree.ENUM_TYPE_PATTERN),
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
    AssertEstree.array(node, "properties"),
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
    AssertEstree.array(node, "elements"),
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
    AssertEstree.enum(node, "kind", Estree.ENUM_KIND_PROPERTY),
    AssertEstree.typeof(node, "method", "boolean"),
    AssertEstree.typeof(node, "computed", "boolean"),
    AssertEstree.typeof(node, "shorthand", "boolean"),
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
  VariableDeclaration: (node, context, _tokens) => (
    AssertEstree.enum(node, "kind", Estree.ENUM_KIND_VARIABLE),
    AssertEstree.array(node, "declarations"),
    ArrayLite.concat(
      (
        _tokens = ArrayLite.map(
          ArrayLite.flatMap(
            node.declarations,
            (node) => visit(
              node,
              null,
              "VariableDeclarator")),
          transform_variable_qualify[node.kind]),
        (
          node.kind === "var" ?
          ArrayLite.filterOut(_tokens, test_marker_pattern_let) :
          ArrayLite.map(_tokens, raise_marker_pattern_let))),
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
  LabeledStatement: (node, context, _tokens) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    ArrayLite.filterOut(
      ArrayLite.map(
        visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
        (
          Estree.has_loop_body(node) ?
          identity :
          make_raise_label_continue(node.label.name))),
      make_test_label(node.label.name)),
    check_single(node, "body", true)),
  BlockStatement: (node, context, _tokens) => (
    AssertEstree.array(node, "body"),
    ArrayLite.map(
      set_hoisting(
        ArrayLite.map(
          ArrayLite.concat(
            context === null ? [] : context.tokens,
            ArrayLite.flatMap(
              node.body,
              (node) => visit(
                node,
                null,
                Estree.ENUM_TYPE_STATEMENT))),
          (
            context !== null && context.closure ?
            transform_variable_function_loosen :
            identity)),
        "block",
        node),
      transform_variable_function_bury)),
  IfStatement: (node, context) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    ArrayLite.map(
      ArrayLite.concat(
        visit(node.consequent, null, Estree.ENUM_TYPE_STATEMENT),
        (
          node.alternate === null ?
          [] :
          visit(node.alternate, null, Estree.ENUM_TYPE_STATEMENT))),
      transform_variable_function_bury),
    check_single(node, "consequent", true),
    (
      node.alternate === null ?
      [] :
      check_single(node, "alternate", true))),
  WithStatement: (node, context) => ArrayLite.concat(
    visit(node.object, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
    check_single(node, "body", false)),
  CatchClause: (node, context, _tokens) => (
    _tokens = visit(
        node.body,
        {
          __proto__: null,
          closure: false,
          tokens: (
            node.param === null ?
            [] :
            ArrayLite.filterOut(
              ArrayLite.map(
                ArrayLite.map(
                  visit(node.param, "pattern", Estree.ENUM_TYPE_PATTERN),
                  transform_variable_qualify["param"]),
                raise_marker_pattern_member),
              test_marker_pattern_let))},
        "BlockStatement"),
    _tokens = ArrayLite.concat(
      _tokens,
      Token.check(
        !ArrayLite.some(_tokens, test_duplicate_variable_param),
        `CatchClause must not have duplicate parameter`)),
    _tokens = set_hoisting(_tokens, "catch", node),
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
    check_single(node, "body", false)),
  DoWhileStatement: (node, context) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    ArrayLite.filterOut(
      visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
      test_label_empty),
    check_single(node, "body", false)),
  ForStatement: (node, context) => ArrayLite.concat(
    (
      node.init === null ?
      [] :
      set_hoisting(
        visit(
          node.init,
          null,
          "VariableDeclaration",
          Estree.ENUM_TYPE_EXPRESSION),
        "block",
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
    check_single(node, "body", false)),
  ForInStatement: helper_for,
  ForOfStatement: helper_for,
  SwitchCase: (node, context) => (
    AssertEstree.array(node, "consequent"),
    ArrayLite.concat(
      (
        node.test === null ?
        [] :
        visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION)),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(node, null, Estree.ENUM_TYPE_STATEMENT)))),
  SwitchStatement: (node, context, _tokens) => (
    AssertEstree.array(node, "cases"),
    _tokens = ArrayLite.concat(
      ArrayLite.flatMap(
        node.cases,
        (node) => visit(node, null, "SwitchCase")),
      Token.check(
        ArrayLite.filter(node.cases, Estree.is_case_default).length <= 1,
        `SwitchStatement must not have more than one default case`)),
    _tokens = set_hoisting(_tokens, "block", node),
    _tokens = ArrayLite.map(_tokens, raise_label_continue_empty),
    _tokens = ArrayLite.filterOut(_tokens, test_label_break_empty),
    _tokens),
  ////////////////////////
  // Expression Special //
  ////////////////////////
  ImportExpression: (node, context) => visit(node.source, null, Estree.ENUM_TYPE_EXPRESSION),
  YieldExpression: (node, context) => (
    AssertEstree.typeof(node, "delegate", "boolean"),
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
        AssertEstree.object(node, "regex"),
        AssertEstree.typeof(node.regex, "pattern", "string", "Literal.regex"),
        AssertEstree.typeof(node.regex, "flags", "string", "Literal.regex")) :
      null),
    (
      "bigint" in node ?
      AssertEstree.typeof(node, "bigint", "string") :
      null),
    AssertEstree.literal(node, "value"),
    ArrayLite.concat(
      Token.check(
        (
          !("bigint" in node) ||
          Estree.is_literal_bigint_valid(node.bigint)),
        `Literal.bigint is invalid`),
      Token.check(
        (
          !("regex" in node) ||
          Estree.is_literal_regex_valid(node.regex)),
        `Literal.regex is invalid`),
      Token.check(
        !("regex" in node) || !("bigint" in node),
        `Literal.regex and Literal.bigint cannot be both present`))),
  TemplateElement: (node, context) => (
    AssertEstree.typeof(node, "tail", "boolean"),
    AssertEstree.object(node, "value"),
    (
      node.value.cooked === null ||
      AssertEstree.typeof(node.value, "cooked", "string", "TemplateElement.value")),
    AssertEstree.typeof(node.value, "raw", "string", "TemplateElement.value"),
    []),
  TemplateLiteral: (node, context) => (
    AssertEstree.array(node, "quasis"),
    AssertEstree.array(node, "expressions"),
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
    AssertEstree.typeof(node, "async", "boolean"),
    AssertEstree.typeof(node, "expression", "boolean"),
    AssertEstree.array(node, "params"),
    // Only instance where we need to lookup node before visiting
    _tokens = (
      (
        (tokens) => (
          node.body !== null &&
          node.body !== void 0 &&
          node.body.type === "BlockStatement") ?
          visit(
            node.body,
            {
              __proto__: null,
              closure: true,
              tokens: tokens},
            "BlockStatement") :
          ArrayLite.concat(
            tokens,
            visit(
              node.body,
              null,
              Estree.ENUM_TYPE_EXPRESSION)))
      (
        ArrayLite.filterOut(
          ArrayLite.map(
            ArrayLite.map(
              ArrayLite.flatMap(
                node.params,
                (node) => visit(
                  node,
                  "pattern",
                  Estree.ENUM_TYPE_PATTERN)),
              transform_variable_qualify["param"]),
            raise_marker_pattern_member),
          test_marker_pattern_let))),
    _tokens = set_head_eval_call(_tokens, node),
    _tokens = set_head_closure(_tokens, node),
    _use_strict = set_use_strict(
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        []),
      node),
    _tokens = ArrayLite.concat(
      _tokens,
      Token.check(
        !ArrayLite.some(_tokens, test_duplicate_variable_param),
        `ArrowFunctionExpression must not have duplicate parameters`),
      Token.check(
        node.expression === (node.body.type !== "BlockStatement"),
        `ArrowFunctionExpression.expression must indicate whether its body is an expression or a block statement`),
      Token.check(
        (
          !_use_strict ||
          ArrayLite.every(node.params, Estree.is_pattern_identifier)),
        `ArrowFunctionExpression with non-simple parameter list must not have a 'use-strict' directive`)),
    _tokens = set_body_eval_call(_tokens, node),
    _tokens = set_hoisting(_tokens, "closure", node),
    _tokens = (
      _use_strict ?
      ArrayLite.map(_tokens, raise_strict) :
      _tokens),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
    _tokens = (
      node.async ?
      ArrayLite.filterOut(_tokens, test_marker_await) :
      ArrayLite.filterOut(_tokens, test_marker_identifier_await)),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_identifier_yield),
    _tokens = ArrayLite.map(_tokens, raise_garbage_arrow),
    ArrayLite.concat(
      _tokens,
      Token.guard(
        true,
        Token.KIND_MARKER_CLOSURE,
        null))),
  FunctionExpression: helper_function,
  ClassExpression: helper_class,
  ///////////
  // Class //
  ///////////
  ClassBody: (node, context) => (
    AssertEstree.array(node, "body"),
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
    AssertEstree.typeof(node, "computed", "boolean"),
    AssertEstree.typeof(node, "static", "boolean"),
    AssertEstree.enum(node, "kind", Estree.ENUM_KIND_METHOD),
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
  ThisExpression: (node, context) => Token.guard(
    true,
    Token.KIND_MARKER_THIS,
    null),
  MetaProperty: (node, context) => ArrayLite.concat(
    visit(node.meta, "key", "Identifier"),
    visit(node.property, "key", "Identifier"),
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
    AssertEstree.typeof(node, "prefix", "boolean"),
    AssertEstree.enum(node, "operator", Estree.ENUM_OPERATOR_UPDATE),
    ArrayLite.concat(
      ArrayLite.filterOut(
        visit(node.argument, "pattern", Estree.ENUM_TYPE_EXPRESSION),
        test_assignment),
      Token.check(
        (
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`))),
  AssignmentExpression: (node, context) => (
    AssertEstree.enum(node, "operator", Estree.ENUM_OPERATOR_ASSIGNMENT),
    ArrayLite.concat(
      ArrayLite.filterOut(
        visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN, Estree.ENUM_TYPE_EXPRESSION),
        test_assignment),
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
    AssertEstree.enum(node, "operator", Estree.ENUM_OPERATOR_LOGICAL),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
  SequenceExpression: (node, context) => (
    AssertEstree.array(node, "expressions"),
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
    AssertEstree.typeof(node, "prefix", "boolean"),
    AssertEstree.enum(node, "operator", Estree.ENUM_OPERATOR_UNARY),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        node.prefix,
        `UpdateExpression.prefix must be true`),
      Token.guard(
        (node.operator === "delete" && node.argument.type === "Identifier"),
        Token.KIND_STRICT,
        `In strict mode, UnaryExpression.argument must not be an Identifier when UnaryExpression.operator is 'delete'`))),
  BinaryExpression: (node, context) => (
    AssertEstree.enum(node, "operator", Estree.ENUM_OPERATOR_BINARY),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
  CallExpression: (node, context) => (
    AssertEstree.array(node, "arguments"),
    AssertEstree.typeof(node, "optional", "boolean"),
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
    AssertEstree.array(node, "arguments"),
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
    AssertEstree.array(node, "elements"),
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
    AssertEstree.array(node, "properties"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(node, null, "SpreadElement", "Property")),
      Token.check(
        ArrayLite.filter(node.properties, Estree.is_property_proto).length <= 1,
        `Duplicate '__proto__' fields are not allowed in object literals`)))};
