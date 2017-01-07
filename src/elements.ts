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
    ["keyup", "keyup", id],
    ["input", "input", id]
  ]
});

export const br      = e("br")();
export const span    = e("span", {wrapper: true});
export const div     = e("div", {wrapper: true});
export const p       = e("p", {wrapper: true});
export const h1      = e("h1");
export const label   = e("label");
export const ul      = e("ul");
export const li      = e("li");
export const a       = e("a");
export const section = e("section");
export const button  = e("button", {streams: [
  ["click", "click", id]
]});
export const header = e("header", {wrapper: true});
export const footer = e("footer", {wrapper: true});

export {text} from "./component";
