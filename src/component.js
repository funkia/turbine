"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var hareactive_1 = require("@funkia/hareactive");
var jabz_1 = require("@funkia/jabz");
var utils_1 = require("./utils");
var supportsProxy = "Proxy" in window;
function isShowable(s) {
    return typeof s === "string" || typeof s === "number" || typeof s === "boolean";
}
function isGeneratorFunction(fn) {
    return (fn !== undefined &&
        fn.constructor !== undefined &&
        fn.constructor.name === "GeneratorFunction");
}
exports.isGeneratorFunction = isGeneratorFunction;
/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we want to
 * make it a monad in different way than Now.
 */
var Component = (function () {
    function Component() {
        this.multi = false;
    }
    Component.of = function (b) {
        return new OfComponent(b);
    };
    Component.prototype.of = function (b) {
        return new OfComponent(b);
    };
    Component.prototype.chain = function (f) {
        return new ChainComponent(this, f);
    };
    Component.prototype.output = function (handler) {
        if (typeof handler === "function") {
            return new HandleOutput(function (e, o) { return utils_1.mergeObj(e, handler(o)); }, this);
        }
        else {
            return new HandleOutput(function (e, o) { return utils_1.mergeObj(e, utils_1.copyRemaps(handler, o)); }, this);
        }
        // return new OutputComponent(remaps, this);
    };
    // explicitOutput: string[] | undefined;
    Component.multi = false;
    Component = __decorate([
        jabz_1.monad
    ], Component);
    return Component;
}());
exports.Component = Component;
var OfComponent = (function (_super) {
    __extends(OfComponent, _super);
    function OfComponent(value) {
        _super.call(this);
        this.value = value;
    }
    OfComponent.prototype.run = function (_1, _2) {
        return { explicit: {}, output: this.value };
    };
    return OfComponent;
}(Component));
var OutputComponent = (function (_super) {
    __extends(OutputComponent, _super);
    function OutputComponent(remaps, comp) {
        _super.call(this);
        this.remaps = remaps;
        this.comp = comp;
        // this.explicitOutput = Object.keys(remaps);
    }
    OutputComponent.prototype.run = function (parent, destroyed) {
        var _a = this.comp.run(parent, destroyed), explicit = _a.explicit, output = _a.output;
        var newExplicit = utils_1.copyRemaps(this.remaps, output);
        var finalExplicit = utils_1.mergeObj(output, newExplicit);
        return { explicit: newExplicit, output: output };
    };
    return OutputComponent;
}(Component));
var HandleOutput = (function (_super) {
    __extends(HandleOutput, _super);
    function HandleOutput() {
        _super.apply(this, arguments);
    }
    return HandleOutput;
}(Component));
function (explicit, output) { return P; },
    private;
readonly;
c: Component();
{
    _super.call(this);
}
run(parent, DomApi, destroyed, hareactive_1.Future(), Out < P, A > {
    const: (_a = this.c.run(parent, destroyed), explicit = _a.explicit, output = _a.output, _a),
    const: newExplicit = this.handler(explicit, output),
    return: { explicit: newExplicit, output: output }
}, type, AnyValues < A, Record < string, any >> , (_b = {}, _b[K in keyof] = A, _b.any = any, _b));
B;
A[B[K]];
;
function output(remaps, component) {
    return component.output(remaps);
}
exports.output = output;
/**
 * An empty component that adds no elements to the DOM and produces an
 * empty object as output.
 */
exports.emptyComponent = Component.of({});
var ChainComponent = (function (_super) {
    __extends(ChainComponent, _super);
    function ChainComponent(component, f) {
        _super.call(this);
        this.component = component;
        this.f = f;
    }
    ChainComponent.prototype.run = function (parent, destroyed) {
        var _a = this.component.run(parent, destroyed), explicit = _a.explicit, outputFirst = _a.output;
        var _b = this.f(outputFirst).run(parent, destroyed), _discarded = _b.explicit, output = _b.output;
        return { explicit: explicit, output: output };
    };
    return ChainComponent;
}(Component));
/**
 * Run component and the now-computation inside.
 * @param parent A selector string or a DOM node under which the
 * component will be created
 * @param component The component to run
 */
