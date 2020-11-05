"use strict";

const global_Array_isArray = global.Array.isArray;
const global_Error_prototype = global.Error.prototype;
const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");

//////////////
// Constant //
//////////////

const EMPTY = [];

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



const ENUM_KIND_VARIABLE_UNIQUE = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM_UNIQUE]: null,
  [Token.KIND_VARIABLE_LET]: null,
  [Token.KIND_VARIABLE_CONST]: null,
  [Token.KIND_VARIABLE_CLASS]: null
};

const ENUM_KIND_VARIABLE_DUPLICABLE = {
  __proto__: null,
  [Token.KIND_VARIABLE_PARAM_DUPLICABLE]: null,
  [Token.KIND_VARIABLE_VAR]: null,
  [Token.KIND_VARIABLE_FUNCTION]: null
};

const ENUM_KIND_VARIABLE = {
  __proto__: null,
  [KIND_VARIABLE_VAR]: null,
  [KIND_VARIABLE_FUNCTION]: null,
  [KIND_VARIABLE_LET]: null,
  [KIND_VARIABLE_CONST]: null,
  [KIND_VARIABLE_CLASS]: null,
  [KIND_VARIABLE_PARAM_UNIQUE]: null,
  [KIND_VARIABLE_PARAM_DUPLICABLE]: null,
  [KIND_VARIABLE_VOID]: null
};

const ENUM_KIND_VARIABLE_BLOCK = {
  __proto__: null,
  [KIND_VARIABLE_LET]: null,
  [KIND_VARIABLE_CONST]: null,
  [KIND_VARIABLE_CLASS]: null
};

const ENUM_KIND_VARIABLE_CLOSURE = {
  __proto__: null,
  [KIND_VARIABLE_VAR]: null,
  [KIND_VARIABLE_FUNCTION]: null,
  [KIND_VARIABLE_CLASS]: null
};

// Label //
const KIND_LABEL_BREAK = "break";
const KIND_LABEL_CONTINUE = "continue";
const ENUM_KIND_LABEL = [
  KIND_LABEL_BREAK,
  KIND_LABEL_CONTINUE];

// Marker //
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
const ENUM_KIND_MARKER_STRICT = [
  KIND_MARKER_WITH,
  KIND_MARKER_DISCARD,
  KIND_MARKER_PATTERN_EVAL,
  KIND_MARKER_PATTERN_ARGUMENTS];

// Key //
const KEY_USE_STRICT = "__sentry_use_strict__";
const KEY_SIMPLE_PARAM_LIST = "__sentry_simple_param_list__";
const KEY_CAPTURE = "__sentry_hoisting__";
const KEY_EVAL_CALL = "__eval_call__";
const KEY_RELEASE "__sentry_hoisting_global__";

////////////////
// Convertion //
////////////////

const to_variable_object = {
  __proto__: null,
  [KIND_VARIABLE_VOID]: (data) => { throw new global_Error("Cannot convert unqualified variable") },
  [KIND_VARIABLE_PARAM_SIMPLE]: (data) => ({kind:"param", duplicable:false, name:data}),
  [KIND_VARIABLE_PARAM_COMPLEX]: (data) => ({kind:"param", duplicable:false, name:data}),
  [KIND_VARIABLE_UNIQUE]

  // [KIND_VARIABLE_PARAM_SIMPLE]: (data) => { throw new global_Error("Cannot convert simple parameter variable") },
  // [KIND_VARIABLE_PARAM_COMPLEX]: (data) => ({kind:"param", scope:null, name:data}),
  [KIND_VARIABLE_CLOSURE]: (data) => ({kind:null, scope:"closure", name:data}),
  [KIND_VARIABLE_CLOSURE_VAR]: (data) => ({kind:"var", scope:"closure", name:data}),
  [KIND_VARIABLE_CLOSURE_FUNCTION]: (data) => ({kind:"function", scope:"closure", name:data}),
  [KIND_VARIABLE_BLOCK]: (data) => ({kind:null, scope:"block", name:data}),
  [KIND_VARIABLE_BLOCK_LET]: (data) => ({kind:"let", scope:"block", name:data}),
  [KIND_VARIABLE_BLOCK_CONST]: (data) => ({kind:"const", scope:"block", name:data}),
  [KIND_VARIABLE_BLOCK_CLASS]: (data) => ({kind:"class", scope:"block", name:data})
};

const to_variable = (kind, data, loc) => to_variable_object[kind](data);

const from_variable_object = {
  __proto__: null,
  ["var"]: KIND_VARIABLE_CLOSURE_VAR,
  ["function"]: KIND_VARIABLE_CLOSURE_FUNCTION,
  ["let"]: KIND_VARIABLE_BLOCK_LET,
  ["const"]: KIND_VARIABLE_BLOCK_CONST,
  ["class"]: KIND_VARIABLE_BLOCK_CLASS
};

const from_variable = (tokens, {kind, scope, name}) => {
  if (kind in from_variable_object) {
    Token.push(tokens, from_variable_object[kind], name);
  } else if (scope === "block") {
    Token.push(tokens, KIND_VARIABLE_BLOCK, name);
  } else if (scope === "closure") {
    Token.push(tokens, KIND_VARIABLE_CLOSURE, name);
  } else {
    throw new global_Error("Invalid variable");
  }
};

const to_error = (kind, data, loc) => {message:data, loc:loc};

