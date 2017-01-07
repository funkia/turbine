import {assert} from "chai";
import {runMain, elements} from "../src";
const {span} = elements;

describe("bootstrap", () => {
  describe("runMain", () => {
    it("attach component to element in document.body", () => {
      const div = document.createElement("div");
      div.id = "container";
      document.body.appendChild(div);

      const comp = span("Hello world");
      runMain("#container", comp);

      assert.strictEqual(div.children.length, 1);
      assert.strictEqual(div.children[0].tagName, "SPAN");
      assert.strictEqual(div.children[0].textContent, "Hello world");
    });
  })

});
