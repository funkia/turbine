import { sequence, Monad, monad, go, fgo } from "@funkia/jabz";
import {
  Now,
  Behavior, observe, sinkBehavior, isBehavior,
  Stream, placeholder
} from "@funkia/hareactive";

import { merge, id } from "./utils";

const supportsProxy = "Proxy" in window;

export type Showable = string | number;

function isShowable(s: any): s is Showable {
  return typeof s === "string" || typeof s === "number";
}

function fst<A, B>(a: [A, B]): A { return a[0]; }
function snd<A, B>(a: [A, B]): B { return a[1]; }

export function isGeneratorFunction<A, T>(fn: any): fn is ((...a: any[]) => IterableIterator<T>) {
  return fn !== undefined
    && fn.constructor !== undefined
    && fn.constructor.name === "GeneratorFunction";
}

/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we want to
 * make it a monad in different way than Now.
 */
@monad
export abstract class Component<A = any> implements Monad<A> {
  static of<B>(b: B): Component<B> {
    return new OfComponent(b);
  }
  of<B>(b: B): Component<B> {
    return new OfComponent(b);
  }
  chain<B>(f: (a: A) => Component<B>): Component<B> {
    return new ChainComponent(this, f);
  }
  static multi: boolean = false;
  multi: boolean = false;
  abstract run(parent: Node): A;
  // Definitions below are inserted by Jabz
  flatten: <B>() => Component<B>;
  map: <B>(f: (a: A) => B) => Component<B>;
  mapTo: <B>(b: B) => Component<B>;
  ap: <B>(a: Component<(a: A) => B>) => Component<B>;
  lift: (f: Function, ...ms: any[]) => Component<any>;
}

class OfComponent<A> extends Component<A> {
  constructor(private value: A) {
    super();
  }
  run(_: Node): A {
    return this.value;
  }
}

class ChainComponent<A, B> extends Component<B> {
  constructor(private component: Component<A>, private f: (a: A) => Component<B>) {
    super();
  }
  run(parent: Node): B {
    return this.f(this.component.run(parent)).run(parent);
  }
}

/** Run component and the now-computation inside */
export function runComponent<A>(parent: Node | string, c: Child<A>): A {
  if (typeof parent === "string") {
    parent = document.querySelector(parent);
  }
  return toComponent(c).run(parent);
}

export function testComponent<A>(c: Component<A>): { out: A, dom: HTMLDivElement } {
  const dom = document.createElement("div");
  const out = runComponent(dom, c);
  return { out, dom };
}

export function isComponent(c: any): c is Component<any> {
  return c instanceof Component;
}

export interface ReactivesObject {
  [a: string]: Behavior<any> | Stream<any>;
}

const placeholderProxyHandler = {
  get: function (target: any, name: string): Behavior<any> | Stream<any> {
    if (!(name in target)) {
      target[name] = placeholder();
    }
    return target[name];
  }
};

class LoopComponent<A> extends Component<A> {
  constructor(
    private f: (a: A) => Child<A>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: Node): A {
    let placeholderObject: any;
    if (supportsProxy) {
      placeholderObject = new Proxy({}, placeholderProxyHandler);
    } else {
      placeholderObject = {};
      if (this.placeholderNames !== undefined) {
        for (const name of this.placeholderNames) {
          placeholderObject[name] = placeholder();
        }
      }
    }
    const result = toComponent(this.f(placeholderObject)).run(parent);
    const returned: (keyof A)[] = <any>Object.keys(result);
    for (const name of returned) {
      (placeholderObject[name]).replaceWith(result[name]);
    }
    return result;
  }
}
export function loop<A extends ReactivesObject>(
  f: ((a: A) => Child<A>) | ((a: A) => IterableIterator<Component<any> | A>),
  placeholderNames?: string[]
): Component<A> {
  const f2 = isGeneratorFunction(f) ? fgo(f) : f;
  return new LoopComponent<A>(f2, placeholderNames);
}

function addErrorHandler(modelName: string, viewName: string, obj: any): any {
  if (modelName === "") { modelName = "anonymous"; }
  if (viewName === "") { viewName = "anonymous"; }
  if (!supportsProxy) {
    return obj;
  }
  return new Proxy(obj, {
    get(object: any, prop: string): any {
      if (prop in obj) {
        return object[prop];
      }
      throw new Error(
        `The model, ${modelName}, expected a property "${prop}" but the view, ${viewName}, returned an object without the property.`
      );
    }
  });
}

