"use strict";

///////////
// Raise //
///////////

const raise_marker_strict = Token.raise(
  {
    [Token.KIND_MARKER_WITH]: `With statement is forbidden in strict mode`,
    [Token.KIND_MARKER_DISCARD]: `Deleting an identifier is forbidden in strict mode`,
    [Token.KIND_MARKER_PATTERN_EVAL]: `'eval' as a pattern is forbidden in strict mode`,
    [Token.KIND_MARKER_PATTERN_ARGUMENTS]: `'arguments' as a pattern is forbidden in strict mode`,
    [Token.KIND_MARKER_PARAM_DUPLICATE]: `Duplicate parameters is forbidden in strict mode`});

const raise_variable_unique = Token.raise(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: (data) => `Global non-duplicable variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_LET]: (data) => `Let variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_CONST]: (data) => `Const variable must not be duplicated: '${data}'`,
    [Token.KIND_VARIABLE_CLASS]: (data) => `Class variable must not be duplicated: '${data}'`});

const raise_variable_duplicate = (token, index, tokens) => (
  (
    test_variable_unique(token) &&
    (
      ArrayLite.filter(
        tokens,
        Token.test(
          {
            __proto__: null,
            [Token.KIND_VARIABLE_VOID]: null,
            [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: null,
            [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: null,
            [Token.KIND_VARIABLE_PARAM]: null,
            [Token.KIND_VARIABLE_VAR]: null,
            [Token.KIND_VARIABLE_FUNCTION]: null,
            [Token.KIND_VARIABLE_LET]: null,
            [Token.KIND_VARIABLE_CONST]: null,
            [Token.KIND_VARIABLE_CLASS]: null},
          Token.to_variable(token).name)).length >
      1)) ?
  raise_variable_unique(token) :
  token);

const raise_marker_module = Token.raise(
  {
    __proto__: null,
    [Token.KIND_MARKER_IMPORT]: `Import declaration must be at the top-level of a module`,
    [Token.KIND_MARKER_EXPORT]: `Export declaration must be at the top-level of a module`
    [Token.KIND_MARKER_IMPORT_META]: `Meta property 'import.meta' must be in a module`});

const raise_garbage = Token.raise(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: (data) => `Unbound break label: ${print_label(data)}`,
    [Token.KIND_LABEL_CONTINUE]: (data) => `Unbound continue label: ${print_label(data)}`,
    [Token.KIND_MARKER_SUPER_CALL]: `Call to Super must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `Property access to Super must be directly in a method or a constructor`,
    [Token.KIND_MARKER_AWAIT]: `AwaitExpression must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_YIELD]: `YieldExpression must be directly in a generator closure`});
    // [Token.KIND_MARKER_RETURN]: `ReturnStatement must be (directly) in a closure`
    // [Token.KIND_MARKER_IMPORT_META]: `MetaProperty 'import.meta' must be in a module`,
    // [Token.KIND_MARKER_IMPORT]: `ImportDeclaration must be at the top-level of a module`;
    // [Token.KIND_MARKER_EXPORT]: `ExportDeclaration must be at the top-level of a module`;
    // [Token.KIND_MARKER_NEW_TARGET]: "meta-new-target",
    // [Token.KIND_MARKER_EVAL]: "eval";
    // [Token.KIND_MARKER_PATTERN_MEMBER]: "pattern-member";
    // [Token.KIND_MARKER_WITH]: "with";
    // [Token.KIND_MARKER_PATTERN_EVAL]: "pattern-eval";
    // [Token.KIND_MARKER_PATTERN_ARGUMENTS]: "pattern-arguments";
    // [Token.KIND_MARKER_DISCARD]: `UnaryExpresion which delete an identifier are forbidden in strict mode`;
    // [Token.KIND_MARKER_PARAM_DUPLICATE]: `param-duplicate`;

    // [Token.KIND_MARKER_RETURN]: `Return statement must be inside a closure`,
    // [Token.KIND_MARKER_SUPER_CALL]: ``,
    // [Token.KIND_MARKER_SUPER_MEMBER]: ``,
    // [Token.KIND_MARKER_IMPORT_META]: ``,
    // [Token.KIND_MARKER_IMPORT]: ``,
    // [Token.KIND_MARLER_EXPORT]: ``,
    // [Token.KIND_MARKER]
    // [Token.KIND_MARKER_YIELD]: `Yield expression must be inside a generator closure`,
    // [Token.KIND_MARKER_AWAIT]: `Await expression must be inside an asynchronous closure`,
    // [Token.KIND_MARKER_AWAIT_FOR_OF]: `Await for-of statement must be inside an asynchronous closure`});