function runComponent(parent, component, destroy) {
    if (destroy === void 0) { destroy = hareactive_1.sinkFuture(); }
    if (typeof parent === "string") {
        parent = document.querySelector(parent);
        !;
    }
    return toComponent(component).run(parent, destroy).output;
}
exports.runComponent = runComponent;
function testComponent(c) {
    var dom = document.createElement("div");
    var destroyed = hareactive_1.sinkFuture();
    var _a = c.run(dom, destroyed), out = _a.output, explicit = _a.explicit;
    var destroy = destroyed.resolve.bind(destroyed);
    return { out: out, dom: dom, destroy: destroy, explicit: explicit };
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
var LoopComponent = (function (_super) {
    __extends(LoopComponent, _super);
    function LoopComponent(f, placeholderNames) {
        _super.call(this);
        this.f = f;
        this.placeholderNames = placeholderNames;
    }
    LoopComponent.prototype.run = function (parent, destroyed) {
        var placeholderObject = { destroyed: destroyed };
        if (supportsProxy) {
            placeholderObject = new Proxy(placeholderObject, placeholderProxyHandler);
        }
        else {
            if (this.placeholderNames !== undefined) {
                for (var _i = 0, _a = this.placeholderNames; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    placeholderObject[name_1] = hareactive_1.placeholder();
                }
            }
        }
        var _b = toComponent(this.f(placeholderObject)).run(parent, destroyed), explicit = _b.explicit, output = _b.output;
        var returned = Object.keys(output);
        for (var _c = 0, returned_1 = returned; _c < returned_1.length; _c++) {
            var name_2 = returned_1[_c];
            placeholderObject[name_2].replaceWith(output[name_2]);
        }
        return { explicit: explicit, output: output };
    };
    return LoopComponent;
}(Component));
function loop(f, placeholderNames) {
    var f2 = isGeneratorFunction(f) ? jabz_1.fgo(f) : f;
    return new LoopComponent(f2, placeholderNames);
}
exports.loop = loop;
var MergeComponent = (function (_super) {
    __extends(MergeComponent, _super);
    function MergeComponent(c1, c2) {
        _super.call(this);
        this.c1 = c1;
        this.c2 = c2;
    }
    MergeComponent.prototype.run = function (parent, destroyed) {
        var explicit1 = this.c1.run(parent, destroyed).explicit;
        var explicit2 = this.c2.run(parent, destroyed).explicit;
        var merged = Object.assign({}, explicit1, explicit2);
        return { explicit: merged, output: merged };
    };
    return MergeComponent;
}(Component));
/**
 * Merges two components. Their explicit output is combined.
 */
function merge(c1, c2) {
    return new MergeComponent(c1, c2);
}
exports.merge = merge;
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
var ModelViewComponent = (function (_super) {
    __extends(ModelViewComponent, _super);
    function ModelViewComponent(args, model, view, placeholderNames) {
        _super.call(this);
        this.args = args;
        this.model = model;
        this.view = view;
        this.placeholderNames = placeholderNames;
    }
    ModelViewComponent.prototype.run = function (parent, destroyed) {
        var _a = this, view = _a.view, model = _a.model, args = _a.args;
        var placeholders;
        if (supportsProxy) {
            placeholders = new Proxy({}, placeholderProxyHandler);
        }
        else {
            placeholders = {};
            if (this.placeholderNames !== undefined) {
                for (var _i = 0, _b = this.placeholderNames; _i < _b.length; _i++) {
                    var name_3 = _b[_i];
                    placeholders[name_3] = hareactive_1.placeholder();
                }
            }
        }
        var viewOutput = toComponent(view.apply(void 0, [placeholders].concat(args))).run(parent, destroyed).explicit;
        var helpfulViewOutput = addErrorHandler(model.name, view.name, Object.assign(viewOutput, { destroyed: destroyed }));
        var behaviors = hareactive_1.runNow(model.apply(void 0, [helpfulViewOutput].concat(args)));
        // Tie the recursive knot
        for (var _c = 0, _d = Object.keys(behaviors); _c < _d.length; _c++) {
            var name_4 = _d[_c];
            placeholders[name_4].replaceWith(behaviors[name_4]);
        }
        return { explicit: {}, output: behaviors };
    };
    return ModelViewComponent;
}(Component));
function modelView(model, view, toViewReactiveNames) {
    var m = isGeneratorFunction(model) ? jabz_1.fgo(model) : model;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return new ModelViewComponent(args, m, view, toViewReactiveNames);
    };
}
exports.modelView = modelView;
function pullOnFrame(pull) {
    var isPulling = true;
    function frame() {
        if (isPulling) {
            pull();
            requestAnimationFrame(frame);
        }
    }
    frame();
    return function () {
        isPulling = false;
    };
}
function viewObserve(update, behavior) {
    hareactive_1.observe(update, pullOnFrame, behavior);
}
exports.viewObserve = viewObserve;
Component(O, never);
Component(A, never);
[CE] ? TC < A[0] >  :
    A;
