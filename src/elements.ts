import {Behavior, at, subscribe} from "hareactive/Behavior";
import {Now} from "hareactive/Now";
import {Stream} from "hareactive/Stream";
import {Component} from "./component";
import {CreateDomNow} from "./dom-builder";

function id<A>(a: A): A { return a; };

export const input = () => new Component((p) => new CreateDomNow<{inputValue: Behavior<string>}>(
  p, "input",
  [{on: "input", name: "inputValue", extractor: (ev: any) => ev.target.value, initial: ""}],
  []
));

export const br = new Component((p) => new CreateDomNow<{}>(p, "br", [], []));

export function span(text: string): Component<{}> {
  return new Component((p) => new CreateDomNow<{}>(p, "span", [], [], text));
}

export function h1(text: string): Component<{}> {
  return new Component((p) => new CreateDomNow<{}>(p, "h1", [], [], text));
}

export function text(tOrB: string|Behavior<Showable>): Component<{}> {
  const elm = document.createTextNode("");
  if (typeof tOrB === "string") {
    elm.nodeValue = tOrB;
  } else {
    if (tOrB.pushing === true) {
      elm.nodeValue = at(tOrB).toString();
    }
    subscribe((t) => elm.nodeValue = t.toString(), tOrB);
  }
  return new Component((parent: Node) => {
    parent.appendChild(elm);
    return Now.of({});
  });
}

export function button(label: string): Component<{click: Stream<Event>}> {
  return new Component((p) => new CreateDomNow<{click: Stream<Event>}>(
    p, "button", [],
    [{on: "click", name: "click", extractor: id}], label
  ));
}

export function div<A>(children: Component<A>): Component<A> {
  return new Component((p) => new CreateDomNow<A>(
    p, "div", [], [], undefined, children
  ));
}
