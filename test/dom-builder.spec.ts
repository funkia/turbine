import { behaviorDescription, streamDescription } from "../src/dom-builder";
import { assert, use, expect } from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import * as fakeRaf from "fake-raf";
import {
  sinkStream,
  fromFunction,
  isBehavior,
  isStream,
  push,
  sinkBehavior
} from "@funkia/hareactive";

import { id } from "../src/utils";
import { testComponent, element, Component, elements } from "../src";
const E = elements;
const { button, div } = elements;

describe("dom-builder", () => {
  it("basic DOM elements", () => {
    const spanFac = element("span");
    const spanC = spanFac();
    const { dom: domSpan } = testComponent(spanC);
    expect(domSpan).to.have.html("<span></span>");

    const h1Fac = element("h1");
    const h1C = h1Fac();
    const { dom: domH1 } = testComponent(h1C);
    expect(domH1).to.have.html("<h1></h1>");

    const btnFac = element("button");
    const btnC = btnFac();
    const { dom: domBtn } = testComponent(btnC);
    expect(domBtn).to.have.html("<button></button>");
  });

  describe("output", () => {
    it("renames output as explicit", () => {
      const c = button({ output: { buttonClick: "click" } });
      const { out, explicit } = testComponent(c);
      assert(isStream(out.buttonClick));
      assert(isStream(explicit.buttonClick));
    });
    it("passes explicit child output through", () => {
      const c = div(button({ output: { buttonClick: "click" } }));
      const { out, explicit } = testComponent(c);
      assert(isStream(explicit.buttonClick));
    });
    it("merges output from list of elements", () => {
      const btn = button({ output: { fooClick: "click" } }, "Click me");
      const btn2 = button({ output: { barClick: "click" } }, "Click me");
      const c = div({}, [btn, btn2]);
      const { out, explicit } = testComponent(c);
      assert(isStream(explicit.fooClick));
      assert(isStream(explicit.barClick));
    });
    it("merges output from list of elements alongside strings", () => {
      const btn = button({ output: { fooClick: "click" } }, "Click me");
      const btn2 = button({ output: { barClick: "click" } }, "Click me");
      const c = div({}, [btn, "foo", btn2]);
      const { explicit } = testComponent(c);
      assert(isStream(explicit.fooClick));
      assert(isStream(explicit.barClick));
    });
    it("merges own output with explicit output in child array", () => {
      const btn = button({ output: { fooClick: "click" } }, "Click me");
      const myDiv = div({ output: { divClick: "click" } }, [btn]);
      const { explicit } = testComponent(myDiv);
      assert(isStream(explicit.divClick));
      assert(isStream(explicit.fooClick));
    });
    it("merges all output from non-array child", () => {
      const child = Component.of({ bar: 1 }).output({ bar: "bar" });
      const myDiv = div({ output: { divClick: "click" } }, child);
      const { explicit } = testComponent(myDiv);
      assert(isStream(explicit.divClick));
      assert.strictEqual(explicit.bar, 1);
    });
  });

  describe("stream and behavior output descriptions", () => {
    it("can add custom stream output", () => {
      const myElement = element("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const myCreatedElement = myElement();
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isStream(out.customClick));
    });
    it("can add custom behavior output", () => {
      const myElement = element("span", {
        behaviors: {
          x: behaviorDescription("click", (e) => e.clientX, () => 0)
        }
      });
      const myCreatedElement = myElement();
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isBehavior(out.x));
    });
    it("does not overwrite descriptions", () => {
      const myElement = element("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const myCreatedElement = myElement({ streams: {} });
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isStream(out.customClick));
    });
    it("contains a stream for all DOM events", () => {
      const myElement = element("span");
      const myCreatedElement = myElement();
      const { out } = testComponent(myCreatedElement);
      assert(isStream(out.keyup));
      assert(isStream(out.drag));
      assert(isStream(out.load));
    });
  });

  describe("output", () => {
    it("can rename output", () => {
      const btn = button({ output: { foobar: "click" } }, "Click");
      const { out } = testComponent(btn);
      assert(isStream(out.foobar));
    });
    it("can rename custom output", () => {
      const myElement = element("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const { out } = testComponent(
        myElement({ output: { horse: "customClick" } })
      );
    });
  });

  describe("actions", () => {
    it("calls function with element and stream value", () => {
      const myComponent = element("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: string) =>
            (element.innerHTML = `<b>${value}</b>`)
        }
      });
      const s = sinkStream<string>();
      const { dom } = testComponent(myComponent({ actions: { boldText: s } }));
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.html("");
      s.push("foo");
      expect(spanElm).to.have.html("<b>foo</b>");
      s.push("bar");
      expect(spanElm).to.have.html("<b>bar</b>");
    });

    it("calls function with element and value from pushing behavior", () => {
      const myComponent = element("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: number) =>
            (element.textContent = value.toString())
        }
      });
      const numberB = sinkBehavior(0);
      const { dom } = testComponent(
        myComponent({ setters: { boldText: numberB } })
      );
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.text("0");
      push(1, numberB);
      expect(spanElm).to.have.text("1");
      push(2, numberB);
      expect(spanElm).to.have.text("2");
    });
    it("calls function with element and value from pulling behavior", () => {
      fakeRaf.use();
      const myComponent = element("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: number) =>
            (element.textContent = value.toString())
        }
      });
      let nr = 0;
      const numberB = fromFunction(() => nr);
      const { dom } = testComponent(
        myComponent({ setters: { boldText: numberB } })
      );
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.text("0");
      nr = 1;
      expect(spanElm).to.have.text("0");
      fakeRaf.step();
      expect(spanElm).to.have.text("1");
      fakeRaf.step();
      expect(spanElm).to.have.text("1");
      nr = 2;
      fakeRaf.step();
      expect(spanElm).to.have.text("2");
      fakeRaf.restore();
    });
  });

  describe("children", () => {
    it("nested", () => {
      const spanFac = element("span");
      const h1Fac = element("h1");
      const span = h1Fac([spanFac("Test")]);
      const { dom, out } = testComponent(span);
      expect(dom.querySelector("h1")).to.have.length(1);
      expect(dom.querySelector("h1")).to.contain("span");
      expect(dom.querySelector("span")).to.have.text("Test");
    });

    it("nested", () => {
      const root = div(div("Test"));
      const { dom, out } = testComponent(root);
      expect(dom.firstChild).to.have.length(1);
    });
  });

  describe("style", () => {
    it("default style", () => {
      const spanFac = element("span", {
        style: {
          backgroundColor: "red"
        }
      });
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: red;"
      );
    });
    it("override style", () => {
      const spanFac = element("span", {
        style: {
          backgroundColor: "red"
        }
      });
      const spanC = spanFac({
        style: {
          backgroundColor: "green"
        }
      });
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: green;"
      );
    });
    it("sets style from behaviors", () => {
      const colorB = sinkBehavior("red");
      const spanFac = element("span", {
        style: {
          backgroundColor: colorB
        }
      });
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.attribute("style", "background-color: red;");
      push("blue", colorB);
      expect(spanElm).to.have.attribute("style", "background-color: blue;");
    });
  });

  describe("attributes", () => {
    it("sets attributes from constant values", () => {
      const { dom } = testComponent(
        element("a", { attrs: { href: "/foo" } })()
      );
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("href", "/foo");
    });
    it("sets attributes from behaviors", () => {
      const hrefB = sinkBehavior("/foo");
      const { dom } = testComponent(element("a", { attrs: { href: hrefB } })());
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("href", "/foo");
      push("/bar", hrefB);
      expect(aElm).to.have.attribute("href", "/bar");
    });
    it("sets boolean attributes correctly", () => {
      const { dom } = testComponent(
        element("a", { attrs: { contenteditable: true } })()
      );
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("contenteditable", "");
    });
    it("removes boolean attribute correctly", () => {
      const checkedB = sinkBehavior(false);
      const { dom } = testComponent(
        element("a", { attrs: { checked: checkedB } })()
      );
      const aElm = dom.firstChild;
      expect(aElm).to.not.have.attribute("checked");
      push(true, checkedB);
      expect(aElm).to.have.attribute("checked", "");
      push(false, checkedB);
      expect(aElm).to.not.have.attribute("checked");
    });
    it("sets attributes from root", () => {
      const hrefB = sinkBehavior("/foo");
      const { dom } = testComponent(element("a", { href: hrefB })());
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("href", "/foo");
      push("/bar", hrefB);
      expect(aElm).to.have.attribute("href", "/bar");
    });
  });

  describe("properties", () => {
    it("sets properties from constant values", () => {
      const { dom } = testComponent(
        element("a", { props: { innerHTML: "<b>Hi</b>" } })()
      );
      const aElm = <Element>dom.firstChild;
      expect(aElm.innerHTML).to.equal("<b>Hi</b>");
    });
    it("sets properties from behaviors", () => {
      const htmlB = sinkBehavior("<b>Hi</b>");
      const { dom } = testComponent(
        element("a", { props: { innerHTML: htmlB } })()
      );
      const aElm = <Element>dom.firstChild;
      expect(aElm.innerHTML).to.equal("<b>Hi</b>");
      push("<b>there</b>", htmlB);
      expect(aElm.innerHTML).to.equal("<b>there</b>");
    });
    it("sets input value", () => {
      const b = sinkBehavior("foo");
      const { dom } = testComponent(E.input({ value: b }));
      const inputElm = <any>dom.firstChild;
      assert.equal(inputElm.value, "foo");
      inputElm.value = "foob"; // Simulate user input
      b.newValue("bar");
      assert.equal(inputElm.value, "bar");
    });
  });

  describe("style and children combinations", () => {
    it("e(children)         fac(props) ", () => {
      const spanFac = element("span");
      const spanC = spanFac({
        style: {
          backgroundColor: "red"
        }
      });
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: red;"
      );
    });
    it("e(children)         fac(props, children) ", () => {
      const spanFac = element("span");
      const spanC = spanFac(
        {
          style: {
            backgroundColor: "red"
          }
        },
        "override text"
      );
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text");
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: red;"
      );
    });

    it("e(props)            fac(children) ", () => {
      const spanFac = element("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac("text");
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text");
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: green;"
      );
    });

    it("e(props)            fac(props, children) ", () => {
      const spanFac = element("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac(
        {
          style: {
            backgroundColor: "red"
          }
        },
        "text"
      );
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text");
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: red;"
      );
    });

    it("e(props, children)  fac(props, children) ", () => {
      const spanFac = element("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac(
        {
          style: {
            backgroundColor: "red"
          }
        },
        "override text"
      );
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text");
      expect(dom.querySelector("span")).to.have.attribute(
        "style",
        "background-color: red;"
      );
    });
  });

  describe("class", () => {
    it("adds classes based on string", () => {
      const span = elements.span({
        class: "foo bar"
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).not.to.have.class("baz");
      expect(spanElm).to.have.class("foo");
      expect(spanElm).to.have.class("bar");
    });
    it("adds classes based on behavior of string", () => {
      const classB = sinkBehavior("foo");
      const span = elements.span({
        class: classB
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.class("foo");
      expect(spanElm).not.to.have.class("bar");
      push("bar", classB);
      expect(spanElm).not.to.have.class("foo");
      expect(spanElm).to.have.class("bar");
    });
    it("toggles classes based on record of booleans", () => {
      const span = elements.span({
        class: {
          foo: true,
          bar: false
        }
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.class("foo");
      expect(spanElm).not.to.have.class("bar");
    });
    it("toggles classes based on record of behaviors of booleans", () => {
      const boolB = sinkBehavior(false);
      const span = elements.span({
        class: { foo: boolB }
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).not.to.have.class("foo");
      push(true, boolB);
      expect(spanElm).to.have.class("foo");
      push(false, boolB);
      expect(spanElm).not.to.have.class("foo");
    });
    it("adds classes based on strings in nested arrays", () => {
      const span = elements.span({
        class: ["foo", ["bar"]]
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.class("foo");
      expect(spanElm).to.have.class("bar");
    });
    it("adds classes based on array of mixed class descriptions", () => {
      const classB = sinkBehavior("baz");
      const boolB = sinkBehavior(false);
      const span = elements.span({
        class: ["foo bar", classB, { dap: true, dip: boolB }]
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.class("foo");
      expect(spanElm).to.have.class("bar");
      expect(spanElm).to.have.class("baz");
      expect(spanElm).to.have.class("dap");
      expect(spanElm).not.to.have.class("buzz");
      expect(spanElm).not.to.have.class("dip");
      push("buzz", classB);
      push(true, boolB);
      expect(spanElm).not.to.have.class("baz");
      expect(spanElm).to.have.class("buzz");
      expect(spanElm).to.have.class("dip");
    });
  });
  describe("entry", () => {
    describe("class", () => {
      it("adds class in single frame", (done) => {
        const c = div({ entry: { class: "foo" }, class: "bar" }, "Hello");
        const { dom } = testComponent(c);
        const theDiv = dom.firstChild;
        expect(theDiv).to.have.class("foo");
        expect(theDiv).to.have.class("bar");
        requestAnimationFrame(() => {
          expect(theDiv).to.have.class("foo");
          requestAnimationFrame(() => {
            expect(theDiv).to.not.have.class("foo");
            expect(theDiv).to.have.class("bar");
            done();
          });
        });
      });
    });
  });
});
