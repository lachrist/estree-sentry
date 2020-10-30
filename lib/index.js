"use strict";

// const yo = {
//   type: "Program",
//   body: [
//     {
//       type: "ExpressionStatement",
//       expression: {
//         type: "AssignmentExpression",
//         operator: "=",
//         left: {
//           type: "AssignmentPattern",
//           left: {
//             type: "Identifier",
//             name: "foo"
//           },
//           right: {
//             type: "Identifier",
//             name: "bar"
//           }
//         },
//         right: {
//           type: "Identifier",
//           name: "qux"
//         }
//       }
//     }
//   ]
// };

const ArrayLite = require("array-lite");

// data Token =
//   -- Error --
//   ErrorToken (Message, Loc) Loc
//   -- Variable --
//   VariableVar      (Identifier) Loc
//   VariableFunction (Identifier) Loc
//   VariableParam    (Identifier) Loc
//   VariableLet      (Identifier) Loc
//   VariableConst    (Identifier) Loc
//   VariableClass    (Identifier) Loc
//   VariableVoid     (Identifier) Loc
//   -- Label --
//   LabelBreak    (Maybe Identifier) Loc
//   LabelContinue (Maybe Identifier) Loc
//   -- Marker --
//   StatementModule            () Loc
//   ExpressionImport           () Loc
//   ExpressionAwait            () Loc
//   ExpressionYield            () Loc
//   ExpressionNewTarget        () Loc
//   ExpressionCallEval         () Loc
//   ExpressionCallSuper        () Loc
//   ExpressionMemberSuper      () Loc
//   ExpressionDeleteVariable   () Loc
//   StatementWith              () Loc
//   StatementReturn            () Loc
//   PatternMember              () Loc
//   PatternIdentifierEval      () Loc
//   PatternIdentifierArguments () Loc

const KEY_USE_STRICT = "__sentry_use_strict__";
const KEY_SIMPLE_PARAM_LIST = "__sentry_simple_param_list__";
const KEY_HOISTING = "__sentry_hoisting__";
const KEY_EVAL_CALL = "__eval_call__";
const KEY_HOISTING_GLOBAL "__sentry_hoisting_global__";

const KIND_ERROR = "error";

const KIND_VARIABLE_LET = "let";
const KIND_VARIABLE_CONST = "const";
const KIND_VARIABLE_CLASS = "class";
const KIND_VARIABLE_VAR = "var";
const KIND_VARIABLE_FUNCTION = "function";
const KIND_VARIABLE_PARAM = "param";
const KIND_VARIABLE_VOID = "void";

const KIND_LABEL_BREAK = "break";
const KIND_LABEL_CONTINUE = "continue";

const KIND_MARKER_MODULE = "module";
const KIND_MARKER_AWAIT = "await";
const KIND_MARKER_YIELD = "yield";
const KIND_MARKER_NEW_TARGET = "new-target";
const KIND_MARKER_EVAL = "eval";
const KIND_MARKER_SUPER_CALL = "super-call";
const KIND_MARKER_SUPER_MEMBER = "super-member";
const KIND_MARKER_WITH = "with";
const KIND_MARKER_DISCARD = "discard";
const KIND_MARKER_RETURN = "return";
const KIND_MARKER_PATTERN_MEMBER = "pattern-member";
const KIND_MARKER_PATTERN_EVAL = "pattern-eval";
const KIND_MARKER_PATTERN_ARGUMENTS = "pattern-arguments";

const ENUM_OPERATOR_UPDATE = ["++", "--"];
const ENUM_OPERATOR_ASSIGNMENT = [
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%="
  "<<=",
  ">>=",
  ">>>=",
  "|=",
  "^=",
  "&="];
const ENUM_OPERATOR_UNARY = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"];
const ENUM_OPERATOR_BINARY = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof"];
const ENUM_OPERATOR_LOGICAL = [
  "||",
  "&&",
  "??"];

const EMPTY = EMPTY;

let current = null;

const make_token = (kind, data) => ({kind, data, loc:current.loc});

const make_conditional_token = (boolean, kind, data) => (
  boolean ?
  make_token(kind, data) :
  EMPTY);

const make_token_error = (message, nullable_loc) => make_token(
  "error",
  {
    message,
    loc: nullable_loc === null ? current.loc : nullable_loc});

const make_conditional_token_error = (boolean, message, nullable_loc) => (
  boolean ?
  [
    make_token_error(message, nullable_loc)] :
  EMPTY);

const visit = (types, node, context, _previous, _result) => (
  assert(typeof node === "object", `Node must be an object`),
  assert(typeof node !== null, `Node must not be null`),
  assert(typeof node.type === "string", `Node.type must be a string`),
  assert(!ArrayLite.includes(types, node.type), `Node.type is invalid`),
  _previous = current,
  current = node,
  _result = visitors[node.type](node, context),
  current = _previous,
  _result);

// const make_visit = (kind, node, context) => (node, context, _previous, _result) => (
//   assert(typeof node === "object", `Node must be an object`),
//   assert(typeof node !== null, `Node must not be null`),
//   assert(typeof node.type === "string", `Node.type must be a string`),
//   assert(node.type in visitors, `Unexpected node type`)
//   _previous = current,
//   current = node,
//   _result = visitors[node.type](node, context),
//   current = _previous,
//   _result);

const to_variable_kind = {
  __proto__: null,
  "let": KIND_VARIABLE_LET,
  "const": KIND_VARIABLE_CONST,
  "class": KIND_VARIABLE_CLASS,
  "param": KIND_VARIABLE_PARAM,
  "var": KIND_VARIABLE_VAR,
  "function": KIND_VARIABLE_FUNCTION};

const from_variable_kind = {
  __proto__: null,
  [KIND_VARIABLE_LET]: "let",
  [KIND_VARIABLE_CONST]: "const",
  [KIND_VARIABLE_CLASS]: "class"
  [KIND_VARIABLE_PARAM]: "param",
  [KIND_VARIABLE_VAR]: "var",
  [KIND_VARIABLE_FUNCTION]: "function"};

