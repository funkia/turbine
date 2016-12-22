import {assert} from "chai";
import {Now} from "hareactive/now";
import {Behavior, sink, placeholder} from "hareactive/behavior";
import {text, dynamic, runComponentNow, toComponent, component, e, elements} from "../src";
const {span, div, button} = elements;

let divElm: HTMLDivElement;
beforeEach(() => {
  divElm = document.createElement("div");
});

describe("component specs", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const b = sink("Hello");
      const component = toComponent(b);
      runComponentNow(divElm, component);
      assert.strictEqual(divElm.textContent, "Hello");
      b.push("world");
      assert.strictEqual(divElm.textContent, "world");
    });
    it("converts an array of components to component", () => {
      runComponentNow(divElm, toComponent([
        span("Hello"), div("There"), button("Click me")
      ]));
      assert.strictEqual(divElm.children.length, 3);
      assert.strictEqual(divElm.children[0].tagName, "SPAN");
      assert.strictEqual(divElm.children[0].textContent, "Hello");
      assert.strictEqual(divElm.children[1].tagName, 'DIV');
      assert.strictEqual(divElm.children[1].textContent, 'There');
      assert.strictEqual(divElm.children[2].tagName, 'BUTTON');
      assert.strictEqual(divElm.children[2].textContent, 'Click me');
    });
  });
  describe("text", () => {
    it("converts string to component", () => {
      runComponentNow(divElm, text("Hello, dom!"));
      assert.strictEqual(divElm.textContent, "Hello, dom!");
    });
    it("converts number to component", () => {
      runComponentNow(divElm, text(200));
      assert.strictEqual(divElm.textContent, "200");
    });
  });
  describe("dynamic", () => {
    it("handles behavior of strings", () => {
      const b = sink("Hello");
      const component = dynamic(b);
      runComponentNow(divElm, component);
      assert.strictEqual(divElm.textContent, "Hello");
      b.push("world");
      assert.strictEqual(divElm.textContent, "world");
    });
    it("handles behavior of component", () => {
      const comp1 = div("Hello");
      const comp2 = span("World");
      const b = sink(comp1);
      const component = dynamic(b);
      runComponentNow(divElm, component);
      assert.strictEqual(divElm.children.length, 1);
      assert.strictEqual(divElm.children[0].tagName, "DIV");
      assert.strictEqual(divElm.children[0].textContent, "Hello");
      b.push(comp2);
      assert.strictEqual(divElm.children.length, 1);
      assert.strictEqual(divElm.children[0].tagName, "SPAN");
      assert.strictEqual(divElm.children[0].textContent, "World");
    });
    it("works with placeholder behavior", () => {
      const b = placeholder();
      const component = dynamic(b);
      runComponentNow(divElm, component);
      b.replaceWith(sink("Hello"));
      assert.strictEqual(divElm.textContent, "Hello");
    });
  });

  describe("component", () => {
    it("simpel span component", () => {
      const c = component(
	function model() {
	  return Now.of([{}, {}]);
	},
	function view() {
	  return span("World");
	}
      );
      runComponentNow(divElm, c);
      assert.strictEqual(divElm.children[0].tagName, "SPAN");
      assert.strictEqual(divElm.children[0].textContent, "World");
    });
  });
});