// //////////////
// // Template //
// //////////////
//
// const template_discriminant_split = {
//   __proto__: null,
//   [Token.KIND_VARIABLE_VOID]: (name) => { throw new global_Error("Cannot export void variable") },
//   [Token.KIND_VARIABLE_PARAM]: (name) => { throw new global_Error("Cannot export param variable") },
//   [Token.KIND_VARIABLE_CLOSURE]: (name) => ({kind:null, scope:"closure", name}),
//   [Token.KIND_VARIABLE_CLOSURE_VAR]: (name) => ({kind:"var", scope:"closure", name}),
//   [Token.KIND_VARIABLE_CLOSURE_FUNCTION]: (name) => ({kind:"function", scope:"closure", name}),
//   [Token.KIND_VARIABLE_BLOCK]: (name) => ({kind:null, scope:"block", name}),
//   [Token.KIND_VARIABLE_BLOCK_LET]: (name) => ({kind:"let", scope:"block", name}),
//   [Token.KIND_VARIABLE_BLOCK_CONST]: (name) => ({kind:"const", scope:"block", name}),
//   [Token.KIND_VARIABLE_BLOCK_CLASS]: (name) => ({kind:"class", scope:"block", name})};
//
// const template_discriminant_raise = {
//   __proto__: null,
//   // Variable //
//   [Token.KIND_VARIABLE_VOID]: (identifier) => `Unqualified variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_PARAM]: `Parameter variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_BLOCK]: `Block-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_LET]: `Block-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_CONST]: `Block-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_CLASS]: `Block-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_CLOSURE]: `Closure-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_VAR]: `Closure-scoped variable is not allowed in this context`,
//   [Token.KIND_VARIABLE_FUNCTION]: `Closure-scoped variable is not allowed in this context`,
//   // Label //
//   [Token.KIND_LABEL]
//   [Token.KIND_LABEL_BREAK]: (nullable_identifier) => `Unbound break label: ${label}`,
//   [Token.KIND_LABEL_CONTINUE]: (label) => `Unbound continue label: ${label}`,
//   // Marker //
//   [Token.KIND_EVAL_MARKER]: `Direct eval call in this context`,
//   [Token.KIND_MARKER_IMPORT]: `Import declaration must be at the top-level of a module`,
//   [Token.KIND_MARKER_EXPORT]: `Export declaration must be at the top-level of a module`,
//   [Token.KIND_MARKER_AWAIT]: `Await expression must be directly inside an asynchronous closure`,
//   [Token.KIND_MARKER_AWAIT_FOR_OF]: `Await for-of statement must be directly inside an asynchronous closure`,
//   [Token.KIND_MARKER_YIELD]: `Yield expression must be directly inside a generator closure`,
//   [Token.KIND_MARKER_NEW_TARGET]: `'new.target' must have a function or a constructor in its ancestor`,
//   [Token.KIND_MARKER_SUPER_CALL]: `Call to 'super' must be directly inside a derived constructor`,
//   [Token.KIND_MARKER_SUPER_MEMBER]: `Property access to 'super' must be directly inside a constructor or a method`,
//   [Token.KIND_MARKER_RETURN]: `Return statement must be inside a closure`,
//   [Token.KIND_MARKER_WITH]: `With statement is forbidden in strict mode`,
//   [Token.KIND_MARKER_DISCARD]: `Deleting a variable is forbidden in strict mode`,
//   [Token.KIND_MARKER_PATTERN_EVAL]: `'eval' pattern is forbidden in strict mode`,
//   [Token.KIND_MARKER_PATTERN_ARGUMENTS]: `'arguments' pattern is forbidden in strict mode`,
//   [Token.KIND_MARKER_PATTERN_MEMBER]: `Member pattern is not allowed in declaration context`};
//
// const make_duplicate_message = (data) => `Duplicate variable: '${data}'`;
//
// const template_wrap_variable = {
//   __proto__: null,
//
// };
//
// const wrap_variable = ({kind, scope, name}) => (
//   Assert.options(
//     (
//       kind === null ||
//       kind === void 0 ||
//       kind === "var" ||
//       kind === "function" ||
//       kind === "let" ||
//       kind === "const" ||
//       kind === "class"),
//     `Variable.kind must either be: null, undefined, 'var', 'function', 'let', 'const', or 'class'`),
//   Assert.options(
//     (
//       scope === null ||
//       scope === void 0 ||
//       scope === "block" ||
//       scope === "closure"),
//     `Variable.scope must either be: null, undefined, 'block' or 'closure'`),
//   Assert.options(
//     typeof name === "string",
//     `Variable.name must be a string`),
//   wrap(
//     kind ?
//     convert[kind] :
//     (
//       scope === "block" ?
//       Token.KIND_VARIABLE_BLOCK :
//       (
//         scope === "closure" :
//         Token.KIND_VARIABLE_CLOSURE :
//         Assert(false, `Variable.kind and Variable.scope cannot be both null or undefined`)))));

const mode = (strict, tokens) => {
  if (strict) {
    Tokens.raise(tokens, KIND_MARKER_WITH, void 0, `With statement is forbidden in strict mode`);
    Tokens.raise(tokens, KIND_MARKER_DISCARD, void 0, `Deleting an identifier is forbidden in strict mode`);
    Tokens.raise(tokens, KIND_MARKER_PATTERN_EVAL, void 0, `Writing to 'eval' is forbidden in strict mode`);
    Tokens.raise(tokens, KIND_MARKER_PATTERN_ARGUMENTS, void 0, `Writing to 'arguments' is forbidden in strict mode`);
  } else {
    Tokens.remove(tokens, KIND_MARKER_WITH);
    Tokens.remove(tokens, KIND_MARKER_DISCARD);
    Tokens.remove(tokens, KIND_MARKER_PATTERN_EVAL);
    Tokens.remove(tokens, KIND_MARKER_PATTERN_ARGUMENTS);
  }
};

const hoist = (tokens, kinds) => {
  const variables = Token.extract(tokens, kinds, void 0, to_variable);
  const raised = {__proto__:null};
  const uniques = {__proto__:null};
  const duplicables = {__proto__:null};
  const raise = (name) => {
    if (!(name in raised)) {
      raised[name] = null;
      Token.push(tokens, Token.KIND_ERROR, `Forbidden duplicated variable: ${name}`);
    }
  };
  const length = variables.length;
  for (let index = 0; index < length; index++) {
    const variable = variables[index1];
    if (variable.name in uniques) {
      raise(variable.name);
    }
    if (Token.includes(tokens, ENUM_KIND_VARIABLE_UNIQUE, variable.name)) {
      raise(variable.name);
    }
    if (variable.duplicable) {
      duplicables[variable.name] = null;
    } else {
      if (variable.name in duplicables) {
        raise(variable.name);
      }
      if (Token.includes(tokens, ENUM_KIND_VARIABLE_DUPLICABLE, variable.name)) {
        raise(variable.name);
      }
      uniques[variable.name] = null;
    }
  }
  return variables;
};

const finalize = (tokens) => {
  const errors = Token.extract(tokens, Token.KIND_ERROR, void 0);
  if (Token.length(tokens) > 0) {
    throw new global_Error("A non error token escaped");
  }
  return errors;
};


{
  const context = {
    module: true,
    strict: true,
    meta_new_target: false,
    super_call: false,
    super_member: false,
    capture_normal: Token.ENUM_KIND_VARIABLE,
    capture_strict: Token.ENUM_KIND_VARIABLE
  };
}
exports.module = (node, options) => {
  options = global_Object_assign({scope:[]}, options);
  return finalize(options.scope, visit("Program", node, context));
}

{
  const context = {
    module: false,
    strict: false,
    meta_new_target: false,
    super_call: false,
    super_member: false,
    capture_normal: Token.ENUM_KIND_EMPTY,
    capture_strict: Token.ENUM_KIND_EMPTY
  };
  exports.script = (node, options) => {
    options = global_Object_assign({scope:[]}, options);
    return finalize(options.scope, visit("Program", node, context));
  }
}

exports.eval = (node, options) => {
  options = global_Object_assign({
    "scope": [],
    "strict-mode": false,
    "closure-tag": null,
    "constructor-ancestor": false
    "method-ancestor": false
  }, options);
  return finalize(options.scope, visit("Program", node, {
    module: false,
    strict: options["strict-mode"],
    meta_new_target: options["function-ancestor"],
    super_call: options["closure-tag"] === "derived-constructor",
    super_member: options["closure-tag"] === "derived-constructor" || options["closure-tag"] === "constructor" || options["closure-tag"] === "method",
    capture_normal: Token.ENUM_KIND_VARIABLE_BLOCK,
    capture_strict: Token.ENUM_KIND_VARIABLE
  }));
};

