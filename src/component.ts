import {Applicative} from "jabz/applicative";
import {Traversable, sequence} from "jabz/traversable";
import {Monad, monad} from "jabz/monad";
import {go, fgo} from "jabz/monad";
import {Now} from "hareactive/now";
import {
  Behavior, placeholder, observe, at, sink, isBehavior
} from "hareactive/behavior";

import {merge} from "./utils";

export type Showable = string | number;

function isShowable(s: any): s is Showable {
  return typeof s === "string" || typeof s === "number";
}

function id<A>(a: A): A { return a; };
function fst<A, B>(a: [A, B]): A { return a[0]; }
function snd<A, B>(a: [A, B]): B { return a[1]; }

/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we wan't to
 * make it a monad in different way than Now.
 */
@monad
export class Component<A> implements Monad<A> {
  constructor(public content: (n: Node) => Now<A>) {}
  static of<B>(b: B): Component<B> {
    return new Component(() => Now.of(b));
  }
  of<B>(b: B): Component<B> {
    return Component.of(b);
  }
  chain<B>(f: (a: A) => Component<B>): Component<B> {
    return new Component((parent: Node) => {
      return this.content(parent).chain((a) => {
        return f(a).content(parent);
      });
    });
  }
  static multi = false;
  multi = false;
  // Definitions below are inserted by Jabz
  flatten: <B>() => Component<B>;
  map: <B>(f: (a: A) => B) => Component<B>;
  mapTo: <B>(b: B) => Component<B>;
  ap: <B>(a: Component<(a: A) => B>) => Component<B>;
  lift: (f: Function, ...ms: any[]) => Component<any>;
}

/** Run component and the now-computation inside */
export function runComponentNow<A>(parent: Node, c: Component<A>): A {
  return c.content(parent).run();
}

export function isComponent(c: any): c is Component<any> {
  return c instanceof Component;
}

export interface BehaviorObject {
  [a: string]: Behavior<any>;
}

const behaviorProxyHandler = {
  get: function (target: any, name: string): Behavior<any> {
    if (!(name in target)) {
      target[name] = placeholder();
    }
    return target[name];
  }
};

class MfixNow<M extends BehaviorObject, O> extends Now<[M, O]> {
  constructor(
    private fn: (m: M) => Now<[M, O]>,
    private toViewBehaviorNames?: string[]
  ) {
    super();
  };
  run(): [M, O] {
    let placeholders: any;
    if ("Proxy" in window) {
      placeholders = new Proxy({}, behaviorProxyHandler);
    } else {
      placeholders = {};
      if (this.toViewBehaviorNames !== undefined) {
	for (const name of this.toViewBehaviorNames) {
          placeholders[name] = placeholder();
	}
      }
    }
    const [behaviors, out] = this.fn(placeholders).run();
    // Tie the recursive knot
    for (const name in behaviors) {
      (placeholders[name]).replaceWith(behaviors[name]);
    }
    return [behaviors, out];
  };
}

export function isGeneratorFunction<A, T>(fn: any): fn is ((a: A) => Iterator<T>) {
  return fn !== undefined
    && fn.constructor !== undefined
    && fn.constructor.name === "GeneratorFunction";
}

export function component<M extends BehaviorObject, V, O>(
  model: ((v: V) => Now<[M, O]>) | ((v: V) => Iterator<Now<any>>),
  view:  ((m: M) => Child) | ((m: M) => Iterator<Component<any>>),
  toViewBehaviorNames?: string[]
): Component<O> {
  const m = isGeneratorFunction(model) ? (v: V) => fgo(model)(v) : model;
  const v = isGeneratorFunction(view) ? (md: M) => fgo(view)(md) : (md: M) => toComponent(view(md));
  return new Component<O>((parent: Node) => new MfixNow<M, O>(
    (bs) => v(bs).content(parent).chain(m),
    toViewBehaviorNames
  ).map(snd));
}