[CE, CE] ? MC < A[0] : , A[1] > ;
A;
[CE, CE, CE] ? MC < A[0] : , MC < A[1], A[2] >> ;
A;
[CE, CE, CE, CE] ? MC < A[0] : , MC < A[1], MC < A[2], A[3] >>> ;
A;
[CE, CE, CE, CE, CE] ? MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], A[4] >>>  > ;
A;
[CE, CE, CE, CE, CE, CE] ? MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], A[5] >>>  >> ;
A;
[CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], A[6] >>>  >>>  > ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], A[7] >>>  >>>  >> ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], MC < A[7], A[8] >>>  >>>  >>> ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], MC < A[7], MC < A[8], A[9] >>>  >>>  >>>  > ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], MC < A[7], MC < A[8], MC < A[9], A[10] >>>  >>>  >>>  >> ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], MC < A[7], MC < A[8], MC < A[9], MC < A[10], A[11] >>>  >>>  >>>  >>> ;
A;
[CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC < MC < A[0] : , MC < A[1], MC < A[2], MC < A[3], MC < A[4], MC < A[5], MC < A[6], MC < A[7], MC < A[8], MC < A[9], MC < A[10], MC < A[11], A[12] >>>  >>>  >>>  >>>  > ;
Component();
Component(Component(A, Showable
    ? Component(A, hareactive_1.Behavior(Component(Component()))) : ));
Child[] ? ArrayToComponent(TC()) : ;
function isChild(a) {
    return (isComponent(a) ||
        isGeneratorFunction(a) ||
        hareactive_1.isBehavior(a) ||
        isShowable(a) ||
        Array.isArray(a));
}
exports.isChild = isChild;
var TextComponent = (function (_super) {
    __extends(TextComponent, _super);
    function TextComponent(t) {
        _super.call(this);
        this.t = t;
    }
    TextComponent.prototype.run = function (parent, destroyed) {
        var node = document.createTextNode(this.t.toString());
        parent.appendChild(node);
        destroyed.subscribe(function (toplevel) {
            if (toplevel) {
                parent.removeChild(node);
            }
        });
        return { explicit: {}, output: {} };
    };
    return TextComponent;
}(Component));
function text(showable) {
    return new TextComponent(showable);
}
exports.text = text;
var ListComponent = (function (_super) {
    __extends(ListComponent, _super);
    function ListComponent(children) {
        _super.call(this);
        this.components = [];
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            var component = toComponent(child);
            this.components.push(component);
        }
    }
    ListComponent.prototype.run = function (parent, destroyed) {
        var output = {};
        for (var i = 0; i < this.components.length; ++i) {
            var component = this.components[i];
            var explicit = component.run(parent, destroyed).explicit;
            Object.assign(output, explicit);
        }
        return { explicit: output, output: output };
    };
    return ListComponent;
}(Component));
function toComponent(child) {
    if (isComponent(child)) {
        return child;
    }
    else if (hareactive_1.isBehavior(child)) {
        return dynamic(child).mapTo({});
    }
    else if (isGeneratorFunction(child)) {
        return jabz_1.go(child);
    }
    else if (isShowable(child)) {
        return text(child);
    }
    else if (Array.isArray(child)) {
        return new ListComponent(child);
    }
    else {
        throw new Error("Child could not be converted to component");
    }
}
exports.toComponent = toComponent;
var FixedDomPosition = (function () {
    function FixedDomPosition(parent, destroy) {
        var _this = this;
        this.parent = parent;
        this.end = document.createComment("Fixed point");
        parent.appendChild(this.end);
        destroy.subscribe(function () { return parent.removeChild(_this.end); });
    }
    FixedDomPosition.prototype.appendChild = function (child) {
        this.parent.insertBefore(child, this.end);
    };
    FixedDomPosition.prototype.insertBefore = function (e, a) {
        this.parent.insertBefore(e, a);
    };
    FixedDomPosition.prototype.removeChild = function (c) {
        this.parent.removeChild(c);
    };
    return FixedDomPosition;
}());
var DynamicComponent = (function (_super) {
    __extends(DynamicComponent, _super);
    function DynamicComponent(behavior) {
        _super.call(this);
        this.behavior = behavior;
    }
    DynamicComponent.prototype.run = function (parent, dynamicDestroyed) {
        var destroyPrevious;
        var parentWrap = new FixedDomPosition(parent, dynamicDestroyed);
        var output = this.behavior.map(function (child) {
            if (destroyPrevious !== undefined) {
                destroyPrevious.resolve(true);
            }
            destroyPrevious = hareactive_1.sinkFuture();
            var explicit = toComponent(child).run(parentWrap, destroyPrevious.combine(dynamicDestroyed)).explicit;
            return explicit;
        });
        // To activate behavior
        viewObserve(utils_1.id, output);
        return { explicit: {}, output: output };
    };
    return DynamicComponent;
}(Component));
function dynamic(behavior) {
    return new DynamicComponent(behavior);
}
exports.dynamic = dynamic;
var DomRecorder = (function () {
    function DomRecorder(parent) {
        this.parent = parent;
        this.elms = [];
    }
    DomRecorder.prototype.appendChild = function (child) {
        this.parent.appendChild(child);
        this.elms.push(child);
    };
    DomRecorder.prototype.insertBefore = function (a, b) {
        this.parent.insertBefore(a, b);
        var index = this.elms.indexOf(b);
        this.elms.splice(index, 0, a);
    };
    DomRecorder.prototype.removeChild = function (c) {
        this.parent.removeChild(c);
        var index = this.elms.indexOf(c);
        this.elms.splice(index, 1);
    };
    return DomRecorder;
}());
var ComponentList = (function (_super) {
    __extends(ComponentList, _super);
    function ComponentList(compFn, listB, getKey) {
        _super.call(this);
        this.compFn = compFn;
        this.listB = listB;
        this.getKey = getKey;
    }
    ComponentList.prototype.run = function (parent, listDestroyed) {
        var _this = this;
        // The reordering code below is neither pretty nor fast. But it at
        // least avoids recreating elements and is quite simple.
        var resultB = hareactive_1.sinkBehavior([]);
        var keyToElm = {};
        var parentWrap = new FixedDomPosition(parent, listDestroyed);
        this.listB.subscribe(function (newAs) {
            var newKeyToElm = {};
            var newArray = [];
            // Re-add existing elements and new elements
            for (var i = 0; i < newAs.length; i++) {
                var a = newAs[i];
                var key = _this.getKey(a, i);
                var stuff = keyToElm[key];
                if (stuff === undefined) {
                    var destroy = hareactive_1.sinkFuture();
                    var recorder = new DomRecorder(parentWrap);
                    var out = _this.compFn(a).run(recorder, destroy.combine(listDestroyed));
                    stuff = { elms: recorder.elms, out: out.explicit, destroy: destroy };
                }
                else {
                    for (var _i = 0, _a = stuff.elms; _i < _a.length; _i++) {
                        var elm = _a[_i];
                        parentWrap.appendChild(elm);
                    }
                }
                newArray.push(stuff.out);
                newKeyToElm[key] = stuff;
            }
            // Remove elements that are no longer present
            var oldKeys = Object.keys(keyToElm);
            for (var _b = 0, oldKeys_1 = oldKeys; _b < oldKeys_1.length; _b++) {
                var key = oldKeys_1[_b];
                if (newKeyToElm[key] === undefined) {
                    keyToElm[key].destroy.resolve(true);
                }
            }
            keyToElm = newKeyToElm;
            resultB.push(newArray);
        });
        return { explicit: {}, output: resultB };
    };
    return ComponentList;
}(Component));
function list(componentCreator, listB, getKey) {
    if (getKey === void 0) { getKey = utils_1.id; }
    return new ComponentList(componentCreator, listB, getKey);
}
exports.list = list;
var _a, _b;
