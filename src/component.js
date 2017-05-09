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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var jabz_1 = require("@funkia/jabz");
var hareactive_1 = require("@funkia/hareactive");
var utils_1 = require("./utils");
var supportsProxy = "Proxy" in window;
function isShowable(s) {
    return typeof s === "string" || typeof s === "number";
}
function fst(a) { return a[0]; }
function snd(a) { return a[1]; }
function isGeneratorFunction(fn) {
    return fn !== undefined
        && fn.constructor !== undefined
        && fn.constructor.name === "GeneratorFunction";
}
exports.isGeneratorFunction = isGeneratorFunction;
/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we wan't to
 * make it a monad in different way than Now.
 */
var Component = Component_1 = (function () {
    function Component(content) {
        this.content = content;
        this.multi = false;
    }
    Component.of = function (b) {
        return new Component_1(function () { return hareactive_1.Now.of(b); });
    };
    Component.prototype.of = function (b) {
        return Component_1.of(b);
    };
    Component.prototype.chain = function (f) {
        var _this = this;
        return new Component_1(function (parent) {
            return _this.content(parent).chain(function (a) {
                return f(a).content(parent);
            });
        });
    };
    return Component;
}());
Component.multi = false;
Component = Component_1 = __decorate([
    jabz_1.monad
], Component);
exports.Component = Component;
/** Run component and the now-computation inside */
function runComponent(parent, c) {
    if (typeof parent === "string") {
        parent = document.querySelector(parent);
    }
    return c.content(parent).run();
}
exports.runComponent = runComponent;
function testComponent(c) {
    var dom = document.createElement("div");
    var out = runComponent(dom, c);
    return {
        out: out,
        dom: dom
    };
}
exports.testComponent = testComponent;
function isComponent(c) {
    return c instanceof Component;
}
exports.isComponent = isComponent;
var placeholderProxyHandler = {
    get: function (target, name) {
        if (!(name in target)) {
            target[name] = hareactive_1.placeholder();
        }
        return target[name];
    }
};
var MfixComponentNow = (function (_super) {
    __extends(MfixComponentNow, _super);
    function MfixComponentNow(f, parent, placeholderNames) {
        var _this = _super.call(this) || this;
        _this.f = f;
        _this.parent = parent;
        _this.placeholderNames = placeholderNames;
        return _this;
    }
    MfixComponentNow.prototype.run = function () {
        var placeholderObject;
        if (supportsProxy) {
            placeholderObject = new Proxy({}, placeholderProxyHandler);
        }
        else {
            placeholderObject = {};
            if (this.placeholderNames !== undefined) {
                for (var _i = 0, _a = this.placeholderNames; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    placeholderObject[name_1] = hareactive_1.placeholder();
                }
            }
        }
        var result = this.f(placeholderObject).content(this.parent).run();
        var returned = Object.keys(result);
        for (var _b = 0, returned_1 = returned; _b < returned_1.length; _b++) {
            var name_2 = returned_1[_b];
            (placeholderObject[name_2]).replaceWith(result[name_2]);
        }
        return result;
    };
    return MfixComponentNow;
}(hareactive_1.Now));
function loop(f, placeholderNames) {
    if (isGeneratorFunction(f)) {
        f = jabz_1.fgo(f);
    }
    return new Component(function (parent) { return new MfixComponentNow(f, parent, placeholderNames); });
}
exports.loop = loop;
var MfixNow = (function (_super) {
    __extends(MfixNow, _super);
    function MfixNow(fn, placeholderNames) {
        var _this = _super.call(this) || this;
        _this.fn = fn;
        _this.placeholderNames = placeholderNames;
        return _this;
    }
    ;
    MfixNow.prototype.run = function () {
        var placeholders;
        if (supportsProxy) {
            placeholders = new Proxy({}, placeholderProxyHandler);
        }
        else {
            placeholders = {};
            if (this.placeholderNames !== undefined) {
                for (var _i = 0, _a = this.placeholderNames; _i < _a.length; _i++) {
                    var name_3 = _a[_i];
                    placeholders[name_3] = hareactive_1.placeholder();
                }
            }
        }
        var _b = this.fn(placeholders).run(), behaviors = _b[0], out = _b[1];
        // Tie the recursive knot
        for (var _c = 0, _d = Object.keys(behaviors); _c < _d.length; _c++) {
            var name_4 = _d[_c];
            (placeholders[name_4]).replaceWith(behaviors[name_4]);
        }
        return [behaviors, out];
    };
    ;
    return MfixNow;
}(hareactive_1.Now));
function addErrorHandler(modelName, viewName, obj) {
    if (modelName === "") {
        modelName = "anonymous";
    }
    if (viewName === "") {
        viewName = "anonymous";
    }
    if (!supportsProxy) {
        return obj;
    }
    return new Proxy(obj, {
        get: function (object, prop) {
            if (prop in obj) {
                return object[prop];
            }
            throw new Error("The model, " + modelName + ", expected a property \"" + prop + "\" but the view, " + viewName + ", returned an object without the property.");
        }
    });
}
function modelView(model, view, toViewReactiveNames) {
    var m = isGeneratorFunction(model) ? jabz_1.fgo(model) : model;
    var v = isGeneratorFunction(view) ? jabz_1.fgo(view) : function () {
        var as = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            as[_i] = arguments[_i];
        }
        return toComponent(view.apply(void 0, as));
    };
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new Component(function (parent) { return new MfixNow(function (bs) { return v.apply(void 0, [bs].concat(args)).content(parent)
            .map(function (o) { return addErrorHandler(model.name, view.name, o); })
            .chain(function (b) { return m.apply(void 0, [b].concat(args)); }); }, toViewReactiveNames).map(snd); });
    };
}
exports.modelView = modelView;
function viewObserve(update, behavior) {
    var isPulling = false;
    hareactive_1.observe(update, function () {
        isPulling = true;
        function pull() {
            update(behavior.pull());
            if (isPulling) {
                requestAnimationFrame(pull);
            }
        }
        pull();
    }, function () {
        isPulling = false;
    }, behavior);
}
exports.viewObserve = viewObserve;
function isChild(a) {
    return isComponent(a) || isGeneratorFunction(a) || hareactive_1.isBehavior(a) || isShowable(a) || Array.isArray(a);
}
exports.isChild = isChild;
function text(s) {
    return new Component(function (parent) {
        parent.appendChild(document.createTextNode(s.toString()));
        return hareactive_1.Now.of({});
    });
}
exports.text = text;
;
function toComponent(child) {
    if (isComponent(child)) {
        return child;
    }
    else if (hareactive_1.isBehavior(child)) {
        return dynamic(child);
    }
    else if (isGeneratorFunction(child)) {
        return jabz_1.go(child);
    }
    else if (isShowable(child)) {
        return text(child);
    }
    else if (Array.isArray(child)) {
        return jabz_1.sequence(Component, child.map(toComponent)).map(function (res) { return res.reduce(utils_1.merge, {}); });
    }
}
exports.toComponent = toComponent;
var DynamicComponent = (function (_super) {
    __extends(DynamicComponent, _super);
    function DynamicComponent(parent, bChild) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.bChild = bChild;
        return _this;
    }
    DynamicComponent.prototype.run = function () {
        var _this = this;
        var start = document.createComment("Dynamic begin");
        var end = document.createComment("Dynamic end");
        this.parent.appendChild(start);
        this.parent.appendChild(end);
        var currentlyShowable;
        var wasShowable = false;
        var performed = this.bChild.map(function (child) {
            currentlyShowable = isShowable(child);
            if (currentlyShowable && wasShowable) {
                return [undefined, child];
            }
            var fragment = document.createDocumentFragment();
            var a = runComponent(fragment, toComponent(child));
            return [a, fragment];
        });
        var showableNode;
        viewObserve(function (_a) {
            var _ = _a[0], node = _a[1];
            if (currentlyShowable && wasShowable) {
                showableNode.nodeValue = node.toString();
            }
            else {
                if (currentlyShowable) {
                    showableNode = node.firstChild;
                    wasShowable = true;
                }
                else {
                    wasShowable = false;
                }
                var i = start.nextSibling;
                while (i !== end) {
                    var j = i;
                    i = i.nextSibling;
                    _this.parent.removeChild(j);
                }
                _this.parent.insertBefore(node, end);
            }
        }, performed);
        return performed.map(fst);
    };
    return DynamicComponent;
}(hareactive_1.Now));
function dynamic(behavior) {
    return new Component(function (p) { return new DynamicComponent(p, behavior); });
}
exports.dynamic = dynamic;
var ComponentListNow = (function (_super) {
    __extends(ComponentListNow, _super);
    function ComponentListNow(parent, compFn, list, getKey, name) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.compFn = compFn;
        _this.list = list;
        _this.getKey = getKey;
        _this.name = name;
        return _this;
    }
    ComponentListNow.prototype.run = function () {
        var _this = this;
        // The reordering code below is neither pretty nor fast. But it at
        // least avoids recreating elements and is quite simple.
        var resultB = hareactive_1.sinkBehavior([]);
        var end = document.createComment("list end");
        var keyToElm = {};
        this.parent.appendChild(end);
        this.list.subscribe(function (newAs) {
            var newKeyToElm = {};
            var newArray = [];
            // Re-add existing elements and new elements
            for (var i = 0; i < newAs.length; i++) {
                var a = newAs[i];
                var key = _this.getKey(a, i);
                var stuff = keyToElm[key];
                if (stuff === undefined) {
                    var fragment = document.createDocumentFragment();
                    var out = runComponent(fragment, _this.compFn(a));
                    // Assumes component only adds a single element
                    stuff = { out: out, elm: fragment.firstChild };
                }
                _this.parent.insertBefore(stuff.elm, end);
                newArray.push(stuff.out);
                newKeyToElm[key] = stuff;
            }
            // Remove elements that are no longer present
            var oldKeys = Object.keys(keyToElm);
            for (var _i = 0, oldKeys_1 = oldKeys; _i < oldKeys_1.length; _i++) {
                var key = oldKeys_1[_i];
                if (newKeyToElm[key] === undefined) {
                    _this.parent.removeChild(keyToElm[key].elm);
                }
            }
            keyToElm = newKeyToElm;
            resultB.push(newArray);
        });
        return (this.name === undefined ? resultB : (_a = {}, _a[this.name] = resultB, _a));
        var _a;
    };
    return ComponentListNow;
}(hareactive_1.Now));
function list(c, list, optional1) {
    var last = arguments[arguments.length - 1];
    var getKey = typeof last === "function" ? last : utils_1.id;
    var name = typeof optional1 === "string" ? optional1 : undefined;
    return (new Component(function (parent) { return new ComponentListNow(parent, c, list, getKey, name); }));
}
exports.list = list;
var Component_1;
