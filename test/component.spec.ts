import {assert, use, expect} from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import {fgo} from "jabz/monad";
import {Behavior, isBehavior, sink, placeholder, Now} from "hareactive";

import {
  text, dynamic,
  toComponent, Component, component,
  elements, loop, testComponent
} from "../src";
const {span, div, button, input} = elements;

const supportsProxy = "Proxy" in window;

describe("component specs", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const b = sink("Hello");
      const component = toComponent(b);
      const {dom} = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("converts an array of components to component", () => {
      const component = toComponent([span("Hello"), div("There"), button("Click me")]);
      const {dom, out} = testComponent(component);

      expect(out).to.have.property("click");
      expect(dom).to.have.length(3);
      expect(dom.querySelector("span")).to.have.text("Hello");
      expect(dom.querySelector("div")).to.have.text("There");
      expect(dom.querySelector("button")).to.have.text("Click me");
    });
  });
  describe("text", () => {
    it("converts string to component", () => {
      const component = text("Hello, dom!");
      const {dom} = testComponent(component);
      expect(dom).to.have.text("Hello, dom!");
    });
    it("converts number to component", () => {
      const component = text(200);
      const {dom} = testComponent(component);
      expect(dom).to.have.text("200");
    });
  });
  describe("dynamic", () => {
    it("handles behavior of strings", () => {
      const b = sink("Hello");
      const component = dynamic(b);
      const {dom} = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("handles behavior of component", () => {
      const comp1 = div("Hello");
      const comp2 = span("World");
      const b = sink(comp1);
      const component = dynamic(b);
      const {dom} = testComponent(component);
      expect(dom).to.have.length(1);
      expect(dom.querySelector("div")).to.exist;
      expect(dom.querySelector("div")).to.have.text("Hello");
      b.push(comp2);
      expect(dom).to.have.length(1);
      expect(dom.querySelector("div")).not.to.exist;
      expect(dom.querySelector("span")).to.exist;
      expect(dom.querySelector("span")).to.have.text("World");
    });
    it("works with placeholder behavior", () => {
      const b = placeholder();
      const component = dynamic(b);
      const {dom} = testComponent(component);
      b.replaceWith(sink("Hello"));
      expect(dom).to.have.text("Hello");
    });
  });

  describe("loop", () => {
    it("works with explicit fgo and looped behavior", () => {
      type Looped = {name: Behavior<string>};
      const comp = loop(fgo(function*({name}: Looped): IterableIterator<Component<any>> {
        yield div(name);
        ({inputValue: name} = yield input({props: {value: "Foo"}}));
        return {name};
      }));
      const {dom} = testComponent(comp);
      expect(dom).to.have.length(2);
      expect(dom.firstChild).to.have.text("Foo");
    });
  });
});

describe("component", () => {
  it("simpel span component", () => {
    const c = component(
      function model(): Now<any> {
        return Now.of([{}, {}] as [{}, {}]);
      },
      function view(): Component<any> {
        return span("World");
      }
    );
    const {dom} = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("World");
  });

  it("view is function returning array of components", () => {
    type FromView = {inputValue: Behavior<any>};
    let fromView: FromView;
    const c = component(
      function model(args: FromView): Now<any> {
        fromView = args;
        return Now.of([{}, {}] as [{}, {}]);
      }, () => [
        span("Hello"),
        input()
      ]);
    const {dom} = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("Hello");
    assert(isBehavior(fromView.inputValue));
  });

  it("throws an error message if the view doesn't return the needed properties", () => {
    if (!supportsProxy) {
      return;
    }
    const c = component(
      function fooComp({foo}: any): Now<any> { return Now.of([{}, {}] as [{}, {}]); },
      function barView(): Component<any> { return Component.of({bar: "no foo?"}); }
    );
    assert.throws(() => {
      testComponent(c);
    }, /fooComp/);
  });
});
