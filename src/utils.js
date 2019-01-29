"use strict";
var hareactive_1 = require("@funkia/hareactive");
function arrayConcat(arr1, arr2) {
    var result = [];
    for (var i = 0; i < arr1.length; ++i) {
        result.push(arr1[i]);
    }
    for (var i = 0; i < arr2.length; ++i) {
        result.push(arr2[i]);
    }
    return result;
}
function fst(a) {
    return a[0];
}
exports.fst = fst;
function snd(a) {
    return a[1];
}
exports.snd = snd;
function isObject(item) {
    return typeof item === "object" && !Array.isArray(item) && !hareactive_1.isBehavior(item);
}
function get(prop) {
    return , Obj;
    Record < K, V >> (obj);
    Obj;
    Obj[K];
    obj[prop];
}
exports.get = get;
function assign(a, b) {
    for (var _i = 0, _a = Object.keys(b); _i < _a.length; _i++) {
        var key = _a[_i];
        a[key] = b[key];
    }
    return a;
}
exports.assign = assign;
function mergeObj(a, b) {
    var c = {};
    for (var _i = 0, _a = Object.keys(a); _i < _a.length; _i++) {
        var key = _a[_i];
        c[key] = a[key];
    }
    for (var _b = 0, _c = Object.keys(b); _b < _c.length; _b++) {
        var key = _c[_b];
        c[key] = b[key];
    }
    return c;
}
exports.mergeObj = mergeObj;
T;
T[K];
;
function mergeDeep() {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i - 0] = arguments[_i];
    }
    // .length of function is 2
    var result = {};
    for (var _a = 0, objects_1 = objects; _a < objects_1.length; _a++) {
        var source = objects_1[_a];
        if (isObject(source)) {
            var keys = Object.keys(source);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var nextItem = source[key];
                if (Array.isArray(source[key]) && Array.isArray(result[key])) {
                    result[key] = arrayConcat(result[key], source[key]);
                }
                else if (isObject(source[key])) {
                    var subKeys = Object.keys(source[key]);
                    result[key] = result[key] || {};
                    for (var j = 0; j < subKeys.length; j++) {
                        var nextSubKey = subKeys[j];
                        result[key][nextSubKey] = nextItem[nextSubKey];
                    }
                }
                else {
                    result[key] = nextItem;
                }
            }
        }
    }
    return result;
}
exports.mergeDeep = mergeDeep;
function copyRemaps(remap, source) {
    var output = {};
    for (var key in remap) {
        output[key] = source[remap[key]];
    }
    return output;
}
exports.copyRemaps = copyRemaps;
function id(a) {
    return a;
}
exports.id = id;
