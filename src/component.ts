import { sequence, Monad, monad, go, fgo } from "@funkia/jabz";
import {
  Now,
  Behavior,
  observe,
  sinkBehavior,
  isBehavior,
  Stream,
  placeholder,
  Future,
  sinkFuture
} from "@funkia/hareactive";

import { mergeObj, id, copyRemaps, fst, snd } from "./utils";

const supportsProxy = "Proxy" in window;

export type Showable = string | number;

function isShowable(s: any): s is Showable {
  return typeof s === "string" || typeof s === "number";
}

export function isGeneratorFunction<A, T>(
  fn: any
): fn is ((...a: any[]) => IterableIterator<T>) {
  return (
    fn !== undefined &&
    fn.constructor !== undefined &&
    fn.constructor.name === "GeneratorFunction"
  );
}

export interface DomApi {
  appendChild(child: Node): void;
  insertBefore(insert: Node, before: Node): void;
  removeChild(child: Node): void;
}

export type Out<O, A> = {
  explicit: O;
  output: A;
};

/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we want to
 * make it a monad in different way than Now.
 */
@monad
export abstract class Component<O, A = any> implements Monad<A> {
  static of<B>(b: B): Component<{}, B> {
    return new OfComponent(b);
  }
  of<B>(b: B): Component<{}, B> {
    return new OfComponent(b);
  }
  chain<B>(f: (a: A) => Component<O, B>): Component<O, B> {
    return new ChainComponent(this, f);
  }
  output<P>(f: (a: A) => P): Component<O & P, A>;
  output<B extends Record<string, keyof A>>(
    remaps: B
  ): Component<O & Remap<A, B>, A>;
  output(handler: any): Component<any, A> {
    if (typeof handler === "function") {
      return new HandleOutput((e, o) => mergeObj(e, handler(o)), this);
    } else {
      return new HandleOutput((e, o) => mergeObj(e, copyRemaps(handler, o)), this);
    }
    // return new OutputComponent(remaps, this);
  }
  // explicitOutput: string[] | undefined;
  static multi: boolean = false;
  multi: boolean = false;
  abstract run(
    parent: DomApi,
    destroyed: Future<boolean>
  ): { explicit: O; output: A };
  // Definitions below are inserted by Jabz
  flatten: <B>() => Component<B>;
  map: <B>(f: (a: A) => B) => Component<B>;
  mapTo: <B>(b: B) => Component<B>;
  ap: <B>(a: Component<(a: A) => B>) => Component<B>;
  lift: (f: Function, ...ms: any[]) => Component<any>;
}

class OfComponent<A> extends Component<{}, A> {
  constructor(private value: A) {
    super();
  }
  run(_1: Node, _2: Future<boolean>): { explicit: {}; output: A } {
    return { explicit: {}, output: this.value };
  }
}

class OutputComponent extends Component<any> {
  constructor(
    private remaps: Record<string, string>,
    private comp: Component<any>
  ) {
    super();
    // this.explicitOutput = Object.keys(remaps);
  }
  run(parent: DomApi, destroyed: Future<boolean>): any {
    const { explicit, output } = this.comp.run(parent, destroyed);
    const newExplicit = copyRemaps(this.remaps, output);
    const finalExplicit = mergeObj(output, newExplicit);
    return { explicit: newExplicit, output };
  }
}