export function viewObserve<A>(update: (a: A) => void, behavior: Behavior<A>): void {
  let isPulling = false;
  observe(
    update,
    () => {
      isPulling = true;
      function pull(): void {
        update(behavior.pull());
        if (isPulling) {
          requestAnimationFrame(pull);
        }
      }
      pull();
    },
    () => {
      isPulling = false;
    },
    behavior
  );
}

// Union of the types that can be used as a child. A child is either a
// component or something that can be converted into a component.
export type Child = Component<any> | Showable | Behavior<Showable>
                  | (() => Iterator<Component<any>>) | ChildList;

// A dummy interface is required since TypeScript doesn't handle recursive type aliases
// See: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
export interface ChildList extends Array<Child> {}

export function isChild(a: any): a is Child {
  return isComponent(a) || isGeneratorFunction(a) || isBehavior(a) || isShowable(a) || Array.isArray(a);
}

export function text(s: Showable): Component<{}> {
  return new Component((parent: Node) => {
    parent.appendChild(document.createTextNode(s.toString()));
    return Now.of({});
  });
};

const merger = (prev: Object, next: Object) => merge(prev, next);

export function toComponent<A>(child: Component<A>): Component<A>;
export function toComponent<A>(child: Showable): Component<{}>;
export function toComponent<A>(child: Behavior<Showable>): Component<{}>;
export function toComponent<A>(child: () => Iterator<Component<any>>): Component<any>;
export function toComponent<A>(child: Array<Component<any>>): Component<{}>;
export function toComponent<A>(child: Child): Component<any>;
export function toComponent<A>(child: Child): Component<any> {
  if (isComponent(child)) {
    return child;
  } else if (isBehavior(child)) {
    return dynamic(child);
  } else if (isGeneratorFunction(child)) {
    return go(child);
  } else if (isShowable(child)) {
    return text(child);
  } else if (Array.isArray(child)) {
    return <Component<A>> sequence(Component, child.map(toComponent)).map((res: any[]) => res.reduce(merger, {}));
  }
}

class DynamicComponent<A> extends Now<Behavior<A>> {
  constructor(
    private parent: Node,
    private bChild: Behavior<Child>
  ) { super(); }
  run(): Behavior<A> {
    const start = document.createComment("Dynamic begin");
    const end = document.createComment("Dynamic end");
    this.parent.appendChild(start);
    this.parent.appendChild(end);

    let currentlyShowable: boolean;
    let wasShowable = false;
    const performed = this.bChild.map((child) => {
      currentlyShowable = isShowable(child);
      if (currentlyShowable && wasShowable) {
      	return [undefined, child] as [A, Showable];
      }
      const fragment = document.createDocumentFragment();
      const a = runComponentNow(fragment, <Component<A>>toComponent(child));
      return [a, fragment] as [A, DocumentFragment];
    });

    let showableNode: Node;
    viewObserve(([_, node]) => {
      if (currentlyShowable && wasShowable) {
      	showableNode.nodeValue = node.toString();
      } else {
      	if (currentlyShowable) {
      	  showableNode = (<Node> node).firstChild;
      	  wasShowable = true;
      	} else {
      	  wasShowable = false;
      	}
	let i: Node = start.nextSibling;
	while (i !== end) {
          const j = i;
          i = i.nextSibling;
          this.parent.removeChild(j);
	}
	this.parent.insertBefore((<Node> node), end);
      }
    }, performed);
    return performed.map(fst);
  }
}

export function dynamic<A>(behavior: Behavior<Component<A>>): Component<Behavior<A>>;
export function dynamic<A>(behavior: Behavior<Child>): Component<any>;
export function dynamic<A>(behavior: Behavior<Child>): Component<Behavior<A>> {
  return new Component((p) => new DynamicComponent<A>(p, behavior));
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
    this.list.subscribe((newAs) => {
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
    });
    return resultB;
  }
}

export function list<A>(
  c: (a: A) => Component<any>, getKey: (a: A) => number, l: Behavior<A[]>
): Component<{}> {
  return new Component((p) => new ComponentListNow(p, getKey, c, l));
}
