import {Behavior} from "hareactive/behavior";
import {Now} from "hareactive/now";
import {Stream} from "hareactive/stream";
import {Component, viewObserve, Showable, ChildList} from "./component";
import {e, CreateElementFunc} from "./dom-builder";
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

export const br      = e("br")();
export const span    = e("span");
export const h1      = e("h1");
export const div     = e("div");
export const label   = e("label");
export const ul      = e("ul");
export const li      = e("li");
export const a       = e("a");
export const p       = e("p");
export const section = e("section");
export const button  = e("button", { streams: [
  ["click", "click", id]
]});

export {text} from "./component";
