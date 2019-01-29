"use strict";
var dom_builder_1 = require("../src/dom-builder");
var chai_1 = require("chai");
var chaiDom = require("chai-dom");
chai_1.use(chaiDom);
var fakeRaf = require("fake-raf");
var hareactive_1 = require("@funkia/hareactive");
var utils_1 = require("../src/utils");
var src_1 = require("../src");
var E = src_1.elements;
var button = src_1.elements.button, div = src_1.elements.div;
describe("dom-builder", function () {
    it("basic DOM elements", function () {
        var spanFac = src_1.element("span");
        var spanC = spanFac();
        var domSpan = src_1.testComponent(spanC).dom;
        chai_1.expect(domSpan).to.have.html("<span></span>");
        var h1Fac = src_1.element("h1");
        var h1C = h1Fac();
        var domH1 = src_1.testComponent(h1C).dom;
        chai_1.expect(domH1).to.have.html("<h1></h1>");
        var btnFac = src_1.element("button");
        var btnC = btnFac();
        var domBtn = src_1.testComponent(btnC).dom;
        chai_1.expect(domBtn).to.have.html("<button></button>");
    });
    it("basic SVG elements", function () {
        var lineFac = src_1.svgElement("line");
        var lineC = lineFac();
        var domLine = src_1.testComponent(lineC).dom;
        chai_1.expect(domLine).to.have.html('<line></line>');
        var rectFac = src_1.svgElement("rect");
        var rectC = rectFac();
        var domRect = src_1.testComponent(rectC).dom;
        chai_1.expect(domRect).to.have.html('<rect></rect>');
        var svgFac = src_1.svgElement("svg");
        var svgC = svgFac();
        var domSvg = src_1.testComponent(svgC).dom;
        chai_1.expect(domSvg).to.have.html('<svg></svg>');
    });
    describe("output", function () {
        it("renames output as explicit", function () {
            var c = button().output({ buttonClick: "click" });
            var _a = src_1.testComponent(c), out = _a.out, explicit = _a.explicit;
            chai_1.assert(!hareactive_1.isStream(out.buttonClick));
            chai_1.assert(hareactive_1.isStream(explicit.buttonClick));
        });
        it("passes explicit child output through", function () {
            var c = div(button().output({ buttonClick: "click" }));
            var _a = src_1.testComponent(c), out = _a.out, explicit = _a.explicit;
            chai_1.assert(hareactive_1.isStream(explicit.buttonClick));
        });
        it("merges output from list of elements", function () {
            var btn = button("Click me").output({ fooClick: "click" });
            var btn2 = button("Click me").output({ barClick: "click" });
            var c = div({}, [btn, btn2]);
            var _a = src_1.testComponent(c), out = _a.out, explicit = _a.explicit;
            chai_1.assert(hareactive_1.isStream(explicit.fooClick));
            chai_1.assert(hareactive_1.isStream(explicit.barClick));
        });
        it("merges output from list of elements alongside strings", function () {
            var btn = button("Click me").output({ fooClick: "click" });
            var btn2 = button("Click me").output({ barClick: "click" });
            var c = div({}, [btn, "foo", btn2]);
            var explicit = src_1.testComponent(c).explicit;
            chai_1.assert(hareactive_1.isStream(explicit.fooClick));
            chai_1.assert(hareactive_1.isStream(explicit.barClick));
        });
        it("merges own output with explicit output in child array", function () {
            var btn = button("Click me").output({ fooClick: "click" });
            var myDiv = div([btn]).output({ divClick: "click" });
            var explicit = src_1.testComponent(myDiv).explicit;
            chai_1.assert(hareactive_1.isStream(explicit.divClick));
            chai_1.assert(hareactive_1.isStream(explicit.fooClick));
        });
        it("merges all output from non-array child", function () {
            var child = src_1.Component.of({ bar: 1 }).output({ bar: "bar" });
            var myDiv = div(child).output({ divClick: "click" });
            var explicit = src_1.testComponent(myDiv).explicit;
            chai_1.assert(hareactive_1.isStream(explicit.divClick));
            chai_1.assert.strictEqual(explicit.bar, 1);
        });
        it("can override existing property", function () {
            src_1.testComponent(div(button("Reset").output({ reset: "click" })));
        });
    });
    describe("stream and behavior output descriptions", function () {
        it("can add custom stream output", function () {
            var myElement = src_1.element("span", {
                streams: { customClick: dom_builder_1.streamDescription("click", utils_1.id) }
            });
            var myCreatedElement = myElement();
            var out = src_1.testComponent(myCreatedElement).out;
            chai_1.assert.isTrue(hareactive_1.isStream(out.customClick));
        });
        it("can add custom behavior output", function () {
            var myElement = src_1.element("span", {
                behaviors: {
                    x: dom_builder_1.behaviorDescription("click", function (e) { return e.clientX; }, function () { return 0; })
                }
            });
            var myCreatedElement = myElement();
            var out = src_1.testComponent(myCreatedElement).out;
            chai_1.assert.isTrue(hareactive_1.isBehavior(out.x));
        });
        it("does not overwrite descriptions", function () {
            var myElement = src_1.element("span", {
                streams: { customClick: dom_builder_1.streamDescription("click", utils_1.id) }
            });
            var myCreatedElement = myElement({ streams: {} });
            var out = src_1.testComponent(myCreatedElement).out;
            chai_1.assert.isTrue(hareactive_1.isStream(out.customClick));
        });
        it("contains a stream for all DOM events", function () {
            var myElement = src_1.element("span");
            var myCreatedElement = myElement();
            var out = src_1.testComponent(myCreatedElement).out;
            chai_1.assert(hareactive_1.isStream(out.keyup));
            chai_1.assert(hareactive_1.isStream(out.drag));
            chai_1.assert(hareactive_1.isStream(out.load));
        });
    });
    describe("output", function () {
        it("can rename output", function () {
            var btn = button("Click").output(function (_a) {
                var click = _a.click;
                return ({
                    foobar: click
                });
            });
            var explicit = src_1.testComponent(btn).explicit;
            chai_1.assert(hareactive_1.isStream(explicit.foobar));
        });
        it("can rename custom output", function () {
            var myElement = src_1.element("span", {
                streams: { customClick: dom_builder_1.streamDescription("click", utils_1.id) }
            });
            var out = src_1.testComponent(myElement().output({ horse: "customClick" })).out;
        });
    });
    describe("actions", function () {
        it("calls function with element and stream value", function () {
            var myComponent = src_1.element("span", {
                actionDefinitions: {
                    boldText: function (element, value) {
                        return (element.innerHTML = "<b>" + value + "</b>");
                    }
                }
            });
            var s = hareactive_1.sinkStream();
            var dom = src_1.testComponent(myComponent({ actions: { boldText: s } })).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.html("");
            s.push("foo");
            chai_1.expect(spanElm).to.have.html("<b>foo</b>");
            s.push("bar");
            chai_1.expect(spanElm).to.have.html("<b>bar</b>");
        });
        it("calls function with element and value from pushing behavior", function () {
            var myComponent = src_1.element("span", {
                actionDefinitions: {
                    boldText: function (element, value) {
                        return (element.textContent = value.toString());
                    }
                }
            });
            var numberB = hareactive_1.sinkBehavior(0);
            var dom = src_1.testComponent(myComponent({ setters: { boldText: numberB } })).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.text("0");
            hareactive_1.push(1, numberB);
            chai_1.expect(spanElm).to.have.text("1");
            hareactive_1.push(2, numberB);
            chai_1.expect(spanElm).to.have.text("2");
        });
        it("calls function with element and value from pulling behavior", function () {
            fakeRaf.use();
            var myComponent = src_1.element("span", {
                actionDefinitions: {
                    boldText: function (element, value) {
                        return (element.textContent = value.toString());
                    }
                }
            });
            var nr = 0;
            var numberB = hareactive_1.fromFunction(function () { return nr; });
            var dom = src_1.testComponent(myComponent({ setters: { boldText: numberB } })).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.text("0");
            nr = 1;
            chai_1.expect(spanElm).to.have.text("0");
            fakeRaf.step();
            chai_1.expect(spanElm).to.have.text("1");
            fakeRaf.step();
            chai_1.expect(spanElm).to.have.text("1");
            nr = 2;
            fakeRaf.step();
            chai_1.expect(spanElm).to.have.text("2");
            fakeRaf.restore();
        });
    });
    describe("children", function () {
        it("nested", function () {
            var spanFac = src_1.element("span");
            var h1Fac = src_1.element("h1");
            var span = h1Fac([spanFac("Test")]);
            var _a = src_1.testComponent(span), dom = _a.dom, out = _a.out;
            chai_1.expect(dom.querySelector("h1")).to.have.length(1);
            chai_1.expect(dom.querySelector("h1")).to.contain("span");
            chai_1.expect(dom.querySelector("span")).to.have.text("Test");
        });
        it("nested", function () {
            var root = div(div("Test"));
            var _a = src_1.testComponent(root), dom = _a.dom, out = _a.out;
            chai_1.expect(dom.firstChild).to.have.length(1);
        });
    });
    describe("style", function () {
        it("default style", function () {
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: "red"
                }
            });
            var spanC = spanFac();
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;");
        });
        it("override style", function () {
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: "red"
                }
            });
            var spanC = spanFac({
                style: {
                    backgroundColor: "green"
                }
            });
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;");
        });
        it("sets style from behaviors", function () {
            var colorB = hareactive_1.sinkBehavior("red");
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: colorB
                }
            });
            var spanC = spanFac();
            var dom = src_1.testComponent(spanC).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.attribute("style", "background-color: red;");
            hareactive_1.push("blue", colorB);
            chai_1.expect(spanElm).to.have.attribute("style", "background-color: blue;");
        });
    });
    describe("attributes", function () {
        it("sets attributes from constant values", function () {
            var dom = src_1.testComponent(src_1.element("a", { attrs: { href: "/foo" } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm).to.have.attribute("href", "/foo");
        });
        it("sets attributes from behaviors", function () {
            var hrefB = hareactive_1.sinkBehavior("/foo");
            var dom = src_1.testComponent(src_1.element("a", { attrs: { href: hrefB } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm).to.have.attribute("href", "/foo");
            hareactive_1.push("/bar", hrefB);
            chai_1.expect(aElm).to.have.attribute("href", "/bar");
        });
        it("sets boolean attributes correctly", function () {
            var dom = src_1.testComponent(src_1.element("a", { attrs: { contenteditable: true } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm).to.have.attribute("contenteditable", "");
        });
        it("removes boolean attribute correctly", function () {
            var checkedB = hareactive_1.sinkBehavior(false);
            var dom = src_1.testComponent(src_1.element("a", { attrs: { checked: checkedB } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm).to.not.have.attribute("checked");
            hareactive_1.push(true, checkedB);
            chai_1.expect(aElm).to.have.attribute("checked", "");
            hareactive_1.push(false, checkedB);
            chai_1.expect(aElm).to.not.have.attribute("checked");
        });
        it("sets attributes from root", function () {
            var hrefB = hareactive_1.sinkBehavior("/foo");
            var dom = src_1.testComponent(src_1.element("a", { href: hrefB })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm).to.have.attribute("href", "/foo");
            hareactive_1.push("/bar", hrefB);
            chai_1.expect(aElm).to.have.attribute("href", "/bar");
        });
    });
    describe("properties", function () {
        it("sets properties from constant values", function () {
            var dom = src_1.testComponent(src_1.element("a", { props: { innerHTML: "<b>Hi</b>" } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm.innerHTML).to.equal("<b>Hi</b>");
        });
        it("sets properties from behaviors", function () {
            var htmlB = hareactive_1.sinkBehavior("<b>Hi</b>");
            var dom = src_1.testComponent(src_1.element("a", { props: { innerHTML: htmlB } })()).dom;
            var aElm = dom.firstChild;
            chai_1.expect(aElm.innerHTML).to.equal("<b>Hi</b>");
            hareactive_1.push("<b>there</b>", htmlB);
            chai_1.expect(aElm.innerHTML).to.equal("<b>there</b>");
        });
        it("sets input value", function () {
            var b = hareactive_1.sinkBehavior("foo");
            var dom = src_1.testComponent(E.input({ value: b })).dom;
            var inputElm = dom.firstChild;
            chai_1.assert.equal(inputElm.value, "foo");
            inputElm.value = "foob"; // Simulate user input
            b.newValue("bar");
            chai_1.assert.equal(inputElm.value, "bar");
        });
    });
    describe("style and children combinations", function () {
        it("e(children)         fac(props) ", function () {
            var spanFac = src_1.element("span");
            var spanC = spanFac({
                style: {
                    backgroundColor: "red"
                }
            });
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;");
        });
        it("e(children)         fac(props, children) ", function () {
            var spanFac = src_1.element("span");
            var spanC = spanFac({
                style: {
                    backgroundColor: "red"
                }
            }, "override text");
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.text("override text");
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;");
        });
        it("e(props)            fac(children) ", function () {
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: "green"
                }
            });
            var spanC = spanFac("text");
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.text("text");
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;");
        });
        it("e(props)            fac(props, children) ", function () {
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: "green"
                }
            });
            var spanC = spanFac({
                style: {
                    backgroundColor: "red"
                }
            }, "text");
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.text("text");
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;");
        });
        it("e(props, children)  fac(props, children) ", function () {
            var spanFac = src_1.element("span", {
                style: {
                    backgroundColor: "green"
                }
            });
            var spanC = spanFac({
                style: {
                    backgroundColor: "red"
                }
            }, "override text");
            var dom = src_1.testComponent(spanC).dom;
            chai_1.expect(dom.querySelector("span")).to.have.text("override text");
            chai_1.expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;");
        });
    });
    describe("class", function () {
        it("adds classes based on string", function () {
            var span = src_1.elements.span({
                class: "foo bar"
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).not.to.have.class("baz");
            chai_1.expect(spanElm).to.have.class("foo");
            chai_1.expect(spanElm).to.have.class("bar");
        });
        it("adds classes based on behavior of string", function () {
            var classB = hareactive_1.sinkBehavior("foo");
            var span = src_1.elements.span({
                class: classB
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.class("foo");
            chai_1.expect(spanElm).not.to.have.class("bar");
            hareactive_1.push("bar", classB);
            chai_1.expect(spanElm).not.to.have.class("foo");
            chai_1.expect(spanElm).to.have.class("bar");
        });
        it("toggles classes based on record of booleans", function () {
            var span = src_1.elements.span({
                class: {
                    foo: true,
                    bar: false
                }
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.class("foo");
            chai_1.expect(spanElm).not.to.have.class("bar");
        });
        it("toggles classes based on record of behaviors of booleans", function () {
            var boolB = hareactive_1.sinkBehavior(false);
            var span = src_1.elements.span({
                class: { foo: boolB }
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).not.to.have.class("foo");
            hareactive_1.push(true, boolB);
            chai_1.expect(spanElm).to.have.class("foo");
            hareactive_1.push(false, boolB);
            chai_1.expect(spanElm).not.to.have.class("foo");
        });
        it("adds classes based on strings in nested arrays", function () {
            var span = src_1.elements.span({
                class: ["foo", ["bar"]]
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.class("foo");
            chai_1.expect(spanElm).to.have.class("bar");
        });
        it("adds classes based on array of mixed class descriptions", function () {
            var classB = hareactive_1.sinkBehavior("baz");
            var boolB = hareactive_1.sinkBehavior(false);
            var span = src_1.elements.span({
                class: ["foo bar", classB, { dap: true, dip: boolB }]
            });
            var dom = src_1.testComponent(span).dom;
            var spanElm = dom.firstChild;
            chai_1.expect(spanElm).to.have.class("foo");
            chai_1.expect(spanElm).to.have.class("bar");
            chai_1.expect(spanElm).to.have.class("baz");
            chai_1.expect(spanElm).to.have.class("dap");
            chai_1.expect(spanElm).not.to.have.class("buzz");
            chai_1.expect(spanElm).not.to.have.class("dip");
            hareactive_1.push("buzz", classB);
            hareactive_1.push(true, boolB);
            chai_1.expect(spanElm).not.to.have.class("baz");
            chai_1.expect(spanElm).to.have.class("buzz");
            chai_1.expect(spanElm).to.have.class("dip");
        });
    });
    describe("entry", function () {
        describe("class", function () {
            it("adds class in single frame", function (done) {
                var c = div({ entry: { class: "foo" }, class: "bar" }, "Hello");
                var dom = src_1.testComponent(c).dom;
                var theDiv = dom.firstChild;
                chai_1.expect(theDiv).to.have.class("foo");
                chai_1.expect(theDiv).to.have.class("bar");
                requestAnimationFrame(function () {
                    chai_1.expect(theDiv).to.have.class("foo");
                    requestAnimationFrame(function () {
                        chai_1.expect(theDiv).to.not.have.class("foo");
                        chai_1.expect(theDiv).to.have.class("bar");
                        done();
                    });
                });
            });
        });
    });
});
