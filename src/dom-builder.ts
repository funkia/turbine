import {go} from "jabz/monad";
import {Now} from "hareactive/now";
import {Stream, empty} from "hareactive/stream";
import {Behavior, sink, subscribe, isBehavior} from "hareactive/behavior";
import {
  Component, runComponentNow, isGeneratorFunction,
  viewObserve, Showable, Child, isChild, toComponent
} from "./component";
import {CSSStyleType} from "./CSSStyleType";
import {merge} from "./utils";

export type StreamDescription<A> = [string, string, (evt: any) => A]
export type BehaviorDescription<A> = [string, string, (evt: any) => A, A];

export type Properties = {
  wrapper?: boolean,
  streams?: StreamDescription<any>[],
  behaviors?: BehaviorDescription<any>[],
  style?: CSSStyleType,
  props?: {
    [name: string]: Showable | Behavior<Showable>;
  },
  attribute?: {
    [name: string]: Showable | Behavior<Showable>;
  },
  class?: {
    [name: string]: boolean | Behavior<boolean>;
  }
};

class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private props?: Properties,
    private children?: Child
  ) { super(); };
  run(): A {
    let output: any = {};
    const elm = document.createElement(this.tagName);

    if (this.props !== undefined) {
      if (this.props.style !== undefined) {
        for (const styleProp in this.props.style) {
          const value = (<any>this).props.style[styleProp];
          if (isBehavior(value)) {
            viewObserve((newValue) => (<any>elm.style)[styleProp] = newValue, value);
          } else {
            (<any>elm.style)[styleProp] = value;
          }
        }
      }

      if (this.props.attribute !== undefined) {
        for (const name in this.props.attribute) {
          const value = this.props.attribute[name];
          if (isBehavior(value)) {
            viewObserve((newValue) => elm.setAttribute(name, newValue.toString()), value);
          } else {
            elm.setAttribute(name, value.toString());
          }
        }
      }

      if (this.props.props !== undefined) {
        for (const name in this.props.props) {
          const value = this.props.props[name];
          if (isBehavior(value)) {
            viewObserve((newValue) => (<any>elm)[name] = newValue, value);
          } else {
            (<any>elm)[name] = value;
          }
        }
      }
      if (this.props.class !== undefined) {
        for (const name in this.props.class) {
          const value = this.props.class[name];
          if (isBehavior(value)) {
            viewObserve((newValue) => elm.classList.toggle(name, newValue), value);
          } else {
	    elm.classList.toggle(name, value);
          }
        }
      }

      if (this.props.behaviors !== undefined) {
        for (const [evt, name, extractor, initial] of this.props.behaviors) {
          let a: Behavior<any> = undefined;
          Object.defineProperty(output, name, {
            get: () => {
              if (a === undefined) {
                a = behaviorFromEvent(evt, initial, extractor, elm);
              }
              return a;
            }});
        }
      }
      if (this.props.streams !== undefined) {
        for (const [evt, name, extractor] of this.props.streams) {
          let a: Stream<any> = undefined;
          Object.defineProperty(output, name, {
            get: () => {
              if (a === undefined) {
                a = streamFromEvent(evt, extractor, elm);
              }
              return a;
            }
          });
        }
      }
    }
    if (this.children !== undefined) {
      const childOutput = runComponentNow(elm, toComponent(this.children));
      if (this.props.wrapper === true) {
        output = childOutput;
      } else {
        output.children = childOutput;
      }
    }
    this.parent.appendChild(elm);
    return output;
  }
}


function parseCSSTagname(cssTagName: string): [string, Properties] {
  const parsedTag = cssTagName.split(/(?=\.)|(?=#)|(?=\[)/);
  const result: Properties = {};
  for (let i = 1; i < parsedTag.length; i++) {
    const token = parsedTag[i];
    switch (token[0]) {
    case '#':
      result.props = result.props || {};
      result.props["id"] = token.slice(1);
      break;
    case '.':
      result.class = result.class || {};
      result.class[token.slice(1)] = true;
      break;
    case '[':
      result.attribute = result.attribute || {};
      const attr = token.slice(1,-1).split('=');
      result.attribute[attr[0]] = attr[1] || "";
      break;
    default:
      throw new Error("Unknown symbol");
    }
  }
  return [parsedTag[0], result];
}

export type CreateElementFunc<A> = (newPropsOrChildren?: Child | Properties, newChildren?: Properties) => Component<A>;

export function e<A>(tagName: string, props: Properties = {}): CreateElementFunc<A> {
  function createElement(): Component<any>;
  function createElement(props: Properties): Component<A>;
  function createElement(child: Child): Component<A>;
  function createElement(props: Properties, bChildren: Child): Component<A>;
  function createElement(newPropsOrChildren?: Properties | Child, newChildrenOrUndefined?: Child): Component<A> {
    if (newChildrenOrUndefined === undefined && isChild(newPropsOrChildren)) {
      return new Component((p) => new CreateDomNow<A>(p, tagName, props, newPropsOrChildren));
    } else {
      const newProps = merge(props, newPropsOrChildren);
      return new Component((p) => new CreateDomNow<A>(p, tagName, newProps, newChildrenOrUndefined));
    }
  }
  return createElement;
}

function behaviorFromEvent<A>(
  eventName: string,
  initial: A,
  extractor: (evt: any) => A,
  dom: Node
): Behavior<A> {
  const b = sink<A>(initial);
  dom.addEventListener(eventName, (ev) => b.push(extractor(ev)));
  return b;
}

function streamFromEvent<A>(
  eventName: string,
  extractor: (evt: any) => A,
  dom: Node
): Stream<A> {
  const s = empty<A>();
  dom.addEventListener(eventName, (ev) => {
    s.push(extractor(ev));
  });
  return s;
}
