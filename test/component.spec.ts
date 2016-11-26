import "mocha";
import {assert} from "chai";
import {Behavior, sink} from "hareactive/Behavior";
import {text, dynamic, runComponentNow, toComponent} from "../src/component";
import {e} from "../src/dom-builder";

describe("component", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const div = document.createElement("div");
      const b = sink("Hello");
      const component = toComponent(b);
      runComponentNow(div, component);
      assert.strictEqual(div.textContent, "Hello");
      b.push("world");
      assert.strictEqual(div.textContent, "world");
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
  });
});
