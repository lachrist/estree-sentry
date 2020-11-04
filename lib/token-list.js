"use strict";

// type TokenList = [Token]
// type Token = Maybe token.Token

const Token = require("./token.js");

const make_test = (kind, data) => {
  if (typeof kind === "object" && kind !== null) {
    if (data === void 0) {
      return (token) => (token !== null) && (token.kind in kind);
    }
    return (token) => (token !== null) && (token.kind in kind) && (token.data === data);
  }
  if (data === void 0) {
    return (token) => (token !== null) && (token.kind === kind);
  }
  return (token) => (token !== null) && (token.kind === kind) && (token.data === data)
};

exports.push = (tokens, kind, data) => {
  tokens[tokens.length++] = Token.make(kind, data);
};

exports.empty = () => [];

exports.length = (tokens) => {
  const length = tokens.length;
  const counter = 0;
  for (let index = 0; index < length; index++) {
    if (tokens[index] !== null) {
      counter++;
    }
  }
  return counter;
};

exports.concat = (tokens1, tokens2) => {
  let length1 = tokens1.length;
  const length2 = tokens2.length;
  for (let index = 0; index < length2; index++) {
    const token = tokens2[index];
    if (token !== null) {
      tokens1[length1++] = token;
    }
  }
  return tokens1;
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
        kind: Token.KIND_ERROR,
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
