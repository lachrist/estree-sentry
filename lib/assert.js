"use strict";

const global_Array_isArray = global.Array.isArray;
const global_RegExp = global.RegExp;
const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;
const global_Error_prototype = global.Error.prototype;
const global_Object_prototype_toString = global.Object.prototype.toString;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_defineProperty = global.Reflect.defineProperty;

const State = require("./state.js");

const make_error = (message) => {
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
    return global_Reflect_apply(global_Object_prototype_toString, value, []);
  }
  return global_String(value);
};

exports.node = (node, discriminants) => {
  if (typeof node !== "object" || node === null) {
    throw make_error(`Node is ${print(node)} and must be an non-null object`);
  }
  const type = node.type;
  if (typeof type !== "string") {
    throw make_error(`Node.type is ${print(type)} and must be a string`);
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
  throw make_error(`Note.type is ${
    print(node.type)
  } and must be one of ${
    global_JSON_stringify(discriminants)
  }`);
};

exports.object = (node, key1, canvas) => {
  if (typeof node[key1] !== "object" || node[key1] === null) {
    throw make_error(`${node.type}.${key1} must be an non-null object`);
  }
  for (let key2 in canvas) {
    if (typeof node[key1][key2] !== canvas[key2]) {
      throw make_error(`${node.type}.${key1}.${key2} must be a ${canvas[key2]}`);
    }
  }
};

exports.enum = (node, key, values) => {
  const length = values.length;
  const value = node[key];
  if (!(value in values)) {
    throw make_error(`${node.type}.${key} is ${
      print(value)
    } and should be one of ${
      global_JSON_stringify(global_Reflect_ownKeys(values), null, 2)
    }`);
  }
};

exports.typeof = (node, key, type) => {
  const value = node[key];
  if (typeof value !== type) {
    throw make_error(`${node.type}.${key} is ${print(value)} and must be a ${type}`);
  }
};

exports.array = (node, key) => {
  if (node === void 0 || key === void 0) {
    throw new Error("foo");
  }
  const value = node[key];
  if (!global_Array_isArray(value)) {
    throw make_error(`${node}.${key} is ${print(value)} and must be an array`);
  }
};

exports.literal = (node, key) => {
  const value = node[key];
  if (value === null) {
    return null;
  }
  if (value instanceof global_RegExp) {
    return null;
  }
  const type = typeof value;
  if (type === "boolean" || type === "number" || type === "bigint" || type === "string") {
    return null;
  }
  throw make_error(`${node.type}.${key} is ${print(value)} and must either null, a boolean, a number, a bigint, or a RegExp`);
};
