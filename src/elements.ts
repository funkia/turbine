import {
  behaviorDescription,
  element,
  svgElement,
  streamDescription
} from "./dom-builder";

export const input = element("input", {
  actionDefinitions: {
    focus: (elm: HTMLElement): void => elm.focus()
  },
  behaviors: {
    value: behaviorDescription(
      "input",
      (evt: any) => evt.target.value as string,
      (elm: any) => elm.value as string
    )
  }
});

export const textarea = element("textarea", {
  behaviors: {
    value: behaviorDescription(
      "input",
      (evt: any) => evt.target.value as string,
      (elm: any) => elm.value as string
    )
  }
});

function getTargetChecked(event: any): boolean {
  return event.target.checked;
}

export const checkbox = element("input", {
  attrs: { type: "checkbox" },
  behaviors: {
    checked: behaviorDescription(
      "change",
      getTargetChecked,
      (elm: any) => elm.checked
    )
  },
  streams: {
    checkedChange: streamDescription("change", getTargetChecked)
  }
});

export const address = element("address");
export const article = element("article");
export const aside = element("aside");
export const footer = element("footer");
export const header = element("header");
export const h1 = element("h1");
export const h2 = element("h2");
export const h3 = element("h3");
export const h4 = element("h4");
export const h5 = element("h5");
export const h6 = element("h6");
export const hgroup = element("hgroup");
export const nav = element("nav");
export const section = element("section");
export const blockquote = element("blockquote");
export const dd = element("dd");
export const div = element("div");
export const dl = element("dl");
export const dt = element("dt");
export const figcaption = element("figcaption");
export const figure = element("figure");
export const hr = element("hr");
export const li = element("li");
export const main = element("main");
export const ol = element("ol");
export const p = element("p");
export const pre = element("pre");
export const ul = element("ul");
export const a = element("a");
export const abbr = element("abbr");
export const b = element("b");
export const bdi = element("bdi");
export const bdo = element("bdo");
export const br = element("br")();
export const cite = element("cite");
export const code = element("code");
export const data = element("data");
export const dfn = element("dfn");
export const em = element("em");
export const i = element("i");
export const kbd = element("kbd");
export const mark = element("mark");
export const q = element("q");
export const rp = element("rp");
export const rt = element("rt");
export const rtc = element("rtc");
export const ruby = element("ruby");
export const s = element("s");
export const samp = element("samp");
export const small = element("small");
export const span = element("span");
export const strong = element("strong");
export const sub = element("sub");
export const sup = element("sup");
export const time = element("time");
export const u = element("u");
export const varElement = element("var");
export const wbr = element("wbr");
export const area = element("area");
export const audio = element("audio");
export const img = element("img");
export const map = element("map");
export const track = element("track");
export const video = element("video");
export const embed = element("embed");
export const object = element("object");
export const param = element("param");
export const picture = element("picture");
export const source = element("source");
export const canvas = element("canvas");
export const script = element("script");
export const del = element("del");
export const ins = element("ins");
export const caption = element("caption");
export const col = element("col");
export const colgroup = element("colgroup");
export const table = element("table");
export const tbody = element("tbody");
export const td = element("td");
export const tfoot = element("tfoot");
export const th = element("th");
export const thead = element("thead");
export const tr = element("tr");
export const button = element("button");
export const datalist = element("datalist");
export const fieldset = element("fieldset");
export const form = element("form");
export const label = element("label");
export const legend = element("legend");
export const meter = element("meter");
export const optgroup = element("optgroup");
export const option = element("option");
export const output = element("output");
export const progress = element("progress");
export const select = element("select");
export const details = element("details");
export const menuitem = element("menuitem");
export const summary = element("summary");
export const slot = element("slot");
export const template = element("template");
export const circle = svgElement("circle");
export const rect = svgElement("rect");
export const ellipse = svgElement("ellipse");
export const g = svgElement("g");
export const image = svgElement("image");
export const line = svgElement("line");
export const mask = svgElement("mask");
export const path = svgElement("path");
export const polygon = svgElement("polygon");
export const polyline = svgElement("polyline");
export const svg = svgElement("svg");
export const svgText = svgElement("text");
export const marker = svgElement("marker");
export const linearGradient = svgElement("linearGradient");
export const foreignObject = svgElement("foreignObject");

export { text } from "./component";