//
//   // Token.raise_duplicate(_tokens, Token.ENUM_KIND_VARIABLE_BLOCK, Token.ENUM_KIND_VARIABLE, (identifier) => `Duplicate variable: '${identifier}'`),
//   node[KEY_EVAL] = Token.includes(_tokens, Token.KIND_EVAL_MARKER, void 0);
//   node[KEY_STRICT] = has_use_strict(node.body, 0);
//   node[KEY_RELEASE] = options.scope;
//   node[KEY_CAPTURE] = hoist(tokens, Token.ENUM_KIND_VARIABLE);
//   Token.remove(tokens, KIND_MARKER_IMPORT, void 0);
//   Token.remove(tokens, KIND_MARKER_EXPORT, void 0);
//   Token.remove(tokens, KIND_MARKER_META_MODULE_IMPORT, void 0);
//   Token.raise(tokens, KIND_MARKER_META_NEW_TARGET, void 0, `Meta property 'new.target' must have as ancestor either: a function, a method, or a constructor`),
//   Token.raise(tokens, KIND_MARKER_SUPER_CALL, void 0, `Call to 'super' must be directly inside a derived constructor`),
//   Token.raise(tokens, KIND_MARKER_SUPER_MEMBER, void 0, `Property access to 'super' must be directly inside a constructor or a method`),
//   mode(true, tokens);
//   return finalize(tokens);
// };
//
// exports.script = (node, options, _tokens) => {
//   options = global_Object_assign({scope:[]}, options);
//   const tokens = visit(node, null, "Program");
//   const length = options.scope.length
//   for (let index = 0; index < length; index++) {
//     // Token.push(options.scope)
//   }
//   node[KEY_EVAL] = Token.includes(_tokens, Token.KIND_EVAL_MARKER, void 0);
//   node[KEY_STRICT] = has_use_strict(node.body, 0);
//   node[KEY_CAPTURE] = hoist(tokens, context.capture)
//   node[KEY_RELEASE] = hoist(tokens, context.release);
//   if (context.module) {
//     Token.remove(tokens, KIND_MARKER_IMPORT, void 0);
//     Token.remove(tokens, KIND_MARKER_EXPORT, void 0);
//     Token.remove(tokens, KIND_MARKER_META_MODULE_IMPORT, void 0);
//   } else {
//     Token.raise(tokens, KIND_MARKER_IMPORT, `Import declaration is forbidden outside of module`);
//     Token.raise(tokens, KIND_MARKER_EXPORT, `Export declaration is forbidden outside of module`);
//     Token.raise(tokens, KIND_MARKER_META_MODULE_IMPORT, `Meta property 'import.meta' is forbidden oustide of module`);
//   }
//   if (context[]) {
//
//   }
//
//   Token.raise(tokens, KIND_MARKER_META_NEW_TARGET, void 0, `Meta property 'new.target' must have as ancestor either: a function, a method, or a constructor`),
//   Token.raise(tokens, KIND_MARKER_SUPER_CALL, void 0, `Call to 'super' must be directly inside a derived constructor`),
//   Token.raise(tokens, KIND_MARKER_SUPER_MEMBER, void 0, `Property access to 'super' must be directly inside a constructor or a method`),
//   mode(true, tokens);
//   return finalize(tokens);
//
//   _tokens = Token.raise_duplicate(Token.ENUM_KIND_VARIABLE_BLOCK, Token.ENUM_KIND_VARIABLE, make_duplicate_message),
//   _tokens = Token.split(_tokens, split_discriminant, node[KEY_RELEASE]),
//   _tokens = Token.remove(_tokens, node[KEY_USE_STRICT] ? remove_discriminant_strict : remove_discriminant_normal),
//   _tokens = Token.raise(_tokens, node[KEY_USE_STRICT] ? raise_discriminant_strict : raise_discriminant_normal),
//   Token.finalize(_tokens));
// }
//
// exports.eval = (node, options) => (
//   options = global_Object_assign(
//     {
//       "strict-mode": false,
//       "function-ancestor": false,
//       "closure-tag": null},
//     options),
//   _tokens = visit(node, null, "Program"),
//   node[KEY_USE_STRICT] = has_use_strict(node.body, 0),
//   (
//     _tokens = ArrayLite.concat(
//       _tokens,
//       ArrayLite.map(
//         options.scope,
//         to_variable_token)),
//     _tokens = ArrayLite.filter(_tokens, raise_variable_block_duplicate),
//     _tokens = ArrayLite.filter(_tokens, is_not_variable_duplicate),
//     node[KEY_HOISTING] = ArrayLite.map(
//       ArrayLite.filter(_tokens, is_variable_block),
//       from_variable_token),
//     node[KEY_HOISTING_GLOBAL] = ArrayLite.map(
//       ArrayLite.filter(_tokens, is_variable),
//       from_variable_token),
//     _tokens = ArrayLite.filter(_tokens, is_not_variable)),
//   (
//     _tokens = ArrayLite.map(_tokens, raise_marker_module),
//     _tokens = (
//       (
//         options["strict-mode"] ||
//         node[KEY_USE_STRICT]) ?
//       ArrayLite.map(_tokens, raise_marker_strict)
//       ArrayLite.filter(_tokens, is_not_marker_strict)),
//     _tokens = ArrayLite.map(_tokens, raise_marker_await),
//     _tokens = ArrayLite.map(_tokens, raise_marker_yield),
//     _tokens = (
//       options["function-ancestor"] ?
//       ArrayLite.filter(_tokens, is_not_marker_new_target) :
//       ArrayLite.map(_tokens, raise_marker_new_target)),
//     _tokens = (
//       options["closure-tag"] === "derived-constructor" ?
//       ArrayLite.filter(_tokens, is_not_marker_super_call) :
//       ArrayLite.map(_tokens, raise_marker_super_call)),
//     _tokens = (
//       (
//         options["closure-tag"] === "method" ||
//         options["closure-tag"] === "constructor" ||
//         options["closure-tag"] === "derived-constructor") ?
//       ArrayLite.filter(_tokens, is_not_marker_super_member) :
//       ArrayLite.map(_tokens, raise_marker_super_member))),
//   ArrayLite.map(
//     _tokens,
//     from_error_token));

///////////
// Hoist //
///////////

const make_hoist = (key, kinds) => (
  _is = make_is(kinds),
  _is_not = make_is_not(kinds),
  (tokens) => (
    current[key] = ArrayLite.map(
      ArrayLite.filter(
        ArrayLite.filter(key, _is),
        is_not_variable_duplicate),
      from_variable_token),
    ArrayLite.map(tokens, _is_not)));

const hoist_capture_all = make_hoist(KEY_HOISTING, ENUM_KIND_VARIABLE);

const hoist_capture_block = make_hoist(KEY_HOISTING, ENUM_KIND_VARIABLE_BLOCK);

const hoist_capture_none = make_hoist(KEY_HOISTING, EMPTY);

const hoist_capture_param = make_hoist(KEY_HOISTING, ENUM_KIND_VARIABLE_PARAM);

const hoist_release = make_hoist(KEY_HOISTING_GLOBAL, ENUM_KIND_VARIABLE);

////////////
// Helper //
////////////

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

///////////
// Visit //
///////////

const visit = (whitelist, node, context) => {
  Assert.node(node, whitelist);
  const loc = State.loc;
  State.loc = node.loc;
  const tokens = visitors[node.type](node, context);
  State.loc = loc;
  return tokens;
};

  // assert(typeof node === "object", `Node must be an object`);
  // assert(typeof node !== null, `Node must not be null`);
  // assert(typeof node.type === "string", `Node.type must be a string`);
  // let match = false;
  // if (typeof whitelist === "string") {
  //   match = whitelist === node.type;
  // } else {
  //   for (let index = 0; index < whitelist.length; index++) {
  //     const white = whitelist[index];
  //     if (typeof white === "string") {
  //       if (white === node.type) {
  //         match = true;
  //         break;
  //       }
  //     } else {
  //       for (let index = 0; index < white.length; index++) {
  //         if (white[index] === node.type) {
  //           match = true;
  //           break;
  //         }
  //       }
  //     }
  //   }
  // }
  // assert(match, `Note.type is invalid`);
// };

