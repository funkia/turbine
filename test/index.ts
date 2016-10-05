import "mocha";
import {assert} from "chai";
import {runComponentNow} from "../src/component";
import {runMain} from "../src/index";
import {span} from "../src/elements";

describe("elements", () => {
  it("renders span", () => {
    const elm = document.createElement("div");
    runComponentNow(elm, span("Text in span"));
    assert.strictEqual(elm.children.length, 1);
    assert.strictEqual(elm.children[0].tagName, "SPAN");
    assert.strictEqual(elm.children[0].innerHTML, "Text in span");
  });
});
