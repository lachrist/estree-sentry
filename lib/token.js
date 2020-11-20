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
//   -- Strict --
//   Strict Message Loc
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
//   StatementReturn            () Loc
//   PatternMember              () Loc

const global_Boolean = global.Boolean;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const State = require("./state.js");
const Error = require("./error.js");

// Error //
exports.KIND_ERROR = "error";

// Variable //
exports.KIND_VARIABLE_VOID = "void";
exports.KIND_VARIABLE_PARAM = "param";
exports.KIND_VARIABLE_VAR = "var";
exports.KIND_VARIABLE_FUNCTION_LOOSE = "function-loose";
exports.KIND_VARIABLE_FUNCTION_RIGID = "function-rigid";
exports.KIND_VARIABLE_FUNCTION_BURIED = "function-buried";
exports.KIND_VARIABLE_LET = "let";
exports.KIND_VARIABLE_CONST = "const";
exports.KIND_VARIABLE_CLASS = "class";
exports.KIND_VARIABLE_GENERIC_LOOSE = "generic-loose";
exports.KIND_VARIABLE_GENERIC_RIGID = "generic-rigid";

// Label //
exports.KIND_LABEL_BREAK = "break";
exports.KIND_LABEL_CONTINUE = "continue";

// Strict //
exports.KIND_STRICT = "strict";

// Marker //
exports.KIND_MARKER_IDENTIFIER_AWAIT = "identifier-await";
exports.KIND_MARKER_IDENTIFIER_YIELD = "identifier-yield";
exports.KIND_MARKER_IDENTIFIER_STRICT = "identifier-strict";
exports.KIND_MARKER_ARGUMENTS_READ = "arguments-read";
exports.KIND_MARKER_ARGUMENTS_WRITE = "arguments-write";
exports.KIND_MARKER_CLOSURE = "closure";
exports.KIND_MARKER_EVAL = "eval";
exports.KIND_MARKER_THIS = "this";
exports.KIND_MARKER_NEW_TARGET = "new-target";
exports.KIND_MARKER_IMPORT_META = "import-meta";
exports.KIND_MARKER_IMPORT_DECLARATION = "import";
exports.KIND_MARKER_EXPORT_DECLARATION = "export";
exports.KIND_MARKER_SUPER_CALL = "super-call";
exports.KIND_MARKER_SUPER_MEMBER = "super-member";
exports.KIND_MARKER_AWAIT = "await";
exports.KIND_MARKER_AWAIT_FOR_OF = "await-for-of";
exports.KIND_MARKER_YIELD = "yield";
exports.KIND_MARKER_RETURN = "return";
exports.KIND_MARKER_PATTERN_MEMBER = "pattern-member";
exports.KIND_MARKER_PATTERN_LET = "pattern-let";

const abort = (error) => { throw error };

const to_variable_object = {
  __proto__: null,
  [exports.KIND_VARIABLE_GENERIC_RIGID]: null,
  [exports.KIND_VARIABLE_GENERIC_LOOSE]: null,
  [exports.KIND_VARIABLE_PARAM]: "param",
  [exports.KIND_VARIABLE_VAR]: "var",
  [exports.KIND_VARIABLE_FUNCTION_BURIED]: "function",
  [exports.KIND_VARIABLE_FUNCTION_RIGID]: "function",
  [exports.KIND_VARIABLE_FUNCTION_LOOSE]: "function",
  [exports.KIND_VARIABLE_LET]: "let",
  [exports.KIND_VARIABLE_CONST]: "const",
  [exports.KIND_VARIABLE_CLASS]: "class"};
exports.to_variable = ({kind, data}) => (
  kind in to_variable_object ?
  {
    kind: to_variable_object[kind],
    duplicable: (
      kind === exports.KIND_VARIABLE_PARAM ||
      kind === exports.KIND_VARIABLE_VAR ||
      kind === exports.KIND_VARIABLE_FUNCTION_LOOSE ||
      kind === exports.KIND_VARIABLE_FUNCTION_BURIED ||
      kind === exports.KIND_GENERIC_LOOSE),
    name: data} :
  abort(
    new global_Error("Cannot convert token to variable")));

