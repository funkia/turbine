import { Behavior, Stream } from "@funkia/hareactive";
import { Component, ChildList } from "./component";
import { element, streamDescription, behaviorDescription } from "./dom-builder";

export const input = element("input", {
  actionDefinitions: {
    focus: (element): void => element.focus()
  },
  behaviors: {
    inputValue: behaviorDescription(
      "input", (evt: any) => evt.target.value as string, (elm: any) => elm.value as string
    )
  }
});

function getTargetChecked(event: any): boolean {
  return event.target.checked;
}

export const checkbox = element("input[type=checkbox]", {
  behaviors: {
    checked: behaviorDescription("change", getTargetChecked, (elm: any) => elm.checked)
  },
  streams: {
    checkedChange: streamDescription("change", getTargetChecked)
  }
});

export const button = element("button");
export const a = element("a");
export const label = element("label");
export const br = element("br")();
export const span = element("span");
export const div = element("div");
export const p = element("p");
export const h1 = element("h1");
export const ul = element("ul");
export const li = element("li");
export const strong = element("strong");
export const section = element("section");
export const nav = element("nav");
export const aside = element("aside");
export const article = element("article");
export const header = element("header");
export const footer = element("footer");

export { text } from "./component";
