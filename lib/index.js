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
    "function-ancestor": false
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
    const tokens = ArrayLite.reduce(TokenList.concat, ArrayLite.map(node.body, (node) => visit(types, node, null)), TokenList.empty());
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

const visit_all = (types, nodes, context) => {
  const tokens = TokenList.empty();
  for (let index = 0; index < length; index++) {
    TokenList.concat(tokens, visit(types, nodes[index], context));
  }
  return tokens;
};

////////////
// Module //
////////////

visitors.ImportSpecifier = (node) => {
  const tokens = TokenList.empty();
  TokenList.concat(tokens, visit("Identifier", node.local, null));
  TokenList.concat(tokens, visit("Identifier", node.imported, null));
  return tokens
};

visitors.ImportDefaultSpecifier = (node) => visit("Identifier", node.local, null);

visitors.ImportNamespaceSpecifier = (node) => visit("Identifier", node.local, null);

visitors.ImportDeclaration = (node) => {
  Assert.array(node, "specifiers");
  const tokens = visit_all({
    __proto__: null,
    "ImportSpecifier": null,
    "ImportDefaultSpecifier": null,
    "ImportNamespaceSpecifier": null
  }, node.specifiers, null);
  TokenList.concat(tokens, visit("Literal", node.source, null));
  if (typeof node.source.value !== "string") {
    TokenList.push(tokens, Token.KIND_ERROR, `ImportDeclaration.source must be a string`)
  }
  return tokens;
}

visitors.ExportSpecifier = (node) => {
  const tokens = TokenList.empty();
  TokenList.concat(tokens, visit("Identifier", node.local, null));
  TokenList.concat(tokens, visit("Identifier", node.exported, null));
  return tokens;
};

