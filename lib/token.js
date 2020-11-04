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

exports.make = (kind, data) => {kind, data, loc:state.loc};

// Error //
exports.KIND_ERROR = "error";

// Variable //
exports.KIND_VARIABLE_VOID = "void";
exports.KIND_VARIABLE_PARAM = "param";
exports.KIND_VARIABLE_CLOSURE = "closure-generic";
exports.KIND_VARIABLE_CLOSURE_VAR = "var";
exports.KIND_VARIABLE_CLOSURE_FUNCTION = "function";
exports.KIND_VARIABLE_BLOCK = "block-generic";
exports.KIND_VARIABLE_BLOCK_LET = "let";
exports.KIND_VARIABLE_BLOCK_CONST = "const";
exports.KIND_VARIABLE_BLOCK_CLASS = "class";

// Label //
exports.KIND_LABEL_BREAK = "break";
exports.KIND_LABEL_CONTINUE = "continue";

// Marker //
exports.KIND_EXPRESSION_META_NEW_TARGET = "meta-new-target";
exports.KIND_EXPRESSION_META_IMPORT_META = "meta-import-meta";
exports.KIND_EXPRESSION_CALL_EVAL = "eval";
exports.KIND_EXPRESSION_CALL_SUPER = "super-call";
exports.KIND_EXPRESSION_MEMBER_SUPER = "super-member";


exports.KIND_EXPRESSION_AWAIT = "await";
exports.KIND_EXPRESSION_YIELD = "yield";


exports.KIND_DECLARATION_IMPORT = "import";
exports.KIND_DECLARATION_EXPORT = "export";

exports.KIND_STATEMENT_WITH = "with";
exports.KIND_EXPRESSION_DELETE_IDENTIFIER = "discard";
exports.KIND_STATEMENT_RETURN = "return";
exports.KIND_PATTERN_MEMBER = "pattern-member";
exports.KIND_PATTERN_IDENTIFIER_EVAL = "pattern-eval";
exports.KIND_PATTERN_IDENTIFIER_ARGUMENTS = "pattern-arguments";
