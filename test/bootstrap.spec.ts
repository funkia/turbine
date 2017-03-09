import {use, expect} from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
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

      expect(document.querySelector("span")).to.exist;
      expect(document.querySelector("span")).to.have.text("Hello world");
    });
  });
});
