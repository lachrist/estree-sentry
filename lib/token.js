"use strict";

// data Token =
//   -- Error --
//   Error Message Loc
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
//   StatementForOfAwait        () Loc
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

const State = require("./state.js");

// Error //
exports.KIND_ERROR = "error";

// Variable //
exports.KIND_VARIABLE_VOID = "void";
exports.KIND_VARIABLE_CLOSURE_VAR = "var";
exports.KIND_VARIABLE_CLOSURE_FUNCTION = "function";
exports.KIND_VARIABLE_BLOCK_LET = "let";
exports.KIND_VARIABLE_BLOCK_CONST = "const";
exports.KIND_VARIABLE_BLOCK_CLASS = "class";
exports.KIND_VARIABLE_GLOBAL_UNIQUE = "global-unique";
exports.KIND_VARIABLE_GLOBAL_DUPLICABLE = "global-duplicable";

// Label //
exports.KIND_LABEL_BREAK = "break";
exports.KIND_LABEL_CONTINUE = "continue";

// Marker //
exports.KIND_MARKER_EVAL = "eval";
exports.KIND_MARKER_NEW_TARGET = "meta-new-target";
exports.KIND_MARKER_IMPORT_META = "meta-import-meta";
exports.KIND_MARKER_SUPER_CALL = "super-call";
exports.KIND_MARKER_SUPER_MEMBER = "super-member";
exports.KIND_MARKER_AWAIT = "await";
exports.KIND_MARKER_YIELD = "yield";
exports.KIND_MARKER_DISCARD = "discard";
exports.KIND_MARKER_PARAM_DUPLICATE = "param-duplicate";
exports.KIND_MARKER_IMPORT = "import";
exports.KIND_MARKER_EXPORT = "export";
exports.KIND_MARKER_WITH = "with";
exports.KIND_MARKER_RETURN = "return";
exports.KIND_MARKER_PATTERN_MEMBER = "pattern-member";
exports.KIND_MARKER_PATTERN_EVAL = "pattern-eval";
exports.KIND_MARKER_PATTERN_ARGUMENTS = "pattern-arguments";

const abort = (message) => { throw new global_Error(message) };

const to_variable_object = {
  __proto__: null,
  [exports.KIND_VARIABLE_GLOBAL_UNIQUE]: "global-unique",
  [exports.KIND_VARIABLE_GLOBAL_DUPLICABLE]: "global-duplicable",
  [exports.KIND_VARIABLE_VOID]: "param",
  [exports.KIND_VARIABLE_VAR]: "var",
  [exports.KIND_VARIABLE_FUNCTION]: "function",
  [exports.KIND_VARIABLE_LET]: "let",
  [exports.KIND_VARIABLE_CONST]: "const",
  [exports.KIND_VARIABLE_CLASS]: "class"};
exports.to_variable = (token) => (
  token.kind in to_variable_object ?
  {
    kind: to_variable_object[token.kind],
    name: token.data} :
  abort("Cannot convert token to variable"));

exports.from_variable_global_unique = (name) => ({
  kind: exports.KIND_VARIABLE_GLOBAL_UNIQUE,
  data: variable.name,
  loc: State.loc});

exports.from_variable_global_duplicable = (name) => ({
  kind: exports.KIND_VARIABLE_GLOBAL_DUPLICABLE,
  data: variable.name,
  loc: State.loc});

exports.to_error = (token) => (
  token.kind === exports.KIND_ERROR ?
  {
    message: token.data,
    loc: token.loc} :
  abort("Cannot convert non-error token to error"));

exports.check = (boolean, message) => (
  boolean ?
  [] :
  [
    {
      kind: exports.KIND_ERROR,
      message: message,
      loc: State.loc}]);

exports.wrap = (kind, data) => [
  {
    kind: kind,
    data: data,
    loc: State.loc}];

//////////////////////
// Return a closure //
//////////////////////

const make_test = (kind, data) => (
  typeof kind === "object" ?
  (
    data === void 0 ?
    (token) => token.kind in kind :
    (token) => token.kind in kind && token.data === data) :
  (
    data === void 0 ?
    (token) => token.kind === kind :
    (token) => token.kind === kind && token.data === data));

exports.test = make_test;

exports.raise = (kind, data, message, _test) => (
  _test = make_test(kind, data),
  (token) => (
    _test(token) ?
    {
      kind: exports.KIND_ERROR,
      data: (
        typeof message === "function" ?
        message(token.kind, token.data) :
        message),
      loc: token.loc} :
    token));

exports.raise_duplicate = (discriminant1, discriminant2, message) => (
  _test = make_test(discriminant1, void 0),
  (token, index, tokens) => (
    (
      _test(token) &&
      ArrayLite.includes(

exports.transform = (kind1, data, kind2, _test) => (
  _test = make_test(kind1, data),
  (token) => (
    _test(token) ?
    {
      kind: kind2,
      data: token.data,
      loc: token.loc} :
    token));