class HandleOutput<O, A, P> extends Component<P, A> {
  constructor(
    private readonly handler: (explicit: O, output: A) => P,
    private readonly c: Component<O, A>
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<P, A> {
    const { explicit, output } = this.c.run(parent, destroyed);
    const newExplicit = this.handler(explicit, output);
    return { explicit: newExplicit, output };
  }
}

type AnyValues<A extends Record<string, any>> = { [K in keyof A]: any };

export type Remap<
  A extends Record<string, any>,
  B extends Record<string, keyof A>
> = { [K in keyof B]: A[B[K]] };

export function output<A, O, P>(
  f: (a: A) => P,
  c: Component<O, A>
): Component<O & P, A>;
export function output<A, O, B extends Record<string, keyof A>>(
  remaps: B,
  c: Component<O, A>
): Component<O & Remap<A, B>, A>;
export function output<A>(
  remaps: any,
  component: Component<any, A>
): Component<any, A> {
  return component.output(remaps);
}

/**
 * An empty component that adds no elements to the DOM and produces an
 * empty object as output.
 */
export const emptyComponent = Component.of({});

class ChainComponent<O, A, B> extends Component<O, B> {
  constructor(
    private component: Component<O, A>,
    private f: (a: A) => Component<O, B>
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<O, B> {
    const { explicit, output: outputFirst } = this.component.run(
      parent,
      destroyed
    );
    const { explicit: _discarded, output } = this.f(outputFirst).run(
      parent,
      destroyed
    );
    return { explicit, output };
  }
}

/**
 * Run component and the now-computation inside.
 * @param parent A selector string or a DOM node under which the
 * component will be created
 * @param component The component to run
 */
export function runComponent<A>(
  parent: DomApi | string,
  component: Child<A>,
  destroy: Future<boolean> = sinkFuture()
): A {
  if (typeof parent === "string") {
    parent = document.querySelector(parent)!;
  }
  return toComponent(component).run(parent, destroy).output;
}

export function testComponent<O, A>(
  c: Component<O, A>
): {
  out: A;
  dom: HTMLDivElement;
  explicit: O;
  destroy: (toplevel: boolean) => void;
} {
  const dom = document.createElement("div");
  const destroyed = sinkFuture<boolean>();
  const { output: out, explicit } = c.run(dom, destroyed);
  const destroy = destroyed.resolve.bind(destroyed);
  return { out, dom, destroy, explicit };
}

export function isComponent(c: any): c is Component<any> {
  return c instanceof Component;
}

export interface ReactivesObject {
  [a: string]: Behavior<any> | Stream<any> | Future<any>;
}

const placeholderProxyHandler = {
  get: function(target: any, name: string): Behavior<any> | Stream<any> {
    if (!(name in target)) {
      target[name] = placeholder();
    }
    return target[name];
  }
};

class LoopComponent<O, A> extends Component<O, A> {
  constructor(
    private f: (a: A) => Child<O, A>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<O, A> {
    let placeholderObject: any = { destroyed };
    if (supportsProxy) {
      placeholderObject = new Proxy(placeholderObject, placeholderProxyHandler);
    } else {
      if (this.placeholderNames !== undefined) {
        for (const name of this.placeholderNames) {
          placeholderObject[name] = placeholder();
        }
      }
    }
    const { explicit, output } = toComponent(this.f(placeholderObject)).run(
      parent,
      destroyed
    );
    const returned: (keyof A)[] = <any>Object.keys(output);
    for (const name of returned) {
      placeholderObject[name].replaceWith(output[name]);
    }
    return { explicit, output };
  }
}
export function loop<O, A extends ReactivesObject>(
  f: ((a: A) => Child<O, A>) | ((a: A) => IterableIterator<Component<any> | A>),
  placeholderNames?: string[]
): Component<O, A> {
  const f2 = isGeneratorFunction(f) ? fgo<A>(f) : f;
  return new LoopComponent<O, A>(f2, placeholderNames);
}

class MergeComponent<
  O extends object,
  A,
  P extends object,
  B
> extends Component<O & P, B> {
  constructor(private c1: Component<O, A>, private c2: Component<P, B>) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<O & P, B> {
    const { explicit: explicit1 } = this.c1.run(parent, destroyed);
    const { explicit: explicit2, output } = this.c2.run(parent, destroyed);
    return { explicit: Object.assign({}, explicit1, explicit2), output };
  }
}

/**
 * Merges two components. Their explicit output is combined.
 */
export function merge<O extends object, A, P extends object, B>(
  c1: Component<O, A>,
  c2: Component<P, B>
): Component<O & P, B> {
  return new MergeComponent(c1, c2);
}

function addErrorHandler(modelName: string, viewName: string, obj: any): any {
  if (modelName === "") {
    modelName = "anonymous";
  }
  if (viewName === "") {
    viewName = "anonymous";
  }
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

class ModelViewComponent<A extends ReactivesObject> extends Component<{}, A> {
  constructor(
    private args: any[],
    private model: (...as: any[]) => Now<A>,
    private view: (...as: any[]) => Component<A>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<{}, A> {
    const { view, model, args } = this;
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
    const { output: viewOutput } = view(placeholders, ...args).run(
      parent,
      destroyed
    );
    const helpfulViewOutput = addErrorHandler(
      model.name,
      view.name,
      Object.assign(viewOutput, { destroyed })
    );
    const behaviors = model(helpfulViewOutput, ...args).run();
    // Tie the recursive knot
    for (const name of Object.keys(behaviors)) {
      placeholders[name].replaceWith(behaviors[name]);
    }
    return { explicit: {}, output: behaviors };
  }
}

export type ModelReturn<M> = Now<M> | Iterator<any>;
export type Model<V, M> = (v: V) => ModelReturn<M>;
export type Model1<V, M, A> = (v: V, a: A) => ModelReturn<M>;
export type View<M, V> =
  | ((m: M) => Child<V>)
  | ((m: M) => Iterator<Component<any>>);
export type View1<M, V, A> =
  | ((m: M, a: A) => Child<V>)
  | ((m: M, a: A) => Iterator<Component<any>>);

export function modelView<M extends ReactivesObject, V>(
  model: Model<V, M>,
  view: View<M, V>,
  toViewReactiveNames?: string[]
): () => Component<{}, M>;
export function modelView<M extends ReactivesObject, V, A>(
  model: Model1<V, M, A>,
  view: View1<M, V, A>,
  toViewReactiveNames?: string[]
): (a: A) => Component<{}, M>;
export function modelView<M extends ReactivesObject, V>(
  model: any,
  view: any,
  toViewReactiveNames?: string[]
): (...args: any[]) => Component<{}, M> {
  const m = isGeneratorFunction<V, any>(model) ? fgo(model) : model;
  const v: any = isGeneratorFunction<any, any>(view)
    ? fgo(view)
    : (...as: any[]) => toComponent(view(...as));
  return (...args: any[]) =>
    new ModelViewComponent<M>(args, m, v, toViewReactiveNames);
}

export function viewObserve<A>(
  update: (a: A) => void,
  behavior: Behavior<A>
): void {
  let isPulling = false;
  observe(
    update,
    () => {
      isPulling = true;
      let lastVal: A;
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
export type Child<O = {}, A = {}> =
  | Component<O, A>
  | Showable
  | Behavior<Showable>
  | (() => Iterator<any>)
  | ChildList;

// A dummy interface is required since TypeScript doesn't handle
// recursive type aliases
// See: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
export interface ChildList extends Array<Child> {}

export function isChild(a: any): a is Child {
  return (
    isComponent(a) ||
    isGeneratorFunction(a) ||
    isBehavior(a) ||
    isShowable(a) ||
    Array.isArray(a)
  );
}

class TextComponent extends Component<{}> {
  constructor(private t: Showable) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<{}, {}> {
    const node = document.createTextNode(this.t.toString());
    parent.appendChild(node);
    destroyed.subscribe((toplevel) => {
      if (toplevel) {
        parent.removeChild(node);
      }
    });
    return { explicit: {}, output: {} };
  }
}

export function text(showable: Showable): Component<{}> {
  return new TextComponent(showable);
}

class ListComponent extends Component<any> {
  components: Component<any>[];
  constructor(children: Child[]) {
    super();
    this.components = [];
    for (const child of children) {
      const component = toComponent(child);
      this.components.push(component);
    }
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<any, any> {
    const output: Record<string, any> = {};
    for (let i = 0; i < this.components.length; ++i) {
      const component = this.components[i];
      const { explicit } = component.run(parent, destroyed);
      Object.assign(output, explicit);
    }
    return { explicit: output, output };
  }
}

export function toComponent<A>(child: Component<A>): Component<A>;
export function toComponent<A>(child: Showable): Component<{}>;
export function toComponent<A>(child: Behavior<Showable>): Component<{}>;
export function toComponent<A>(child: () => Iterator<any>): Component<any>;
export function toComponent<A>(child: Child[]): Component<{}>;
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
    return new ListComponent(child);
  } else {
    throw "Child could not be converted to component";
  }
}

class FixedDomPosition implements DomApi {
  end: Comment;
  constructor(private parent: DomApi, destroy: Future<boolean>) {
    this.end = document.createComment("Fixed point");
    parent.appendChild(this.end);
    destroy.subscribe(() => parent.removeChild(this.end));
  }

  appendChild(child: Node): void {
    this.parent.insertBefore(child, this.end);
  }
  insertBefore(e: Node, a: Node): void {
    this.parent.insertBefore(e, a);
  }
  removeChild(c: Node): void {
    this.parent.removeChild(c);
  }
}

class DynamicComponent<A> extends Component<{}, Behavior<A>> {
  constructor(private behavior: Behavior<Child<A>>) {
    super();
  }
  run(parent: DomApi, dynamicDestroyed: Future<boolean>): Out<{}, Behavior<A>> {
    let destroyPrevious: Future<boolean>;
    const parentWrap = new FixedDomPosition(parent, dynamicDestroyed);

    const output = this.behavior.map((child) => {
      if (destroyPrevious !== undefined) {
        destroyPrevious.resolve(true);
      }
      destroyPrevious = sinkFuture<boolean>();
      const result = toComponent(child).run(
        parentWrap,
        destroyPrevious.combine(dynamicDestroyed)
      );
      return result.explicit;
    });
    // To activate behavior
    viewObserve((v) => {}, output);

    return { explicit: {}, output };
  }
}

export function dynamic<O, A>(
  behavior: Behavior<Component<O, A>>
): Component<{}, Behavior<A>>;
export function dynamic<A>(behavior: Behavior<Child>): Component<{}, any>;
export function dynamic<A>(
  behavior: Behavior<Child<A>>
): Component<{}, Behavior<A>> {
  return new DynamicComponent(behavior);
}

class DomRecorder implements DomApi {
  constructor(private parent: DomApi) {}
  elms: Node[] = [];
  appendChild(child: Node): void {
    this.parent.appendChild(child);
    this.elms.push(child);
  }
  insertBefore(a: Node, b: Node): void {
    this.parent.insertBefore(a, b);
    const index = this.elms.indexOf(b);
    this.elms.splice(index, 0, a);
  }
  removeChild(c: Node): void {
    this.parent.removeChild(c);
    const index = this.elms.indexOf(c);
    this.elms.splice(index, 1);
  }
}

type ComponentStuff<A> = {
  out: A;
  destroy: Future<boolean>;
  elms: Node[];
};

class ComponentList<A, B> extends Component<{}, Behavior<B[]>> {
  constructor(
    private compFn: (a: A) => Component<B>,
    private listB: Behavior<A[]>,
    private getKey: (a: A, index: number) => Showable
  ) {
    super();
  }
  run(parent: DomApi, listDestroyed: Future<boolean>): Out<{}, Behavior<B[]>> {
    // The reordering code below is neither pretty nor fast. But it at
    // least avoids recreating elements and is quite simple.
    const resultB = sinkBehavior<B[]>([]);
    let keyToElm: Record<string, ComponentStuff<B>> = {};
    const parentWrap = new FixedDomPosition(parent, listDestroyed);
    this.listB.subscribe((newAs) => {
      const newKeyToElm: Record<string, ComponentStuff<B>> = {};
      const newArray: B[] = [];
      // Re-add existing elements and new elements
      for (let i = 0; i < newAs.length; i++) {
        const a = newAs[i];
        const key = this.getKey(a, i);
        let stuff = keyToElm[key];
        if (stuff === undefined) {
          const destroy = sinkFuture<boolean>();
          const recorder = new DomRecorder(parentWrap);
          const out = runComponent(
            recorder,
            this.compFn(a),
            destroy.combine(listDestroyed)
          );
          stuff = { elms: recorder.elms, out, destroy };
        } else {
          for (const elm of stuff.elms) {
            parentWrap.appendChild(elm);
          }
        }
        newArray.push(stuff.out);
        newKeyToElm[key] = stuff;
      }
      // Remove elements that are no longer present
      const oldKeys = Object.keys(keyToElm);
      for (const key of oldKeys) {
        if (newKeyToElm[key] === undefined) {
          keyToElm[key].destroy.resolve(true);
        }
      }
      keyToElm = newKeyToElm;
      resultB.push(newArray);
    });
    return { explicit: {}, output: resultB };
  }
}

export function list<A, B>(
  componentCreator: (a: A) => Component<any>,
  listB: Behavior<A[]>,
  getKey: (a: A, index: number) => Showable = id
): Component<{}, Behavior<B[]>> {
  return new ComponentList(componentCreator, listB, getKey);
}
