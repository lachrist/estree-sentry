"use strict";

exports.is_pattern_identifier = (node) => node.type === "Identifier";

exports.is_method_constructor = (node) => node.kind === "constructor";

exports.is_case_default = (node) => node.test === null;

exports.is_node_export_default_declaration = (node) => node.type === "ExportDefaultDeclaration";

exports.is_declaration_non_initialized = (node) => node.init === null;

exports.is_property_proto = (node) => (
  node.type !== "SpreadElement" &&
  node.kind === "init" &&
  !node.shorthand &&
  !node.computed &&
  !node.method &&
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

//////////
// Kind //
//////////

exports.ENUM_KIND_VARIABLE = {
  __proto__: null,
  "var": null,
  "let": null,
  "const": null};

exports.ENUM_KIND_PROPERTY = {
  __proto__: null,
  "init": null,
  "get": null,
  "set": null}

exports.ENUM_KIND_METHOD = {
  __proto__: null,
  "constructor": null,
  "method": null,
  "get": null,
  "set": null};

//////////////
// Operator //
//////////////

exports.ENUM_OPERATOR_UPDATE = {
  __proto__: null,
  "++": null,
  "--": null};

exports.ENUM_OPERATOR_ASSIGNMENT = {
  __proto__: null,
  "=": null,
  "+=": null,
  "-=": null,
  "*=": null,
  "/=": null,
  "%=": null,
  "**=": null,
  "<<=": null,
  ">>=": null,
  ">>>=": null,
  "|=": null,
  "^=": null,
  "&=": null,
  "&&=": null,
  "||=": null,
  "??=": null};

exports.ENUM_OPERATOR_UNARY = {
  __proto__: null,
  "-": null,
  "+": null,
  "!": null,
  "~": null,
  "typeof": null,
  "void": null,
  "delete": null};

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
  "**": null,
  "|": null,
  "^": null,
  "&": null,
  "in": null,
  "instanceof": null};

exports.ENUM_OPERATOR_LOGICAL = {
  __proto__: null,
  "||": null,
  "&&": null,
  "??": null};

//////////
// Type //
//////////

exports.ENUM_TYPE_STATEMENT = {
  __proto__: null,
  EmptyStatement: null,
  ExpressionStatement: null,
  DebuggerStatement: null,
  ThrowStatement: null,
  ReturnStatement: null,
  BreakStatement: null,
  ContinueStatement: null,
  LabeledStatement: null,
  BlockStatement: null,
  IfStatement: null,
  WithStatement: null,
  TryStatement: null,
  WhileStatement: null,
  DoWhileStatement: null,
  ForStatement: null,
  ForInStatement: null,
  ForOfStatement: null,
  SwitchStatement: null,
  FunctionDeclaration: null,
  VariableDeclaration: null,
  ClassDeclaration: null};

exports.ENUM_TYPE_PATTERN = {
  __proto__: null,
  MemberExpression: null,
  Identifier: null,
  RestElement: null,
  ObjectPattern: null,
  ArrayPattern: null,
  AssignmentPattern: null};

exports.ENUM_TYPE_EXPRESSION = {
  __proto__: null,
  Identifier: null,
  ImportExpression: null,
  AwaitExpression: null,
  YieldExpression: null,
  Literal: null,
  ThisExpression: null,
  MemberExpression: null,
  TemplateLiteral: null,
  TaggedTemplateExpression: null,
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
  ObjectExpression: null};
