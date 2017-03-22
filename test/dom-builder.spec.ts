import { behaviorDescription, streamDescription } from "../src/dom-builder";
import { assert, use, expect } from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import * as fakeRaf from "fake-raf";
import { empty, fromFunction, isBehavior, isStream, publish, sink, Stream } from "hareactive";

import { id } from "../src/utils";
import { testComponent, e, Component, elements } from "../src";
const { button, div, a } = elements;

describe("dom-builder: e()", () => {

  it("basic DOM elements", () => {
    const spanFac = e("span");
    const spanC = spanFac();
    const { dom: domSpan } = testComponent(spanC);
    expect(domSpan).to.have.html("<span></span>");

    const h1Fac = e("h1");
    const h1C = h1Fac();
    const { dom: domH1 } = testComponent(h1C);
    expect(domH1).to.have.html("<h1></h1>");

    const btnFac = e("button");
    const btnC = btnFac();
    const { dom: domBtn } = testComponent(btnC);
    expect(domBtn).to.have.html("<button></button>");
  });

  describe("selector syntax", () => {
    it("with class", () => {
      const spanFac = e("span.someClass.otherClass");
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.class("someClass");
      expect(dom.querySelector("span")).to.have.class("otherClass");
    });
    it("adds static classes", () => {
      const divC = e("div")({ class: "foo bar baz" });
      const { dom } = testComponent(divC);
      expect(dom.querySelector("div")).to.have.class("foo");
      expect(dom.querySelector("div")).to.have.class("bar");
      expect(dom.querySelector("div")).to.have.class("baz");
    });
    it("with id", () => {
      const spanFac = e("span#someId");
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.id("someId");
    });
  });

  describe("wrapper", () => {
    describe("wrapper element", () => {
      it("passes parent output through in wrapper element", () => {
        const c = div(button({ output: { buttonClick: "click" } }));
        const { out } = testComponent(c);
        assert(isStream(out.buttonClick));
      });
      it("merges output from list of elements", () => {
        const btn = button({ output: { fooClick: "click" } }, "Click me");
        const btn2 = button({ output: { barClick: "click" } }, "Click me");
        const c = div({}, [btn, btn2]);
        const { out } = testComponent(c);
        assert(isStream(out.fooClick));
        assert(isStream(out.barClick));
      });
      it("merges output from list of elements alongside strings", () => {
        const btn = button({ output: { fooClick: "click" } }, "Click me");
        const btn2 = button({ output: { barClick: "click" } }, "Click me");
        const c = div({}, [btn, "foo", btn2]);
        const { out } = testComponent(c);
        assert(isStream(out.fooClick));
        assert(isStream(out.barClick));
      });
    });
    describe("non-wrapper elements", () => {
      it("does not pass child component through", () => {
        const c = a({}, button({ output: { btnClick: "click" } }));
        const { out } = testComponent(c);
        assert.isUndefined((<any>out).btnClick);
      });
    });
  });

  describe("stream and behavior output descriptions", () => {
    it("can add custom stream output", () => {
      const myElement = e("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const myCreatedElement = myElement();
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isStream(out.customClick));
    });
    it("can add custom behavior output", () => {
      const myElement = e("span", {
        behaviors: { x: behaviorDescription("click", (e) => e.clientX, () => 0) }
      });
      const myCreatedElement = myElement();
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isBehavior(out.x));
    });
    it("does not overwrite descriptions", () => {
      const myElement = e("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const myCreatedElement: Component<any> = myElement({ streams: {} });
      const { out } = testComponent(myCreatedElement);
      assert.isTrue(isStream(out.customClick));
    });
    it("contains a stream for all DOM events", () => {
      const myElement = e("span");
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
      const myElement = e("span", {
        streams: { customClick: streamDescription("click", id) }
      });
      const { out } = testComponent(myElement({ output: { horse: "customClick" } }));
    });
  });

  describe("actions", () => {
    it("calls function with element and stream value", () => {
      const myComponent = e("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: string) => element.innerHTML = `<b>${value}</b>`
        }
      });
      const s: Stream<string> = empty();
      const { dom } = testComponent(myComponent({ actions: { boldText: s } }));
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.html("");
      s.push("foo");
      expect(spanElm).to.have.html("<b>foo</b>");
      s.push("bar");
      expect(spanElm).to.have.html("<b>bar</b>");
    });

    it("calls function with element and value from pushing behavior", () => {
      const myComponent = e("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: number) => element.textContent = value.toString()
        }
      });
      const numberB = sink(0);
      const { dom } = testComponent(myComponent({ setters: { boldText: numberB } }));
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.text("0");
      publish(1, numberB);
      expect(spanElm).to.have.text("1");
      publish(2, numberB);
      expect(spanElm).to.have.text("2");
    });
    it("calls function with element and value from pulling behavior", () => {
      fakeRaf.use();
      const myComponent = e("span", {
        actionDefinitions: {
          boldText: (element: HTMLElement, value: number) => element.textContent = value.toString()
        }
      });
      let nr = 0;
      const numberB = fromFunction(() => nr);
      const { dom } = testComponent(myComponent({ setters: { boldText: numberB } }));
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
      const spanFac = e("span");
      const h1Fac = e("h1");
      const span = h1Fac(spanFac("Test"));
      const { dom, out } = testComponent(span);
      expect(dom.querySelector("h1")).to.have.length(1);
      expect(dom.querySelector("h1")).to.contain("span");
      expect(dom.querySelector("span")).to.have.text("Test");
    });
  });

  describe("style", () => {
    it("default style", () => {
      const spanFac = e("span", {
        style: {
          backgroundColor: "red"
        }
      });
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });
    it("override style", () => {
      const spanFac = e("span", {
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
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;")
    });
    it("sets style from behaviors", () => {
      const colorB = sink("red");
      const spanFac = e("span", {
        style: {
          backgroundColor: colorB
        }
      });
      const spanC = spanFac();
      const { dom } = testComponent(spanC);
      const spanElm = dom.firstChild;
      expect(spanElm).to.have.attribute("style", "background-color: red;")
      publish("blue", colorB);
      expect(spanElm).to.have.attribute("style", "background-color: blue;")
    });
  });

  describe("attributes", () => {
    it("sets attributes from constant values", () => {
      const { dom } = testComponent(e("a", { attrs: { href: "/foo" } })());
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("href", "/foo");
    });
    it("sets attributes from behaviors", () => {
      const hrefB = sink("/foo");
      const { dom } = testComponent(e("a", { attrs: { href: hrefB } })());
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("href", "/foo");
      publish("/bar", hrefB);
      expect(aElm).to.have.attribute("href", "/bar");
    });
    it("sets boolean attributes correctly", () => {
      const { dom } = testComponent(e("a", { attrs: { contenteditable: true } })());
      const aElm = dom.firstChild;
      expect(aElm).to.have.attribute("contenteditable", "");
    });
    it("removes boolean attribute correctly", () => {
      const checkedB = sink(false);
      const { dom } = testComponent(e("a", { attrs: { checked: checkedB } })());
      const aElm = dom.firstChild;
      expect(aElm).to.not.have.attribute("checked");
      publish(true, checkedB);
      expect(aElm).to.have.attribute("checked", "");
      publish(false, checkedB);
      expect(aElm).to.not.have.attribute("checked");
    });
  });

  describe("properties", () => {
    it("sets properties from constant values", () => {
      const { dom } = testComponent(e("a", { props: { innerHTML: "<b>Hi</b>" } })());
      const aElm = <Element>dom.firstChild;
      expect(aElm.innerHTML).to.equal("<b>Hi</b>");
    });
    it("sets properties from behaviors", () => {
      const htmlB = sink("<b>Hi</b>");
      const { dom } = testComponent(e("a", { props: { innerHTML: htmlB } })());
      const aElm = <Element>dom.firstChild;
      expect(aElm.innerHTML).to.equal("<b>Hi</b>");
      publish("<b>there</b>", htmlB);
      expect(aElm.innerHTML).to.equal("<b>there</b>");
    });
  });

  describe("style and children combinations", () => {
    it("e(children)         fac(props) ", () => {
      const spanFac = e("span");
      const spanC = spanFac({
        style: {
          backgroundColor: "red"
        }
      });
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });
    it("e(children)         fac(props, children) ", () => {
      const spanFac = e("span");
      const spanC = spanFac({
        style: {
          backgroundColor: "red"
        }
      }, "override text");
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });

    it("e(props)            fac(children) ", () => {
      const spanFac = e("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac("text");
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;")
    });

    it("e(props)            fac(props, children) ", () => {
      const spanFac = e("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac({
        style: {
          backgroundColor: "red"
        }
      }, "text");
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });

    it("e(props, children)  fac(props, children) ", () => {
      const spanFac = e("span", {
        style: {
          backgroundColor: "green"
        }
      });
      const spanC = spanFac({
        style: {
          backgroundColor: "red"
        }
      }, "override text");
      const { dom } = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });
  });

  describe("classToggle", () => {
    it("toggles classe based on behavior", () => {
      const boolB = sink(false);
      const span = elements.span({
        classToggle: { foo: boolB }
      });
      const { dom } = testComponent(span);
      const spanElm = dom.firstChild;
      expect(spanElm).not.to.have.class("foo");
      publish(true, boolB);
      expect(spanElm).to.have.class("foo");
      publish(false, boolB);
      expect(spanElm).not.to.have.class("foo");
    });
  });
});