// {
//   const raise_discriminant = {
//     __proto__: null,
//     [Token.KIND_MARKER_RETURN]: ``,
//     [Token.KIND_LABEL_BREAK]: ``,
//     [Token.KIND_LABEL_CONTINUE]: ``,
//     [Token.KIND_MARKER_AWAIT]: ``
//     [Token.KIND_MARKER_AWAIT_FOR_OF]: `Await for-of`,
//     [Token.KIND_MARKER_YIELD]: ``};
//   const discriminant_eval = {
//     __proto__: null,
//     [Token.KIND_MARKER_EVAL]: null};


/////////////
// Closure //
/////////////

// const helper_closure = (node, context) => {
//   if (node.type === "ArrowFunctionExpression") {
//     Assert.typeof(node, "expression", "boolean");
//   } else {
//     Assert.typeof(node, "generator", "boolean");
//   }
//   Assert.typeof(node, "async", "boolean");
//   Assert.array(node.params);
//   if (node.type === "FunctionDeclaration" && context !== "anonymous") {
//     Assert.isnot(node, "id", null);
//   }
//
//
//   const tokens1 = TokenList.empty();
//   if (node.type !== "ArrowFunctionExpression" && node.id !== null) {
//     TokenList.append(tokens1, visit(Estree.ENUM_TYPE_IDENTIFIER, node.id, "pattern"));
//     Token.transform(tokens1, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_FUNCTION);
//   }
//   let tokens2 = TokenList.empty();
//   let simple = true;
//   for (let index = 0; index < params; index++) {
//     TokenList.append(tokens2, visit(Estree.ENUM_TYPE_PATTERN, node.params[index], "pattern"));
//     simple = simple && node.params[index].type === "Identifier";
//   }
//   if (simple) {
//     Token.transform(tokens2, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_PARAM);
//   } else {
//     Token.transform(tokens2, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_PARAM);
//   }
//
//   if (node.type === "ArrowFunctionExpression" && node.expression) {
//     Token.append(tokens2, visit(Estree.ENUM_TYPE_EXPRESSION, node.body, null));
//   } else {
//     tokens2 = visit(Estree.ENUM_TYPE_BLOCK_STATEMENT, node.body, tokens2));
//   }
//   node[KEY_CAPTURE] = hoist(tokens2, Token.ENUM_TYPE_);
//
//
//
//   Assert.array()
// };


const helper_closure = (node, context) => (
  (
    (node.type === "ArrowFunctionExpression") ?
    Assert.typeof(node, "expression", "boolean") :
    Assert.typeof(node, "generator", "boolean")),
  Assert.typeof(node, "async", "boolean"),
  Assert.array(node, "params"),
  (
    (node.type === "FunctionDeclaration") &&
    (context !== "anonymous") &&
    Assert.isnot(node, "id", null)),

  TokenList.concat(
    (
      node.id === null ?
      [] :
      TokenList.transform(
        visit(Estree.Identifier, node.id, null),
        Token.KIND_VARIALE_VOID,
        void 0,
        Token.KIND_VARIABLE_FUNCTION)),




);

//
//   }
//
//
//   const tokens1 = TokenList.empty();
//   if (node.type !== "ArrowFunctionExpression" && node.id !== null) {
//     TokenList.append(tokens1, visit(Estree.ENUM_TYPE_IDENTIFIER, node.id, "pattern"));
//     Token.transform(tokens1, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_FUNCTION);
//   }
//   let tokens2 = TokenList.empty();
//   let simple = true;
//   for (let index = 0; index < params; index++) {
//     TokenList.append(tokens2, visit(Estree.ENUM_TYPE_PATTERN, node.params[index], "pattern"));
//     simple = simple && node.params[index].type === "Identifier";
//   }
//   if (simple) {
//     Token.transform(tokens2, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_PARAM);
//   } else {
//     Token.transform(tokens2, Token.KIND_VARIABLE_VOID, void 0, Tokne.KIND_VARIABLE_PARAM);
//   }
//
//   if (node.type === "ArrowFunctionExpression" && node.expression) {
//     Token.append(tokens2, visit(Estree.ENUM_TYPE_EXPRESSION, node.body, null));
//   } else {
//     tokens2 = visit(Estree.ENUM_TYPE_BLOCK_STATEMENT, node.body, tokens2));
//   }
//   node[KEY_CAPTURE] = hoist(tokens2, Token.ENUM_TYPE_);
//
//
//
//   Assert.array()
// };

/////////////
// Program //
/////////////

{
  const types = global_Object_assign({
    __proto__: null,
    "ImportDeclaration": null,
    "ExportNamedDeclaration": null,
    "ExportDefaultDeclaration": null,
    "ExportAllDeclaration": null
  }, Estree.ENUM_TYPE_STATEMENT);
  const message_label = (label) => `Unbound label ${label === null ? `<empty>` :`'${label}'`}`;
  const message_return = `Return statement must be (directly) inside a closure`;
  const message_await = `Await expression must be directly inside an asynchronous closure`;
  const message_await_for_of = `Await for-of statement must be directly inside an asynchronous closure`;
  const message_yield = `Yield expression must be directly inside a generator function`;
  const message_meta_new_target = `Meta property 'new.taret' must be inside a function, a method or a constructor`;
  const message_meta_import_meta = `Meta property 'import.meta' directly inside a module`;
  const message_import = `Import declaration must be at the top level of a module`;
  const message_export = `Import declaration must be at the top level of a module`;
  const message_with = ``
  visitors.Program = (node, context) => {
    Assert.array(node, "body");
    const tokens = ArrayLite.reduce(TokenList.append, ArrayLite.map(node.body, (node) => visit(types, node, null)), TokenList.empty());
    // Strict //
    node[KEY_STRICT] = has_use_strict(node.body, 0);
    if (context["strict-mode"] || node[KEY_STRICT]) {
      Tokens.raise(tokens, KIND_MARKER_WITH, void 0, `With statement is forbidden in strict mode`);
      Tokens.raise(tokens, KIND_MARKER_DISCARD, void 0, `Deleting an identifier is forbidden in strict mode`);
      Tokens.raise(tokens, KIND_MARKER_PATTERN_EVAL, void 0, `Writing to 'eval' is forbidden in strict mode`);
      Tokens.raise(tokens, KIND_MARKER_PATTERN_ARGUMENTS, void 0, `Writing to 'arguments' is forbidden in strict mode`);
    } else {
      Tokens.remove(tokens, KIND_MARKER_WITH, void 0);
      Tokens.remove(tokens, KIND_MARKER_DISCARD, void 0);
      Tokens.remove(tokens, KIND_MARKER_PATTERN_EVAL, void 0);
      Tokens.remove(tokens, KIND_MARKER_PATTERN_ARGUMENTS, void 0);
    }
    // Eval Call //
    node[KEY_EVAL] = Token.includes(tokens, Token.KIND_MARKER_EVAL);
    Token.remove(tokens, Token.KIND_MARKER_EVAL, void 0);
    // Hoisting //
    if (context.strict || node[KEY_STRICT]) {
      node[KEY_CAPTURE] = hoist(tokens, context["capture-strict"]);
    } else {
      node[KEY_CAPTURE] = hoist(tokens, context["capture-normal"]);
    }
    node[KEY_RELEASE] = hoist(tokens, Token.ENUM_KIND_VARIABLE);
    // Marker //
    Token.raise(tokens, Token.KIND_MARKER_RETURN, void 0, message_return),
    Token.raise(tokens, Token.KIND_MARKER_AWAIT, void 0, message_await),
    Token.raise(tokens, Token.KIND_MARKER_AWAIT_FOR_OF, void 0, message_await_for_of),
    Token.raise(tokens, Token.KIND_MARKER_YIELD, void 0, message_yield),
    Token.raise(tokens, Token.ENUM_KIND_LABEL, void 0, message_label);
    if (context["module"]) {
      Token.remove(tokens, Token.KIND_MARKER_META_MODULE_IMPORT, void 0);
      Token.remove(tokens, Token.KIND_MARKER_IMPORT, void 0);
      Token.remove(tokens, Token.KIND_MARKER_EXPORT, void 0);
    } else {
      Token.raise(tokens, Token.KIND_MARKER_META_MODULE_IMPORT, void 0, message_meta_import_meta);
      Token.raise(tokens, Token.KIND_MARKER_IMPORT, void 0, message_import);
      Token.raise(tokens, Token.KIND_MARKER_EXPORT, void 0, message_export);
    }
    if (context["function-ancestor"]) {
      Token.remove(tokens, Token.KIND_MARKER_META_NEW_TARGET);
    } else {
      Token.raise(tokens, Token.KIND_MARKER_META_NEW_TARGET, );
    }
    if (context["closure-tag"] === "derived-constructor") {
      Token.remove(tokens, Token.KIND_MARKER_SUPER_CALL, void 0);
    } else {
      Token.raise(tokens, Token.KIND_MARKER_SUPER_CALL, void 0, `Call to 'super' must be directly inside a derived constructor`);
    }
    if (context["closure-tag"] === "method" || context["closure-tag"] === "constructor" || context["closure-tag"] === "derived-constructor") {
      Token.remove(tokens, Token.KIND_MARKER_SUPER_MEMBER, void 0);
    } else {
      Token.raise(tokens, Token.KIND_MARKER_SUPER_MEMBER, void 0, `Property access to 'super' must be directly inside a method or a constructor`);
    }
    return tokens;
  }
}

////////////
// Module //
////////////

visitors.ImportSpecifier = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit("Identifier", node.local, null));
  TokenList.append(tokens, visit("Identifier", node.imported, null));
  return tokens
};

