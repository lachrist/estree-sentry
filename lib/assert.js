"use strict";

const State = require("./state.js");

const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;
const global_Error_prototype = global.Error.prototype;
const global_Object_prototype_toString = global.Object.prototype.toString;

const error = (message) => {
  const error = {
    __proto__: global_Error_prototype,
    name: "SentryError",
    message
  };
  global_Reflect_defineProperty(error, "loc", {
    value: State.loc,
    writable: true,
    configurable: false
  });
  return error;
};

const print = (value) => {
  if (typeof value === "string") {
    return global_JSON_stringify(value);
  }
  if ((typeof value === "object" && value !== null) || typeof value === "function") {
    global_Reflect_apply(global_Object_prototype_toString, value, []);
  }
  return global_String(value);
};

exports.node = (node, typess) => {
  if (typeof node !== "object" || node === null) {
    throw error(`Node is ${print(node)} and must be an non-null object`);
  }
  if (typeof node.type !== "string") {
    throw error(`Node.type is ${print(node.type)} and must be a string`);
  }
  if (typeof typess === "string") {
    if (node.type !== typess) {
      throw error(`Note.type is ${print(node.type)} and must be ${global_JSON_stringify(typess)}`);
    }
    return null;
  }
  const length = typess.length;
  for (let index = 0; index < length; index++) {
    const types = typess[index];
    if (typeof types === "string") {
      if (node.type === types) {
        return null;
      }
    } else {
      const length = types.length;
      for (let index = 0; index < length; index++) {
        if (node.type === types[index]) {
          return null;
        }
      }
    }
  }
  throw error(`Note.type is ${print(node.type)} and must one of ${global_JSON_stringify(typess, null, 2)}`);
};

exports.enum = (node, key, values) => {
  const length = values.length;
  const value = node[key];
  for (let index = 0; index < length; index++) {
    if (value === values[index]) {
      return null;
    }
  }
  throw error(`${node.type}.${key} is ${print(value)} and should be one of ${global_JSON_stringify(typess, null, 2)}`);
};

exports.typeof = (node, key, type) => {
  const value = node[key];
  if (typeof value === type) {
    return null;
  }
  throw error(`${node.type}.${key} is ${print(value)} and must be a ${type}`);
};

exports.array = (node, key) => {
  const value = node[key];
  if (global_Array_isArray(value)) {
    return null;
  }
  throw error(`${node.type}.${key} is ${print(value)} and must be an array`);
};

exports.json = (node, key) => {
  const value = node[key];
  if (value === null) {
    return null;
  }
  const type = typeof node[key]
  if (type === "boolean" || type === "number" || type === "string") {
    return null;
  }
  throw error(`${node.type}.${key} is ${print(value)} and must be a json primitive`);
};
