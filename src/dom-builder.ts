import {Now} from "hareactive/Now";
import {Stream, empty} from "hareactive/Stream";
import {Behavior, sink, subscribe, isBehavior} from "hareactive/Behavior";
import {Component, runComponentNow} from "./component";
import {CSSStyleType} from "./CSSStyleType";

export type Showable = string | number;

export type StreamDescription<A> = [string, string, (evt: any) => A]
export type BehaviorDescription<A> = [string, string, (evt: any) => A, A];

export type Properties = {
  streams?: StreamDescription<any>[],
  behaviors?: BehaviorDescription<any>[],
  style?: CSSStyleType,
  props?: {
    [name: string]: Showable | Behavior<Showable>;
  }
  attribute?: {
    [name: string]: Showable | Behavior<Showable>;
  }
};

export type Children = Component<any> | string;

function isChildren(a: any): a is Children {
  return a instanceof Component || typeof a === "string";
}

class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private props?: Properties,
    private children?: Children
  ) { super(); };
  run(): A {
    let output: any = {};

    const parsedTag = this.tagName.match(/[.#]?\w+/g);
    const elm = document.createElement(parsedTag[0]);
    for (let i = 1; i < parsedTag.length; i++) {
      let classOrId = parsedTag[i];
      let name = classOrId.substring(1, classOrId.length);
      if (classOrId[0] === "#") {
        elm.setAttribute("id", name);
      } else if (classOrId[0] === ".") {
        elm.classList.add(name);
      }
    }

    if (this.props !== undefined) {
      if (this.props.style !== undefined) {
        for (const styleProp in this.props.style) {
          const value = (<any>this).props.style[styleProp];
          if (isBehavior(value)) {
            value.subscribe((newValue) => (<any>elm.style)[styleProp] = newValue);
          } else {
            (<any>elm.style)[styleProp] = value;
          }
        }
      }

      if (this.props.attribute !== undefined) {
        for (const name in this.props.attribute) {
          const value = this.props.attribute[name];
          if (isBehavior(value)) {
            value.subscribe((newValue) => elm.setAttribute(name, newValue.toString()));
          } else {
            elm.setAttribute(name, value.toString());
          }
        }
      }

      if (this.props.props !== undefined) {
        for (const name in this.props.props) {
          const value = this.props.props[name];
          if (isBehavior(value)) {
            value.subscribe((newValue) => (<any>elm)[name] = newValue);
          } else {
            (<any>elm)[name] = value;
          }
        }
      }

      if (this.props.behaviors !== undefined) {
        for (const [evt, name, extractor, initial] of this.props.behaviors) {
          let a : Behavior<any> = null;
          Object.defineProperty(output, name, {
            get: () => {
              if (a === null) {
                a = behaviorFromEvent(evt, initial, extractor, elm);
              }
              return a;
            }});
        }
      }
      if (this.props.streams !== undefined) {
        for (const [evt, name, extractor] of this.props.streams) {
          let a : Stream<any> = null;
          Object.defineProperty(output, name, {
            get: () => {
              if (a === null) {
                a = streamFromEvent(evt, extractor, elm);
              }
              return a;
            }
          });
        }
      }
    }
    if (this.children !== undefined) {
      if (typeof this.children === "string") {
        elm.textContent = this.children;
      } else {
        output.children = runComponentNow(elm, this.children);
      }
    }
    this.parent.appendChild(elm);
    return output;
  }
}

export type CreateElementFunc<A> = (newPropsOrChildren?: Children | Properties, newChildren?: Properties) => Component<A>;

export function e<A>(tagName: string): CreateElementFunc<A>;
export function e<A>(tagName: string, children: Children ): CreateElementFunc<A>;
export function e<A>(tagName: string, props: Properties ): CreateElementFunc<A>;
export function e<A>(tagName: string, props: Properties , children: Children ): CreateElementFunc<A>;
export function e<A>(tagName: string, propsOrChildren?: Properties | Children, children?: Children ): CreateElementFunc<A> {
  function createElement(): Component<A>;
  function createElement(props: Properties): Component<A>;
  function createElement(children: Children): Component<A>;
  function createElement(props: Properties, children: Children): Component<A>;
  function createElement(newPropsOrChildren?: Properties | Children, newChildrenOrUndefined?: Children): Component<A> {
    if (newChildrenOrUndefined === undefined && isChildren(newPropsOrChildren)) {
      return new Component((p) => new CreateDomNow<A>(p, tagName, propsOrChildren, newPropsOrChildren));
    } else if (isChildren(propsOrChildren)) {
      return new Component((p) => new CreateDomNow<A>(p, tagName, newPropsOrChildren, newChildrenOrUndefined || propsOrChildren));
    } else {
      const newProps = Object.assign({}, propsOrChildren, newPropsOrChildren);
      return new Component((p) => new CreateDomNow<A>(p, tagName, newProps, newChildrenOrUndefined || children));
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

type ComponentStuff<A> = {
  elm: Node, out: A
}

class ComponentListNow<A, B> extends Now<Behavior<B[]>> {
  constructor(
    private parent: Node,
    private getKey: (a: A) => number,
    private compFn: (a: A) => Component<B>,
    private list: Behavior<A[]>
  ) { super(); }
  run(): Behavior<B[]> {
    // The reordering code below is neither pretty nor fast. But it at
    // least avoids recreating elements and is quite simple.
    const resultB = sink<B[]>([]);
    const end = document.createComment("list end");
    let keyToElm: {[key: string]: ComponentStuff<B>} = {};
    this.parent.appendChild(end);
    subscribe((newAs) => {
      const newKeyToElm: {[key: string]: ComponentStuff<B>} = {};
      const newArray: B[] = [];
      // Re-add existing elements and new elements
      for (const a of newAs) {
        const key = this.getKey(a);
        let stuff = keyToElm[key];
        if (stuff === undefined) {
          const fragment = document.createDocumentFragment();
          const out = runComponentNow(fragment, this.compFn(a));
          // Assumes component only adds a single element
          stuff = {out, elm: fragment.firstChild};
        }
        this.parent.insertBefore(stuff.elm, end);
        newArray.push(stuff.out);
        newKeyToElm[key] = stuff;
      }
      // Remove elements that are no longer present
      const oldKeys = Object.keys(keyToElm);
      for (const key of oldKeys) {
        if (newKeyToElm[key] === undefined) {
          this.parent.removeChild(keyToElm[key].elm);
        }
      }
      keyToElm = newKeyToElm;
      resultB.push(newArray);
    }, this.list);
    return resultB;
  }
}

export function list<A>(
  c: (a: A) => Component<any>, getKey: (a: A) => number, l: Behavior<A[]>
): Component<{}> {
  return new Component((p) => new ComponentListNow(p, getKey, c, l));
}