//////////
// Test //
//////////

const test_variable = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_VOID]: null,
    [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: null,
    [Token.KIND_VARIABLE_GLOBAL_DUPLICABLE]: null,
    [Token.KIND_VARIABLE_PARAM]: null,
    [Token.KIND_VARIABLE_VAR]: null,
    [Token.KIND_VARIABLE_FUNCTION]: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null});

const test_variable_unique = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_GLOBAL_UNIQUE]: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Token.KIND_VARIABLE_CLASS]: null});

const test_variable_block = Token.test(
  {
    __proto__: null,
    [Token.KIND_VARIABLE_LET]: null,
    [Token.KIND_VARIABLE_CONST]: null,
    [Tokne.KIND_VARIABLE_CLASS]: null});

const test_marker_strict = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_WITH]: null,
    [Token.KIND_MARKER_DISCARD]: null,
    [Token.KIND_MARKER_PATTERN_EVAL]: null,
    [Token.KIND_MARKER_PATTERN_ARGUMENTS]: null,
    [Token.KIND_MARKER_PARAM_DUPLICATE]: null});

const test_label = Token.test(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: null,
    [Token.KIND_LABEL_CONTINUE]: null});

const test_label_empty = Token.test(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: null,
    [Token.KIND_LABEL_CONTINUE]: null},
  null);

const test_module = Token.test(
  {
    __proto__: null,
    [Token.KIND_MARKER_IMPORT]: `Import declaration must be at the top-level of a module`,
    [Token.KIND_MARKER_EXPORT]: `Export declaration must be at the top-level of a module`
    [Token.KIND_MARKER_IMPORT_META]: `Meta property 'import.meta' must be in a module`});

///////////////
// Transform //
///////////////

const transform_variable_void = {
  __proto__: null,
  ["var"]: Token.transform(Token.KIND_VARIABLE_VOID, Token.KIND_VARIABLE_VAR),
  ["function"]: Token.transform(Token.KIND_VARIABLE_VOID, Token.KIND_VARIABLE_FUNCTION),
  ["let"]: Token.transform(Token.KIND_VARIABLE_VOID, Token.KIND_VARIABLE_LET),
  ["const"]: Token.transform(Token.KIND_VARIABLE_VOID, Token.KIND_VARIABLE_CONST),
  ["class"]: Token.transform(Token.KIND_VARIABLE_VOID, Token.KIND_VARIABLE_CLASS),};

/////////////
// Capture //
/////////////

const capture = (tokens, test, node) => (
  node[KEY_CAPTURE] = ArrayLite.map(
    ArrayLite.filter(tokens, test),
    Token.to_variable),
  ArrayLite.filterOut(tokens, test));

////////////
// Helper //
////////////

const helper_for = (node) => (
  (
    node.type === "ForOfStatment" ?
    Assert.typeof(node, "await", "boolean") :
    null),
  ArrayLite.concat(
    visit(
      node.left,
      null,
      "VariableDeclaration",
      Estree.ENUM_TYPE_EXPRESSION,
      Estree.ENUM_TYPE_PATTERN),
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
    Token.mark(
      node.type === "ForOfStatment",
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
        ArrayLite.every(node.declarations, (node) => node.init === null)),
      `${node.type}.left must not be a VariableDeclaration with initializers`)));