const signal = (message) => { throw new global_Error(message) };

const throw_internal = (message) => { throw new global_Error(`Internal error: ${message}`) };

const throw_external = (message) => { throw new global_Error(`External error: ${message}`) };

const to_variable_token = ({kind, name}) => (
  kind in to_variable_kind ?
  make_token(
    to_variable_kind[kind],
    name) :
  throw_external(`Cannot convert variable to a token: ${kind}`));

const from_variable_token = ({kind, data}) => (
  kind in from_variable_kind ?
  {
    kind: from_variable_kind[kind],
    name: data} :
  throw_internal(`Cannot convert token to variable: ${kind}`));

const from_error_token = ({kind, data}) => (
  kind === KIND_ERROR ?
  data :
  throw_internal(`Cannot convert token to an error: ${kind}`));

const make_const = (value) => () => value;

const const_true = make_const(true);

const const_false = make_const(false);

exports.module = (node, context = {}) => (
  node[KEY_USE_STRICT] = has_use_strict(node.body, 0),
  visit_program(
    node,
    {
      "module": true,
      "capture": is_variable,
      "escape": is_not_variable,
      "closure-tag": null,
      "scope": EMPTY,
      "function-ancestor": false,
      "strict-mode": true}));

exports.script = (node, context = {}) => (
  node[KEY_USE_STRICT] = has_use_strict(node.body, 0),
  visit_program(
    node,
    global_Object_assign(
      {scope:EMPTY},
      context,
      {
        "module": false,
        "capture": const_false,
        "escape": const_true,
        "closure-tag": null,
        "function-ancestor": false,
        "strict-mode": node[KEY_USE_STRICT]})));

exports.eval = (node, context = {}, _strict_mode) => (
  node[KEY_USE_STRICT] = has_use_strict(node.body, 0),
  _strict_mode = (
    node[KEY_USE_STRICT] ||
    (
      global_Reflect_getOwnPropertyDescriptor(context, "strict") &&
      context.strict)),
  visit_program(
    global_Object_assign(
      {
        "closure-tag": null,
        "scope": EMPTY,
        "function-ancestor": false},
      context,
      {
        "module": false,
        "capture": _strict_mode ? is_variable : is_variable_block,
        "escape": _strict_mode ? is_not_variable : is_not_variable_block,
        "strict-mode": _strict_mode})));

///////////
// Query //
///////////

const is_proto_property = (property) => (
  property.type !== "SpreadElement" &&
  !property.shorthand &&
  !property.computed &&
  !property.method &&
  !property.shorthand &&
  property.key.type === "Identifier" &&
  property.key.name === "__proto__");

const has_use_strict = (statements, index) => (
  index < statements.length &&
  statements[index].type === "ExpressionStatement" &&
  statements[index].expression.type === "Literal" &&
  typeof statements[index].expression.value === "string" &&
  (
    typeof statements[index].expression.value === "use strict" ||
    has_use_strict(statements, index + 1)));

const has_loop_body = (statement) => (
  statement.type === "LabeledStatement" ?
  has_loop_body(statement.body) :
  (
    statement.type === "WhileStatement" ||
    statement.type === "DoWhileStatement" ||
    statement.type === "ForStatement" ||
    statement.type === "ForInStatement" ||
    statement.type === "ForOfStatement"));

/////////////////////////////////
// Regular Is && Regular IsNot //
/////////////////////////////////

// type Discriminant = Either [Kind] || Kind
const make_is = (discriminant) => (
  global_Array_isArray(discriminant) ?
  ({kind}) => ArrayLite.include(discriminant, kind) :
  ({kind}) => kind === discriminant);

// type Discriminant = Either [Kind] || Kind
const make_is_not = (discriminant) => (
  global_Array_isArray(discriminant) ?
  ({kind}) => !ArrayLite.include(discriminant, kind) :
  ({kind}) => kind !== discriminant);

const ARRAY_KIND_VARIABLE = [
  KIND_VARIABLE_VOID,
  KIND_VARIABLE_VAR,
  KIND_VARIABLE_FUNCTION,
  KIND_VARIABLE_PARAM,
  KIND_VARIABLE_LET,
  KIND_VARIABLE_CONST
  KIND_VARIABLE_CLASS];
const is_variable = make_is(ARRAY_KIND_VARIABLE);
const is_not_variable = make_is_not(ARRAY_KIND_VARIABLE);

const ARRAY_KIND_VARIABLE_BLOCK = [
  KIND_VARIABLE_LET,
  KIND_VARIABLE_CONST
  KIND_VARIABLE_CLASS];
const is_variable_block = make_is(ARRAY_KIND_VARIABLE_BLOCK);
const is_not_variable_block = make_is_not(ARRAY_KIND_VARIABLE_BLOCK);

const ARRAY_KIND_LABEL = [
  KIND_LABEL_BREAK,
  KIND_LABEL_CONTINUE];
const is_label = make_is(ARRAY_KIND_LABEL);
const is_not_label = make_is_not(ARRAY_KIND_LABEL);

const ARRAY_KIND_MARKER_STRICT = [
  KIND_MARKER_WITH,
  KIND_MARKER_DISCARD,
  KIND_MARKER_PATTERN_EVAL,
  KIND_MARKER_PATTERN_ARGUMENTS];
const is_marker_strict = make_is(ARRAY_KIND_MARKER_STRICT);
const is_not_marker_strict = make_is_not(ARRAY_KIND_MARKER_STRICT);

const is_marker_pattern_member = make_is(KIND_MARKER_PATTERN_MEMBER);
const is_not_marker_pattern_member = make_is_not(KIND_MARKER_PATTERN_MEMBER);

const is_variable_void = make_is(KIND_VARIABLE_VOID);
const is_not_variable_void = make_is_not(KIND_VARIABLE_VOID);

