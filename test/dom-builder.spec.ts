import {assert} from "chai";
import {runComponentNow, e} from "../src";

describe("dom-builder: e()", () => {

  it("basic DOM elements", () => {
    const spanFac = e("span");
    const spanC = spanFac();
    const spanDiv = document.createElement("div");
    runComponentNow(spanDiv, spanC);
    assert.strictEqual(spanDiv.children.length, 1, "No element was attached");
    assert.strictEqual(spanDiv.children[0].tagName, "SPAN", "Wrong element was attached");

    const h1Fac = e("h1");
    const h1C = h1Fac();
    const h1Div = document.createElement("div");
    runComponentNow(h1Div, h1C);
    assert.strictEqual(h1Div.children.length, 1, "No element was attached");
    assert.strictEqual(h1Div.children[0].tagName, "H1", "Wrong element was attached");

    const btnFac = e("button");
    const btnC = btnFac();
    const btnDiv = document.createElement("div");
    runComponentNow(btnDiv, btnC);
    assert.strictEqual(btnDiv.children.length, 1, "No element was attached");
    assert.strictEqual(btnDiv.children[0].tagName, "BUTTON", "Wrong element was attached");
  });

  it("with class", () => {
    const spanFac = e("span.someClass.otherClass");
    const spanC = spanFac();
    const div = document.createElement("div");
    runComponentNow(div, spanC);
    assert.strictEqual(div.children[0].tagName, "SPAN", "Wrong element was attached");
    assert.strictEqual(div.children[0].classList.toString(), "someClass otherClass");
  });

  it("with id", () => {
    const spanFac = e("span#someId");
    const spanC = spanFac();
    const div = document.createElement("div");
    runComponentNow(div, spanC);
    assert.strictEqual(div.children[0].tagName, "SPAN", "Wrong element was attached");
    assert.strictEqual(div.children[0].id, "someId");
  });

  describe("children", () => {

    it("default text", () => {
      const spanFac = e("span", "default text");
      const spanC = spanFac();
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "default text");
    });

    it("override text", () => {
      const spanFac = e("span", "default text");
      const spanC = spanFac("override text");
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "override text");
    });

    it("nested", () => {
      const spanFac = e("span");
      const h1Fac = e("h1");
      const spanC = h1Fac(spanFac("Test"));
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].tagName, "H1", "Wrong element was attached");
      assert.strictEqual(div.children[0].children[0].tagName, "SPAN", "Wrong element was attached");
    });
  });

  describe("properties", () => {

    it("default style", () => {
      const spanFac = e("span", {
        style: {
          background: "red"
        }
      });
      const spanC = spanFac();
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "red");
    });

    it("override style", () => {
      const spanFac = e("span", {
        style: {
          background: "red"
        }
      });
      const spanC = spanFac({
        style: {
          background: "green"
        }
      });
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "green");
    });
  });

  describe("properties and children combinations", () => {

    it("e(children)         fac(props) ", () => {
      const spanFac = e("span", "default text");
      const spanC = spanFac({style: {
        background: "red"
      }});
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "default text");
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "red");
    });

    it("e(children)         fac(props, children) ", () => {
      const spanFac = e("span", "default text");
      const spanC = spanFac({style: {
        background: "red"
      }}, "override text");
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "override text");
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "red");
    });

    it("e(props)            fac(children) ", () => {
      const spanFac = e("span", {style: {
        background: "green"
      }});
      const spanC = spanFac("text");
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "text");
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "green");
    });

    it("e(props)            fac(props, children) ", () => {
      const spanFac = e("span", {style: {
        background: "green"
      }});
      const spanC = spanFac({style: {
        background: "red"
      }}, "text");
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "text");
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "red");
    });

    it("e(props, children)  fac(props, children) ", () => {
      const spanFac = e("span", {style: {
        background: "green"
      }}, "default text");
      const spanC = spanFac({style: {
        background: "red"
      }}, "override text");
      const div = document.createElement("div");
      runComponentNow(div, spanC);
      assert.strictEqual(div.children[0].textContent, "override text");
      assert.strictEqual((<HTMLElement>div.children[0]).style.background, "red");
    });
  });
});