visitors.ImportDefaultSpecifier = (node) => visit("Identifier", node.local, null);

visitors.ImportNamespaceSpecifier = (node) => visit("Identifier", node.local, null);

visitors.ImportDeclaration = (node) => {
  Assert.array(node, "specifiers");
  const tokens = TokenList.empty();
  for (let index = 0; index < node.specifiers.length; index++) {
    TokenList.append(tokens, visit({
      __proto__: null,
      "ImportSpecifier": null,
      "ImportDefaultSpecifier": null,
      "ImportNamespaceSpecifier": null
    }, node.specifier[index], null);
  }
  TokenList.append(tokens, visit("Literal", node.source, null));
  if (typeof node.source.value !== "string") {
    TokenList.push(tokens, Token.KIND_ERROR, `ImportDeclaration.source must be a string`)
  }
  return tokens;
}

visitors.ExportSpecifier = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit("Identifier", node.local, null));
  TokenList.append(tokens, visit("Identifier", node.exported, null));
  return tokens;
};

visitors.ExportNamedDeclaration = (node) => {
  Assert.array(node, "specifiers");
  const tokens = Token.empty();
  if (node.declaration !== null) {
    TokenList.append(tokens, visit({
      __proto__: null,
      "VariableDeclaration": null,
      "FunctionDeclaration": null,
      "ClassDeclaration": null
    }, node.declaration, null));
  }
  TokenList.append(tokens, visit_all("ExportSpecifier", node.specifiers, null));
  if (node.source !== null) {
    TokenList.append(tokens, visit("Literal", node.declaration, null));
  }
  if (node.source !== null && typeof node.source.value !== "string") {
    TokenList.push(tokens, Token.KIND_ERROR, `ExportNamedDeclaration.source must either be missing or be a string literal`);
  }
  return tokens;
};

visitors.ExportDefaultDeclaration = (node) => visit(global_Object_assign({
  __proto__: null,
  "FunctionDeclaration": null,
  "ClassDeclaration": null
}, Estree.ENUM_KIND_EXPRESSION), node.declaration, "anonymous");

visitors.ExportAllDeclaration = (node) => {
  const tokens = visit("Literal", node.source, null);
  if (typeof node.source.value !== "string") {
    TokenList.push(tokens, Token.KIND_ERROR, `ExportAllDeclaration.source must be a string Literal`);
  }
  return tokens;
};

/////////////
// Pattern //
/////////////

// context = "key" || "label" || "expression" || "pattern"
visitors.Identifier = (node, context) => {
  Assert.typeof(node.name, "string");
  const tokens = TokenList.empty();
  if (!global_Reflect_apply(global_RegExp_prototype_test, /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u, [node.name]) {
    TokenList.push(tokens, Token.KIND_ERROR, `Identifier.name is invalid, got: ${global_JSON_stringify(node.name)}`);
  }
  // Nice-to-have: check for keywords based on strict mode and label
  if (context === "pattern") {
    TokenList.push(tokens, Token.KIND_VARIABLE_VOID, node.name);
    if (node.name === "eval") {
      TokenList.push(tokens, Token.KIND_PATTERN_IDENTIFIER_EVAL, null);
    } else if (node.name === "arguments") {
      TokenList.push(tokens, Token.KIND_PATTERN_IDENTIFIER_ARGUMENTS, null);
    }
  }
  return tokens;
};

visitors.MemberExpression = (node, context) => {
  Assert.typeof(node, "computed", "boolean");
  Assert.typeof(node, "optional", "boolean");
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(global_Object_assign({
    __proto__: null,
    Super: null
  }, Estree.ENUM_TYPE_EXPRESSION), context === "chain" ? "chain" : null));
  if (node.computed) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.property, null);
  } else {
    TokenList.append(tokens, visit({
      __proto__: null,
      Identifier: null,
    }, node.property, "key"));
  }
  if (context !== "chain" && node.optional) {
    TokenList.push(tokens, Token.KIND_ERROR, `MemberExpression.optional must be false when outside a chain`);
  }
  if (context === "pattern") {
    TokenList.push(tokens, Token.KIND_MEMBER_PATTERN, null);
  }
  if (node.object.type === "Super") {
    TokenList.push(tokens, Token.KIND_MEMBER_SUPER);
  }
  return tokens;
};

visitors.RestElement = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_PATTERN, node.argument, "pattern"));
  if (node.argument.type === "RestElement") {
    TokenList.push(tokens, Token.KIND_ERROR, `RestElement.argument cannot be a RestElement itself`);
  }
  return tokens;
};

visitors.AssignmentPattern = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_PATTERN, node.left, "pattern"));
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.right, null));
  if (node.left.type === "RestElement") {
    TokenList.push(tokens, Token.KIND_ERROR, `AssignmentPattern.left cannot be a RestElement`);
  }
  return tokens;
};

visitors.ObjectPattern = (node) => {
  Assert.array(node, "properties");
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit_all({
    __proto__: null,
    Property: null,
    RestElement: null
  }, node.properties, "pattern"));
  for (let index = 0; index < node.properties.length; index++) {
    if (node.properties[index].type === "RestElement") {
      if (index !== node.properties.length - 1) {
        TokenList.push(tokens, Token.KIND_ERROR, `RestElement must be in last position`);
      }
    } else {
      if (node.properties[index].kind !== "init") {
        TokenList.push(tokens, Token.KIND_ERROR, `Property cannot be an accessor when used as a pattern`);
      }
      if (node.properties[index].method) {
        TokenList.push(tokens, Token.KIND_ERROR, `Property cannot be a method when used as a pattern`);
      }
    }
  }
  return tokens;
};