const helper_function = (node, context, _tokens) => (
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
    capture(
      visit(
        node.body,
        ArrayLite.flatMap(
          node.params,
          (node) => visit(
            node,
            "pattern",
            Estree.ENUM_TYPE_PATTERN)),
        "BlockStatement"),
      test_variable_void,
      node),
    check(
      node.type === "FunctionExpression" || node.id !== null || context === "anonymous",
      `FunctionDeclaration.id must not be null when not inside an anonymous declaration`),
    (
      ArrayLite.every(node.params, (node) => node.type === "Identifier") ?
      guard(
        !ArrayLite.every(node[KEY_CAPTURE], unique),
        Token.KIND_MARKER_PARAM_DUPLICATE,
        null) :
      check(
        !ArrayLite.every(node[KEY_CAPTURE], unique),
        `${node.type} with complex parameter list must not have duplicate parameters`))),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
  _tokens = (
    has_use_strict(node.body.body, 0),
    ArrayLite.map(_tokens, raise_strict) :
    _tokens),
  _tokens = (
    node.generator ?
    ArrayLite.filterOut(_tokens, test_marker_yield) :
    ArrayLite.map(_tokens, raise_marker_yield)),
  _tokens = (
    node.async ?
    ArrayLite.filterOut(_tokens, test_marker_await) :
    ArrayLite.map(_tokens, raise_marker_await)),
  _tokens = (
    (
      context === "method" ||
      context === "constructor" ||
      context === "derived-constructor") ?
    ArrayLite.filterOut(_tokens, test_marker_super_member) :
    ArrayLite.map(_tokens, raise_marker_super_member)),
  _tokens = (
    context === "derived-constructor" ?
    ArrayLite.filterOut(_tokens, test_marker_super_call) :
    ArrayLite.map(_tokens, raise_marker_super_call)),
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
      noe.superClass === null ? null : "derived",
      "ClassBody"),
    check(
      (
        node.type !== "ClassDeclaration" ||
        node.id !== null ||
        context === "anonymous"),
      `ClassDeclaration must either be named or be in an anonymous context`)),
  raise_strict);

///////////////
// Top-Level //
///////////////

exports.module = (node, options) => (
  options = global_Object_assign(
    "global-frame-unique": [],
    "global-frame-duplicable": [],
    options),
  _tokens = visit(node, null, "Program"),
  _tokens = ArrayLite.filterOut(_tokens, test_marker_module),
  _tokens = ArrayLite.map(_tokens, raise_marker_strict),
  _tokens = ArrayLile.raise(_tokens, raise_marker_super_call),
  _tokens = ArrayLile.raise(_tokens, raise_marker_super_member),
  _tokens = ArrayLite.raise(_tokens, raise_marker_new_target),
  _tokens = ArrayLite.raise(_tokens, raise_marker_await),
  _tokens = ArrayLite.raise(_tokens, raise_marker_yield),
  _tokens = ArrayLite.raise(_tokens, raise_label),
  _tokens = ArrayLite.raise(_tokens, raise_variable_duplicate),
  _tokens = capture(_tokens, test_variable, node),
  _tokens = release(_tokens, null)
  node[KEY_RELEASE] = [],
  ArrayLite.map(_tokens, Token.to_error));

exports.script = (node, options) => (
  options = global_Object_assign(
    "global-frame": [],
    options),
  _tokens = ArrayLite.concat(
    visit(node, null, "Program"),
    ArrayLite.map(options["global-frame"], Token.from_global_variable)),
  _tokens = ArrayLite.raise(_tokens, raise_marker_module),
  _tokens = (
    Estree.has_use_strict(node.body, 0) ?
    ArrayLite.map(_tokens, raise_marker_strict) :
    ArrayLite.filterOut(_tokens, test_marker_strict)),
  _tokens = ArrayLile.raise(_tokens, raise_marker_super_call),
  _tokens = ArrayLile.raise(_tokens, raise_marker_super_member),
  _tokens = ArrayLite.raise(_tokens, raise_marker_new_target),
  _tokens = ArrayLite.raise(_tokens, raise_marker_await),
  _tokens = ArrayLite.raise(_tokens, raise_marker_yield),
  _tokens = ArrayLite.raise(_tokens, raise_label),
  _tokens = ArrayLite.raise(_tokens, raise_variable_duplicate),
  _tokens[KEY_CAPTURE] = [];
  _tokens = capture
  _tokens = capture(_tokens, test_variable, node),
  node[KEY_RELEASE] = [],
  ArrayLite.map(_tokens, Token.to_error));

