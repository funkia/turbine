import {Behavior, Stream} from "hareactive";
import {Component, ChildList} from "./component";
import {e} from "./dom-builder";
import {CSSStyleType} from "./CSSStyleType";

function id<A>(a: A): A { return a; };

export const input = e("input", {
  actionDefinitions: {
    focus: (element) => element.focus()
  },
  behaviors: [
    ["input", "inputValue", (evt: any) => evt.target.value, ({value}: HTMLInputElement) => value]
  ],
  streams: [
    ["keyup", "keyup", id],
    ["input", "input", id],
    ["blur", "blur", id]
  ]
});

function getTargetChecked(event: any): boolean {
  return event.target.checked;
}

export const checkbox = e("input[type=checkbox]", {
  behaviors: [
    ["change", "checked", getTargetChecked, ({checked}: HTMLInputElement) => checked]
  ],
  streams: [
    ["change", "checkedChange", getTargetChecked]
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
export const label   = e("label", {
  streams: [["dblclick", "dblclick", id]]
});
export const ul      = e("ul", {wrapper: true});
export const li      = e("li", {wrapper: true});
export const a       = e("a");
export const strong  = e("strong", {wrapper: true});
export const section = e("section", {wrapper: true});
export const header  = e("header", {wrapper: true});
export const footer  = e("footer", {wrapper: true});

export {text} from "./component";
