"use strict";

// data Token =
//   -- Error --
//   ErrorToken Message Loc
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

const State = require("./state.js");

// Error //
const KIND_ERROR = "error";
exports.KIND_ERROR = KIND_ERROR;

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
exports.KIND_MARKER_IMPORT = "import";
exports.KIND_MARKER_EXPORT = "export";
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

////////////
// Atomic //
////////////

exports.push = (tokens, kind, data) => {
  tokens[tokens.length++] = {
    kind: kind,
    data: data,
    loc: State.loc
  };
};

exports.empty = () => [];

exports.length = (tokens) => {
  const length = tokens.length
  const counter = 0;
  for (let index = 0; index < length; index++) {
    if (tokens[index] !== null) {
      counter++;
    }
  }
  return counter;
};

exports.concat = (...args) => {
  const tokens = [];
  let counter = 0;
  const length = args.length;
  for (let index = 0; index < length; index++) {
    const arg = args[index];
    const length = arg.length;
    for (let index = 0; index < arg.length; index++) {
      if (arg[index] !== null) {
        tokens[counter++] = arg[index];
      }
    }
  }
  return tokens;
};

//////////////
// Standard //
//////////////

const make_test = (kind, data) => {
  if (typeof kind === "object" && kind !== null) {
    if (data === void 0) {
      return (element) => (element !== null) && (element.kind in kind);
    }
    return (element) => (element !== null) && (element.kind in kind) && (element.data === data);
  }
  if (data1 === void 0) {
    return (element) => (element !== null) && (element.kind === kind);
  }
  return ({kind2, data2}) => (element !== null) && (element.kind === kind) && (element.data === data)
};

exports.remove = (tokens, kind, data) => {
  const length = tokens.length;
  const test = make_test(kind, data);
  for (let index = 0; index < length; index++) {
    const token = tokens[index];
    if (test(token)) {
      tokens[index] = null;
    }
  }
};

exports.raise = (tokens, kind, data, message) => {
  const length = tokens.length;
  const test = make_test(kind, data);
  for (let index = 0; index < length; index++) {
    const token = tokens[index];
    if (test(token)) {
      tokens[index] = {
        kind: KIND_ERROR,
        data: typeof message === "function" ? message(token.data) : message,
        loc: token.loc
      };
    }
  }
};

exports.includes = (tokens, kind, data) => {
  const length = tokens.length;
  const test = make_test(kind, data);
  for (let index = 0; index < length; index++) {
    const token = tokens[index];
    if (test(token)) {
      return true;
    }
  }
  return false;
};

exports.extract = (tokens, kind, data, callback) => {
  const length = tokens.lenght;
  const test = make_test(kind, data);
  const array = [];
  let counter = 0;
  for (let index = 0; index < lenght; index++) {
    const token = tokens[index];
    if (test(token)) {
      array[counter++] = callback(token.kind, token.data, token.loc);
      tokens[index] = null;
    }
  }
  return array;
};

/////////////
// Special //
/////////////

// exports.raise_duplicate = (tokens, kinds1, kinds2, message) => {
//   const length = tokens.length;
//   for (let index1 = 0; index1 < length; index1++) {
//     const token1 = tokens[index1];
//     if (token1.kind in kinds1) {
//       for (let index2 = index1 + 1; index2 < length; index2++) {
//         const token2 = tokens[index2];
//         if (token2.kind in kinds2 && token1.data === token2.data) {
//           tokens[index2] = {
//             kind: KIND_ERROR,
//             data: typeof message === "function" message(token2.data) : message,
//             loc: token2.loc
//           };
//         }
//       }
//     }
//   }
// };

