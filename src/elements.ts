import { Behavior, Stream } from "hareactive";
import { Component, ChildList } from "./component";
import { e, streamDescription, behaviorDescription } from "./dom-builder";

export const input = e("input", {
  actionDefinitions: {
    focus: (element): void => element.focus()
  },
  behaviors: {
    inputValue: behaviorDescription("input", (evt: any) => evt.target.value, (elm: any) => elm.value)
  }
});

function getTargetChecked(event: any): boolean {
  return event.target.checked;
}

export const checkbox = e("input[type=checkbox]", {
  behaviors: {
    checked: behaviorDescription("change", getTargetChecked, (elm: any) => elm.checked)
  },
  streams: {
    checkedChange: streamDescription("change", getTargetChecked)
  }
});

export const button = e("button");
export const a = e("a");
export const label = e("label");
export const br = e("br")();
export const span = e("span");
export const div = e("div");
export const p = e("p");
export const h1 = e("h1");
export const ul = e("ul");
export const li = e("li");
export const strong = e("strong");
export const section = e("section");
export const header = e("header");
export const footer = e("footer");

export { text } from "./component";
