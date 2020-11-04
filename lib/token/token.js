"use strict";

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

const EMPTY = [];

exports.loc = null;

// Variable //
exports.KIND_ERROR = "error";
exports.KIND_VARIABLE_LET = "let";
exports.KIND_VARIABLE_CONST = "const";
exports.KIND_VARIABLE_CLASS = "class";
exports.KIND_VARIABLE_VAR = "var";
exports.KIND_VARIABLE_FUNCTION = "function";
exports.KIND_VARIABLE_PARAM = "param";
exports.KIND_VARIABLE_VOID = "void";
exports.ENUM_KIND_VARIABLE = [
  exports.KIND_VARIABLE_VOID,
  exports.KIND_VARIABLE_VAR,
  exports.KIND_VARIABLE_FUNCTION,
  exports.KIND_VARIABLE_PARAM,
  exports.KIND_VARIABLE_LET,
  exports.KIND_VARIABLE_CONST
  exports.KIND_VARIABLE_CLASS];
exports.ENUM_KIND_VARIABLE_BLOCK = [
  exports.KIND_VARIABLE_LET,
  exports.KIND_VARIABLE_CONST
  exports.KIND_VARIABLE_CLASS];

// Label //
exports.KIND_LABEL_BREAK = "break";
exports.KIND_LABEL_CONTINUE = "continue";
exports.ENUM_KIND_LABEL = [
  exports.KIND_LABEL_BREAK,
  exports.KIND_LABEL_CONTINUE];

// Marker //
exports.KIND_MARKER_MODULE = "module";
exports.KIND_MARKER_AWAIT = "await";
exports.KIND_MARKER_YIELD = "yield";
exports.KIND_MARKER_NEW_TARGET = "new-target";
exports.KIND_MARKER_EVAL = "eval";
exports.KIND_MARKER_SUPER_CALL = "super-call";
exports.KIND_MARKER_SUPER_MEMBER = "super-member";
exports.KIND_MARKER_WITH = "with";
exports.KIND_MARKER_DISCARD = "discard";
exports.KIND_MARKER_RETURN = "return";
exports.KIND_MARKER_PATTERN_MEMBER = "pattern-member";
exports.KIND_MARKER_PATTERN_EVAL = "pattern-eval";
exports.KIND_MARKER_PATTERN_ARGUMENTS = "pattern-arguments";
exports.ENUM_KIND_MARKER_STRICT = [
  exports.KIND_MARKER_WITH,
  exports.KIND_MARKER_DISCARD,
  exports.KIND_MARKER_PATTERN_EVAL,
  exports.KIND_MARKER_PATTERN_ARGUMENTS];

exports.make = (kind, data) => ({kind, data, loc:exports.loc});

exports.mark = (boolean, kind, data) => (
  boolean ?
  [
    exports.make(kind, data)] :
  EMPTY);

exports.make_error = (message, loc) => make_token(
  KIND_ERROR,
  {message, loc});

exports.check = (boolean, message) => (
  boolean ?
  EMPTY :
  [
    exports.make_error(message, exports.loc)]);

////////////////
// Convertion //
////////////////

exports.to_error = ({kind, data}) => (
  Error.expect(kind === KIND_ERROR, `A non-error token escaped`),
  data);

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

exports.from_variable = ({kind, name}) => (
  Error.assert(
    kind in to_variable_kind,
    `Cannot convert variable to token`),
  make_token(to_variable_kind[kind], name));

exports.to_variable = ({kind, data}) => (
  Error.expect(
    kind in from_variable_kind,
    `Cannot convert token to variable`),
  {
    kind: from_variable_kind[kind],
    name: data});

//////////
// Bind //
//////////

const make_bind = (kind) => (token) => (
  token.kind === KIND_VARIABLE_VOID ?
  make_token(kind, token.data) :
  token);

exports.bind = {__proto__:null};

ArrayLite.forEach(
  ENUM_KIND_VARIABLE,
  (kind) => exports.bind[kind] = make_bind(kind));

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

exports.is_variable = make_is(ENUM_KIND_VARIABLE);
exports.is_not_variable = make_is_not(ENUM_KIND_VARIABLE);

exports.is_variable_block = make_is(ENUM_KIND_VARIABLE_BLOCK);
exports.is_not_variable_block = make_is_not(ENUM_KIND_VARIABLE_BLOCK);

exports.is_label = make_is(ENUM_KIND_LABEL);
exports.is_not_label = make_is_not(ENUM_KIND_LABEL);

exports.is_marker_strict = make_is(ENUM_KIND_MARKER_STRICT);
exports.is_not_marker_strict = make_is_not(ENUM_KIND_MARKER_STRICT);

exports.is_marker_pattern_member = make_is(KIND_MARKER_PATTERN_MEMBER);
exports.is_not_marker_pattern_member = make_is_not(KIND_MARKER_PATTERN_MEMBER);

exports.is_variable_void = make_is(KIND_VARIABLE_VOID);
exports.is_not_variable_void = make_is_not(KIND_VARIABLE_VOID);

exports.is_marker_call_eval = make_is(KIND_MARKER_CALL_EVAL);
exports.is_not_marker_call_eval = make_is(KIND_MARKER_CALL_EVAL);

exports.is_marker_call_super = make_is(KIND_MARKER_CALL_SUPER);
exports.is_not_marker_call_super = make_is(KIND_MARKER_CALL_SUPER);

exports.is_marker_member_super = make_is(KIND_MARKER_MEMBER_SUPER);
exports.is_not_marker_member_super = make_is(KIND_MARKER_MEMBER_SUPER);

/////////////////////////////////
// Special Is && Special IsNot //
/////////////////////////////////

exports.is_label_empty = (token) => (
  (
    token.kind === KIND_LABEL_BREAK ||
    token.kind === KIND_LABEL_CONTINUE) &&
  token.data === null);

exports.is_not_label_empty = (token) => (
  (
    token.kind !== KIND_LABEL_BREAK &&
    token.kind !== KIND_LABEL_CONTINUE) ||
  token.data !== null);

exports.is_not_duplicate_variable = (token1, index, tokens) => (
  !exports.is_variable(token1) ||
  (
    ArrayLite.findIndex(
      tokens,
      (token2) => (
        exports.is_variable(token2) &&
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

// const make_assert = (predicate, message) => (token, index, tokens) => assert(
//   predicate(token, index, tokens),
//   message);
//
// const assert_not_variable_void = make_assert(
//   is_not_variable_void,
//   `Unexpected unqualified variable in this context`);
//
// const assert_not_pattern_member = make_assert(
//   is_not_marker_pattern_member,
//   `Unexpected pattern member in this context`);
