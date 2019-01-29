"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var hareactive_1 = require("@funkia/hareactive");
var component_1 = require("./component");
var utils_1 = require("./utils");
HTMLElementEventMap;
A;
StreamDescription < A > (_a = {
        return: function () { }
    },
    _a[eventName, f] = ,
    _a
);
T;
hareactive_1.Stream < T[K][2] >
;
;
A,
    init;
(function (elm) { return A; });
BehaviorDescription < A > (_b = {
        return: function () { }
    },
    _b[eventName, f, init] = ,
    _b
);
T;
hareactive_1.Behavior < T[K][3] >
;
;
CSSStyleDeclaration;
    | hareactive_1.Behavior(
        | CSSStyleDeclaration[N]);
"behaviors";
BehaviorDescriptions
    ? BehaviorOutput({}) &
        DefaultOutput
            >  : ;
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
        element.setAttribute(key, value.toString());
    }
}; };
var propertySetter = function (element) { return function (key, value) {
    return (element[key] = value);
}; };
var classSetter = function (element) { return function (key, value) {
    return element.classList.toggle(key, value);
}; };
var styleSetter = function (element) { return function (key, value) {
    return (element.style[key] = value);
}; };
function handleObject(object, element, createSetter) {
    if (object !== undefined) {
        var setter_1 = createSetter(element);
        var _loop_1 = function(key) {
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
        var _loop_2 = function(name_2) {
            var actionTrigger = actions[name_2];
            var actionDefinition = actionDefinitions[name_2];
            if (isStreamActions) {
                actionTrigger.subscribe(function (value) { return actionDefinition(elm, value); });
            }
            else {
                component_1.viewObserve(function (value) { return actionDefinition(elm, value); }, (actionTrigger));
            }
        };
        for (var _i = 0, _a = Object.keys(actions); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            _loop_2(name_2);
        }
    }
}
function handleClass(desc, elm) {
    if (hareactive_1.isBehavior(desc)) {
        var previousClasses_1;
        component_1.viewObserve(function (value) {
            if (previousClasses_1 !== undefined) {
                (_a = elm.classList).remove.apply(_a, previousClasses_1);
            }
            previousClasses_1 = value.split(" ");
            (_b = elm.classList).add.apply(_b, previousClasses_1);
            var _a, _b;
        }, desc);
    }
    else if (Array.isArray(desc)) {
        for (var _i = 0, desc_1 = desc; _i < desc_1.length; _i++) {
            var d = desc_1[_i];
            handleClass(d, elm);
        }
    }
    else if (typeof desc === "string") {
        var classes = desc.split(" ");
        (_a = elm.classList).add.apply(_a, classes);
    }
    else {
        handleObject(desc, elm, classSetter);
    }
    var _a;
}
function handleEntryClass(desc, elm) {
    var classes = desc.split(" ");
    (_a = elm.classList).add.apply(_a, classes);
    // Wait two frames so that we get one frame with the class
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            (_a = elm.classList).remove.apply(_a, classes);
            var _a;
        });
    });
    var _a;
}
var propKeywords = new Set([
    "style",
    "attrs",
    "props",
    "class",
    "actionDefinitions",
    "actions",
    "setters",
    "entry",
    "behaviors",
    "streams"
]);
/**
 * Set of things that should be handled as properties and not attributes.
 */
