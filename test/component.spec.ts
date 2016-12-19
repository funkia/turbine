import "mocha";
import {assert} from "chai";
import {Behavior, sink, placeholder} from "hareactive/behavior";
import {text, dynamic, runComponentNow, toComponent} from "../src/component";
import {e} from "../src/dom-builder";
import {span, div, button} from "../src/elements";

describe("component", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const divElm = document.createElement("div");
      const b = sink("Hello");
      const component = toComponent(b);
      runComponentNow(divElm, component);
      assert.strictEqual(divElm.textContent, "Hello");
      b.push("world");
      assert.strictEqual(divElm.textContent, "world");
    });
    it("converts an array of components to component", () => {
      const divElm = document.createElement("div");
      runComponentNow(divElm, toComponent([
        span("Hello"), div("There"), button("Click me")
      ]));
      assert.strictEqual(divElm.children.length, 3);
      assert.strictEqual(divElm.children[0].tagName, 'SPAN');
      assert.strictEqual(divElm.children[0].textContent, 'Hello');
      assert.strictEqual(divElm.children[1].tagName, 'DIV');
      assert.strictEqual(divElm.children[1].textContent, 'There');
      assert.strictEqual(divElm.children[2].tagName, 'BUTTON');
      assert.strictEqual(divElm.children[2].textContent, 'Click me');
    });
  });
  describe("text", () => {
    it("converts string to component", () => {
      const div = document.createElement("div");
      runComponentNow(div, text("Hello, dom!"));
      assert.strictEqual(div.textContent, "Hello, dom!");
    });
    it("converts number to component", () => {
      const div = document.createElement("div");
      runComponentNow(div, text(200));
      assert.strictEqual(div.textContent, "200");
    });
  });
  describe("dynamic", () => {
    it("handles behavior of strings", () => {
      const div = document.createElement("div");
      const b = sink("Hello");
      const component = dynamic(b);
      runComponentNow(div, component);
      assert.strictEqual(div.textContent, "Hello");
      b.push("world");
      assert.strictEqual(div.textContent, "world");
    });
    it("handles behavior of component", () => {
      const divElm = document.createElement("div");
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
      const div = document.createElement("div");
      const component = dynamic(b);
      runComponentNow(div, component);
      b.replaceWith(sink("Hello"));
      assert.strictEqual(div.textContent, "Hello");
    });
  });
});
