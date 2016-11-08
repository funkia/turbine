import {Behavior, at, observe} from "hareactive/Behavior";
import {Now} from "hareactive/Now";
import {Stream} from "hareactive/Stream";
import {Component, viewObserve} from "./component";
import {e, Showable, CreateElementFunc} from "./dom-builder";
import {CSSStyleType} from "./CSSStyleType";

function id<A>(a: A): A { return a; };

export const input = e("input", {
  behaviors: [
    ["input", "inputValue", (evt: any) => evt.target.value, ""]
  ],
  streams: [
    ["input", "input", id]
  ]
});

export const br = e("br")();
export const span = e("span");
export const h1 = e("h1");
export const div = e("div");
export const label = e("label");
export const button = e("button", { streams: [
  ["click", "click", id]
]});

export function text(tOrB: string|Behavior<Showable>): Component<{}> {
  const elm = document.createTextNode("");
  if (typeof tOrB === "string") {
    elm.nodeValue = tOrB;
  } else {
    viewObserve((text) => elm.nodeValue = text.toString(), tOrB);
  }
  return new Component((parent: Node) => {
    parent.appendChild(elm);
    return Now.of({});
  });
};