exports.module

  Token.raise(
  {
    __proto__: null,
    [Token.KIND_LABEL_BREAK]: (data) => `Unbound break label: ${print_label(data)}`,
    [Token.KIND_LABEL_CONTINUE]: (data) => `Unbound continue label: ${print_label(data)}`,
    [Token.KIND_MARKER_SUPER_CALL]: `Call to Super must be directly in a derived constructor`,
    [Token.KIND_MARKER_SUPER_MEMBER]: `Property access to Super must be directly in a method or a constructor`,
    [Token.KIND_MARKER_AWAIT]: `AwaitExpression must be directly in a asynchronous closure`,
    [Token.KIND_MARKER_YIELD]: `YieldExpression must be directly in a generator closure`});
    // [Token.KIND_MARKER_RETURN]: `ReturnStatement must be (directly) in a closure`
    // [Token.KIND_MARKER_IMPORT_META]: `MetaProperty 'import.meta' must be in a module`,
    // [Token.KIND_MARKER_IMPORT]: `ImportDeclaration must be at the top-level of a module`;
    // [Token.KIND_MARKER_EXPORT]: `ExportDeclaration must be at the top-level of a module`;
    // [Token.KIND_MARKER_NEW_TARGET]: "meta-new-target",
    // [Token.KIND_MARKER_EVAL]: "eval";
    // [Token.KIND_MARKER_PATTERN_MEMBER]: "pattern-member";
    // [Token.KIND_MARKER_WITH]: "with";
    // [Token.KIND_MARKER_PATTERN_EVAL]: "pattern-eval";
    // [Token.KIND_MARKER_PATTERN_ARGUMENTS]: "pattern-arguments";
    // [Token.KIND_MARKER_DISCARD]: `UnaryExpresion which delete an identifier are forbidden in strict mode`;
    // [Token.KIND_MARKER_PARAM_DUPLICATE]: `param-duplicate`;

    // [Token.KIND_MARKER_RETURN]: `Return statement must be inside a closure`,
    // [Token.KIND_MARKER_SUPER_CALL]: ``,
    // [Token.KIND_MARKER_SUPER_MEMBER]: ``,
    // [Token.KIND_MARKER_IMPORT_META]: ``,
    // [Token.KIND_MARKER_IMPORT]: ``,
    // [Token.KIND_MARLER_EXPORT]: ``,
    // [Token.KIND_MARKER]
    // [Token.KIND_MARKER_YIELD]: `Yield expression must be inside a generator closure`,
    // [Token.KIND_MARKER_AWAIT]: `Await expression must be inside an asynchronous closure`,
    // [Token.KIND_MARKER_AWAIT_FOR_OF]: `Await for-of statement must be inside an asynchronous closure`});


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
    // setup //
    Assert.array(node, "body"),
    _strict = (
      context.strict ||
      Estree.has_use_strict(node.body, 0)),
    _tokens = ArrayLite.flatMap(
      node.body,
      (node) => visit(
        node,
        null,
        "ImportDeclaration",
        "ExportDefaultDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
        Estree.ENUM_TYPE_STATEMENT)),
    // Context-Independent //
    node[KEY_EVAL] = ArrayLite.includes(
      Token.test(Token.KIND_MARKER_EVAL),
      _tokens),
    _tokens = ArrayLite.filterOut(
      Token.test(Token.KIND_MARKER_EVAL),
      _tokens),
    _tokens = ArrayLite.map(_tokens, raise_marker_garbage),
    // Strict //
    _tokens = (
      _strict ?
      ArrayLite.map(_tokens, raise_strict) :
      ArrayLite.filterOut(_tokens, test_strict)),
    // Hoisting //
    _tokens = ArrayLite.map(_tokens, raise_duplicate),
    _tokens = hoist(
      _tokens,
      strict ? context.capture_strict : context.capture_normal,
      node),
    node[KEY_RELEASE] = ArrayLite.map(
      ArrayLite.filter(_tokens, test_variable),
      Token.to_variable),
    _tokens = ArrayLite.filterOut(_tokens, test_variable),
    // Module //
    _tokens = (
      context.module ?
      ArrayLite.filterOut(_tokens, test_module) :
      ArrayLite.map(_tokens, raise_module)),
    // new.target //
    _tokens = (
      node.new_target ?
      ArrayLite.filterOut(
        _tokens,
        Token.test(Token.KIND_MARKER_NEW_TARGET)) :
      ArrayLite.map(
        _tokens,
        Token.raise(Token.KIND_MARKER_NEW_TARGET, `Meta property 'new.target' must be (possibly deep) inside a FunctionExpression`))),
    // super-call //
    _tokens = (
      node.super_call ?
      ArrayLite.filterOut(
        _tokens,
        Token.test(Token.KIND_MARKER_SUPER_CALL)) :
      ArrayLite.map(
        _tokens,
        Token.raise(Token.KIND_MARKER_SUPER_CALL, `Call to 'super' must be directly in a derived constructor`))),
    // super-member //
    _tokens = (
      node.super_member ?
      ArrayLite.filterOut(
        _tokens,
        Token.test(Token.KIND_MARKER_SUPER_MEMBE)) :
      ArrayLite.map(
        _tokens,
        Token.raise(Token.KIND_MARKER_SUPER_MEMBE, `Property access to 'super' must be directly in a derived constructor`))),
    // return //
    _tokens),
  ////////////
  // Module //
  ////////////
  ImportSpecifier: = (node) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.imported, null, "Identifier")),
  ImportDefaultSpecifier: (node) => visit(node.local, null, "Identifier"),
  ImportNamespaceSpecifier: (node) => visit(node.local, null, "Identifier"),
  ImportDeclaration: (node) => (
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
      Token.check(
        typeof node.source.value === "string",
        `ImportDeclaration.source must be a string literal`))),
  ExportSpecifier: (node) => ArrayLite.concat(
    visit(node.local, null, "Identifier"),
    visit(node.exported, null, "Identifier")),
  ExportNamedDeclaration: (node) => (
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
      Token.check(
        node.source === null || typeof node.source.value === "string",
        `ExportNamedDeclaration.source must either be null or a string literal`),
      Token.check(
        node.declaration !== null && node.source !== null,
        `ExportNamedDeclaration.declaration and ExportNamedDeclaration.source cannot be both non-null`))),
  ExportDefaultDeclaration: (node) => visit(
    node.declaration,
    "anonymous",
    "FunctionDeclaration",
    "ClassDeclaration",
    Estree.ENUM_TYPE_EXPRESSION),
  ExportAllDeclaration: (node) => ArrayLite.concat(
    visit(node.source, null, "Literal"),
    Token.check(
      typeof node.source.value === "string",
      `ExportAllDeclaration.source must be a string Literal`)),
  /////////////
  // Pattern //
  /////////////
  // context = "key" || "label" || "expression" || "pattern"
  Identifier: (node, context) => (
    Assert.typeof(node.name, "string"),
    ArrayLite.concat(
      Token.check(
        global_Reflect_apply(
          global_RegExp_prototype_test,
          /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
          [node.name]),
      `Identifier.name is invalid, got: ${global_JSON_stringify(node.name)}`),
      // Nice-to-have: Token.check for keywords based on strict mode and label
      Token.guard(
        context === "pattern" ?
        Token.KIND_VARIABLE_VOID,
        node.name),
      Token.guard(
        context === "pattern" && node.name === "eval" ?
        Token.KIND_MARKER_PATTERN_EVAL),
      Token.guard(
        context === "pattern" && node.name === "arguments" ?
        Token.KIND_MARKER_PATTERN_ARGUMENTS))),
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
        node.optional && context !== "chain",
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
  RestElement: (node) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_PATTERN),
    Token.check(
      node.argument.type !== "RestElement",
      `RestElement.argument cannot be a RestElement itself`)),
  AssignmentPattern: (node) => ArrayLite.concat(
    visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN),
    visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.check(
      node.left.type !== "RestElement",
      `AssignmentPattern.left cannot be a RestElement`)),
  ObjectPattern: (node) => (
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
  ArrayPattern: (node) => (
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
    Assert.enum(node, "kind", Estree.ENUM_PROPERTY_KIND),
    Assert.typeof(node, "method", "boolean"),
    Assert.typeof(node "computed", "boolean"),
    Assert.typeof(node, "shorthand", "boolean"),
    ArrayLite.concat(
      visit(
        node.key,
        node.computed ? null : "key",
        Estree.ENUM_TYPE_EXPRESSION),
      (
        context === "Pattern" ?
        visit(
          node.value,
          "pattern",
          Estree.ENUM_TYPE_PATTERN) :
        ArrayLite.filter(
          visit(
            node.value,
            null,
            Estree.ENUM_TYPE_EXPRESSION),
          (
            node.method ?
            Token.test(Token.KIND_MARKER_SUPER_MEMBER) :
            identity))),
      Token.check(
        (
          node.computed ||
          node.key.type === "Identifier" ||
          (node.key.type === "Literal" && typeof node.key.value === "string")),
        `The key of a non-computed property must either be an identifier or a string literal`),
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
  VariableDeclarator: (node) => ArrayLite.concat(
    ArrayLite.map(
      visit(node.id, "pattern", Estree.ENUM_TYPE_PATTERN),
      Token.raise(
        Token.KIND_MEMBER_PATTERN,
        `MemberExpression cannot be used as a pattern in a declaration context`)),
    (
      node.init === null ?
      [] :
      visit(node.init, null, Estree.ENUM_TYPE_EXPRESSION)),
    Token.check(
      node.id.type !== "AssignmentPattern",
      `VariableDeclarator.id cannot be an AssignmentPattern`)),
  VariableDeclaration: (node) => (
    Assert.enum(node, "kind", Estree.ENUM_KIND_VARIABLE),
    Assert.array(node, "declarations"),
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(
          node.declarations,
          (node) = visit(
            node,
            null,
            "VariableDeclarator")),
        transform_variable_void[node.kind]),
      Token.check(
        node.declarations.length > 0,
        `VariableDeclaration.declarations must not be an empty array`))),
  FunctionDeclaration: helper_closure,
  ClassDeclaration: helper_closure,
  //////////////////////
  // Atomic Statement //
  //////////////////////
  EmptyStatement: (node) => [],
  DebuggerStatement: (node) => [],
  ThrowStatement: (node) => visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
  ExpressionStatement: (node) => visit(node.expressionm, null, Estree.ENUM_TYPE_EXPRESSION),
  ReturnStatement: (node) => (
    node.argument === null ?
    [] :
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION)),
  BreakStatement: (node) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    Token.guard(
      true,
      Token.KIND_LABEL_BREAK,
      node.label === null ? node.label.name : null)),
  ContinueStatement: (node) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    Token.guard(
      true,
      Token.KIND_LABEL_CONTINUE,
      node.label === null ? node.label.name : null)),
  /////////////////////////
  // Commpound Statement //
  /////////////////////////
  LabeledStatement: (node) => ArrayLite.concat(
    visit(node.label, "label", "Identifier"),
    ArrayLite.filterOut(
      ArrayLite.map(
        visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
        (
          Estree.has_loop_body(node) ?
          identity :
          Token.raise(Token.KIND_LABEL_CONTINUE, node.label.name))),
      test_label)),
  BlockStatement: (node, context, _tokens) => (
    Assert.array(node, "body"),
    _tokens = ArrayLite.map(
      ArrayLite.concat(
        context || [],
        ArrayLite.flatMap(
          node.body,
          (node) => visit(
            node,
            null,
            Estree.ENUM_TYPE_STATEMENT))),
      raise_duplicate),
    node[KEY_CAPTURE] = ArrayLite.map(
      ArrayLite.filter(_tokens, test_variable_block),
      Token.to_variable),
    ArrayLite.filterOut(_tokens, test_variable_block)),
  IfStatement: (node) => ArrayLite.concat(
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
  WithStatement: (node) => ArrayLite.concat(
    visit(node.object, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.body, null, Estree.ENUM_TYPE_STATEMENT),
    Token.check(
      (
        node.body.type !== "ClassDeclaration" &&
        (
          node.body.type !== "VariableDeclaration" ||
          node.body.kind === "var")),
      `WithStatement.body must not be a let/const/class declaration`)),
  CatchClause: (node, _tokens) => capture(
    ArrayLite.map(
      visit(
        node
        (
          node.param === null ?
          [] :
          visit(node.param, "pattern", null)),
        "BlockStatement"),
      raise_variable_void_duplicate),
    test_variable_void,
    node),
  TryStatment: (node) => ArrayLite.concat(
    visit(node.block, null, "BlockStatement"),
    (
      node.handler === null ?
      [] :
      visit(node.handler, null, "CatchClause")),
    (
      node.finalizer === null ?
      [] :
      visit(node.finalizer, null, "BlockStatement"))),
  WhileStatement: (node) => ArrayLite.concat(
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
  DoWhileStatement: (node) => ArrayLite.concat(
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
  ForStatement: (node) => ArrayLite.concat(
    (
      node.init === null ?
      [] :
      capture(
        visit(node.init, null, "VariableDeclaration", Estree.ENUM_TYPE_EXPRESSION),
        test_variable_block,
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
  SwitchCase: (node) => (
    Assert.array(node, "consequent"),
    ArrayLite.concat(
      visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(node.consequent[index], null, Estree.ENUM_TYPE_STATEMENT)))),
  SwitchStatement: (node) => (
    Assert.array(node, "cases"),
    ArrayLite.concat(
      visit(node.discriminant, null, Estree.ENUM_TYPE_EXPRESSION),
      capture(
        ArrayLite.flatMap(
          node.cases,
          (node) => visit(node, null, "SwitchCase")),
        test_variable_block,
        node),
      Token.check(
        ArrayLite.filter(node.cases, (node) => node.test === null).length > 1,
        `SwitchStatement must not have more than one default case`))),
  ////////////////////////
  // Expression Special //
  ////////////////////////
  YieldExpression: (node) => (
    Assert.typeof(node, "delegate", "boolean"),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.mark(true, Token.KIND_MARKER_YIELD, null))),
  AwaitExpression: (node) => ArrayLite.concat(
    visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
    Token.mark(true, Token.KIND_MARKER_AWAIT, null)),
  ///////////////////////////
  // Expression >> Literal //
  ///////////////////////////
  Literal: (node, context) => (
    (
      "regex" in node ?
      Assert.object(node, "regex", {__proto__: null, pattern:"string", flags:"string"}) :
      null),
    (
      "bigint" in node ?
      Assert.typeof(node, "bigint", "string") :
      null),
    Assert.json(node, "value"),
    ArrayLite.concat(
      Token.check(
        (
          !("bigint" in node) ||
          node.bigint === "0n" ||
          global_Reflect_apply(
            global_RegExp_prototype_test,
            /^[1-9][0-9]+n$/,
            [node.bigint])),
        `Literal.bigint is invalid`),
      Token.check(
        !("regex" in node) || !("bigint" in node),
        `Literal.regex and Literal.bigint cannot be both present`))),
  TemplateElement: (node) => (
    Assert.typeof(node, "tail", "boolean"),
    Assert.object(node, "value", {cooked:"string", raw:"string"}),
    []),
  TemplateLiteral: (node) => (
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
        node.quasis.length === node.expression.length + 1,
        `TemplateLiteral.quasis must have exacly one additional element over TemplateLiteral.expressions`))),
  TaggedTemplateLiteral: (node) => ArrayLite.concat(
    visit(node.tag, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.quasi, null, "TemplateLiteral")),
  ArrowFunctionExpression: (node, context, _tokens) => (
    Assert.typeof(node, "async", "boolean"),
    Assert.typeof(node, "expression", "boolean"),
    Assert.array(node, "params"),
    // Only instance where we need to lookup node before visiting
    _tokens = ArrayLite.concat(
      ArrayLite.filterOut(
        capture(
          (
            (
              node.body !== null &&
              node.body !== void 0 &&
              node.body.type === "BlockStatement") ?
            visit(
              node,
              ArrayLite.flatMap(
                node.params,
                (node) => visit(
                  node,
                  "pattern",
                  Estree.ENUM_TYPE_PATTERN)),
              "BlockStatement") :
            ArrayLite.concat(
              ArrayLite.flatMap(
                node.params,
                (node) => visit(
                  node,
                  "pattern",
                  Estree.ENUM_TYPE_PATTERN)),
              visit(
                node,
                null,
                Estree.ENUM_TYPE_EXPRESSION))),
          test_variable_void,
          node),
        node.async ? test_await : const_false),
      check(
        ArrayLite.every(node[KEY_CAPTURE], unique),
        `ArrowFunctionExpression must not have duplicate parameters`),
      check(
        node.expression === (node.body.type !== "BlockStatement"),
        `ArrowFunctionExpression.expression must indicate whether its body is an expression or a block statement`),
      check(
        (
          node.body.type !== "BlockStatement" ||
          !has_use_strict(node.body.body, 0) ||
          ArrayLite.every(node.params, (node) => node.type === "Identifier")),
        `ArrowFunctionExpression must not have a 'use-strict' directive when it does not have a simple parameter list`)),
    _tokens = (
      (
        node.body.type === "BlockStatement" &&
        Estree.has_use_strict(node.body.body, 0)) ?
      ArrayLite.map(_tokens, raise_marker_strict) :
      _tokens),
    _tokens = ArrayLite.filterOut(_tokens, test_marker_return),
    _tokens = ArrayLite.map(_tokens, raise_marker_yield),
    _tokens = (
      node.async ?
      ArrayLite.filterOut(_tokens, test_marker_await) :
      ArrayLite.map(_tokens, raise_marker_await)),
    _tokens = ArrayLite.map(_tokens, raise_marker_super_member),
    _tokens = ArrayLite.map(_tokens, raise_marker_super_call),
    _tokens),
  FunctionExpression: helper_function,
  ClassExpression: helper_class,
  ///////////
  // Class //
  ///////////
  ClassBody: (node, context) => (
    Assert.array(node.body),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.body,
        (node) => visit(
          node,
          context,
          "MethodDefinition")),
      Token.check(
        ArrayLite.filter(node.body, (node) => node.kind === "constructor").length > 1,
        `Class body cannot have more than one constructor`))),
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
      check(
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
  MetaProperty = (node) => ArrayLite.concat(
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
  UpdateExpression: (node) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UPDATE),
    ArrayLite.concat(
      visit(node.argument, "pattern", Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        (
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`))),
  AssignmentExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_ASSIGNMENT),
    ArrayLite.concat(
      visit(node.left, "pattern", Estree.ENUM_TYPE_PATTERN, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        (
          node.operator === "=" ||
          node.argument.type === "Identifier" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "CallExpression"),
        `When not performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, or a MemberExpression`),
      Token.check(
        (
          node.operator !== "=" ||
          node.argument.type === "Identifier" ||
          node.argument.type === "CallExpression" ||
          node.argument.type === "MemberExpression" ||
          node.argument.type === "ObjectPattern" ||
          node.argument.type === "ArrayPattern"),
        `When performing '=', AssignmentExpression.left must either be a CallExpression, an Identifier, a MemberExpression, an ObjectPattern, or an ArrayPattern`))),
  ///////////////////////////////
  // Expression >> ControlFlow //
  ///////////////////////////////
  ChainExpression: (node) => visit(node.expression, "chain", "MemberExpression", "CallExpression"),
  ConditionalExpression: (node) => ArrayLite.concat(
    visit(node.test, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.consequent, null, Estree.ENUM_TYPE_EXPRESSION),
    visit(node.alternate, null, Estree.ENUM_TYPE_EXPRESSION)),
  LogicalExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_LOGICAL),
    ArrayLite.concat(
      visit(node.left, null, Estree.ENUM_TYPE_EXPRESSION),
      visit(node.right, null, Estree.ENUM_TYPE_EXPRESSION))),
  SequenceExpression: (node) => (
    Assert.array(node, "expressions"),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.expressions,
        (node) => (
          node === null ?
          [] :
          visit(node.expressions[index], null, Estree.ENUM_TYPE_EXPRESSION))),
      Token.check(
        node.expressions.length > 0,
        `LogicalExpression.expressions must not be an empty array`))),
  UnaryExpression: (node) => (
    Assert.typeof(node, "prefix", "boolean"),
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UNARY),
    ArrayLite.concat(
      visit(node.argument, null, Estree.ENUM_TYPE_EXPRESSION),
      Token.check(
        node.prefix,
        `UpdateExpression.prefix must be true`),
      Token.guard(
        (node.operator === "delete" && node.argument.type === "Identifier"),
        Token.KIND_EXPRESSION_UNARY_DELETE_IDENTIFIER,
        null))),
  BinaryExpression: (node) => (
    Assert.enum(node, "operator", Estree.ENUM_OPERATOR_BINARAY),
    ArrayLite.concat(
      visit(node.left, null, ENUM_TYPE_EXPRESSION),
      visit(node.right, null, ENUM_TYPE_EXPRESSION))),
  CallExpression: (node, context) => (
    Assert.array(node, "arguments"),
    Assert.typeof(node, "optional", "boolean"),
    ArrayLite.concat(
      visit(
        node.callee,
        context === "chain" ? "chain",
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
        Token.KIND_CALL_EVAL,
        null),
      Token.guard(
        node.callee.type === "Super",
        Token.KIND_CALL_SUPER,
        null))),
  NewExpression: (node) => (
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
  ArrayExpression: (node) => (
    Assert.array(node.elements),
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
  ObjectExpression: (node) => (
    Assert.array(node.properties),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(node, null, "SpreadElement", "Property")),
      Token.check(
        ArrayLite.filter(node.propertiers, Estree.is_proto_property).length > 1,
        `Duplicate '__proto__' fields are not allowed in object literals`)))};
