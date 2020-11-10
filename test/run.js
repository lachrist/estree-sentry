
const EstreeSentry = require("../lib/index.js");
const Acorn = require("acorn");
const AcornLoose = require("acorn-loose");
const Assert = require("assert").strict;

class AcornError extends Error {};

const test = (code, source, options) => {
  const acorn_option_object = {
    ecmaVersion: 2020,
    sourceType: source === "module" ? "module" : "script"
  };
  let estree = null
  try {
    estree = Acorn.parse(code, acorn_option_object);
  } catch (error) {
    try {
      estree = AcornLoose.parse(code, acorn_option_object);
    } catch (error) {
      throw new AcornError(error.message);
    }
  }
  let errors = null;
  errors = EstreeSentry[source](estree, options);
  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length === 0) {
    return estree;
  }
  throw new global.Error(`Multiple syntax error:\n${errors.map(({message}) => message).join("\n")}`);
};

const assert_key = (node, key, value) => {
  if (value === global.undefined) {
    Assert.ok(!(key in node));
  } else {
    Assert.deepEqual(node[key], value);
  }
};

const assert_node = (node, use_strict, eval_call, capture, release) => {
  assert_key(node, "__estree_sentry_eval_call__", eval_call);
  assert_key(node, "__estree_sentry_use_strict__", use_strict);
  assert_key(node, "__estree_sentry_capture__", capture);
  assert_key(node, "__estree_sentry_release__", release);
};

assert_node(
  test(
    `
      let x = 123;
      var y = 456;
      function z () { 789 }
      class t {}
    `,
    "module",
    {
      "global-frame": [
        {duplicable:false, name: "x"},
        {duplicable:false, name: "y"},
        {duplicable:false, name: "z"},
        {duplicable:false, name: "t"},
        {duplicable:false, name: "u"}]}),
  false,
  false,
  [
    {kind: "let", duplicable:false, name:"x"},
    {kind: "var", duplicable:true, name:"y"},
    {kind: "function", duplicable:true, name:"z"},
    {kind: "class", duplicable:false, name:"t"}],
  []);

Assert.throws(
  () => test(
    `let x = 123;`,
    "script",
    {
      "scope": [
        {duplicable:false, name: "x"}]}),
  new EstreeSentry.SyntaxSentryError(`Duplicate let variable named x`));

Assert.throws(
  () => test(
    `
      'use strict';
      let x = 123;`,
    "script",
    {
      "scope": [
        {duplicable:false, name: "x"}]}),
  new EstreeSentry.SyntaxSentryError(`Duplicate let variable named x`));

Assert.throws(
  () => test(
    `let x = 123;`,
    "script",
    {
      "scope": [
        {duplicable:true, name: "x"}]}),
  new EstreeSentry.SyntaxSentryError(`Duplicate let variable named x`));

assert_node(
  test(
    `var x = 123;`,
    "script",
    {
      "scope": [
        {duplicable:true, name: "x"}]}),
  false,
  false,
  [],
  [
    {kind:"var", duplicable:true, name:"x"}]);

assert_node(
  test(
    `function x () { 123; }`,
    "script",
    {
      "scope": [
        {duplicable:true, name: "x"}]}),
  false,
  false,
  [],
  [
    {kind:"function", duplicable:true, name:"x"}]);


assert_node(
  test(
    ``,