visitors.ArrayPattern = (node) => {
  Assert.array(node, "elements");
  const tokens = TokenList.empty();
  for (let index = 0; index < node.elements.length; index++) {
    if (node.elements[index] !== null) {
      TokenList.append(tokens, visit(Estree.ENUM_TYPE_PATTERN, node.elements[index], null));
    }
  }
  for (let index = 0; index < node.elements.length; index++) {
    if (node.elements[index] !== null && node.elements[index].type === "RestElement" && index !== node.elements.length) {
      TokenList.push(tokens, Token.KIND_ERROR, `RestElement must be in last position`);
    }
  }
  return tokens;
};

//////////////
// Property //
//////////////

visitors.Property = (node, context) => {
  Assert.enum(node, "kind", Estree.ENUM_PROPERTY_KIND);
  Assert.typeof(node, "method", "boolean");
  Assert.typeof(node "computed", "boolean");
  Assert.typeof(node, "shorthand", "boolean");
  const tokens = TokenList.empty();
  if (node.computed) {
    TokenList.push(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.key, null));
  } else {
    TokenList.push(tokens, visit({
      __proto__: null,
      Identifier: null,
      Literal: null
    }, node.key, :"key"));
  }
  if (context === "pattern") {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_PATTERN, node.value, "pattern");
  } else {
    const tmp = visit(Estree.ENUM_TYPE_EXPRESSION, node.value, null);
    if (node.method) {
      TokenList.remove(tmp, Token.KIND_MARKER_SUPER_CALL, void 0);
    }
    TokenList.append(tokens, tmp);
  }
  if (!node.computed && node.key.type === "Literal" && typeof node.key.value !== "string") {
    TokenList.push(tokens, Token.KIND_ERROR, `The key of a non-computed property must either be an identifier or a string literal`);
  }
  if (node.kind !== "init" && node.method) {
    TokenList.push(tokens, Token.KIND_ERROR, `A property cannot be both a method and an accessor at the same time`);
  }
  if (node.kind !== "init" ||  && node.value.type !== "FunctionExpression") {
    TokenList.push(tokens, Token.KIND_ERROR, `The value of an accessor property must be a function`);
  }
  if (node.kind === "get" && node.value.params.length !== 0) {
    TokenList.push(tokens, Token.KIND_ERROR, `The value of an getter property must be a function with no parameters`);
  }
  if (node.kind === "set" && node.value.params.length !== 1) {
    TokenList.push(tokens, Token.KIND_ERROR, `The value of an setter property must be a function with exactly one parameter`);
  }
  return tokens;
};

/////////////////
// Declaration //
/////////////////

visitors.VariableDeclarator = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_PATTERN, node.id, "pattern"));
  if (node.init !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.init, null));
  }
  if (node.id.type === "AssignmentPattern") {
    TokenList.push(tokens, Token.KIND_ERROR, `VariableDeclarator.id cannot be an AssignmentPattern`);
  }
  TokenList.raise(tokens, Token.KIND_MEMBER_PATTERN, `MemberExpression cannot be used as a pattern in a declaration context`);
  return tokens;
};

visitors.VariableDeclaration = (node) => {
  Assert.enum(node, "kind", Estree.ENUM_KIND_VARIABLE);
  Assert.array(node, "declarations");
  const tokens = TokenList.empty();
  for (let index = 0; node.declarations.length; index++) {
    Token.concat(tokens, visit("VariableDeclarator", node.declarations[index], null));
  }
  if (node.declarations.length === 0) {
    TokenList.push(tokens, Token.KIND_ERROR, `VariableDeclaration.declarations must not be an empty array`);
  }
  if (node.kind === "let") {
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_LET);
  } else if (node.kind === "const") {
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_CONST);
  } else {
    // console.assert(node.kind === "var");
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_VAR);
  }
  return tokens;
};

visitors.FunctionDeclaration = (node, context) => {
  const tokens = helper_closure(node);
  if (node.id !== null) {
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_FUNCTION);
  }
  if (context !== "anonymous" && node.id === null) {
    TokenList.push(tokens, Token.KIND_ERROR, `FunctionDeclaration must be named when not used as an anonymous declaration`);
  }
  return tokens;
};

visitors.ClassDeclaration = (node, context) => {
  const tokens = helper_class(node);
  if (node.id !== null) {
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_CLASS);
  }
  if (context !== "anonymous" && node.id === null) {
    TokenList.push(tokens, Token.KIND_ERROR, `ClassnDeclaration must be named when not used as an anonymous declaration`);
  }
  return tokens;
};

//////////////////////
// Atomic Statement //
//////////////////////

visitors.EmptyStatement = (node) => TokenList.empty();

visitors.DebuggerStatement =(node) => TokenList.empty();

visitors.ThrowStatement = (node) => visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null);

visitors.ExpressionStatement = (node) => {
  if ("directive" in node) {
    Assert.typeof(node, "directive", "string");
  }
  return visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null);
}

visitors.ReturnStatement = (node) => {
  const tokens = TokenList.empty();
  if (node.argument !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null));
  }
  TokenList.push(tokens, Token.KIND_RETURN, null);
  return tokens;
};

visitors.BreakStatement = (node) => {
  const tokens = TokenList.empty();
  if (node.label !== null) {
    TokenList.append(tokens, visit("Identifier", node.label, "label");
  }
  TokenList.push(tokens, Token.KIND_LABEL_BREAK, node.label === null ? node.label.name : null);
  return tokens;
};

visitors.ContinueStatement = (node) => {
  const tokens = TokenList.empty();
  if (node.label !== null) {
    TokenList.append(tokens, visit("Identifier", node.label, "label");
  }
  TokenList.push(tokens, Token.KIND_LABEL_CONTINUE, node.label === null ? node.label.name : null);
  return tokens;
};

////////////////////////
// Compound Statement //
////////////////////////

visitors.LabeledStatement = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit("Identifier", node.label, "label"));
  {
    const part = visit(Estree.ENUM_TYPE_STATEMENT, node.body, null);
    let current = node;
    while (current.type === "LabeledStatement") {
      current = node.body;
    }
    TokenList.remove(part, Token.KIND_LABEL_BREAK, node.label.name);
    if (current.type === "WhileStatement" || current.type === "DoWhileStatement" || current.type === "ForStatement" || current.type === "ForOfStatement" || current.type === "ForInStatement") {
      TokenList.remove(part, Token.KIND_LABEL_CONTINUE, node.label.name);
    } else {
      TokenList.raise(part, Token.KIND_LABEL_CONTINUE, node.label.name, `Continue label ${node.label.name} does not refer to a loop statement`);
    }
    TokenList.append(tokens, part);
  }
  return TokenList.append(tokens1, tokens2);
};

visitors.BlockStatement = (node, tokens = Token.empty()) => {
  Assert.array(node, "body");
  for (let index = 0; index < node.body.length; index++) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.body[index], null));
  }
  node[KEY_CAPTURE] = hoist(tokens, Token.ENUM_KIND_VARIABLE_BLOCK);
  return tokens;
};

