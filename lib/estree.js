"use strict";

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
    has_use_strict(nodes, index + 1)));

exports.has_loop_body = (node) => (
  node.type === "LabeledStatement" ?
  has_loop_body(node.body) :
  (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"));

exports.ENUM_VARIABLE_KIND = [
  "var",
  "let",
  "const"];

exports.ENUM_OPERATOR_UPDATE = [
  "++",
  "--"];

exports.ENUM_OPERATOR_ASSIGNMENT = [
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

exports.ENUM_OPERATOR_UNARY = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"];

exports.ENUM_OPERATOR_BINARY = [
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

exports.ENUM_OPERATOR_LOGICAL = [
  "||",
  "&&",
  "??"];

exports.ENUM_TYPE_STATEMENT = [
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
  "FunctionDeclaration",
  "VariableDeclaration",
  "ClassDeclaration"];

exports.ENUM_TYPE_PATTERN = [
  "MemberExpression",
  "Identifier",
  "RestElement",
  "ObjectPattern",
  "ArrayPattern",
  "AssignmentPattern"];

exports.ENUM_TYPE_EXPRESSION = [
  "Identifier",
  "Literal",
  "MemberExpression",
  "TemplateLiteral",
  "TaggedTemplateLiteral",
  "ArrowFunctionExpression",
  "FunctionExpression",
  "ClassExpression",
  "MetaProperty",
  "UpdateExpression",
  "AssignmentExpression",
  "ChainExpression",
  "ConditionalExpression",
  "LogicalExpression",
  "SequenceExpression",
  "UnaryExpression",
  "BinaryExpression",
  "CallExpression",
  "NewExpression",
  "ArrayExpression",
  "ObjectExpression"];
