import { assert, use, expect } from "chai";
import * as chaiDom from "chai-dom";
use(chaiDom);
import { fgo } from "@funkia/jabz";
import * as H from "@funkia/hareactive";
import * as fakeRaf from "fake-raf";

import {
  text,
  dynamic,
  Child,
  toComponent,
  Component,
  modelView,
  emptyComponent,
  elements,
  loop,
  testComponent,
  list,
  runComponent,
  output,
  merge
} from "../src";
const { span, div, button, input } = elements;

const supportsProxy = "Proxy" in window;

describe("component specs", () => {
  describe("toComponent", () => {
    it("convert behavior of string to component", () => {
      const b = H.sinkBehavior("Hello");
      const component = toComponent(b);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("converts an array of components to component", () => {
      const component = toComponent([
        span("Hello"),
        div("There"),
        button("Click me").output({ click: "click" })
      ]);
      const { dom, out } = testComponent(component);

      expect(out).to.have.property("click");
      expect(dom).to.have.length(3);
      expect(dom.querySelector("span")).to.have.text("Hello");
      expect(dom.querySelector("div")).to.have.text("There");
      expect(dom.querySelector("button")).to.have.text("Click me");
    });
    it("only combines explicit output in array", () => {
      const component = toComponent([
        button("Click me"),
        button().output({ trigger: "click" })
      ]);
      const { dom, out } = testComponent(component);
      expect(out).to.have.property("trigger");
      expect(out).to.not.have.property("click");
    });
  });
  describe("explicit output", () => {
    it("has output method", () => {
      const comp = Component.of({ foo: 1, bar: 2, baz: 3 }).output({
        newFoo: "foo",
        newBar: "bar"
      });
      const { dom, out, explicit } = testComponent(comp);
      expect(explicit.newFoo).to.equal(1);
      expect(explicit.newBar).to.equal(2);
      expect((out as any).newFoo).to.be.undefined;
    });
    it("has output function", () => {
      const comp = Component.of({ foo: 1, bar: "two", baz: 3 });
      const comp2 = output({ newFoo: "foo", newBar: "bar" }, comp);
      const { dom, out, explicit } = testComponent(comp2);
      // type asserts to check that the types work
      explicit.newFoo as number;
      explicit.newBar as string;
      expect(explicit.newFoo).to.equal(1);
      expect(explicit.newBar).to.equal("two");
      expect((out as any).newFoo).to.be.undefined;
    });
  });
  describe("merge", () => {
    it("merges output", () => {
      const b1 = button().output({ click1: "click" });
      const b2 = button().output({ click2: "click" });
      const m = merge(b1, b2);
      const { explicit, out } = testComponent(m);
      expect(out).to.have.property("click1");
      expect(out).to.have.property("click2");
      expect(explicit).to.have.property("click1");
      expect(explicit).to.have.property("click2");
    });
  });
  describe("empty component", () => {
    it("creates no dom", () => {
      const { dom } = testComponent(emptyComponent);
      expect(dom).to.be.empty;
    });
    it("it outputs an empty object", () => {
      const { out } = testComponent(emptyComponent);
      assert.typeOf(out, "object");
      assert.deepEqual(Object.keys(out), []);
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
      const b = H.sinkBehavior("Hello");
      const component = dynamic(b);
      const { dom } = testComponent(component);
      expect(dom).to.have.text("Hello");
      b.push("world");
      expect(dom).to.have.text("world");
    });
    it("handles pull behavior of strings", () => {
      fakeRaf.use();
      let value = "foo";
      const b = H.fromFunction(() => value);
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
      const b = H.sinkBehavior(comp1);
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
      const b = H.placeholder<Child>();
      const component = dynamic(b);
      const { dom } = testComponent(component);
      b.replaceWith(H.sinkBehavior("Hello"));
      expect(dom).to.have.text("Hello");
    });
    it("only outputs explicit output", () => {
      const c = dynamic(
        H.Behavior.of(Component.of({ foo: 1, bar: 2 }).output({ baz: "bar" }))
      );
      const { explicit, out } = testComponent(c);
      assert.deepEqual(explicit, {});
      assert.deepEqual(Object.keys(H.at(out)), ["baz"]);
    });
    it("dynamic in dynamic", () => {
      const model = () => {
        return H.Now.of({
          content: H.Behavior.of("hello"),
          isEditing: H.Behavior.of(false)
        });
      };
      const view = ({ content, isEditing }: any) => [
        dynamic(isEditing.map((_: any) => dynamic(content)))
      ];
      const brokenComponent = modelView(model, view);
      testComponent(brokenComponent());
    });
  });

  describe("loop", () => {
    type Looped = { name: H.Behavior<string>; destroyed: H.Future<boolean> };
    it("works with explicit fgo and looped behavior", () => {
      const comp = loop(
        fgo(function*({ name }: Looped): IterableIterator<Component<any, any>> {
          yield div(name);
          ({ value: name } = yield input({ props: { value: "Foo" } }));
          return { name };
        })
      );
      const { dom } = testComponent(comp);
      expect(dom).to.have.length(2);
      expect(dom.firstChild).to.have.text("Foo");
    });
    // it("can be called directly with generator function", () => {
    //   const comp = loop(function*({
    //     name
    //   }: Looped): IterableIterator<Component<any, any>> {
    //     yield div(name);
    //     ({ value: name } = yield input({ props: { value: "Foo" } }));
    //     return { name };
    //   });
    // });
    it("can be told to destroy", () => {
      let toplevel = false;
      const comp = loop(
        fgo(function*({
          name,
          destroyed
        }: Looped): IterableIterator<Component<any, any>> {
          yield div(name);
          destroyed.subscribe((b) => (toplevel = b));
          ({ value: name } = yield input({ props: { value: "Foo" } }));
          return { name };
        })
      );
      const { dom, destroy } = testComponent(comp);
      expect(dom).to.have.length(2);
      expect(dom.firstChild).to.have.text("Foo");
      destroy(true);
      expect(dom).to.have.length(0);
      expect(toplevel).to.equal(true);
    });
  });
});

describe("modelView", () => {
  it("simple span component", () => {
    const c = modelView(
      function model(): H.Now<any> {
        return H.Now.of({});
      },
      function view(): Component<any, any> {
        return span("World");
      }
    )();
    const { dom } = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("World");
  });
  it("passes explicit output to model", () => {
    const c = modelView(
      (input: { spanClicked: H.Stream<any> }, n: number) => {
        assert.deepEqual(Object.keys(input), ["spanClicked", "destroyed"]);
        return H.Now.of({ n: H.Behavior.of(n) });
      },
      ({ n }) => span(n).output({ spanClicked: "click" })
    );
    const { dom } = testComponent(c(12));
    expect(dom.querySelector("span")).to.have.text("12");
  });
  it("passes argument to view", () => {
    const c = modelView(
      ({ click }) => H.Now.of({}),
      ({}, n: number) => span(n).output({ click: "click" })
    );
    const { dom } = testComponent(c(7));
    expect(dom.querySelector("span")).to.have.text("7");
  });
  it("view is function returning array of components", () => {
    type FromView = { value: H.Behavior<any> };
    let fromView: FromView;
    const c = modelView(
      function model(args: FromView): H.Now<any> {
        fromView = args;
        return H.Now.of({});
      },
      (): Child<FromView> => [
        span("Hello"),
        input().output({ value: "value" })
      ]
    )();
    const { dom } = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("Hello");
    assert(H.isBehavior(fromView!.value));
  });
  it("throws an error message if the view doesn't return the needed properties", () => {
    if (!supportsProxy) {
      return;
    }
    const c = modelView(
      function fooComp({ foo }: any): H.Now<any> {
        return H.Now.of({});
      },
      function barView(): Component<any, any> {
        return Component.of({ bar: "no foo?" });
      }
    )();
    assert.throws(() => {
      testComponent(c);
    }, /fooComp/);
  });
  it("can be told to destroy", () => {
    let toplevel = false;
    const c = modelView(
      function model({ destroyed }): H.Now<any> {
        destroyed.subscribe((b: boolean) => (toplevel = b));
        return H.Now.of({});
      },
      function view(): Component<any, any> {
        return span("World");
      }
    )();
    const { dom, destroy } = testComponent(c);
    expect(dom.querySelector("span")).to.exist;
    expect(dom.querySelector("span")).to.have.text("World");
    destroy(true);
    expect(dom.querySelector("span")).to.not.exist;
    expect(toplevel).to.equal(true);
  });
});

describe("list", () => {
  const createSpan = (content: string) => span(content);
  const initial = ["Hello ", "there", "!"];
  it("has correct initial order", () => {
    const listB = H.sinkBehavior(initial);
    const { dom } = testComponent(list(createSpan, listB));
    expect(dom).to.have.length(3);
    expect(dom).to.have.text("Hello there!");
  });
  it("reorders elements", () => {
    const listB = H.sinkBehavior(initial);
    const { dom } = testComponent(list(createSpan, listB));
    expect(dom).to.have.length(3);
    const elements = dom.childNodes;
    H.push(["!", "there", "Hello "], listB);
    expect(dom).to.have.length(3);
    expect(dom).to.contain(elements[0]);
    expect(dom).to.contain(elements[1]);
    expect(dom).to.contain(elements[2]);
    expect(dom).to.have.text("!thereHello ");
  });
  it("removes element", () => {
    const listB = H.sinkBehavior(initial);
    const { dom } = testComponent(list(createSpan, listB));
    const toBeRemoved = dom.childNodes[1];
    expect(dom).to.have.length(3);
    expect(dom).to.have.text("Hello there!");
    H.push(["Hello ", "!"], listB);
    expect(dom).to.have.length(2);
    expect(dom).to.not.contain(toBeRemoved);
  });
  it("outputs object with property", () => {
    const listB = H.sinkBehavior(initial);
    const { explicit } = testComponent(
      list(createSpan, listB).output((o) => ({ foobar: o }))
    );
    assert.notEqual(explicit.foobar, undefined);
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
