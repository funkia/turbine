"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var hareactive_1 = require("@funkia/hareactive");
var component_1 = require("./component");
var utils_1 = require("./utils");
function streamDescription(eventName, f) {
    return [eventName, f]; // The third value don't exist it's for type info only
}
exports.streamDescription = streamDescription;
function behaviorDescription(eventName, f, init) {
    return [eventName, f, init]; // The fourth value don't exist it's for type info only
}
exports.behaviorDescription = behaviorDescription;
// An array of names of all DOM events
exports.allDomEvents = Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(document)))
    .filter(function (i) { return i.indexOf("on") === 0; })
    .map(function (name) { return name.slice(2); });
// Output streams that _all_ elements share
var defaultStreams = {};
for (var _i = 0, allDomEvents_1 = exports.allDomEvents; _i < allDomEvents_1.length; _i++) {
    var name_1 = allDomEvents_1[_i];
    defaultStreams[name_1] = streamDescription(name_1, utils_1.id);
}
var defaultProperties = {
    streams: defaultStreams
};
var attributeSetter = function (element) { return function (key, value) {
    if (value === true) {
        element.setAttribute(key, "");
    }
    else if (value === false) {
        element.removeAttribute(key);
    }
    else {
        element.setAttribute(key, value);
    }
}; };
var propertySetter = function (element) { return function (key, value) {
    return element[key] = value;
}; };
var classSetter = function (element) { return function (key, value) {
    return element.classList.toggle(key, value);
}; };
var styleSetter = function (element) { return function (key, value) {
    return element.style[key] = value;
}; };
function handleObject(object, element, createSetter) {
    if (object !== undefined) {
        var setter_1 = createSetter(element);
        var _loop_1 = function (key) {
            var value = object[key];
            if (hareactive_1.isBehavior(value)) {
                component_1.viewObserve(function (newValue) { return setter_1(key, newValue); }, value);
            }
            else {
                setter_1(key, value);
            }
        };
        for (var _i = 0, _a = Object.keys(object); _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_1(key);
        }
    }
}
function handleCustom(elm, isStreamActions, actionDefinitions, actions) {
    if (actions !== undefined) {
        var _loop_2 = function (name_2) {
            var actionTrigger = actions[name_2];
            var actionDefinition = actionDefinitions[name_2];
            if (isStreamActions) {
                actionTrigger.subscribe(function (value) { return actionDefinition(elm, value); });
            }
            else {
                component_1.viewObserve(function (value) { return actionDefinition(elm, value); }, actionTrigger);
            }
        };
        for (var _i = 0, _a = Object.keys(actions); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            _loop_2(name_2);
        }
    }
}
var CreateDomNow = (function (_super) {
    __extends(CreateDomNow, _super);
    function CreateDomNow(parent, tagName, props, children) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.tagName = tagName;
        _this.props = props;
        _this.children = children;
        return _this;
    }
    ;
    CreateDomNow.prototype.run = function () {
        var output = {};
        var elm = document.createElement(this.tagName);
        if (this.props !== undefined) {
            handleObject(this.props.style, elm, styleSetter);
            handleObject(this.props.attrs, elm, attributeSetter);
            handleObject(this.props.props, elm, propertySetter);
            handleObject(this.props.classToggle, elm, classSetter);
            if (this.props["class"] !== undefined) {
                var classes = this.props["class"].split(" ");
                for (var _i = 0, classes_1 = classes; _i < classes_1.length; _i++) {
                    var name_3 = classes_1[_i];
                    elm.classList.add(name_3);
                }
            }
            handleCustom(elm, true, this.props.actionDefinitions, this.props.actions);
            handleCustom(elm, false, this.props.actionDefinitions, this.props.setters);
            if (this.props.behaviors !== undefined) {
                var _loop_3 = function (name_4) {
                    var _a = this_1.props.behaviors[name_4], evt = _a[0], extractor = _a[1], initialFn = _a[2];
                    var a = undefined;
                    var initial = initialFn(elm);
                    Object.defineProperty(output, name_4, {
                        enumerable: true,
                        get: function () {
                            if (a === undefined) {
                                a = behaviorFromEvent(evt, initial, extractor, elm);
                            }
                            return a;
                        }
                    });
                };
                var this_1 = this;
                for (var _a = 0, _b = Object.keys(this.props.behaviors); _a < _b.length; _a++) {
                    var name_4 = _b[_a];
                    _loop_3(name_4);
                }
            }
            if (this.props.streams !== undefined) {
                var _loop_4 = function (name_5) {
                    var _a = this_2.props.streams[name_5], evt = _a[0], extractor = _a[1];
                    var a = undefined;
                    if (output[name_5] === undefined) {
                        Object.defineProperty(output, name_5, {
                            enumerable: true,
                            get: function () {
                                if (a === undefined) {
                                    a = hareactive_1.streamFromEvent(elm, evt, extractor);
                                }
                                return a;
                            }
                        });
                    }
                };
                var this_2 = this;
                for (var _c = 0, _d = Object.keys(this.props.streams); _c < _d.length; _c++) {
                    var name_5 = _d[_c];
                    _loop_4(name_5);
                }
            }
        }
        if (this.children !== undefined) {
            var childOutput = component_1.runComponent(elm, component_1.toComponent(this.children));
            utils_1.assign(output, childOutput);
        }
        if (this.props.output !== undefined) {
            utils_1.rename(output, this.props.output);
        }
        this.parent.appendChild(elm);
        return output;
    };
    return CreateDomNow;
}(hareactive_1.Now));
function parseCSSTagname(cssTagName) {
    var parsedTag = cssTagName.split(/(?=\.)|(?=#)|(?=\[)/);
    var result = {};
    for (var i = 1; i < parsedTag.length; i++) {
        var token = parsedTag[i];
        switch (token[0]) {
            case "#":
                result.props = result.props || {};
                result.props.id = token.slice(1);
                break;
            case ".":
                result.classToggle = result.classToggle || {};
                result.classToggle[token.slice(1)] = true;
                break;
            case "[":
                result.attrs = result.attrs || {};
                var attr = token.slice(1, -1).split("=");
                result.attrs[attr[0]] = attr[1] || "";
                break;
            default:
                throw new Error("Unknown symbol");
        }
    }
    return [parsedTag[0], result];
}
function element(tagName, props) {
    var _a = parseCSSTagname(tagName), parsedTagName = _a[0], tagProps = _a[1];
    props = utils_1.mergeDeep(props, utils_1.mergeDeep(defaultProperties, tagProps));
    function createElement(newPropsOrChildren, newChildrenOrUndefined) {
        if (newChildrenOrUndefined === undefined && component_1.isChild(newPropsOrChildren)) {
            return new component_1.Component(function (p) { return new CreateDomNow(p, parsedTagName, props, newPropsOrChildren); });
        }
        else {
            var newProps_1 = utils_1.mergeDeep(props, newPropsOrChildren);
            return new component_1.Component(function (p) { return new CreateDomNow(p, parsedTagName, newProps_1, newChildrenOrUndefined); });
        }
    }
    return createElement;
}
exports.element = element;
function behaviorFromEvent(eventName, initial, extractor, dom) {
    var b = hareactive_1.sinkBehavior(initial);
    dom.addEventListener(eventName, function (ev) { return b.push(extractor(ev)); });
    return b;
}