class ModelViewComponent<A> extends Component<A> {
  constructor(
    private args: any[],
    private model: (...as: any[]) => Now<A>,
    private view: (...as: any[]) => Component<A>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: Node): A {
    const {view, model, args} = this;
    let placeholders: any;
    if (supportsProxy) {
      placeholders = new Proxy({}, placeholderProxyHandler);
    } else {
      placeholders = {};
      if (this.placeholderNames !== undefined) {
        for (const name of this.placeholderNames) {
          placeholders[name] = placeholder();
        }
      }
    }
    const viewOutput = view(placeholders, ...args).run(parent);
    const helpfulViewOutput = addErrorHandler(model.name, view.name, viewOutput);
    const behaviors = model(helpfulViewOutput, ...args).run();
    // Tie the recursive knot
    for (const name of Object.keys(behaviors)) {
      (placeholders[name]).replaceWith(behaviors[name]);
    }
    return behaviors;
  }
}

export type ModelReturn<M> = Now<M> | Iterator<any>;
export type Model<V, M> = (v: V) => ModelReturn<M>;
export type Model1<V, M, A> = (v: V, a: A) => ModelReturn<M>;
export type View<M, V> = ((m: M) => Child<V>) | ((m: M) => Iterator<Component<any>>);
export type View1<M, V, A> = ((m: M, a: A) => Child<V>) | ((m: M, a: A) => Iterator<Component<any>>);

export function modelView<M extends ReactivesObject, V>(
  model: Model<V, M>, view: View<M, V>, toViewReactiveNames?: string[]
): () => Component<M>;
export function modelView<M extends ReactivesObject, V, A>(
  model: Model1<V, M, A>, view: View1<M, V, A>, toViewReactiveNames?: string[]
): (a: A) => Component<M>;
export function modelView<M extends ReactivesObject, V>(
  model: any, view: any, toViewReactiveNames?: string[]
): (...args: any[]) => Component<M> {
  const m = isGeneratorFunction<V, any>(model) ? fgo(model) : model;
  const v: any = isGeneratorFunction<any, any>(view) ? fgo(view) : (...as: any[]) => toComponent(view(...as));
  return (...args: any[]) => new ModelViewComponent<M>(args, m, v, toViewReactiveNames);
}