visitors.IfStatement = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.test, null));
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.consequent, null));
  if (node.alternate !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.alternate, null));
  }
  if (node.consequent.type === "VariableDeclaration" && node.consequent.kind !== "var") {
    TokenList.push(tokens, Token.KIND_ERROR, `IfStatement.consequent cannot be a let/const variable declaration`);
  }
  if (node.consequent.type === "ClassDeclaration") {
    TokenList.push(tokens, Token.KIND_ERROR, `IfStatement.consequent cannot be a class declaration`);
  }
  if (node.alternate !== null && node.consequent.type === "VariableDeclaration" && node.consequent.kind !== "var") {
    TokenList.push(tokens, Token.KIND_ERROR, `IfStatement.alternate cannot be a let/const variable declaration`);
  }
  if (node.alternate !== null && node.aleternate === "ClassDeclaration") {
    TokenList.push(tokens, Token.KIND_ERROR, `IfStatement.alternate cannot be a class declaration`);
  }
  return tokens;
};

visitors.WithStatement = (node) => {
  const tokens = Token.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.object, null));
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.body, null));
  if (node.body.type === "ClassDeclaration" || (node.body.type === "VariableDeclaration" && node.body.kind !== "var")) {
    TokenList.push(tokens, Token.KIND_ERROR, `WithStatement.body cannot be a let/const/class declaration`);
  }
  return tokens;
};

visitors.CatchClause = (node) => {
  let tokens = TokenList.empty();
  if (node.param !== null) {
    tokens = visit(Estree.ENUM_TYPE_PATTERN, node.body, null);
    TokenList.transform(tokens, Token.KIND_VARIABLE_VOID, void 0, Token.KIND_VARIABLE_ERROR);
  }
  tokens = visit("BlockStatement", node.body, tokens);
  hoist(tokens, Token.KIND_VARIABLE_ERROR);
  return tokens;
};

visitors.TryStatment = (node) => {
  const tokens = Token.empty();
  TokenList.append(tokens, visit("BlockStatement", node.block, null));
  if (node.handler !== null) {
    TokenList.append(tokens, visit("CatchClause", node.handler, null));
  }
  if (node.finalizer !== null) {
    TokenList.append(tokens, visit("BlockStatement", node.finalizer, null));
  }
  return tokens;
};

visitors.WhileStatement = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.test, null));
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.body, null));
  if (node.body.type === "ClassDeclaration" || (node.body.type === "VariableDeclaration" && node.body.kind !== "var")) {
    TokenList.push(tokens, Token.KIND_ERROR, `WileStatement.body cannot be a let/const/class declaration`);
  }
  TokenList.remove(tokens, Token.ENUM_KIND_LABEL, null);
  return tokens;
};

visitors.DoWhileStatement = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.test, null));
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.body, null));
  if (node.body.type === "ClassDeclaration" || (node.body.type === "VariableDeclaration" && node.body.kind !== "var")) {
    TokenList.push(tokens, Token.KIND_ERROR, `DoWileStatement.body cannot be a let/const/class declaration`);
  }
  TokenList.remove(tokens, Token.ENUM_KIND_LABEL, null);
  return tokens;
};

visitors.ForStatement = (node) => {
  const tokens1 = TokenList.empty();
  if (node.init !== null) {
    TokenList.append(tokens, visit(global_Object_assign({
      __proto__: null,
      "VariableDeclaration": null
    }, Estree.ENUM_TYPE_EXPRESSION), node.init, null));
  }
  if (node.test !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.test, null));
  }
  if (node.update !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.update, null));
  }
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.body, null));
  if (node.body.type === "ClassDeclaration" || (node.body.type === "VariableDeclaration" && node.body.kind !== "var")) {
    TokenList.push(tokens, Token.KIND_ERROR, `DoWileStatement.body cannot be a let/const/class declaration`);
  }
  TokenList.remove(tokens, Token.ENUM_KIND_LABEL, null);
  node[KEY_CAPTURE] = hoist(node, Token.ENUM_KIND_VARIABLE_BLOCK);
  return tokens;
};

// ForInStatement: helper_for,
// ForOfStatement: helper_for,

visitors.SwitchCase = (node) => {
  Asser.array(node, "consequent");
  const tokens = TokenList.empty();
  if (node.test !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.test, null));
  }
  for (let index = 0; index < node.consequent.length; index++) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_STATEMENT, node.consequent[index], null));
  }
  return tokens;
}

visitors.SwitchStatement = (node) => {
  Assert.array(node, "cases");
  let counter = 0;
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.discriminant, null));
  for (let index = 0; index < node.cases.length; index++) {
    TokenList.append(tokens, visit("SwitchCase", node.cases[index], null));
    if (node.cases[index].test === null) {
      counter++;
    }
  }
  if (counter > 1) {
    TokenList.push(tokens, Token.KIND_ERROR, `SwitchStatement must not have more than one default case`);
  }
  node[KEY_CAPTURE] = hoist(token.)
  return tokens;
};

////////////////////////
// Expression Special //
////////////////////////

visitors.YieldExpression = (node) => {
  Assert.typeof(node, "delegate", "boolean");
  const tokens = TokenList.empty();
  if (node.argument !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null));
  }
  TokenList.push(tokens, Token.KIND_YIELD, null);
  return tokens;
};

visitors.AwaitExpression = (node) => {
  Assert.typeof(node, "delegate", "boolean");
  const tokens = TokenList.empty();
  if (node.argument !== null) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null));
  }
  TokenList.push(tokens, Token.KIND_YIELD, null);
  return tokens;
};

///////////////////////////
// Expression >> Literal //
///////////////////////////

visitors.Literal = (node, context) => {
  if ("regex" in node) {
    Assert.object(node, "regex", {__proto__: null, pattern:"string", flags:"string"});
  }
  if ("bigint" in node) {
    Assert.typeof(node, "bigint", "string");
  }
  Assert.json(node, "value");
  const tokens = TokenList.empty();
  if ("bigint" in node) {
    if (node.bigint !== "0n" && !global_Reflect_apply(global_RegExp_prototype_test, /^[1-9][0-9]+n$/, [node.bigint])) {
      TokenList.push(tokens, Token.KIND_ERROR, `Literal.bigint is invalid`);
    }
  }
  if ("regex" in node && "bigint" in node) {
    TokenList.push(tokens, Token.KIND_ERROR, `Literal.regex and Literal.bigint cannot be both present`);
  }
  return tokens;
};

visitors.TemplateElement = (node) => {
  Assert.typeof(node, "tail", "boolean");
  Assert.object(node, "value", {cooked:"string", raw:"string"});
  return TokenList.empty();
}

visitors.TemplateLiteral = (node) => {
  Assert.array(node, "quasis");
  Assert.array(node, "expressions");
  for (let index = 0; index < node.quasis.length; index++) {
    TokenList.append(tokens, visit("TemplateElement", node.quasis[index], null));
    if (node.quasis[index].tail && index !== node.quasis.length - 1) {
      TokenList.push(tokens, Token.KIND_ERROR, `TemplateLiteral: the tail property of its elements must reflect its position`);
    }
  }
  for (let index = 0; index < node.expression.length; index++) {
    TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.expression[index], null));
  }
  if (node.quasis.length !== node.expression.length + 1) {
    TokenList.push(tokens, Token.KIND_ERROR, `TemplateLiteral.quasis must have exacly one element more than TemplateLiteral.expressions`);
  }
  return tokens;
};