const is_marker_call_eval = make_is(KIND_MARKER_CALL_EVAL);
const is_not_marker_call_eval = make_is(KIND_MARKER_CALL_EVAL);

const is_marker_call_super = make_is(KIND_MARKER_CALL_SUPER);
const is_not_marker_call_super = make_is(KIND_MARKER_CALL_SUPER);

const is_marker_member_super = make_is(KIND_MARKER_MEMBER_SUPER);
const is_not_marker_member_super = make_is(KIND_MARKER_MEMBER_SUPER);

/////////////////////////////////
// Special Is && Special IsNot //
/////////////////////////////////

const is_label_EMPTY = (token) => (
  (
    token.kind === KIND_LABEL_BREAK ||
    token.kind === KIND_LABEL_CONTINUE) &&
  token.data === null);

const is_not_label_EMPTY = (token) => (
  (
    token.kind !== KIND_LABEL_BREAK &&
    token.kind !== KIND_LABEL_CONTINUE) ||
  token.data !== null);

const is_not_variable_duplicate = (token1, index, tokens) => (
  is_variable(token1.kind) &&
  (
    ArrayLite.findIndex(
      tokens,
      (token2) => (
        is_variable(token2) &&
        token2.data === token1.data)) !==
    index));

///////////
// Raise //
///////////

// type Predicate :: (Token, Natural, [Token]) -> Boolean
// type Callback :: Token -> String
const make_raise = (predicate, callback) => (token, index, tokens) => (
  predicate(token, index, tokens) ?
  make_token_error(
    callback(token),
    token.loc) :
  token);

const raise_label = make_raise(
  is_label,
  (token) => (
    token.data === null ?
    `Unbound label (EMPTY)` :
    `Unbound label '${token.data}'`));

const raise_variable_block = make_raise(
  is_variable_block,
  (token) => `Block variable ${token.data} cannot be declared in this context`);

const raise_marker_super_call = make_raise(
  is_marker_super_call,
  (token) => `Super constructor call is not available in this context`);

const raise_marker_super_member = make_raise(
  raise_marker_super_member,
  (token) => `Super property access is not available in this context`);

const raise_marker_pattern_member = make_raise(
  raise_marker_super_member,
  (token) => `Member pattern is not allowed in this context`);

const raise_marker_strict = make_raise(
  is_marker_strict,
  (token) => (
    token.kind === KIND_MARKER_WITH ?
    `The 'with' statement is forbidden in strict mode` :
    (
      token.kind === KIND_MARKER_DISCARD ?
      `Deleting an identifier is forbidden in strict mode` :
      `Assigning 'eval' or 'arguments' is forbidden in strict mode`)));

const raise_variable_block_duplicate = make_raise(
  (token1, index, tokens) => (
    is_variable_block(token1.kind) &&
    (
      ArrayLite.findIndex(
        tokens,
        (token2) => (
          is_variable(token2) &&
          token2.data === token1.data)) !==
      index)) ?
  (token) => `Variable '${token.data}' has already been declared`);

const make_raise_label_continue = (label) => make_raise(
  (token) => (
    token.kind === KIND_LABEL_CONTINUE &&
    token.data === label),
  (token) => (
    label === null ?
    `Illegal continue label: (EMPTY)` :
    `Illegal continue label: '${label}'`));

///////////
// Throw //
///////////

const make_assert = (predicate, message) => (token, index, tokens) => assert(
  predicate(token, index, tokens),
  message);

const assert_not_variable_void = make_assert(
  is_not_variable_void,
  `Unexpected unqualified variable in this context`);

const assert_not_pattern_member = make_assert(
  is_not_marker_pattern_member,
  `Unexpected pattern member in this context`);

///////////
// Hoist //
///////////

const make_make_hoist = (key) => (kinds) => (
  _capture = make_is(kinds),
  _escape = make_is_not(kinds),
  (tokens) => (
    current[key] = ArrayLite.map(
      ArrayLite.filter(
        ArrayLite.filter(key, _capture),
        is_not_variable_duplicate),
      from_variable_token),
    ArrayLite.map(tokens, _escape)));

const make_hoist_local = make_make_hoist(KEY_HOISTING);

const make_hoist_global = make_make_hoist(KEY_HOISTING_GLOBAL);

const hoist_local_param = make_hoist_local([KIND_VARIABLE_PARAM]);

const hoist_local_block = make_hoist_local(ARRAY_KIND_VARIABLE_BLOCK);

const hoist_local_all = make_hoist_local(ARRAY_KIND_VARIABLE);

const hoist_global_all = make_hoist_global(ARRAY_KIND_VARIABLE);

//////////
// Bind //
//////////

const make_bind = (kind) => (token) => (
  token.kind === KIND_VARIABLE_VOID ?
  make_token(kind, token.data) :
  token);

const bind = {__proto__:null};

ArrayLite.forEach(
  [
    KIND_VARIABLE_PARAM,
    KIND_VARIABLE_VAR,
    KIND_VARIABLE_FUNCTION,
    KIND_VARIABLE_LET,
    KIND_VARIABLE_CONST,
    KIND_VARIABLE_CLASS],
  (kind) => bind[kind] = make_bind(kind));

////////////
// Helper //
////////////

const helper_closure = (node) => {};

const helper_class = (node) => {};

