import {runNow, Now} from "hareactive/Now";
import {Stream, empty} from "hareactive/Stream";
import {Behavior, sink, subscribe} from "hareactive/Behavior";
import {Component, runComponentNow} from "./component";

export type Showable = string | number;

type StreamDescription<A> = [string, string, (evt: any) => A]
type BehaviorDescription<A> = [string, string, (evt: any) => A, A];

type Properties = {
  streams?: StreamDescription<any>[],
  behaviors?: BehaviorDescription<any>[]
};

type Children = Component<any> | string;

class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private props?: Properties,
    private children?: Children
  ) { super(); };
  run(): A {
    const elm = document.createElement(this.tagName);
    let output: any = {};

    if (this.props !== undefined) {
      const props = Object.assign({
        streams: [],
        behaviors: []
      }, this.props);

      for (const [evt, name, extractor, initial] of props.behaviors) {
        output[name] = behaviorFromEvent<any>(evt, initial, extractor, elm);
      }
      for (const [evt, name, extractor] of props.streams) {
        output[name] = streamFromEvent(evt, extractor, elm);
      }
    }
    if(this.children !== undefined) {
      if(typeof this.children === "string") {
        elm.textContent = this.children;
      } else {
        output["children"] = runComponentNow(elm, this.children);
      }
    }
    this.parent.appendChild(elm);
    return output;
  }
}

export function e<A>(tagName: string, propsOrChildren?: Properties | Children, children?: Children ):  (a?: Children | Properties, b?: Properties) => Component<A> {
  return (newPropsOrChildren?: Properties | Children, newChildrenOrUndefined?: Children): Component<A> => {
    if (newChildrenOrUndefined === undefined && newPropsOrChildren instanceof Component || typeof newPropsOrChildren === "string") {
      return new Component((p) => new CreateDomNow<A>(p, tagName, propsOrChildren, newPropsOrChildren));
    } else {
      const newProps = Object.assign({}, propsOrChildren, newPropsOrChildren);
      return new Component((p) => new CreateDomNow<A>(p, tagName, newProps, newChildrenOrUndefined || children));
    }
  }
}

function behaviorFromEvent<A>(
  eventName: string,
  initial: A,
  extractor: (evt: any) => A,
  dom: Node
): Behavior<A> {
  const b = sink(initial);
  dom.addEventListener(eventName, (ev) => b.publish(extractor(ev)));
  return b;
}

function streamFromEvent<A>(
  eventName: string,
  extractor: (evt: any) => A,
  dom: Node
): Stream<A> {
  const s = empty<A>();
  dom.addEventListener(eventName, (ev) => {
    s.publish(extractor(ev));
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
      resultB.publish(newArray);
    }, this.list);
    return resultB;
  }
}

export function list<A>(
  c: (a: A) => Component<any>, getKey: (a: A) => number, l: Behavior<A[]>
): Component<{}> {
  return new Component((p) => new ComponentListNow(p, getKey, c, l));
}