visitors.TaggedTemplateLiteral = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.tag, null));
  TokenList.append(tokens, visit("TemplateLiteral", node.quasi, null));
  return tokens;
};

visitors.ArrowFunctionExpression = helper_closure;

visitors.FunctionExpression = helper_closure;

visitors.ClassExpression = helper_class;

///////////////////////////////
// Expression >> Environment //
///////////////////////////////

visitors.MetaProperty = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit("Identifier", node.meta, null));
  TokenList.append(tokens, visit("Identifier", node.property, null));
  if (node.meta.name === "new" && node.property.name === "target") {
    TokenList.push(tokens, Token.KIND_META_NEW_TARGET);
  } else if (node.meta.name === "import" && node.property.name === "meta") {
    TokenList.push(tokens, Token.KIND_META_IMPORT_META);
  } else {
    TokenList.push(tokens, Token.KIND_ERROR, `Only new.target and import.meta are recognized as meta property`);
  }
  return tokens;
};

visitors.UpdateExpression = (node) => {
  Assert.typeof(node, "prefix", "boolean");
  Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UPDATE);
  const tokens = visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, "pattern");
  if (node.argument.type !== "Identifier" && node.argument.type !== "MemberExpression" && node.argument.type !== "CallExpression") {
    TokenList.push(tokens, Token.KIND_ERROR, `UpdateExpression.argument must either be an Identifier, a MemberExpression, or a CallExpression`);
  }
  return tokens;
};

visitors.AssignmentExpression = (node) => {
  Assert.enum(node, "operator", Estree.ENUM_OPERATOR_ASSIGNMENT);
  const tokens = Token.empty();
  TokenList.append(tokens, visit(global_Object_assign({
    __proto__: null
  }, Estree.ENUM_TYPE_PATTERN, Estree.ENUM_TYPE_EXPRESSION), node.left, "pattern");
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION, node.right, null));
  if (node.operator !== "=" && node.left.type !== "Identifier" && node.left.type !== "MemberExpression" && node.left.type !== "CallExpression") {
    TokenList.push(tokens, Token.KIND_ERROR, `When not performing '=', AssignmentExpression.left must either be an Identifier, a MemberExpression, or a CallExpression`);
  }
  if (node.left.type !== "Identifier" && node.left.type !== "MemberExpression" && node.left.type !== "CallExpression" && node.left.type !== "ObjectPattern" && node.left.type !== "ArrayPattern") {
    TokenList.push(tokens, Token.KIND_ERROR, `AssignmentExpression.left must either be an Identifier, a MemberExpression, a CallExpression, an ObjectPattern, or an ArrayPattern`);
  }
  if (node.left.type === "AssignmentPattern") {
    TokenList.push(tokens, Token.KIND_ERROR, `AssignmentExpression.left must not be an AssignmentPattern`);
  }
  return tokens;
};

///////////////////////////////
// Expression >> ControlFlow //
///////////////////////////////

visitors.ChainExpression = (node) => visit({
  __proto__: null,
  MemberExpression: null,
  CallExpression: null
}, node.expression, "chain");

visitors.ConditionalExpression = (node) => {
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.test, null));
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.consequent, null));
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.alternate, null));
  return tokens;
};

visitors.LogicalExpression = (node) => {
  Assert.enum(node, "operator", Estree.ENUM_OPERATOR_LOGICAL);
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.left, null));
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.right, null));
  return tokens;
};

visitors.SequenceExpression = (node) => {
  Assert.array(node, "expressions");
  const tokens = TokenList.empty();
  for (let index = 0; index < node.expressions.length; index++) {
    TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.expressions[index], null));
  }
  if (node.expressions.length === 0) {
    TokenList.push(tokens, Token.KIND_ERROR, `LogicalExpression.expressions must not be an empty array`);
  }
  return tokens;
};

////////////////////////////
// Expression >> Combiner //
////////////////////////////

visitors.UnaryExpression = (node) => {
  Assert.typeof(node, "prefix", "boolean");
  Assert.enum(node, "operator", Estree.ENUM_OPERATOR_UNARY);
  const tokens = visit(Estree.ENUM_TYPE_EXPRESSION, node.argument, null);
  if (!node.prefix) {
    TokenList.push(tokens, Token.KIND_ERROR, `UpdateExpression.prefix must be true`);
  }
  if (node.operator === "delete" && node.argument.type === "Identifier") {
    TokenList.push(tokens, Token.KIND_EXPRESSION_UNARY_DELETE_IDENTIFIER);
  }
  return tokens;
};

visitors.BinaryExpression = (node) => {
  Assert.enum(node, "operator", Estree.ENUM_OPERATOR_BINARAY);
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.left, null));
  TokenList.append(tokens, visit(ENUM_TYPE_EXPRESSION, node.right, null));
  return tokens;
};


visitors.CallExpression = (node, context) => {
  Assert.array(node, "arguments");
  Assert.typeof(node, "optional", "boolean");
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit({
    __proto__: null,
    Super: null
  }, Estree.ENUM_TYPE_EXPRESSION), node.callee, context === "chain" ? "chain" : null);
  for (let index = 0; index < node.arguments.length; index++) {
    TokenList.append(tokens, visit({
      __proto__: null,
      SpreadElement: null
    }, Estree.ENUM_TYPE_EXPRESSION), node.arguments[index], null);
  }
  if (node.optional && context !== "chain") {
    TokenList.push(tokens, Token.KIND_ERROR, `CallExpression.optional must be false when outside a chain`);
  }
  if (node.callee.type === "Identifier" && node.callee.type.name === "eval") {
    TokenList.push(tokens, Token.KIND_CALL_EVAL, null);
  }
  if (node.callee.type === "Super") {
    TokenList.push(tokens, Token.KIND_CALL_SUPER, null);
  }
  return tokens;
};

visitors.NewExpression = (node) => {
  Assert.array(node, "arguments");
  const tokens = TokenList.empty();
  TokenList.append(tokens, visit(Estree.ENUM_TYPE_EXPRESSION), node.callee, null);
  for (let index = 0; index < node.arguments.length; index++) {
    TokenList.append(tokens, visit({
      __proto__: null,
      SpreadElement: null
    }, Estree.ENUM_TYPE_EXPRESSION), node.arguments[index], null);
  }
  return tokens;
};


visitors.ArrayExpression = (node) => {
  Assert.array(node.elements);
  const tokens = TokenList.empty();
  for (let index = 0; index < node.elements.length; index++) {
    if (node.element !== null) {
      TokenList.append(tokens, visit({
        __proto__: null,
        SpreadElement: null
      }, Estree.ENUM_TYPE_EXPRESSION), node.elements[index], null);
    }
  }
  return tokens;
};

visitors.ObjectExpression = (node) => {
  Assert.array(node.properties);
  const tokens = TokenList.empty();
  let counter = 0;
  for (let index = 0; index < node.elements.length; index++) {
    TokenList.append(tokens, visit({
      __proto__: null,
      SpreadElement: null,
      Property: null
    }), node.properties[index], null);
    (
      node.properties[index].type === "Property" &&
      node.properties[index].kind === "init" &&
      !node.properties[index].method &&
      !node.properties[index].shorthand &&
      !node.properties[index].computed &&
      node.properties[index].key.type === "Ientifier" &&
      node.properties[index].key.name === "__proto__" &&
      counter++);
  }
  if (counter > 1) {
    TokenList.push(tokens, Token.KIND_ERROR, `Duplicate __proto__ fields are not allowed in object literals`);
  }
  return tokens;
};