const helper_for = (node) => (
  (
    node.type === "ForOfStatement",
    check_type(node.await, "boolean") :
    null),
  ArrayLite.concat( // console.assert(node.type === "ForInStatement" || node.type === "ForOfStatement")
    (
      (
        node.left.type === "VariableDeclaration" &&
        node.left.declarations.length !== 1) ?
      [
        make_token_error(
          `The variable declaration of ${node.type} must have a single declarator.`,
          node.left.loc)] :
      EMPTY),
    (
      node.left.type === "VariableDeclaration" ?
      ArrayLite.map(
        ArrayLite.filter(
          node.left.declarations,
          (declaration) => declaration.init !== null),
        (declaration) => make_token_error(
          `The variable declaration of ${node.type} may not have an initializer.`,
          declaration.loc)) :
      EMPTY),
    (
      (
        node.type === "ForOfStatement" &&
        node.await) ?
      [
        make_token(KIND_MARKER_AWAIT, null)] :
      EMPTY),
    (
      node.left.type === "VariableDeclaration" ?
      hoist_variable_block(
        ArrayLite.map(
          visit_statement(node.left),
          raise_variable_block_duplicate)) :
      (
        node.left.type === "CallExpression" ?
        visit_expression(node.left) :
        ArrayLite.filter(
          pvisit(node.left),
          is_variable_void))),
    visit_expression(node.right),
    ArrayLite.map(
      visit_statement(node.body),
      raise_variable_block));

const helper_closure = (node, _tokens) => (
  node[KEY_USE_STRICT] = has_use_strict(node.body.body, 0),
  node[KEY_SIMPLE_PARAM_LIST] = ArrayLite.every(node.params, (pattern) => pattern.type === "Identifier"),
  _tokens = ArrayLite.concat(
    (
      (
        node[KEY_USE_STRICT] &&
        !node[KEY_SIMPLE_PARAM_LIST]) ?
      [
        make_token_error(`Illegal 'use strict' directive in function with non-simple parameter list`)] :
      EMPTY),
    ArrayLite.map(
      ArrayLite.flatMap(node.params, pvisit),
      replace_variable_void_by_variable_param),
    (
      (
        node.type === "ArrowFunctionExpression" &&
        node.expression) ?
      visit_expression(node.body) :
      block(node.body))),
  _tokens = (
    (
      node[KEY_SIMPLE_PARAM_LIST] ||
      node.type === "ArrowFunctionExpression") ?
    ArrayLite.map(_tokens, raise_variable_param_duplicate) :
    ArrayLite.filter(_tokens, )


  _tokens = ArrayLite.map(
    _tokens,
    (
      node[KEY_SIMPLE_PARAM_LIST] ?
      replace_variable_param_duplicate :
      raise_variable_param_duplicate)),
  _tokens = ArrayLite.concat(
    _tokens,
    (
      (
        node.type === "ArrowFunctionExpression" &&
        node.expression) ?
      visit_expression(node.body) :
      block(node.body))),
  _tokens = ArrayLite.filter(
    _tokens,
    node.async ? drop_expression_await : raise_expression_await),
  _tokens = ArrayLite.filter(
    _tokens,
    node.generator ? drop_expression_yield : raise_expression_yield),
  _tokens = ArrayLite.map(
    _tokens,
    node[KEY_USE_STRICT] ? raise_strict : identity),
  _tokens = ArrayLite.filter(_tokens, raise_label),
  (
    node[KEY_EVAL_CALL] = ArrayLite.some(_tokens, is_expression_call_eval),
    _tokens = ArrayLite.filter(_tokens, is_not_expression_call_eval)),
  (
    node[KEY_HOISTING] = ArrayLite.filter(_tokens, is_variable_closure);
    _tokens = ArrayLite.filter(_tokens, is_not_variable_closure)),

    _tokens));

/////////////////////
// Single Visitors //
/////////////////////

const ARRAY_TYPE_STATEMENT = [
  "EmptyStatement",
  "DebuggerStatement",
  "ThrowStatement",
  "ReturnStatement",
  "BreakStatement",
  "ContinueStatement",
  "LabelStatement",
  "BlockStatement",
  "IfStatement",
  "WithStatement",
  "TryStatment",
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "SwitchStatement",
  "VariableDeclaration",
  "ClassDeclaration"];

const ENUM_TYPE_EXPRESSION = EMPTY;

const ENUM_TYPE_PATTERN = [
  "MemberExpression",
  "Identifier",
  "ObjectPattern",
  "ArrayPattern",
  "AssignmentPattern"
];

const visit_statement = make_visit(ARRAY_TYPE_STATEMENT);

const visit_expression = make_visit(ARRAY_TYPE_EXPRESSION);

const visit_left = make_visit(ArrayLite.concat(ARRAY_TYPE_PATTERN, ARRAY_TYPE_EXPRESSION));

const visit_for_left = make_visit(ArrayLite.concat(ARRAY_TYPE_PATTERN, ["VariableDeclaration"]);

const visit_for_init = make_visit(ArrayLite.concat(ARRAY_TYPE_EXPRESSION, ["VariableDeclaration"]);

const visit_program = make_visit(["Program"]);

const visit_property_pattern = make_visit(["Property", "RestElement"]);

const visit_property_object = make_visit(["Property", "SpreadElement"]);

const visit_key = make_visit(["Identifier", "Literal"]);

const visit_catch = make_visit(["CatchClause"]);

const visit_case = make_visit(["SwitchCase"]);

const visit_block = make_visit(["BlockStatement"]);

const visitors = {
  __proto__: null,
  // Atomic //
  Identifier: (node, context) => (
    assert(
      typeof node.name === "string",
      `Identifier.name must be a string`),
    ArrayLite.concat(
      make_conditional_token_error(
        global_Reflect_apply(
          global_RegExp_prototype_test,
          /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
          node.name),
        `Invalid identifier name: ${global_JSON_stringify(node.name)}`,
        node.loc),
      make_conditional_token(
        (
          context === "pattern" ||
          context === "last-pattern"),
        KIND_VARIABLE_VOID,
        node.name))),
  Literal: (node, context) => (
    (
      "regex" in node ?
      (
        assert(
          typeof node.regx === "object",
          `If present, Literal.regex must be an object`),
        assert(
          node.regex !== null,
          `If present, Literal.regex must not be null`),
        assert(
          typeof node.regex.pattern !== "string",
          `If regex is present, Literal.regex.pattern must be a string`),
        assert(
          typeof node.regex.flags !== "string",
          `If regex is present, Literal.regex.flags must be a string`)) :
      null),
    (
      "bigint" in node ?
      assert(
        typeof node.bigint === "string",
        `If present, Literal.bigint must be a string`) :
      null),
    assert(
      (
        node.value === null ||
        node.value === true ||
        node.value === false ||
        typeof node.value === "number" ||
        typeof node.value === "string"),
      `Literal.value must be a JSON primitive`),
    ArrayLite.concat(
      make_conditional_token_error(
        (
          "regex" in node &&
          "bigint" in node),
        `Literal.regex and Literal.bigint cannot be both present`
        node.loc),
      make_conditional_token_error(
        (
          context === "non-computed-key" &&
          (
            "regex" in node ||
            "bigint" in node ||
            typeof node.value !== "string")),
        `Literal.value must be a string when used as a non-computed key`,
        node.loc))),
  // Pattern && Expression //
  MemberExpression: (node, context) => (
    assert(
      typeof node.computed === "boolean",
      `MemberExpression.computed must be a boolean`),
    assert(
      typeof node.optional === "boolean",
      `MemberExpression.optional must be a boolean`),
    ArrayLite.concat(
      make_conditional_token_error(
        (
          node.optional &&
          (
            context === "pattern" ||
            context === "pattern-last")),
        `MemberExpression.optional must be false when used as a pattern`,
        node.loc),
      visit(ENUM_EXPRESSION_TYPE, node, null),
      (
        node.computed ?
        visit(ENUM_EXPRESSION_TYPE, node, null) :
        visit(["Identifier"], node, "key")))),
  // Pattern //
  RestElement: (node, context) => ArrayLite.concat(
    make_conditional_token_error(
      context !== "last-pattern",
      `RestElement can only appear in last position`,
      node.loc),
    visit(ENUM_PATTERN_TYPE, node, "pattern")),
  AssignmentPattern: (node) => ArrayLite.concat(
    visit(ENUM_PATTERN_TYPE, node.let, "pattern"),
    visit_expression(ENUM_EXPRESSION_TYPE, node.right, null)),
  ObjectPattern: (node) => ArratLite.flatMap(
    node.properties,
    (node, index) => visit(
      ["Property", "RestElement"],
      node,
      (index === node.properties.length - 1) ? "pattern-last" : "pattern")),
  ArrayPattern: (node) => ArrayLite.flatMap(
    node.elements,
    (nullable_node, index) => (
      nullable_node === null ?
      EMPTY :
      visit(
        ENUM_PATTERN_TYPE,
        nullable_node,
        (index === node.properties.length - 1) ? "pattern-last" : "pattern"))),
  // Special //
  // Context :: {
  //   "capture": (token) -> boolean,
  //   "release": (token) -> boolean,
  //   "module": boolean,
  //   "scope": [Variable],
  //   "strict-mode": boolean,
  //   "function-ancestor": boolean
  //   "closure-tag": null | "arrow" | "function" | "method" | "constructor" | "derived-constructor"}
  Program: (node, context) => (
    _tokens = ArrayLite.flatMap(node.body, visit_top),
    (
      // Label //
      _tokens = ArrayLite.map(_tokens, raise_label),
      // Variable //
      ArrayLite.forEach(_tokens, throw_variable_void),
      ArrayLite.forEach(_tokens, throw_variable_param),
      _tokens = ArrayLite.filter(_tokens, raise_variable_block_duplicate),
      node[KEY_HOISTING] = ArrayLite.map(
        ArrayLite.filter(_tokens, context["capture"]),
        from_variable_token),
      _tokens = ArrayLite.filter(_tokens, context["release"]),
      _tokens = ArrayLite.concat(
        ArrayLite.map(context["scope"], to_variable_token),
        _tokens),
      _tokens = ArrayLite.filter(_tokens, raise_variable_block_duplicate),
      _tokens = ArrayLite.filter(_tokens, is_not_variable_duplicate),
      node[KEY_HOISTING_GLOBAL] = ArrayLite.map(
        ArrayLite.filter(_tokens, is_variable),
        from_variable_token),
      _tokens = ArrayLite.filter(_tokens, is_not_variable),
      // Marker //
      ArrayLite.forEach(_tokens, throw_marker_pattern_member),
      _tokens = (
        context["module"] ?
        ArrayLite.filter(_tokens, is_marker_module) :
        ArrayLite.map(_tokens, raise_marker_module)),
      _tokens = (
        context["strict-mode"] ?
        ArrayLite.map(_tokens, raise_marker_strict) :
        ArrayLite.filter(_tokens, is_marker_strict)),
      _tokens = (
        context["function-ancestor"] ?
        ArrayLite.filter(_tokens, is_marker_new_target) :
        ArrayLite.map(_tokens, raise_marker_new_target)),
      _tokens = (
        context["closure-tag"] === "derived-constructor" ?
        ArrayLite.filter(_tokens, is_marker_call_super) :
        ArrayLite.map(_tokens, raise_marker_call_super)),
      _tokens = (
        (
          context["closure-tag"] === "derived-constructor" ||
          context["closure-tag"] === "constructor" ||
          context["closure-tag"] === "method") ?
        ArrayLite.filter(_tokens, is_marker_member_super) :
        ArrayLite.map(_tokens, raise_marker_member_super)),
      _tokens = ArrayLite.map(_tokens, raise_marker_return),
      _tokens = ArrayLite.map(_tokens, raise_marker_await),
      _tokens = ArrayLite.map(_tokens, raise_marker_yield)),
    _tokens),
  // type Context = null | "pattern" | "pattern-last"
  Property: (node, context) => (
    assert(
      node.kind === "init" || node.kind === "get" || node.kind === "set",
      `Propery.kind must either be: 'init', 'get', or 'set'`),
    assert(
      typeof node.method === "boolean",
      `Property.method must be a boolean`),
    assert(
      typeof node.computed === "boolean",
      `Propery.computed must be a boolean`),
    assert(
      typeof node.shorthand === "boolean",
      `Property.computed must be a boolean`),
    (
      (
        context === "pattern" ||
        context === "pattern-last") ?
      (
        assert(
          node.kind === "init",
          `Property.kind must be 'init' when used as a pattern`),
        assert(
          node.method === false,
          `Property.method must be false when used as a pattern`)) :
      null),
    ArrayLite.concat(
      (
        node.computed ?
        visit(ENUM_TYPE_EXPRESSION, node.key, null) :
        visit(["Identifier", "Literal"], node.key, "non-computed-key")),
      (
        pattern ?
        visit(ENUM_TYPE_PATTERN, property.value, "pattern") :
        visit(ENUM_TYPE_EXPRESSION, property.value, null)))),
  // type Context = "var" | "let" | "const"
  VariableDeclarator: (node, context) => ArrayLite.concat(
    ArrayLite.map(
      ArrayLite.map(
        visit(ENUM_TYPE_PATTERN, declaration.id, "pattern"),
        raise_marker_pattern_member),
      bind[to_variable_kind[context]]),
    (
      node.init === null ?
      EMPTY :
      visit(ENUM_TYPE_EXPRESSION, node.init, null))),
  CatchClause: (node, context) => hoist_local_param(
    visit(
      ["BlockStatement"],
      node.body,
      ArrayLite.map(
        ArrayLite.map(
          visit(ENUM_TYPE_PATTERN, node.param, "pattern"),
          bind[KIND_VARIABLE_PARAM]),
        raise_variable_param_duplicate))),
  SwitchCase: (node, tokens) => (
    assert(
      global_Array_isArray(node.consequent),
      `SwitchCase.consequent must be an array`),
    ArrayLite.concat(
      (
        node.test === null ?
        EMPTY :
        visit(ENUM_TYPE_EXPRESSION, node.test, null)),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(ENUM_TYPE_STATEMENT, node, null)))),
  // Atomic-Statement //
  EmptyStatement: (node) => EMPTY,
  DebuggerStatement: (node) => EMPTY,
  ThrowStatement: (node) => visit(ENUM_TYPE_EXPRESSION, node.argument, null),
  ReturnStatement: (node) => ArrayLite.concat(
    make_conditional_token(true, KIND_STATEMENT_RETURN, null),
    (
      node.argument === null ?
      EMPTY :
      visit_expression(node.argument))),
  BreakStatement: (node) => (
    node.label === null ?
    make_conditional_token(true, KIND_LABEL_BREAK, null) :
    ArrayLite.concat(
      visit(["Identifier"], node.label, "label"),
      make_conditional_token(true, KIND_LABEL_BREAK, node.label.name))),
  ContinueStatement: (node) => (
    node.label === null ?
    make_conditional_token(true, KIND_LABEL_CONTINUE, null) :
    ArrayLite.concat(
      visit(["Identifier"], node.label, "label"),
      make_conditional_token(true, KIND_LABEL_CONTINUE, node.label.name))),
  // Compound //
  LabelStatement: (node) => (
    node[KEY_LOOP_BODY] = has_loop_body(node),
    ArrayLite.concat(
      visit(["Identifier"], node.label, "label"),
      ArrayLite.filter(
        (
          node[KEY_LOOP_BODY] ?
          visit(ENUM_TYPE_STATEMENT, node.body, null) :
          ArrayLite.map(
            visit(ENUM_TYPE_STATEMENT, node.body, null),
            (token) => (
              (
                token.KIND === KIND_LABEL_CONTINUE &&
                token.data === node.label.name) ?
              make_token_error(
                `Continue label '${token.data}' is not bound to a loop statement`,
                token.loc) :
              token))),
        (token) => (
          (
            token.KIND === KIND_LABEL_CONTINUE ||
            token.KIND === KIND_LABEL_BREAK) &&
          token.data === node.label.name)))),
    // type Context = [Token]
    BlockStatement: (node, context) => hoist_local_block(
      ArrayLite.map(
        ArrayLite.concat(
          context,
          ArrayLite.flatMap(
            node.body,
            (node) => visit(ENUM_TYPE_STATEMENT, node, null))),
        raise_variable_block_duplicate)),
    IfStatement: (node) => ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.test, null),
      ArrayLite.map(
        visit_statement(ENUM_TYPE_STATEMENT, node.consequent, null),
        raise_variable_block),
      (
        node.alternate === null ?
        EMPTY :
        ArrayLite.map(
          visit_statement(ENUM_TYPE_STATEMENT, node.alternate, null),
          raise_variable_block))),
    WithStatement: (node) => ArrayLite.concat(
      make_conditional_token(true, KIND_MARKER_WITH, null),
      visit(ENUM_TYPE_EXPRESSION, node.object, null),
      ArrayLite.map(
        visit(ENUM_TYPE_STATEMENT, node.body, null),
        raise_variable_block)),
    TryStatment: (node) => ArrayLite.concat(
      visit(["BlockStatement"], node.block, EMPTY),
      (
        node.handler === null ?
        EMPTY :
        visit(["CatchClause"], node.handler, EMPTY)),
      (
        node.finalizer === null ?
        EMPTY :
        visit(["BlockStatement"], node.finalizer, EMPTY))),
    WhileStatement: (node, context) => ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.test, null),
      ArrayLit.filter(
        ArrayLite.map(
          visit(ENUM_TYPE_STATEMENT, node.body, null),
          raise_variable_block),
        is_not_label_empty)),
    DoWhileStatement: (node, context) => ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.test, null),
      ArrayLit.filter(
        ArrayLite.map(
          visit(ENUM_TYPE_STATEMENT, node.body, null),
          raise_variable_block),
        is_not_label_empty)),
    ForStatement: (node, context) => ArrayLite.concat(
      (
        node.init === null ?
        EMPTY :
        hoist_variable_block(
          ArrayLite.map(
            visit(
              ArrayLite.concat(ENUM_EXPRESSION_TYPE, ["VariableDeclaration"]),
              node.init,
              null),
            raise_variable_block_duplicate))),
      (
        node.test === null ?
        EMPTY :
        visit(ENUM_TYPE_EXPRESSION, node.test, null)),
      (
        node.update === null ?
        EMPTY :
        visit(ENUM_TYPE_EXPRESSION, node.update, null)),
      ArrayLite.map(
        visit(ENUM_TYPE_STATEMENT, node.body, null),
        raise_variable_block)),
    ForInStatement: helper_for,
    ForOfStatement: helper_for,
    SwitchStatement: (node) => ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.discriminant, null),
      hoist_local_block(
        ArrayLite.map(
          ArrayLite.map(
            node.cases,
            (node) => visit(["SwitchCase"], node, null)),
          raise_variable_block_duplicate)),
      make_conditional_token_error(
        (
          ArrayLite.findIndex(node.cases, (clause) => clause.test === null) !==
          ArrayLite.findLastIndex(node.cases, (clause) => clause.test === null)),
        `More than one default clause in switch statement`,
        node.loc)),
    // Declaration //
    // type Context = null | "for-of" | "for-in"
    VariableDeclaration: (node, context) => (
      assert(
        node.kind === "var" || node.kind === "let" || node.kind === "const",
        `VariableDeclaration.kind must either be: 'var', 'let', or 'const'`),
      assert(
        global_Array_isArray(node.declarations),
        `VariableDeclaration.declarations must be an array`),
      ArrayLite.concat(
        ArrayLite.flatMap(
          node.declarations,
          (node) => visit(["VariableDeclarator"], node, node.kind)),
        make_conditional_token_error(
          node.declarations.length === 0,
          `VariableDeclaration.declarations must not be an empty array`,
          node.loc),
        make_conditional_token_error(
          (
            (
              context === "for-of" ||
              context === "for-in") &&
            node.declarations.length !== 1 &&
            node.declarations[0].init !== null),
          `The variable declaration of a ${context} loop must have a single binding without initialization`,
          node.loc))),
    FunctionDeclaration: helper_closure,
    ClassDeclaration: helper_class,
    // Expression >> Litearal //
    TemplateElement: (node, last) => (
      assert(
        typeof node.tail === "boolean",
        `TemplateElement.tail must be a boolean`),
      assert(
        typeof node.value === "object",
        `TemplateElement.value must be an object`),
      assert(
        typeof node.value !== null,
        `TemplateElement.value must not be null`),
      assert(
        typeof node.value.cooked === "string",
        `TemplateElement.value.cooked must be a string`),
      assert(
        typeof node.value.raw === "string",
        `TemplateElement.value.raw must be a string`),
      make_conditional_token_error(
        last !== node.tail,
        `TemplateElement.tail must indicate whether it is last or not`)),
    TemplateLiteral: (node) => (
      assert(
        global_Array_isArray(node.quasis),
        `TemplateLiteral.quasis must be an array`),
      assert(
        global_Array_isArray(node.expressions),
        `TemplateLiteral.expressions must be an array`),
      ArrayLite.concat(
        ArrayLite.flatMap(
          node.quasis,
          (node, index, nodes) => visit(
            ["TemplateElement"],
            node,
            index === nodes.length - 1)),
        ArrayLite.flatMap(
          node.expressions,
          (node) => visit(ENUM_TYPE_EXPRESSION, node, null)),
        make_conditional_token_error(
          node.quasis.length !== node.expressions.length + 1,
          `TemplateLiteral.quasis must have exacly one element more than TemplateLiteral.expressions`))),
    TaggedTemplateLiteral: (node) => ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.tag, null),
      visit(["TemplateLiteral"], node.quasi, null)),
    ArrowFunctionExpression: helper_closure,
    FunctionExpression: helper_closure,
    ClassExpression: helper_class,
    // Expression >> Environment //
    MetaProperty: (node) => ArrayLite.concat(
      visit(["Identifier"], node.meta, null),
      visit(["Identifier"], node.property, null),
      make_conditional_token(
        (
          node.meta.name === "new" &&
          node.property.name === "target"),
        KIND_MARKER_NEW_TARGET,
        null),
      make_conditional_token(
        (
          node.meta.name === "import" &&
          node.property.name === "meta"),
        KIND_MARKER_MODULE,
        null),
      make_conditional_token_error(
        (
          (
            node.meta.name !== "new" ||
            node.property.name !== "target") &&
          (
            node.meta.name !== "meta" ||
            node.property.name !== "import")),
        `Only new.target and import.meta are recognized as meta property`,
        node.loc)),
    UpdateExpression: (node) => (
      assert(
        typeof node.prefix === "boolean",
        `UpdateExpression.prefix must be a boolean`),
      assert(
        ArrayLite.includes(ENUM_OPERATOR_UPDATE, node.operator),
        `Invalid UpdateExpression.operator`),
      ArrayLite.concat(
        visit(ENUM_TYPE_EXPRESSION, node.argument, "pattern"),
        make_conditional_token_error(
          (
            node.argument.type !== "Identifier" &&
            node.argument.type !== "MemberExpression" &&
            node.argument.type !== "CallExpression"),
          `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`,
          node.loc))),
    AssignmentExpression: (node) => (
      assert(
        ArrayLite.includes(ENUM_OPERATOR_ASSIGNMENT, node.operator),
        `Invalid AssignmentExpression.operator`),
      ArrayLite.concat(
        visit(
          ArrayLite.concat(ENUM_TYPE_PATTERN, ENUM_TYPE_EXPRESSION),
          node.left,
          "pattern"),
        visit(ENUM_TYPE_EXPRESSION, node.right, null),
        make_conditional_token_error(
          (
            node.operator !== "=" &&
            node.left.type !== "Identifier" &&
            node.left.type !== "MemberExpression" &&
            node.left.type !== "CallExpression"),
          `When not performing '=', AssignmentExpression.left must either be an Identifier, a MemberExpression, or a CallExpression`,
          node.loc),
        make_conditional_token_error(
          (
            node.operator === "=" &&
            node.left.type !== "Identifier" &&
            node.left.type !== "MemberExpression" &&
            node.left.type !== "CallExpression" &&
            node.left.type !== "ArrayPattern" &&
            node.left.type !== "ObjectPattern"),
          `When not performing '=', AssignmentExpression.left must either be an Identifier, a MemberExpression, a CallExpression, an ObjectPattern, or an ArrayPattern`,
          node.loc))),
    // Control Flow //
    ChainExpression: (node) => visit_expression(node.expression),
    ConditionalExpression: (node) => ArrayLite.concat(
      visit_expression(node.test),
      visit_expression(node.consequent),
      visit_expression(node.alternate)),
    LogicalExpression: (node) => ArrayLite.concat(
      visit_expression(node.left),
      visit_expression(node.right)),
    SequenceExpression: (node) => ArrayLite.concat(
      ArrayLite.map(node.expressions, visit_expression),
      (
        node.expressions.length === 0 ?
        [
          {
            kind: "error",
            data: {
              name: "SpecialSyntaxError",
              message: `EMPTY sequence expression`,
              loc: node.loc},
            loc: node.loc}] :
        EMPTY)),
    // Combiners //
    MemberExpression: (node) => ArrayLite.concat(
      (
        (
          node.computed &&
          node.property.type !== "Identifier") ?
        [
          {
            kind: "error",
            data: {
              name: "SpecialSyntaxError",
              message: `Non computed member expressions can only admit an identifier as key`,
              loc: node.loc},
            loc: node.loc}] :
        EMPTY),
      (
        node.object.type === "Super" ?
        [
          {
            kind: "super-member",
            data: null,
            loc: node.loc}] :
        visit_expression(node.object)),
      (
        node.computed ?
        visit_expression(node.property) :
        EMPTY)),
    UnaryExpression: (node) => ArrayLite.concat(
      (
        node.prefix ?
        EMPTY :
        [
          {
            kind: "error",
            data: {
              name: "SpecialSyntaxError",
              message: `unary operator not in prefix position`,
              loc: node.loc},
            loc: node.loc}]),
      (
        (
          node.operator === "delete" &&
          node.argument.type === "Identifier") ?
        [
          {
            kind: "delete-variable",
            data: null,
            loc: node.loc}] :
        EMPTY),
      visit_expression(node.argument)),
    BinaryExpression: (node) => ArrayLite.concat(
      visit_expression(node.left),
      visit_expression(node.right)),
    CallExpression: (node) => ArrayLite.concat(
      (
        (
          node.callee.type === "Identifier" &&
          node.callee.name === "eval") ?
        [
          {
            kind: "eval",
            data: null,
            loc: node.loc}] :
        EMPTY),
      (
        node.callee.type === "Super" ?
        [
          {
            kind: "super-call",
            data: null,
            loc: node.loc}] :
        visit_expression(node.callee)),
      ArrayLite.flatMap(
        node.arguments,
        (argument) => (
          node.type === "SpreadElement" ?
          visit_expression(argument.argument) :
          visit_expression(argument)))),
    NewExpression: (node) => ArrayLite.concat(
      visit_expression(node.callee),
      ArrayLite.flatMap(
        node.arguments,
        (argument) => (
          node.type === "SpreadElement" ?
          visit_expression(argument.argument) :
          visit_expression(argument)))),
    ArrayExpression: (node) => ArrayLite.flatMap(
      ArrayLite.map(
        node.elements,
        (element) => (
          element === null ?
          EMPTY :
          (
            element.type === "SpreadElement" ?
            visit_expression(element.argument) :
            visit_expression(element))))),
    ObjectExpression: (node) => ArrayLite.concat(
      (
        (
          ArrayLite.findIndex(node.properties, is_proto_property) !==
          ArrayLite.findLastIndex(node.properties, is_proto_property)) ?
        [
          {
            kind: "error",
            data: {
              name: "SyntaxError",
              message: `Duplicate __proto__ fields are not allowed in object literals`,
              loc: node.loc},
            loc: node.loc}] :
        EMPTY),
      ArrayLite.flatMap(
        node.properties,
        (property) => (
          property.kind === "SpreadElement" ?
          visit_expression(property.argument) :
          ArrayLite.concat(
            (
              (
                property.kind !== "init" &&
                property.method) ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SpecialSyntaxError",
                    message: `A property cannot be both an accessor and a method`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              (
                property.shorthand &&
                (
                  property.kind !== "init" ||
                  property.method ||
                  property.computed ||
                  property.key.type === "Identifier" ||
                  property.value.type !== "Identifier" ||
                  property.key.name !== propery.key.value)) ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SpecialSyntaxError",
                    message: `A shorthand property must be a non-computed init property where the key and the value must point to the same identifier`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              (
                !property.computed &&
                property.key.type !== "Identifier" &&
                property.key.type !== "Literal" &&
                typeof property.key.value !== "string") ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SpecialSyntaxError",
                    message: `Non computed property key must either be an identifier or a string literal`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              (
                property.kind !== "init" &&
                property.value.type !== "FunctionExpression") ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SpecialSyntaxError",
                    message: `The value of an accessor property should be a function expression`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              (
                property.kind === "get" &&
                property.value.params.length !== 0) ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SyntaxError",
                    message: `Getter must not have any formal parameters.`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              (
                property.kind === "set" &&
                property.value.params.length !== 1) ?
              [
                {
                  kind: "error",
                  data: {
                    name: "SyntaxError",
                    message: `Setter must have exactly one formal parameter.`,
                    loc: property.loc},
                  loc: node.loc}] :
              EMPTY),
            (
              property.computed ?
              visit_expression(property.key) :
              EMPTY),
            (
              property.method ?
              ArrayLite.filter(
                visit_expression(property.value),
                make_filter_kind("super-member")) :
              visit_expression(property.value))))))}));
