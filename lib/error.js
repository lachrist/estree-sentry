"use strict";

const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Error_prototype = global.Error.prototype;

const make = (name) => {
  const constructor = function (message, loc) {
    this.message = message;
    global_Reflect_defineProperty(this, "loc", {
      value: loc,
      writable: true,
      enumerable: false,
      configurable: true
    });
  };
  global_Reflect_defineProperty(constructor, "name", {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true
  });
  constructor.prototype = {
    __proto__: global_Error_prototype,
    name: name,
    message: null,
    loc: null
  };
  global_Reflect_defineProperty(constructor.prototype, "constructor", {
    value: name,
    writable: true,
    enumerable: false,
    configurable: true
  });
  return constructor;
};

exports.EstreeSentryError = make("EstreeSentryError");

exports.SyntaxSentryError = make("SyntaxSentryError");

exports.OptionSentryError = make("OptionSentryError");
