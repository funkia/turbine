import {assert, use, expect} from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import {isStream, empty, Stream} from "hareactive";
import {testComponent, e, Component, elements} from "../src";
const {button} = elements;

describe("dom-builder: e()", () => {

  it("basic DOM elements", () => {
    const spanFac = e("span");
    const spanC = spanFac();
    const {dom: domSpan} = testComponent(spanC);
    expect(domSpan).to.have.html("<span></span>");

    const h1Fac = e("h1");
    const h1C = h1Fac();
    const {dom: domH1} = testComponent(h1C);
    expect(domH1).to.have.html("<h1></h1>");

    const btnFac = e("button");
    const btnC = btnFac();
    const {dom: domBtn} = testComponent(btnC);
    expect(domBtn).to.have.html("<button></button>");
  });

  it("with class", () => {
    const spanFac = e("span.someClass.otherClass");
    const spanC = spanFac();
    const {dom} = testComponent(spanC);
    expect(dom.querySelector("span")).to.have.class("someClass");
    expect(dom.querySelector("span")).to.have.class("otherClass");
  });

  it("adds static classes", () => {
    const divC = e("div")({class: "foo bar baz"});
    const {dom} = testComponent(divC);
    expect(dom.querySelector("div")).to.have.class("foo");
    expect(dom.querySelector("div")).to.have.class("bar");
    expect(dom.querySelector("div")).to.have.class("baz");
  });

  it("with id", () => {
    const spanFac = e("span#someId");
    const spanC = spanFac();
    const {dom} = testComponent(spanC);
    expect(dom.querySelector("span")).to.have.id("someId");
  });

  it("can rename output", () => {
    const btn = (<Component<{foobar: Stream<any>}>>button({output: {click: "foobar"}}, "Click"));
    const {dom, out} = testComponent(btn);
    assert(isStream(out.foobar));
  });

  it("call methods/actions on the HTMLElement", () => {
    const s: Stream<[string, string]> = empty();
    const span = elements.span({
      action: {
        "setAttribute": s
      }
    });
    const {dom, out} = testComponent(span);
    expect(dom.querySelector("span")).not.to.have.class("test");
    s.push(["class", "test"]);
    expect(dom.querySelector("span")).to.have.class("test");
  });

  describe("children", () => {
    it("nested", () => {
      const spanFac = e("span");
      const h1Fac = e("h1");
      const span = h1Fac(spanFac("Test"));
      const {dom, out} = testComponent(span);
      expect(dom.querySelector("h1")).to.have.length(1);
      expect(dom.querySelector("h1")).to.contain("span");
      expect(dom.querySelector("span")).to.have.text("Test");
    });
  });

  describe("properties", () => {

    it("default style", () => {
      const spanFac = e("span", {
        style: {
          backgroundColor: "red"
        }
      });
      const spanC = spanFac();
      const {dom} = testComponent(spanC);
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
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;")
    });
  });

  describe("properties and children combinations", () => {

    it("e(children)         fac(props) ", () => {
      const spanFac = e("span");
      const spanC = spanFac({style: {
        backgroundColor: "red"
      }});
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });

    it("e(children)         fac(props, children) ", () => {
      const spanFac = e("span");
      const spanC = spanFac({style: {
        backgroundColor: "red"
      }}, "override text");
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });

    it("e(props)            fac(children) ", () => {
      const spanFac = e("span", {style: {
        backgroundColor: "green"
      }});
      const spanC = spanFac("text");
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: green;")
    });

    it("e(props)            fac(props, children) ", () => {
      const spanFac = e("span", {style: {
        backgroundColor: "green"
      }});
      const spanC = spanFac({style: {
        backgroundColor: "red"
      }}, "text");
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });

    it("e(props, children)  fac(props, children) ", () => {
      const spanFac = e("span", {style: {
        backgroundColor: "green"
      }});
      const spanC = spanFac({style: {
        backgroundColor: "red"
      }}, "override text");
      const {dom} = testComponent(spanC);
      expect(dom.querySelector("span")).to.have.text("override text")
      expect(dom.querySelector("span")).to.have.attribute("style", "background-color: red;")
    });
  });
});