visitors.ExportNamedDeclaration: (node) => {
  Assert.array(node, "specifiers");
  const tokens = Token.empty();
  if (node.declaration !== null) {
    TokenList.concat(tokens, visit({
      __proto__: null,
      "VariableDeclaration": null,
      "FunctionDeclaration": null,
      "ClassDeclaration": null
    }, node.declaration, null));
  }
  TokenList.concat(tokens, visit_all("ExportSpecifier", node.specifiers, null));
  if (node.source !== null) {
    TokenList.concat(tokens, visit("Literal", node.declaration, null));
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

///////////
// Class //
///////////

////////////
// Atomic //
////////////



const visitors = {
  __proto__: null,
  // Program //
  Program: (node, context) => {
    Assert.array(node, "body");
    _tokens = ArrayLite.flatMap(
      node.body,
      (node) => visit(
        ,
        node,
        null)),
    node[KEY_STRICT] = has_use_strict(node.body, 0),
    node[KEY_EVAL] = Token.includes(_tokens, Token.KIND_MARKER_EVAL),
    Token.remove(_tokens, Token.KIND_MARKER_EVAL),
    Token.raise(_tokens, Token.KIND_MARKER_RETURN, void 0, `Return statement must be (directly) inside a closure`),
    Token.raise(_tokens, Token.KIND_MARKER_AWAIT, void 0, `Await expression must be directly inside an asynchronous closure`),
    Token.raise(_tokens, Token.KIND_MARKER_AWAIT_FOR_OF, void 0, `Await for-of statement must be directly inside an asynchronous closure`),
    Token.raise(_tokens, Token.KIND_MARKER_YIELD, void 0, `Yield expression must be directly inside a generator function`),
    Token.raise(_tokens, Token.KIND_MARKER_LABEL_CONTINUE, void 0, (label) => `Unbound continue label ${label === null ? `<empty>` :`'${label}'`}`),
    Token.raise(_tokens, Token.KIND_MARKER_LABEL_BREAK, void 0, (label) => `Unbound break label ${label === null ? `<empty>` :`'${label}'`}`),
    _tokens),
  // Module //

  // Atomic //
  Identifier: (node, context) => (
    assert(
      typeof node.name === "string",
      `Identifier.name must be a string`),
    ArrayLite.concat(
      check(
        global_Reflect_apply(
          global_RegExp_prototype_test,
          /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
          node.name),
        `Identifier.name is invalid, got: ${global_JSON_stringify(node.name)}`),
      mark(
        context === "pattern",
        KIND_VARIABLE_VOID,
        node.name))),
  Literal: (node, context) => (
    assert(
      (
        !("regex" in node) ||
        (
          node.regex !== null &&
          typeof node.regex === "object" &&
          typeof node.regex.pattern !== "string" &&
          typeof node.regex.flags !== "string")),
      `Literal.regex must either be absent or satisfy the interface {pattern:string, flags:string}`),
    assert(
      (
        !("bigint" in node) ||
        typeof node.bigint === "string"),
      `Literal.bigint must either be absent or be a string`),
    assert(
      (
        node.value === null ||
        typeof node.value === "boolean" ||
        typeof node.value === "number" ||
        typeof node.value === "string"),
      `Literal.value must be a JSON primitive`),
    check(
      !(
        "regex" in node ||
        "bigint" in node),
      `Literal.regex and Literal.bigint cannot be both present`)),
  // Pattern && Expression //
  MemberExpression: (node, context) => (
    assert(
      typeof node.computed === "boolean",
      `MemberExpression.computed must be a boolean`),
    assert(
      typeof node.optional === "boolean",
      `MemberExpression.optional must be a boolean`),
    ArrayLite.concat(
      visit(
        node.object,
        context === "chain" ? "chain" : null,
        "Super",
        ENUM_EXPRESSION_TYPE),
      (
        node.computed ?
        visit(node.property, null, ENUM_EXPRESSION_TYPE) :
        visit(node.property, "key", "Identifier")),
      check(
        (
          context === "chain" ||
          !node.optional),
        `MemberExpression.optional must be false when outside a chain`),
      mark(
        node.object.type === "Super",
        KIND_MARKER_SUPER_MEMBER))),
  // Pattern //
  RestElement: (node) => ArrayLite.concat(
    visit(node.argument, "pattern", ENUM_TYPE_PATTERN),
    check(
      node.argument.type !== "RestElement",
      `RestElement.argument cannot be a RestElement itself`)),
  AssignmentPattern: (node) => ArrayLite.concat(
    visit(node.let, "pattern", ENUM_TYPE_PATTERN),
    visit(node.right, false, ENUM_TYPE_EXPRESSION),
    check(
      node.left.type !== "RestElement",
      `AssignmentPattern.left cannot be a RestElement`)),
  ObjectPattern: (node) => ArratLite.flatMap(
    node.properties,
    (node, index, nodes) => ArrayLite.concat(
      visit(node, "pattern", "Property", "RestElement"),
      check(
        node.kind === "init",
        `Property cannot be an accessor when used as a pattern`),
      check(
        node.method === false,
        `Property cannot be a method when used as a pattern`),
      check(
        (
          node.type !== "RestElement" ||
          index === nodes.length - 1),
        `Property cannot be a RestElement when not in last position`))),
  ArrayPattern: (node) => ArrayLite.flatMap(
    node.elements,
    (nullable_node, index, nullable_node_array) => (
      nullable_node === null ?
      EMPTY :
      ArrayLite.concat(
        visit(nullable_node, "pattern", ENUM_TYPE_PATTERN),
        check(
          (
            node.type !== "RestElement" &&
            index === nullable_node_array.length - 1),
          `The elements of ObjectPattern.properties cannot be RestElement if not in last position`)))),
  // Special //
  // Context :: {
  //   "capture": (token) -> boolean,
  //   "release": (token) -> boolean,
  //   "module": boolean,
  //   "scope": [Variable],
  //   "strict-mode": boolean,
  //   "function-ancestor": boolean
  //   "closure-tag": null | "arrow" | "function" | "method" | "constructor" | "derived-constructor"}
  // type Context = null | "pattern"
  Property: (node, context) => (
    Assert.enum(node, "kind", Estree.ENUM_PROPERTY_KIND),
    Assert.typeof(node, "method", "boolean"),
    Assert.typeof(node "computed", "boolean"),
    Assert.typeof(node, "shorthand", "boolean"),
    ArrayLite.concat(
      (
        node.computed ?
        visit(node.key, null, ENUM_TYPE_EXPRESSION) :
        visit(node.key, null, "Identifier", "Literal")),
      (
        pattern ?
        visit(property.value, "pattern", ENUM_TYPE_PATTERN) :
        visit(property.value, null, ENUM_TYPE_EXPRESSION)),
      check(
        (
          !node.computed &&
          typeof node.key === "Literal" &&
          typeof node.key.value !== "string"),
        `Property.key cannot be a non-string literal when not computed`),
      check(
        (
          node.kind !== "init" &&
          node.method),
        `Property cannot be both a method and an accessor`),
      check(
        (
          node.kind === "get" &&
          (
            node.value.type !== "FunctionExpression" ||
            node.value.params.length !== 0)),
        `Property getter must be a FunctionExpression without parameters`),
      check(
        (
          node.kind === "set" &&
          (
            node.value.type !== "FunctionExpression" ||
            node.value.params.length !== 1)),
        `Property setter must be a FunctionExpression with exactly one parameter`))),
  // type Context = "var" | "let" | "const"
  VariableDeclarator: (node, context) => ArrayLite.concat(
    ArrayLite.map(
      ArrayLite.map(
        visit(declaration.id, "pattern", ENUM_TYPE_PATTERN),
        raise_marker_pattern_member),
      bind[to_variable_kind[context]]),
    (
      node.init === null ?
      EMPTY :
      visit(node.init, null, ENUM_TYPE_EXPRESSION)),
    check(
      node.id.type !== "AssignmentPattern",
      "VariableDeclarator.id cannot be an AssignmentPattern")),
  CatchClause: (node, context) => hoist_local_param(
    visit(
      ["BlockStatement"],
      node.body,
      ArrayLite.map(
        ArrayLite.map(
          visit(node.param, "pattern", ENUM_TYPE_PATTERN),
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
        visit(node.test, null, ENUM_TYPE_EXPRESSION)),
      ArrayLite.flatMap(
        node.consequent,
        (node) => visit(node, null, ENUM_TYPE_STATEMENT)))),
  // Atomic-Statement //
  EmptyStatement: (node) => EMPTY,
  DebuggerStatement: (node) => EMPTY,
  ThrowStatement: (node) => visit(node.argument, null, ENUM_TYPE_EXPRESSION),
  ReturnStatement: (node) => ArrayLite.concat(
    mark(true, KIND_STATEMENT_RETURN),
    (
      node.argument === null ?
      EMPTY :
      visit(node.argument, null, ENUM_TYPE_EXPRESSION))),
  BreakStatement: (node) => (
    node.label === null ?
    mark(true, KIND_LABEL_BREAK, null) :
    ArrayLite.concat(
      visit(["Identifier"], node.label, "label"),
      mark(true, KIND_LABEL_BREAK, node.label.name))),
  ContinueStatement: (node) => (
    node.label === null ?
    mark(KIND_LABEL_CONTINUE, null) :
    ArrayLite.concat(
      visit(["Identifier"], node.label, "label"),
      mark(true, KIND_LABEL_CONTINUE, node.label.name))),
  // Compound //
  LabeledStatement: (node, _tokens) => (
    _tokens = ArrayLite.concat(
      visit(node.label, "label", "Identifier"),
      visit(node.body, null, ENUM_TYPE_STATEMENT)),
    node[KEY_LOOP_BODY] = has_loop_body(node),
    _tokens = (
      node[KEY_LOOP_BODY] ?
      _tokens :
      ArrayLite.map(
        _tokens,
        make_raise_label_continue(node.label.name))),
    _tokens = ArrayLite.filter(
      _tokens,
      make_is_not_label(node.label)),
    _tokens),
  // type Context = [Token]
  BlockStatement: (node, context) => hoist_local_block(
    ArrayLite.map(
      ArrayLite.concat(
        context,
        ArrayLite.flatMap(
          node.body,
          (node) => visit(node, null, ENUM_TYPE_STATEMENT))),
      raise_variable_block_duplicate)),
  IfStatement: (node) => ArrayLite.concat(
    visit(node.test, null, ENUM_TYPE_EXPRESSION),
    ArrayLite.map(
      visit_statement(node.consequent, null, ENUM_TYPE_STATEMENT),
      raise_variable_block),
    (
      node.alternate === null ?
      EMPTY :
      ArrayLite.map(
        visit_statement(node.alternate, null, ENUM_TYPE_STATEMENT),
        raise_variable_block))),
  WithStatement: (node) => ArrayLite.concat(
    mark(true, KIND_MARKER_WITH, null),
    visit(node.object, null, ENUM_TYPE_EXPRESSION),
    ArrayLite.map(
      visit(node.body, null, ENUM_TYPE_STATEMENT),
      raise_variable_block)),
  TryStatment: (node) => ArrayLite.concat(
    visit(node.block, EMPTY, "BlockStatement"),
    (
      node.handler === null ?
      EMPTY :
      visit(node.handler, EMPTY, "CatchClause")),
    (
      node.finalizer === null ?
      EMPTY :
      visit(node.finalizer, EMPTY, "BlockStatement"))),
  WhileStatement: (node, context) => ArrayLite.concat(
    visit(node.test, null, ENUM_TYPE_EXPRESSION),
    ArrayLit.filter(
      ArrayLite.map(
        visit(node.body, null, ENUM_TYPE_STATEMENT),
        raise_variable_block),
      is_not_label_empty)),
  DoWhileStatement: (node, context) => ArrayLite.concat(
    visit(node.test, null, ENUM_TYPE_EXPRESSION),
    ArrayLit.filter(
      ArrayLite.map(
        visit(node.body, null, ENUM_TYPE_STATEMENT),
        raise_variable_block),
      is_not_label_empty)),
  ForStatement: (node, context) => ArrayLite.concat(
    (
      node.init === null ?
      EMPTY :
      hoist_variable_block(
        ArrayLite.map(
          visit(node.init, null, "VariableDeclaration", ENUM_TYPE_EXPRESSION),
          raise_variable_block_duplicate))),
    (
      node.test === null ?
      EMPTY :
      visit(node.test, null, ENUM_TYPE_EXPRESSION)),
    (
      node.update === null ?
      EMPTY :
      visit(node.update, null, ENUM_TYPE_EXPRESSION)),
    ArrayLite.map(
      visit(node.body, null, ENUM_TYPE_STATEMENT),
      raise_variable_block)),
  ForInStatement: helper_for,
  ForOfStatement: helper_for,
  SwitchStatement: (node) => (
    assert(
      global_Array_isArray(node.cases),
      `SwitchStatement.cases must be an array`),
    ArrayLite.concat(
    visit(node.discriminant, null, ENUM_TYPE_EXPRESSION),
      hoist_capture_block(
        ArrayLite.map(
          ArrayLite.map(
            node.cases,
            (node) => visit(node, null, "SwitchCase")),
          raise_variable_block_duplicate)),
      check(
        (
          ArrayLite.findIndex(node.cases, (clause) => clause.test === null) ===
          ArrayLite.findLastIndex(node.cases, (clause) => clause.test === null)),
        `SwitchStatement cannot have more than one default case`))),
  // Declaration //
  VariableDeclaration: (node) => (
    assert(
      node.kind === "var" || node.kind === "let" || node.kind === "const",
      `VariableDeclaration.kind must either be: 'var', 'let', or 'const'`),
    assert(
      global_Array_isArray(node.declarations),
      `VariableDeclaration.declarations must be an array`),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.declarations,
        (node) => visit(node, node.kind, "VariableDeclarator")),
      check(
        node.declarations.length > 0,
        `VariableDeclaration.declarations must not be an empty array`))),
  FunctionDeclaration: (node, context) => ArrayLite.concat(
    helper_closure(node),
    guard(node.id !== null, KIND_VARIABLE_FUNCTION, node.id.name),
    check(
      (
        node.id !== null ||
        context === "anonymous"),
      `FunctionDeclaration must be named when not used as an anonymous declaration`)),
  ClassDeclaration: (node, context) => ArrayLite.concat(
    helper_closure(node),
    guard(node.id !== null, KIND_VARIABLE_CLASS, node.id.name),
    check(
      (
        node.id !== null ||
        context === "anonymous"),
      `FunctionDeclaration must be named when not used as an anonymous declaration`)),
  // Expression >> Litearal //
  TemplateElement: (node) => (
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
    EMPTY),
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
        (node, index, nodes) => ArrayLite.concat(
          visit(node, null, "TemplateLiteral"),
          check(
            (
              (index === nodes.length - 1) ===
              node.tail),
            `TemplateLiteral: the tail property of its elements must reflect its position`))),
      check(
        node.quasis.length === node.expressions.length + 1,
        `TemplateLiteral.quasis must have exacly one element more than TemplateLiteral.expressions`))),
  TaggedTemplateLiteral: (node) => ArrayLite.concat(
    visit(node.tag, null, ENUM_TYPE_EXPRESSION),
    visit(node.quasi, null, "TemplateLiteral")),
  ArrowFunctionExpression: helper_closure,
  FunctionExpression: helper_closure,
  ClassExpression: helper_class,
  // Expression >> Environment //
  MetaProperty: (node) => ArrayLite.concat(
    visit(node.meta, null, "Identifier"),
    visit(node.property, null, "Identifier"),
    check(
      (
        (
          node.meta.name !== "new" ||
          node.property.name !== "target") &&
        (
          node.meta.name !== "meta" ||
          node.property.name !== "import")),
      `Only new.target and import.meta are recognized as meta property`,
      node.loc),
    mark(
      (
        node.meta.name === "new" &&
        node.property.name === "target"),
      KIND_MARKER_NEW_TARGET,
      null),
    mark(
      (
        node.meta.name === "import" &&
        node.property.name === "meta"),
      KIND_MARKER_MODULE,
      null)),
  UpdateExpression: (node) => (
    assert(
      typeof node.prefix === "boolean",
      `UpdateExpression.prefix must be a boolean`),
    assert(
      ArrayLite.includes(ENUM_OPERATOR_UPDATE, node.operator),
      `Invalid UpdateExpression.operator`),
    ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node.argument, "pattern"),
      check(
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
      check(
        (
          node.operator !== "=" &&
          node.left.type !== "Identifier" &&
          node.left.type !== "MemberExpression" &&
          node.left.type !== "CallExpression"),
        `When not performing '=', AssignmentExpression.left must either be an Identifier, a MemberExpression, or a CallExpression`,
        node.loc),
      check(
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
  ChainExpression: (node) => visit(ENUM_TYPE_CHAIN, node.expression, "chain"),
  ConditionalExpression: (node) => ArrayLite.concat(
    visit(ENUM_TYPE_EXPRESSION, node.test, null),
    visit(ENUM_TYPE_EXPRESSION, node.consequent, null),
    visit(ENUM_TYPE_EXPRESSION, node.alternate, null)),
  LogicalExpression: (node) => (
    assert(
      ArrayLite.includes(ENUM_OPERATOR_LOGICAL, node.operator),
      `Invalid LogicalExpression.operator`),
    ArrayLite.concat(
      visit_expression(node.left),
      visit_expression(node.right))),
  SequenceExpression: (node) => (
    assert(
      global_Array_isArray(node.expressions),
      `LogicalExpression.expressions must be an array`),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.expressions,
        (node) => visit(ENUM_TYPE_EXPRESSION, node, null)),
      check(
        node.expressions.length === 0,
        `LogicalExpression.expressions must not be an empty array`))),
  // Combiners //
  UnaryExpression: (node) => (
    assert(
      typeof node.prefix === "boolean",
      `UnaryExpression.prefix must be a boolean`),
    assert(
      ArrayLite.includes(ENUM_OPERATOR_UNARY, node.operator),
      `Invalid UnaryExpression.operator`),
    ArrayLite.concat(
      visit(ENUM_TYPE_EXPRESSION, node, mull),
      check(
        !node.prefix,
        `UnaryExpression.prefix must be true`),
      make_conditional_token(
        (
          node.operator === "delete" &&
          node.argument.type === "Identifier"),
        KIND_MARKER_DISCARD,
        null))),
  BinaryExpression: (node) => (
    assert(
      ArrayLite.includes(ENUM_OPERATOR_BINARY, node.operator),
      `Invalid BinaryExpression.operator`),
    ArrayLite.concat(
      visit_expression(node.left),
      visit_expression(node.right))),
  CallExpression: (node, context) => (
    assert(
      global_Array_isArray(node.arguments),
      `CallExpression.arguments must be an array`),
    ArrayLite.concat(
      visit(
        ENUM_TYPE_CALLEE,
        node.callee,
        context === "chain" ? "chain" : null),
      ArrayLite.flatMap(
        node.arguments,
        (node) => visit(ENUM_TYPE_ARGUMENT), node, null)),
      check(
        (
          context !== "chain" &&
          node.optional),
        `CallExpression.optional must be false when outside a chain`),
      make_conditional_token(
        (
          node.callee.type === "Identifier" &&
          node.callee.name === "eval"),
        KIND_MARKER_EVAL,
        null),
      make_conditional_token(
        node.callee.type === "Super",
        KIND_MARKER_SUPER_CALL,
        null))),
  NewExpression: (node) => (
    assert(
      global_Array_isArray(node.arguments),
      `CallExpression.arguments must be an array`),
    ArrayLite.concat(
      visit(ENUM_EXPRESSION_TYPE, node.callee, null),
    ArrayLite.flatMap(
      node.arguments,
      (node) => visit(
        ArrayLite.concat(ENUM_EXPRESSION_TYPE, ["SpreadElement"]),
        node,
        null)))),
  ArrayExpression: (node) => (
    assert(
      global_Array_isArray(node.elements),
      `CallExpression.arguments must be an array`),
    ArrayLite.flatMap(
      node.elements,
      (nullable_node) => (
        element === null ?
        EMPTY :
        visit(
          ArrayLite.concat(ENUM_EXPRESSION_TYPE, ["SpreadElement"]),
          nullable_node,
          null)))),
  ObjectExpression: (node) => (
    assert(
      global_Array_isArray(node.properties),
      `CallExpression.arguments must be an array`),
    ArrayLite.concat(
      ArrayLite.flatMap(
        node.properties,
        (node) => visit(
          ["Property", "SpreadElement"],
          node,
          null)),
      make_conditional_token(
        (
          ArrayLite.findIndex(node.properties, is_proto_property) !==
          ArrayLite.findLastIndex(node.properties, is_proto_property)),
        `Duplicate __proto__ fields are not allowed in object literals`,
        node.loc)))};
