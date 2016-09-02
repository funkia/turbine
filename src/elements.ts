import {Behavior, at, subscribe} from "hareactive/Behavior";
import {Now} from "hareactive/Now";
import {Stream} from "hareactive/Stream";
import {Component} from "./component";
import {e, Showable} from "./dom-builder";

function id<A>(a: A): A { return a; };

export const input = e("input", {behaviors: [
  ["input", "inputValue", (evt) => evt.target.value, ""]
]})

export const br = e("br");
export const span = e("span");
export const h1 = e("h1");
export const div = e("div");
export const button = e("button", {streams: [
  ["click", "click", id]
]});

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
