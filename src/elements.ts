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
export const checkbox = e("input[type=checkbox]", {
  behaviors: [
    ["change", "checked", (evt: any) => evt.target.checked, false]
  ]
});
export const button  = e("button", {
  streams: [
    ["click", "click", id]
  ]
});
export const br      = e("br")();
export const span    = e("span", {wrapper: true});
export const div     = e("div", {wrapper: true});
export const p       = e("p", {wrapper: true});
export const h1      = e("h1");
export const label   = e("label");
export const ul      = e("ul", {wrapper: true});
export const li      = e("li");
export const a       = e("a");
export const strong  = e("strong", {wrapper: true});
export const section = e("section", {wrapper: true});
export const header  = e("header", {wrapper: true});
export const footer  = e("footer", {wrapper: true});

export {text} from "./component";