const from_variable_object = {
  __proto__: null,
  "param": exports.KIND_VARIABLE_PARAM,
  "var": exports.KIND_VARIABLE_VAR,
  "function": exports.KIND_VARIABLE_FUNCTION_BURIED,
  "let": exports.KIND_VARIABLE_LET,
  "const": exports.KIND_VARIABLE_CONST,
  "class": exports.KIND_VARIABLE_CLASS};
exports.from_variable = ({kind, duplicable, name}) => (
  (
    kind === null ||
    kind === void 0) ?
  (
    (
      duplicable === null ||
      duplicable === void 0) ?
    abort(
      new Error.OptionSentryError(
        "Cannot convert a variable which does not have a kind nor duplicability information",
        null)) :
    {
      kind: (
        duplicable ?
        exports.KIND_VARIABLE_GENERIC_LOOSE :
        exports.KIND_VARIABLE_GENERIC_RIGID),
      data: name,
      loc: State.loc}) :
  (
    (
      (
        duplicable === null ||
        duplicable === void 0) ||
      (
        global_Boolean(duplicable) ===
        (
          kind === "param" ||
          kind === "var" ||
          kind === "function"))) ?
    {
      kind: from_variable_object[kind],
      data: name,
      loc: State.loc} :
    abort(
      new Error.OptionSentryError(
        "Cannot convert variable because its kind conflicts with its duplicability information",
        null))));

exports.to_error = (token) => (
  token.kind === exports.KIND_ERROR ?
  new Error.SyntaxSentryError(token.data, token.loc) :
  abort(
    new global_Error(`Cannot convert non-error token ${token.kind} carrying ${token.data} to error`)));

exports.check = (boolean, message) => (
  boolean ?
  [] :
  [
    {
      kind: exports.KIND_ERROR,
      data: message,
      loc: State.loc}]);

exports.guard = (boolean, kind, data) => (
  boolean ?
  [
    {
      kind: kind,
      data: data,
      loc: State.loc}] :
  []);

//////////////////////
// Return a closure //
//////////////////////

exports.test = (kinds, data) => (
  data === void 0 ?
  ((token) => (token.kind in kinds)) :
  ((token) => (token.kind in kinds) && (token.data === data)));

exports.test_duplicate = (kinds) => (token1, index1, tokens) => (
  token1.kind in kinds &&
  ArrayLite.some(
    tokens,
    (token2, index2) => (
      index1 > index2 &&
      token2.kind in kinds[token1.kind] &&
      token1.data === token2.data)));

exports.raise = (kinds, data) => (token) => (
  (
    token.kind in kinds &&
    (
      data === void 0 ||
      token.data === data)) ?
  {
    kind: exports.KIND_ERROR,
    data: (
      typeof kinds[token.kind] === "function" ?
      kinds[token.kind](token.kind, token.data) :
      kinds[token.kind]),
    loc: token.loc} :
  token);

exports.raise_duplicate = (kinds, callback) => (token1, index1, tokens) => (
  (
    token1.kind in kinds &&
    ArrayLite.some(
      tokens,
      (token2, index2) => (
        index1 > index2 &&
        token2.kind in kinds[token1.kind] &&
        token1.data === token2.data))) ?
  {
    kind: exports.KIND_ERROR,
    data: callback(token1.kind, token1.data),
    loc: token1.loc} :
  token1);

exports.transform = (kinds, data) => (token) => (
  (
    token.kind in kinds &&
    (
      data === void 0 ||
      token.data === data)) ?
  {
    kind: kinds[token.kind],
    data: token.data,
    loc: token.loc} :
  token);
