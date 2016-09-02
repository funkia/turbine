import {runNow, Now} from "hareactive/Now";
import {Stream, empty} from "hareactive/Stream";
import {Behavior, sink, subscribe} from "hareactive/Behavior";
import {Component, runComponentNow} from ".component";

// DOM constructor stuff, should eventually be in different file

type Showable = string | number;

type BehaviorDescription<A> = {
  on: string,
  name: string,
  initial: A,
  extractor: (event: any) => A
}

type StreamDescription<A> = {
  on: string,
  name: string,
  extractor: (event: any) => A
}

export class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private behaviors: BehaviorDescription<any>[],
    private streams: StreamDescription<any>[],
    private text?: string,
    private children?: Component<any>
  ) { super(); };
  run(): A {
    const elm = document.createElement(this.tagName);
    let output: any;
    if (this.children !== undefined) {
      // If the component has children we don't create event listeners
      // for the element. In this case we instead pass on the streams
      // and behaviors that hte children creates.
      output = runComponentNow(elm, this.children);
    } else {
      output = {};
      for (const bd of this.behaviors) {
        output[bd.name] = behaviorFromEvent(bd, elm);
      }
      for (const bd of this.streams) {
        output[bd.name] = streamFromEvent(bd, elm);
      }
      if (this.text !== undefined) {
        elm.textContent = this.text;
      }
    }
    this.parent.appendChild(elm);
    return output;
  }
}

function behaviorFromEvent<A>(
  {on, initial, extractor}: BehaviorDescription<A>,
  dom: Node
): Behavior<A> {
  const b = sink(initial);
  dom.addEventListener(on, (ev) => b.publish(extractor(ev)));
  return b;
}

function streamFromEvent<A>(
  {on, extractor}: StreamDescription<A>,
  dom: Node
): Stream<A> {
  const s = empty<A>();
  dom.addEventListener(on, (ev) => {
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
