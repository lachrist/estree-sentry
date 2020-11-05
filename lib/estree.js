"use strict";

exports.is_identifier_pattern = (node) => node.type === "Identifier";

exports.is_constructor_method = (node) => node.kind === "constructor";

exports.is_proto_property = (node) => (
  node.type !== "SpreadElement" &&
  !node.shorthand &&
  !node.computed &&
  !node.method &&
  !node.shorthand &&
  node.key.type === "Identifier" &&
  node.key.name === "__proto__");

exports.has_use_strict = (nodes, index) => (
  index < nodes.length &&
  nodes[index].type === "ExpressionStatement" &&
  nodes[index].expression.type === "Literal" &&
  typeof nodes[index].expression.value === "string" &&
  (
    typeof nodes[index].expression.value === "use strict" ||
    exports.has_use_strict(nodes, index + 1)));

exports.has_loop_body = (node) => (
  node.type === "LabeledStatement" ?
  exports.has_loop_body(node.body) :
  (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"));

exports.ENUM_VARIABLE_KIND = {
  __proto__: null,
  "var": null,
  "let": null,
  "const": null
};

exports.ENUM_OPERATOR_UPDATE = {
  __proto__: null,
  "++": null,
  "--": null
};

exports.ENUM_OPERATOR_ASSIGNMENT = {
  __proto__: null,
  "=": null,
  "+=": null,
  "-=": null,
  "*=": null,
  "/=": null,
  "%=": null,
  "<<=": null,
  ">>=": null,
  ">>>=": null,
  "|=": null,
  "^=": null,
  "&=": null
};

exports.ENUM_OPERATOR_UNARY = {
  __proto__: null,
  "-": null,
  "+": null,
  "!": null,
  "~": null,
  "typeof": null,
  "void": null,
  "delete": null
};

exports.ENUM_OPERATOR_BINARY = {
  __proto__: null,
  "==": null,
  "!=": null,
  "===": null,
  "!==": null,
  "<": null,
  "<=": null,
  ">": null,
  ">=": null,
  "<<": null,
  ">>": null,
  ">>>": null,
  "+": null,
  "-": null,
  "*": null,
  "/": null,
  "%": null,
  "|": null,
  "^": null,
  "&": null,
  "in": null,
  "instanceof": null
};

exports.ENUM_OPERATOR_LOGICAL = {
  __proto__: null,
  "||": null,
  "&&": null,
  "??": null
};

exports.ENUM_TYPE_STATEMENT = {
  __proto__: null,
  EmptyStatement: null,
  DebuggerStatement: null,
  ThrowStatement: null,
  ReturnStatement: null,
  BreakStatement: null,
  ContinueStatement: null,
  LabelStatement: null,
  BlockStatement: null,
  IfStatement: null,
  WithStatement: null,
  TryStatment: null,
  WhileStatement: null,
  DoWhileStatement: null,
  ForStatement: null,
  ForInStatement: null,
  ForOfStatement: null,
  SwitchStatement: null,
  FunctionDeclaration: null,
  VariableDeclaration: null,
  ClassDeclaration: null
};

exports.ENUM_TYPE_PATTERN = {
  __proto__: null,
  MemberExpression: null,
  Identifier: null,
  RestElement: null,
  ObjectPattern: null,
  ArrayPattern: null,
  AssignmentPattern: null
};

exports.ENUM_TYPE_EXPRESSION = {
  __proto__: null,
  Identifier: null,
  Literal: null,
  MemberExpression: null,
  TemplateLiteral: null,
  TaggedTemplateLiteral: null,
  ArrowFunctionExpression: null,
  FunctionExpression: null,
  ClassExpression: null,
  MetaProperty: null,
  UpdateExpression: null,
  AssignmentExpression: null,
  ChainExpression: null,
  ConditionalExpression: null,
  LogicalExpression: null,
  SequenceExpression: null,
  UnaryExpression: null,
  BinaryExpression: null,
  CallExpression: null,
  NewExpression: null,
  ArrayExpression: null,
  ObjectExpression: null
};

// exports.ENUM_TYPE_MODULABLE_STATEMENT = global_Object_assign({
//   __proto__: null,
//   ImportDeclaration: null,
//   ExportAllDeclaration: null,
//   ExportNamedDeclaration: null,
//   ExportDefaultDeclaration: null
// }, exports.ENUM_TYPE_STATEMENT);
//
// exports.ENUM_TYPE_ASSIGNMENT_LEFT = global_Object_assign({
//   __proto__: null
// }, exports.ENUM_TYPE_EXPRESSION, exports.ENUM_TYPE_PATTERN);
//
// exports.ENUM_TYPE_SUPERABLE_EXPRESSION = global_Object_assign({
//   __proto__: null,
//   Super: null
// }, exports.ENUM_TYPE_EXPRESSION);
//
// exports.ENUM_TYPE_SPREADABLE_EXPRESSSION = global_Object_assign({
//   __proto__: null,
//   SpreadElement: null
// }, exports.ENUM_TYPE_EXPRESSION);
//
// exports.ENUM_TYPE_IDENTIFIER = {
//   __proto__: null,
//   Identifier: null
// };
//
// exports.ENUM_TYPE_LITERAL = {
//   __proto__: null,
//   Literal: null
// };
//
// exports.ENUM_KEY = {
//   __proto__: null,
//   Identifier: null,
//   Literal: null
// };