export function viewObserve<A>(update: (a: A) => void, behavior: Behavior<A>): void {
  let isPulling = false;
  observe(
    update,
    () => {
      isPulling = true;
      let lastVal;
      function pull(): void {
        const newVal = behavior.pull();
        if (lastVal !== newVal) {
          lastVal = newVal;
          update(newVal);
        }
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
export type Child<A = {}> = Component<A> | Showable | Behavior<Showable>
  | (() => Iterator<any>) | ChildList;

// A dummy interface is required since TypeScript doesn't handle
// recursive type aliases
// See: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
export interface ChildList extends Array<Child> { }

export function isChild(a: any): a is Child {
  return isComponent(a) || isGeneratorFunction(a) || isBehavior(a) || isShowable(a) || Array.isArray(a);
}

class TextComponent extends Component<{}> {
  constructor(private text: Showable) {
    super();
  }
  run(parent: Node): {} {
    parent.appendChild(document.createTextNode(this.text.toString()));
    return {};
  }
}

export function text(showable: Showable): Component<{}> {
  return new TextComponent(showable);
}

export function toComponent<A>(child: Component<A>): Component<A>;
export function toComponent<A>(child: Showable): Component<{}>;
export function toComponent<A>(child: Behavior<Showable>): Component<{}>;
export function toComponent<A>(child: () => Iterator<any>): Component<any>;
export function toComponent<A>(child: Array<Component<any>>): Component<{}>;
export function toComponent<A>(child: Child<A>): Component<A>;
export function toComponent<A>(child: Child): Component<any> {
  if (isComponent(child)) {
    return child;
  } else if (isBehavior(child)) {
    return dynamic(child).mapTo({});
  } else if (isGeneratorFunction(child)) {
    return go(<any>child);
  } else if (isShowable(child)) {
    return text(child);
  } else if (Array.isArray(child)) {
    return <Component<A>>sequence(Component, child.map(toComponent)).map((res: any[]) => res.reduce(merge, {}));
  }
}

class DynamicComponent<A> extends Component<Behavior<A>> {
  constructor(private behavior: Behavior<Child<A>>) {
    super();
  }
  run(parent: Node): Behavior<A> {
    const start = document.createComment("Dynamic begin");
    const end = document.createComment("Dynamic end");
    parent.appendChild(start);
    parent.appendChild(end);

    let currentlyShowable: boolean;
    let wasShowable = false;
    const performed = this.behavior.map((child) => {
      currentlyShowable = isShowable(child);
      if (currentlyShowable && wasShowable) {
        return [undefined, child] as [A, Showable];
      }
      const fragment = document.createDocumentFragment();
      const a = runComponent(fragment, <Component<A>>toComponent(child));
      return [a, fragment] as [A, DocumentFragment];
    });

    let showableNode: Node;
    viewObserve((node) => {
      if (currentlyShowable && wasShowable) {
        showableNode.nodeValue = node.toString();
      } else {
        if (currentlyShowable) {
          showableNode = (<Node>node).firstChild;
          wasShowable = true;
        } else {
          wasShowable = false;
        }
        let i: Node = start.nextSibling;
        while (i !== end) {
          const j = i;
          i = i.nextSibling;
          parent.removeChild(j);
        }
        parent.insertBefore((<Node>node), end);
      }
    }, performed.map(snd));
    return performed.map(fst);
  }
}

export function dynamic<A>(behavior: Behavior<Component<A>>): Component<Behavior<A>>;
export function dynamic<A>(behavior: Behavior<Child>): Component<any>;
export function dynamic<A>(behavior: Behavior<Child<A>>): Component<Behavior<A>> {
  return new DynamicComponent(behavior);
}

type ComponentStuff<A> = {
  elm: Node, out: A
};

class ComponentList<A, B> extends Component<Behavior<B[]>> {
  constructor(
    private compFn: (a: A) => Component<B>,
    private list: Behavior<A[]>,
    private getKey: (a: A, index: number) => string,
    private name: string | undefined
  ) { super(); }
  run(parent: Node): Behavior<B[]> {
    // The reordering code below is neither pretty nor fast. But it at
    // least avoids recreating elements and is quite simple.
    const resultB = sinkBehavior<B[]>([]);
    const end = document.createComment("list end");
    let keyToElm: { [key: string]: ComponentStuff<B> } = {};
    parent.appendChild(end);
    this.list.subscribe((newAs) => {
      const newKeyToElm: { [key: string]: ComponentStuff<B> } = {};
      const newArray: B[] = [];
      // Re-add existing elements and new elements
      for (let i = 0; i < newAs.length; i++) {
        const a = newAs[i];
        const key = this.getKey(a, i);
        let stuff = keyToElm[key];
        if (stuff === undefined) {
          const fragment = document.createDocumentFragment();
          const out = runComponent(fragment, this.compFn(a));
          // Assumes component only adds a single element
          stuff = { out, elm: fragment.firstChild };
        }
        parent.insertBefore(stuff.elm, end);
        newArray.push(stuff.out);
        newKeyToElm[key] = stuff;
      }
      // Remove elements that are no longer present
      const oldKeys = Object.keys(keyToElm);
      for (const key of oldKeys) {
        if (newKeyToElm[key] === undefined) {
          parent.removeChild(keyToElm[key].elm);
        }
      }
      keyToElm = newKeyToElm;
      resultB.push(newArray);
    });
    return <any>(this.name === undefined ? resultB : { [this.name]: resultB });
  }
}

export function list<A, B, Name extends string>(
  componentCreator: (a: A) => Component<any>,
  list: Behavior<A[]>,
  name: Name,
  key?: (a: A, index: number) => Showable
): Component<{[key in Name]: Behavior<B[]> }>;
export function list<A, B>(
  componentCreator: (a: A) => Component<any>,
  list: Behavior<A[]>,
  key?: (a: A, index: number) => Showable
): Component<Behavior<B[]>>;
export function list<A, B>(
  c: (a: A) => Component<any>, list: Behavior<A[]>, optional1: any
): Component<Behavior<B[]>> {
  const last = arguments[arguments.length - 1];
  const getKey = typeof last === "function" ? last : id;
  const name = typeof optional1 === "string" ? optional1 : undefined;
  return new ComponentList(c, list, getKey, name);
}
