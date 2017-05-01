import { assert, use, expect } from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import { fgo } from "@funkia/jabz";
import { Behavior, isBehavior, sink, placeholder, Now, publish, fromFunction } from "@funkia/hareactive";
import * as fakeRaf from "fake-raf";

import {
  text, dynamic, Child,
  toComponent, Component, modelView,
  elements, loop, testComponent, list, runComponent
} from "../src";
const { span, div, button, input } = elements;

const supportsProxy = "Proxy" in window;

describe("component specs", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const b = sink("Hello");
      const component = toComponent(b);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("converts an array of components to component", () => {
      const component = toComponent([span("Hello"), div("There"), button("Click me")]);
      const { dom, out } = testComponent(component);

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
      const { dom } = testComponent(component);
      expect(dom).to.have.text("Hello, dom!");
    });
    it("converts number to component", () => {
      const component = text(200);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("200");
    });
  });
  describe("dynamic", () => {
    it("handles push behavior of strings", () => {
      const b = sink("Hello");
      const component = dynamic(b);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("handles pull behavior of strings", () => {
      fakeRaf.use();
      let value = "foo";
      const b = fromFunction(() => value);
      const component = dynamic(b);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("foo");
      value = "bar";
      expect(dom).to.have.text("foo");
      fakeRaf.step();
      expect(dom).to.have.text("bar");
      fakeRaf.restore();
    });
    it("handles behavior of component", () => {
      const comp1 = div("Hello");
      const comp2 = span("World");
      const b = sink(comp1);
      const component = dynamic(b);
      const { dom } = testComponent(component);
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
      const { dom } = testComponent(component);
      b.replaceWith(sink("Hello"));
      expect(dom).to.have.text("Hello");
    });
  });

  describe("loop", () => {
    type Looped = { name: Behavior<string> };
    it("works with explicit fgo and looped behavior", () => {
      const comp = loop(fgo(function* ({ name }: Looped): IterableIterator<Component<any>> {
        yield div(name);
        ({ inputValue: name } = yield input({ props: { value: "Foo" } }));
        return { name };
      }));
      const { dom } = testComponent(comp);
      expect(dom).to.have.length(2);
      expect(dom.firstChild).to.have.text("Foo");
    });
    it("can be called directly with generator function", () => {
      const comp = loop(function* ({ name }: Looped): IterableIterator<Component<any>> {
        yield div(name);
        ({ inputValue: name } = yield input({ props: { value: "Foo" } }));
        return { name };
      });
    });
  });
});

describe("modelView", () => {
  it("simple span component", () => {
    const c = modelView(
      function model(): Now<any> {
        return Now.of([{}, {}] as [{}, {}]);
      },
      function view(): Component<any> {
        return span("World");
      }
    )();
    const { dom } = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("World");
  });
  it("passes argument to model", () => {
    const pair = <A, B>(a: A, b: B): [A, B] => ([a, b]);
    const c = modelView(
      ({ click }, n: number) => Now.of(pair({ n: Behavior.of(n) }, 12)),
      ({ n }) => span(n)
    );
    const { dom } = testComponent(c(12));
    expect(dom.querySelector("span")).to.have.text(("12"));
  });
  it("passes argument to view", () => {
    const pair = <A, B>(a: A, b: B): [A, B] => ([a, b]);
    const c = modelView(
      ({ click }) => Now.of(pair({}, {})),
      ({ }, n: number) => span(n)
    );
    const { dom } = testComponent(c(7));
    expect(dom.querySelector("span")).to.have.text(("7"));
  });
  it("view is function returning array of components", () => {
    type FromView = { inputValue: Behavior<any> };
    let fromView: FromView;
    const c = modelView(
      function model(args: FromView): Now<any> {
        fromView = args;
        return Now.of([{}, {}] as [{}, {}]);
      }, (): Child<FromView> => [
        span("Hello"),
        input()
      ])();
    const { dom } = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("Hello");
    assert(isBehavior(fromView.inputValue));
  });
  it("throws an error message if the view doesn't return the needed properties", () => {
    if (!supportsProxy) {
      return;
    }
    const c = modelView(
      function fooComp({ foo }: any): Now<any> { return Now.of([{}, {}] as [{}, {}]); },
      function barView(): Component<any> { return Component.of({ bar: "no foo?" }); }
    )();
    assert.throws(() => {
      testComponent(c);
    }, /fooComp/);
  });
});

describe("list", () => {
  const createSpan = (content: string) => span(content);
  const initial = ["Hello ", "there", "!"]
  it("has correct initial order", () => {
    const listB = sink(initial);
    const { dom } = testComponent(list(createSpan, listB));
    expect(dom).to.have.length(3);
    expect(dom).to.have.text("Hello there!");
  });
  it("reorders elements", () => {
    const listB = sink(initial);
    const { dom } = testComponent(list(createSpan, listB));
    expect(dom).to.have.length(3);
    const elements = dom.childNodes;
    publish(["!", "there", "Hello "], listB);
    expect(dom).to.have.length(3);
    expect(dom).to.contain(elements[0]);
    expect(dom).to.contain(elements[1]);
    expect(dom).to.contain(elements[2]);
  });
  it("removes element", () => {
    const listB = sink(initial);
    const { dom } = testComponent(list(createSpan, listB));
    const toBeRemoved = dom.childNodes[1];
    expect(dom).to.have.length(3);
    expect(dom).to.have.text("Hello there!");
    publish(["Hello ", "!"], listB);
    expect(dom).to.have.length(2);
    expect(dom).to.not.contain(toBeRemoved);
  });
  it("outputs object with property", () => {
    const listB = sink(initial);
    const { out } = testComponent(list(createSpan, listB, "foobar"));
    console.log(out);
    assert.notEqual(out.foobar, undefined);
  });
});

describe("runComponent", () => {
  it("attach component to element in document.body", () => {
    const div = document.createElement("div");
    div.id = "container";
    document.body.appendChild(div);

    const comp = span("Hello world");
    runComponent("#container", comp);

    expect(document.querySelector("span")).to.exist;
    expect(document.querySelector("span")).to.have.text("Hello world");
  });
});