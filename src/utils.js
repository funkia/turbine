"use strict";
exports.__esModule = true;
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
function isObject(item) {
    return typeof item === "object" && !Array.isArray(item);
}
function get(prop) {
    return function (obj) { return obj[prop]; };
}
exports.get = get;
function assign(a, b) {
    for (var _i = 0, _a = Object.keys(b); _i < _a.length; _i++) {
        var key = _a[_i];
        if (!(key in a)) {
            a[key] = b[key];
        }
    }
    return a;
}
exports.assign = assign;
function merge(a, b) {
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
exports.merge = merge;
function mergeDeep() {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
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
// Note this function mutates `source`
function rename(source, renames) {
    for (var _i = 0, _a = Object.keys(renames); _i < _a.length; _i++) {
        var newName = _a[_i];
        var name_1 = renames[newName];
        source[newName] = source[name_1];
    }
}
exports.rename = rename;
function id(a) { return a; }
exports.id = id;
