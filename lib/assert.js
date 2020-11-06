"use strict";

const global_Array_isArray = global.Array.isArray;

const State = require("./state.js");

const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;
const global_Error_prototype = global.Error.prototype;
const global_Object_prototype_toString = global.Object.prototype.toString;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const abort = (message) => {
  const error = {
    __proto__: global_Error_prototype,
    name: "SentryError",
    message
  };
  global_Reflect_defineProperty(error, "loc", {
    value: State.loc,
    enumerable: false,
    writable: true,
    configurable: true
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

exports.node = (node, discriminants) => {
  if (typeof node !== "object" || node === null) {
    throw error(`Node is ${print(node)} and must be an non-null object`);
  }
  const type = node.type;
  if (typeof type !== "string") {
    throw error(`Node.type is ${print(type)} and must be a string`);
  }
  for (let index = 0; index < discriminants.length; index++) {
    const discriminant = discriminants[index];
    if (typeof discriminant === "string") {
      if (type === discriminant) {
        return null;
      }
    } else if (type in discriminant) {
      return null;
    }
  }
  throw error(`Note.type is ${
    print(node.type)
  } and must be one of ${
    global_JSON_stringify(discriminant, null, 2)
  }`);
};

exports.object = (node, key1, canvas) => {
  if (typeof node[key1] !== "object" || node[key1] === null) {
    throw error(`${node.type}.${key1} must be an non-null object`);
  }
  for (let key2 of canvas) {
    if (typeof node[key1][key2] !== canvas[key2]) {
      throw error(`${node.type}.${key1}.${key2} must be a ${canvas[key2]}`);
    }
  }
};

exports.enum = (node, key, values) => {
  const length = values.length;
  const value = node[key];
  if (!(value in values)) {
    throw error(`${node.type}.${key} is ${
      print(value)
    } and should be one of ${
      global_JSON_stringify(global_Reflect_ownKeys(values), null, 2)
    }`);
  }
};

exports.typeof = (node, key, type) => {
  if (typeof node[key] !== type) {
    throw error(`${node.type}.${key} is ${print(value)} and must be a ${type}`);
  }
};

exports.array = (node, key) => {
  if (!global_Array_isArray(node[key])) {
    throw error(`${node.type}.${key} is ${print(value)} and must be an array`);
  }
};

exports.json = (node, key) => {
  const value = node[key];
  if (value !== null) {
    const type = typeof node[key];
    if (type !== "boolean" && type !== "number" && type !== "string") {
      throw error(`${node.type}.${key} is ${print(value)} and must be a json primitive`);
    }
  }
};