var isProperty = new Set(["value"]);
function handleProps(props, elm) {
    var output = {};
    var attrs = Object.assign({}, props.attrs);
    var properties = Object.assign({}, props.props);
    for (var _i = 0, _a = Object.entries(props); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (!propKeywords.has(key)) {
            if (isProperty.has(key)) {
                properties[key] = value;
            }
            else {
                attrs[key] = value;
            }
        }
    }
    handleObject(props.style, elm, styleSetter);
    handleObject(attrs, elm, attributeSetter);
    handleObject(properties, elm, propertySetter);
    if (props.class !== undefined) {
        handleClass(props.class, elm);
    }
    if (props.entry !== undefined) {
        if (props.entry.class !== undefined) {
            handleEntryClass(props.entry.class, elm);
        }
    }
    if (props.actionDefinitions !== undefined) {
        handleCustom(elm, true, props.actionDefinitions, props.actions);
        handleCustom(elm, false, props.actionDefinitions, props.setters);
    }
    if (props.behaviors !== undefined) {
        var _loop_3 = function(name_3) {
            var _c = props.behaviors[name_3], evt = _c[0], extractor = _c[1], getter = _c[2];
            var a = undefined;
            Object.defineProperty(output, name_3, {
                enumerable: true,
                get: function () {
                    if (a === undefined) {
                        a = hareactive_1.behaviorFromEvent(elm, evt, getter, extractor);
                    }
                    return a;
                },
                set: function (value) {
                    return (a = value);
                }
            });
        };
        for (var _d = 0, _e = Object.keys(props.behaviors); _d < _e.length; _d++) {
            var name_3 = _e[_d];
            _loop_3(name_3);
        }
    }
    if (props.streams !== undefined) {
        var _loop_4 = function(name_4) {
            var _f = props.streams[name_4], evt = _f[0], extractor = _f[1];
            var a = undefined;
            if (output[name_4] === undefined) {
                Object.defineProperty(output, name_4, {
                    enumerable: true,
                    get: function () {
                        if (a === undefined) {
                            a = hareactive_1.streamFromEvent(elm, evt, extractor);
                        }
                        return a;
                    },
                    set: function (value) {
                        return (a = value);
                    }
                });
            }
        };
        for (var _g = 0, _h = Object.keys(props.streams); _g < _h.length; _g++) {
            var name_4 = _h[_g];
            _loop_4(name_4);
        }
    }
    return output;
}
exports.handleProps = handleProps;
var DomComponent = (function (_super) {
    __extends(DomComponent, _super);
    function DomComponent(tagName, props, child) {
        _super.call(this);
        this.tagName = tagName;
        this.props = props;
        this.child = child;
        if (child !== undefined) {
            this.child = component_1.toComponent(child);
        }
    }
    DomComponent.prototype.run = function (parent, destroyed) {
        var ns = this.props.namespace;
        var elm = ns
            ? document.createElementNS(ns, this.tagName)
            : document.createElement(this.tagName);
        delete this.props.namespace;
        var output = handleProps(this.props, elm);
        var explicit = {};
        parent.appendChild(elm);
        if (this.child !== undefined) {
            var childResult = this.child.run(elm, destroyed.mapTo(false));
            Object.assign(explicit, childResult.explicit);
            Object.assign(output, childResult.explicit);
        }
        destroyed.subscribe(function (toplevel) {
            if (toplevel) {
                parent.removeChild(elm);
            }
            // TODO: cleanup listeners
        });
        return { explicit: explicit, output: output };
    };
    return DomComponent;
}(component_1.Component));
P
    ? {}(props ?  : P) : component_1.Component();
// Only child
;
Child > (child);
Ch;
component_1.Component();
{
    // Required props
    // Only props
    ();
}
 & {}(props, P, child, Ch);
component_1.Component();
;
function wrapper(fn) {
    function wrappedComponent(newPropsOrChild, childOrUndefined) {
        var props = newPropsOrChild !== undefined && !component_1.isChild(newPropsOrChild)
            ? newPropsOrChild
            : undefined;
        var child = childOrUndefined !== undefined
            ? component_1.toComponent(childOrUndefined)
            : component_1.isChild(newPropsOrChild)
                ? component_1.toComponent(newPropsOrChild)
                : undefined;
        return fn(props, !, child);
    }
    return wrappedComponent;
}
exports.wrapper = wrapper;
function element(tagName, defaultElementProps) {
    var mergedProps = utils_1.mergeDeep(defaultElementProps, defaultProperties);
    return wrapper(function (p, child) {
        var finalProps = utils_1.mergeDeep(mergedProps, p);
        return new DomComponent(tagName, finalProps, child);
    });
}
exports.element = element;
function svgElement(tagName, defaultElementProps) {
    return element.apply(void 0, [tagName, {}].concat(defaultElementProps, [namespace, "http://www.w3.org/2000/svg"]));
}
exports.svgElement = svgElement;
;
var _a, _b;
