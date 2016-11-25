import {go} from "jabz/monad";
import {Now} from "hareactive/Now";
import {Stream, empty} from "hareactive/Stream";
import {Behavior, sink, subscribe, isBehavior} from "hareactive/Behavior";
import {
  Component, runComponentNow, isGeneratorFunction,
  viewObserve, Showable, Child, isChild, normalizeChild
} from "./component";
import {CSSStyleType} from "./CSSStyleType";

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

class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private props?: Properties,
    private children?: Child
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
      output.children = runComponentNow(elm, normalizeChild(this.children));
    }
    this.parent.appendChild(elm);
    return output;
  }
}

export type CreateElementFunc<A> = (newPropsOrChildren?: Child | Properties, newChildren?: Properties) => Component<A>;

export function e<A>(tagName: string): CreateElementFunc<A>;
export function e<A>(tagName: string, children: Child): CreateElementFunc<A>;
export function e<A>(tagName: string, props: Properties): CreateElementFunc<A>;
export function e<A>(tagName: string, props: Properties, children: Child): CreateElementFunc<A>;
export function e<A>(tagName: string, propsOrChildren?: Properties | Child, children?: Child): CreateElementFunc<A> {
  function createElement(): Component<any>;
  function createElement(props: Properties): Component<A>;
  function createElement(aChildren: Child): Component<A>;
  function createElement(props: Properties, bChildren: Child): Component<A>;
  function createElement(newPropsOrChildren?: Properties | Child, newChildrenOrUndefined?: Child): Component<A> {
    if (newChildrenOrUndefined === undefined && isChild(newPropsOrChildren)) {
      return new Component((p) => new CreateDomNow<A>(p, tagName, propsOrChildren, newPropsOrChildren));
    } else if (isChild(propsOrChildren)) {
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