// ///////////
// // Label //
// ///////////
//
// exports.bind = (tokens, label, loop) => {
//   const length = tokens.length;
//   for (let index = 0; index < length; index++) {
//     const token = tokens[index];
//     if (token.kind === KIND_LABEL_BREAK && token.data === label) {
//       tokens[index] = null;
//     } else if (token.kind === KIND_LABEL_CONTINUE && token.data === label) {
//       if (loop) {
//         tokens[index] = null;
//       } else {
//         tokens[index] = {
//           kind: KIND_ERROR,
//           data: `Continue label ${token.data === null ? `<empty>` : `'${tokens.data}'`} does not refer to a loop statement` : ,
//           loc: Token.loc
//         };
//       }
//     }
//   }
// };
//
// //////////////
// // Variable //
// //////////////
//
// exports.hoist = (tokens, kinds, duplicable) => {
//   if (!duplicable) {
//   }
// };
//
//
//
//
// exports.push = (tokens, kind, data) => {
//   tokens[tokens.length] = {
//     kind: kind,
//     data: data,
//     loc: State.loc
//   };
// };
//
// exports.check = (boolean, message) => {
//   if (boolean) {
//     tokens[tokens.length] = {
//       kind: KIND_ERROR,
//       data: message,
//       loc: State.loc
//     };
//   }
// };
//
// // split :: [Maybe Token] -> Map Kind (Data -> a) -> [a] -> [Maybe Token]
// exports.split = (tokens1, kind, array) => {
//   const length = tokens1.length;
//   let length2 = array.length;
//   const tokens3 = [];
//   let length3 = 0
//   for (let index = 0; index < length1; index++) {
//     const token = tokens1[index];
//     if (token.kind === kind) {
//       array[length2++] = discriminant[token.kind](token.data);
//     } else {
//       tokens3[length3++] = token;
//     }
//   }
//   return tokens3;
// };
//
//
//
// exports.wrap = (kind, data) => [{
//   kind: kind,
//   data: data,
//   loc: State.loc
// }];
//
// exports.check = (boolean, message) => boolean ? EMPTY : [{
//   kind: KIND_ERROR,
//   data: message,
//   loc: State.loc
// }];
//
// exports.guard = (boolean, kind, data) => boolean ? [{
//   kind: kind,
//   data: data,
//   loc: State.loc
// }] : EMPTY;
//
// ///////////
// // Split //
// ///////////
//
// // split :: [Maybe Token] -> Map Kind (Data -> a) -> [a] -> [Maybe Token]
// exports.split = (tokens1, discriminant, array) => {
//   const length1 = tokens1.length;
//   let length2 = array.length;
//   const tokens3 = [];
//   let length3 = 0
//   for (let index = 0; index < length1; index++) {
//     const token = tokens1[index];
//     if (token.kind in discriminant) {
//       array[length2++] = discriminant[token.kind](token.data);
//     } else {
//       tokens3[length3++] = token;
//     }
//   }
//   return tokens3;
// };
//
// ////////////
// // Remove //
// ////////////
//
// // remove :: [Token] -> Set Kind -> [Token]
// exports.remove = (tokens1, discriminant) => {
//   const length1 = tokens1.length;
//   const tokens2 = [];
//   let length2 = 0;
//   for (let index = 0; index < length1; index++) {
//     const token = tokens1[index];
//     if (!(token.kind in discriminant)) {
//       tokens2[length2++] = tokens1[index];
//     }
//   }
//   return tokens2;
// };
//
// // remove :: [Token] -> Set Kind -> [Token]
// exports.remove_specific = (tokens1, discriminant, data) => {
//   const length1 = tokens1.length;
//   const tokens2 = [];
//   let length2 = 0;
//   for (let index = 0; index < length1; index++) {
//     const token = tokens1[index];
//     if (!(token.kind in discriminant && data === token.data)) {
//       tokens2[length2++] = tokens1[index];
//     }
//   }
//   return tokens2;
// };
//
// ///////////////
// // Transform //
// ///////////////
//
// // transform :: [Token] -> Map Kind Kind -> [Token]
// exports.transform = (tokens1, discriminant) => {
//   const length = token1.length;
//   const tokens2 = global_Array(length);
//   for (let index = 0; index < length; index++) {
//     const token = token1[index];
//     if (token.kind in discriminant) {
//       token2[index] = {
//         kind: discriminant[kind],
//         data: token.data,
//         loc: token.loc
//       };
//     } else {
//       token2[index] = token;
//     }
//   }
//   return token2;
// };
//
// //////////////
// // Includes //
// //////////////
//
// // includes :: [Token] -> Set Kind -> Bool
// exports.includes = (tokens, discriminant) => {
//   const length = tokens.length;
//   for (let index = 0; index < length; index++) {
//     if (tokens[index].kind in discriminant) {
//       return true;
//     }
//   }
//   return false;
// };
//
// //////////////
// // Finalize //
// //////////////
//
// // finalize :: [Token] -> [{message:String, loc:estree.SourceLocation}]
// exports.finalize = (tokens, callback) => {
//   const length = tokens.length;
//   const array = global_Array(length);
//   for (let index = 0; index < length; index++) {
//     const token = tokens[index];
//     Assert.internal(token.kind === KIND_ERROR, `A non-error token escaped`);
//     array[index] = {
//       message: token.data,
//       loc: token.loc
//     };
//   };
//   return array;
// };
//
// ///////////
// // Raise //
// ///////////
//
// // raise :: ([Token], Map Kind Message) -> [Token]
// exports.raise = (tokens1, discriminant) => {
//   const length = token1.length;
//   const tokens2 = global_Array(length);
//   for (let index = 0; index < length; index++) {
//     const token = token1[index];
//     if (token.kind in discriminant) {
//       token2[index] = {
//         kind: KIND_ERROR,
//         data: discriminant[token.kind],
//         loc: token.loc
//       };
//     } else {
//       token2[index] = token;
//     }
//   }
//   return tokens2;
// };
//
// // raise_specific :: ([Token], Map Kind (Data -> Message), Data) -> [Token]
// exports.raise_specific = (tokens1, discriminant, data) => {
//   const length = token1.length;
//   const tokens2 = global_Array(length);
//   for (let index = 0; index < length; index++) {
//     const token = token1[index];
//     if (token.kind in discriminant && token.data === data) {
//       token2[index] = {
//         kind: KIND_ERROR,
//         data: discriminant[token.kind](data),
//         loc: token.loc
//       };
//     } else {
//       token2[index] = token;
//     }
//   }
//   return tokens2;
// };
//
// // raise_duplicate :: ([Token], Set Kind, Set Kind, ((Kind, Kind, Data) -> Message)) -> [Token]
// exports.raise_duplicate = (tokens1, discriminant1, discriminant2, callback) => {
//   const length = tokens1.length;
//   const tokens2 = global_Array(length);
//   for (let index1 = 0; index1 < length; index1++) {
//     const token1 = tokens1[index1];
//     if (token1.kind in discriminant1) {
//       for (let index2 = 0; index2 < index1; index2++) {
//         const token2 = tokens1[index2];
//         if (token2.kind in discriminant2 && token2.data === token1.data) {
//           tokens2[index1] = {
//             kind: KIND_ERROR,
//             data: callback(data),
//             loc: token1.loc
//           };
//         } else {
//           tokens2[index1] = token;
//         }
//       }
//     }
//   }
//   return tokens2;
// };
