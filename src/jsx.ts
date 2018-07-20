import { elements } from ".";
import { Component } from "./component";
import { div } from "./elements";
import { DefaultOutput, Properties, ElementCreator } from "./dom-builder";

export function createElement(
  node: string,
  props: Properties<DefaultOutput> | null,
  ...children: any[]
): Component<{}, DefaultOutput> {
  console.log("node", node);
  console.log("props", props);
  console.log("children", children);

  const e: ElementCreator<any> = node in elements ? (<any>elements)[node] : div;

  if (props !== null) {
    let o = undefined;
    if ("output" in props && typeof props === "object") {
      o = props.output;
      delete props.output;
    }
    const el = e(props, children);
    return o !== undefined ? el.output(o) : el;
  }
  return e(children);
}

declare global {
  namespace JSX {
    type IntrinsicElements = { [k in keyof typeof elements]: any };
    type Element = Component<any, any>;
  }
}
