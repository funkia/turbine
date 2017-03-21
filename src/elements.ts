import { Behavior, Stream } from "hareactive";
import { Component, ChildList } from "./component";
import { e } from "./dom-builder";

export const input = e("input", {
  actionDefinitions: {
    focus: (element): void => element.focus()
  },
  behaviors: [
    ["input", "inputValue", (evt: any) => evt.target.value, ({value}: HTMLInputElement) => value]
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

// Elements with interesting output
export const button = e("button");
export const a = e("a");
export const label = e("label");

// Wrapper elements
export const br = e("br")();
export const span = e("span", { wrapper: true });
export const div = e("div", { wrapper: true });
export const p = e("p", { wrapper: true });
export const h1 = e("h1");
export const ul = e("ul", { wrapper: true });
export const li = e("li", { wrapper: true });
export const strong = e("strong", { wrapper: true });
export const section = e("section", { wrapper: true });
export const header = e("header", { wrapper: true });
export const footer = e("footer", { wrapper: true });

export { text } from "./component";
