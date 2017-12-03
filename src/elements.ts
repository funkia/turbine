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

export const canvas = element("canvas");
export const button = element("button");
export const img = element("img");
export const a = element("a");
export const i = element("i");
export const b = element("b");
export const label = element("label");
export const br = element("br")();
export const span = element("span");
export const div = element("div");
export const p = element("p");
export const h1 = element("h1");
export const h2 = element("h2");
export const h3 = element("h3");
export const h4 = element("h4");
export const h5 = element("h5");
export const h6 = element("h6");
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
