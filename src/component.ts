import {
  Behavior,
  Future,
  isBehavior,
  Now,
  placeholder,
  runNow,
  sinkBehavior,
  sinkFuture,
  Stream
} from "@funkia/hareactive";
import { render } from "@funkia/hareactive/dom";
import { fgo, go, Monad, monad } from "@funkia/jabz";
import { copyRemaps, id, Merge, mergeObj } from "./utils";

const supportsProxy = typeof Proxy !== "undefined";

export type Showable = string | number | boolean;

function isShowable(s: any): s is Showable {
  return (
    typeof s === "string" || typeof s === "number" || typeof s === "boolean"
  );
}

export function isGeneratorFunction(
  fn: any
): fn is (...a: any[]) => IterableIterator<any> {
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
  selected: O;
  output: A;
};

/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we want to
 * make it a monad in different way than Now.
 */
@monad
export abstract class Component<O, A> implements Monad<A> {
  static of<B>(b: B): Component<{}, B> {
    return new OfComponent(b);
  }
  of<B>(b: B): Component<{}, B> {
    return new OfComponent(b);
  }
  flatMap<B>(f: (a: A) => Component<O, B>): Component<O, B> {
    return new FlatMapComponent(this, f);
  }
  chain<B>(f: (a: A) => Component<O, B>): Component<O, B> {
    return new FlatMapComponent(this, f);
  }
  output<P>(f: (a: A) => P): Component<O & P, A>;
  output<B extends Record<string, keyof A>>(
    remaps: B
  ): Component<O & Remap<A, B>, A>;
  output(handler: any): Component<any, A> {
    if (typeof handler === "function") {
      return new HandleOutput((e, o) => [mergeObj(e, handler(o)), o], this);
    } else {
      return new HandleOutput(
        (e, o) => [mergeObj(e, copyRemaps(handler, o)), o],
        this
      );
    }
  }
  view(): Component<{}, O> {
    return view(this);
  }
  static multi: boolean = false;
  multi: boolean = false;
  abstract run(
    parent: DomApi,
    destroyed: Future<boolean>
  ): { selected: O; output: A };
  // Definitions below are inserted by Jabz
  flatten: <B>() => Component<O, B>;
  map: <B>(f: (a: A) => B) => Component<O, B>;
  mapTo: <B>(b: B) => Component<O, B>;
  ap: <B, P>(a: Component<P, (a: A) => B>) => Component<O, B>;
  lift: (f: Function, ...ms: any[]) => Component<O, any>;
}

class OfComponent<A> extends Component<{}, A> {
  constructor(private value: A) {
    super();
  }
  run(_1: Node, _2: Future<boolean>): { selected: {}; output: A } {
    return { selected: {}, output: this.value };
  }
}

class PerformComponent<A> extends Component<{}, A> {
  constructor(private cb: () => A) {
    super();
  }
  run(_1: Node, _2: Future<boolean>): { selected: {}; output: A } {
    return { selected: {}, output: this.cb() };
  }
}

/**
 * Takes a callback, potentially with side-effects. The callback is invoked when
 * the component is run and the return value becomes the components output.
 */
export function performComponent<A>(callback: () => A): Component<{}, A> {
  return new PerformComponent(callback);
}

export function liftNow<A>(now: Now<A>): Component<{}, A> {
  return performComponent(() => runNow(now));
}

class HandleOutput<O, A, P, B> extends Component<P, B> {
  constructor(
    private readonly handler: (selected: O, output: A) => [P, B],
    private readonly c: Component<O, A>
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<P, B> {
    const { selected, output } = this.c.run(parent, destroyed);
    const [newSelected, newOutput] = this.handler(selected, output);
    return { selected: newSelected, output: newOutput };
  }
}

/**
 * This type is sometimes useful to trick TypeScript into evaulating types
 * that it would otherwise not evaluating. This can make some types
 * significantly more readable.
 */
type Id<T extends object> = {} & { [P in keyof T]: T[P] };

export type Remap<
  A extends Record<any, any>,
  B extends Record<any, keyof A>
> = Id<{ [K in keyof B]: A[B[K]] }>;

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

class FlatMapComponent<O, A, B> extends Component<O, B> {
  constructor(
    private component: Component<O, A>,
    private f: (a: A) => Component<O, B>
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<O, B> {
    const { selected, output: outputFirst } = this.component.run(
      parent,
      destroyed
    );
    const { output } = this.f(outputFirst).run(parent, destroyed);
    return { selected, output };
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
  component: Child,
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
  selected: O;
  destroy: (toplevel: boolean) => void;
} {
  const dom = document.createElement("div");
  const destroyed = sinkFuture<boolean>();
  const { output: out, selected } = c.run(dom, destroyed);
  const destroy = destroyed.resolve.bind(destroyed);
  return { out, dom, destroy, selected };
}

export function isComponent(c: any): c is Component<any, any> {
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

class LoopComponent<O> extends Component<{}, O> {
  constructor(
    private f: (o: O) => Child<O>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<{}, O> {
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
    const { selected, output } = toComponent(this.f(placeholderObject)).run(
      parent,
      destroyed
    );
    const returned: (keyof O)[] = <any>Object.keys(output);
    for (const name of returned) {
      placeholderObject[name].replaceWith(output[name]);
    }
    return { selected: {}, output };
  }
}

export function loop<O extends ReactivesObject>(
  f: (o: O) => Component<O, any>,
  placeholderNames?: string[]
): Component<{}, O> {
  const f2 = isGeneratorFunction(f) ? fgo<O>(f) : f;
  return new LoopComponent<O>(f2, placeholderNames);
}

class MergeComponent<
  O extends object,
  A,
  P extends object,
  B
> extends Component<O & P, O & P> {
  constructor(private c1: Component<O, A>, private c2: Component<P, B>) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<O & P, O & P> {
    const { selected: selected1 } = this.c1.run(parent, destroyed);
    const { selected: selected2 } = this.c2.run(parent, destroyed);
    const merged = Object.assign({}, selected1, selected2);
    return { selected: merged, output: merged };
  }
}

/**
 * Merges two components. Their selected output is combined.
 */
export function merge<O extends object, A, P extends object, B>(
  c1: Component<O, A>,
  c2: Component<P, B>
): Component<O & P, O & P> {
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

class ModelViewComponent<M extends ReactivesObject, V> extends Component<
  {},
  M
> {
  constructor(
    private args: any[],
    private model: (...as: any[]) => Now<M>,
    private viewF: (...as: any[]) => Child<V>,
    private placeholderNames?: string[]
  ) {
    super();
  }
  run(parent: DomApi, destroyed: Future<boolean>): Out<{}, M> {
    const { viewF, model, args } = this;
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
    const { selected: viewOutput } = toComponent(
      viewF(placeholders, ...args)
    ).run(parent, destroyed);
    const helpfulViewOutput = addErrorHandler(
      model.name,
      viewF.name,
      Object.assign(viewOutput, { destroyed })
    );
    const behaviors = runNow(model(helpfulViewOutput, ...args));
    // Tie the recursive knot
    for (const name of Object.keys(behaviors)) {
      placeholders[name].replaceWith(behaviors[name]);
    }
    return { selected: {}, output: behaviors };
  }
}

export type ModelReturn<M> = Now<M> | Iterator<any>;
export type Model<V, M> = (v: V) => ModelReturn<M>;
export type Model1<V, M, A> = (v: V, a: A) => ModelReturn<M>;
export type View<M, V> = (m: M) => Child<V>;
export type View1<M, V, A> = (m: M, a: A) => Child<V>;

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
  const m: any = isGeneratorFunction(model) ? fgo(model) : model;
  return (...args: any[]) =>
    new ModelViewComponent<M, V>(args, m, view, toViewReactiveNames);
}

export function view<O>(c: Component<O, any>): Component<{}, O> {
  return new HandleOutput((selected, _) => [{}, selected], c);
}

// Child element
export type CE<O = any> =
  | Component<O, any>
  | Behavior<Component<any, any>>
  | Showable
  | Behavior<Showable>
  | ChildList;

// Union of the types that can be used as a child. A child is either a
// component or something that can be converted into a component. This
// type is not recursive on tuples due to recursive type aliases being
// impossible.
export type Child<O = any> =
  | [CE]
  | [CE, CE]
  | [CE, CE, CE]
  | [CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE]
  | [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] // 12
  | CE<O>;

// A dummy interface is required since TypeScript doesn't handle
// recursive type aliases
// See: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
export interface ChildList extends Array<CE> {}

/**
 * Takes a component type and returns the selected output of the component.
 */
export type ComponentSelectedOutput<C> = C extends Component<infer O, any>
  ? O
  : never;

/**
 * Takes a component type and returns the output of the component.
 */
export type ComponentOutput<C> = C extends Component<any, infer A> ? A : never;

export type ChildSelectedOutput<Ch extends Child> = ComponentSelectedOutput<
  ToComponent<Ch>
>;

// Merge component
export type MC<C1 extends CE, C2 extends CE> = Component<
  ComponentSelectedOutput<TC<C1>> & ComponentSelectedOutput<TC<C2>>,
  Merge<ComponentSelectedOutput<TC<C1>> & ComponentSelectedOutput<TC<C2>>>
>;

// prettier-ignore
export type ArrayToComponent<A extends Array<Child>> =
  A extends [CE] ? TC<A[0]> :
  A extends [CE, CE] ? MC<A[0], A[1]> :
  A extends [CE, CE, CE] ? MC<A[0], MC<A[1], A[2]>> :
  A extends [CE, CE, CE, CE] ? MC<A[0], MC<A[1], MC<A[2], A[3]>>> :
  A extends [CE, CE, CE, CE, CE] ? MC<A[0], MC<A[1], MC<A[2], MC<A[3], A[4]>>>> :
  A extends [CE, CE, CE, CE, CE, CE] ? MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], A[5]>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], A[6]>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], A[7]>>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], MC<A[7], A[8]>>>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], MC<A[7], MC<A[8], A[9]>>>>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], MC<A[7], MC<A[8], MC<A[9], A[10]>>>>>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], MC<A[7], MC<A[8], MC<A[9], MC<A[10], A[11]>>>>>>>>>>>> :
  A extends [CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE, CE] ? TC<MC<A[0], MC<A[1], MC<A[2], MC<A[3], MC<A[4], MC<A[5], MC<A[6], MC<A[7], MC<A[8], MC<A[9], MC<A[10], MC<A[11], A[12]>>>>>>>>>>>>> :
  Component<any, any>;

export type TC<A> = A extends Component<infer O, any>
  ? Component<O, O>
  : A extends Showable
  ? Component<{}, {}>
  : A extends Behavior<Showable>
  ? Component<{}, {}>
  : Component<any, any>;

export type ToComponent<A> = A extends Child[] ? ArrayToComponent<A> : TC<A>;

export function isChild(a: any): a is Child {
  return (
    isComponent(a) ||
    isGeneratorFunction(a) ||
    isBehavior(a) ||
    isShowable(a) ||
    Array.isArray(a)
  );
}

class TextComponent extends Component<{}, {}> {
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
    return { selected: {}, output: {} };
  }
}

export function text(showable: Showable): Component<{}, {}> {
  return new TextComponent(showable);
}

class ListComponent extends Component<any, any> {
  components: Component<any, any>[];
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
      const { selected } = component.run(parent, destroyed);
      Object.assign(output, selected);
    }
    return { selected: output, output };
  }
}

export function toComponent<A extends Child>(child: A): ToComponent<A> {
  if (isComponent(child)) {
    return child as any;
  } else if (isBehavior(child)) {
    return dynamic(child).mapTo({}) as any;
  } else if (isGeneratorFunction(child)) {
    return go(child);
  } else if (isShowable(child)) {
    return text(child) as any;
  } else if (Array.isArray(child)) {
    return new ListComponent(child) as any;
  } else {
    throw new Error("Child could not be converted to component");
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

class DynamicComponent<O> extends Component<{}, Behavior<O>> {
  constructor(private behavior: Behavior<Child<O>>) {
    super();
  }
  run(parent: DomApi, dynamicDestroyed: Future<boolean>): Out<{}, Behavior<O>> {
    let destroyPrevious: Future<boolean>;
    const parentWrap = new FixedDomPosition(parent, dynamicDestroyed);

    const output = this.behavior.map((child) => {
      if (destroyPrevious !== undefined) {
        destroyPrevious.resolve(true);
      }
      destroyPrevious = sinkFuture<boolean>();
      const { selected } = toComponent(child).run(
        parentWrap,
        destroyPrevious.combine(dynamicDestroyed)
      );
      return selected;
    });
    // To activate behavior
    render(id, output);

    return { selected: {}, output };
  }
}

export function dynamic<O>(
  behavior: Behavior<Component<O, any>>
): Component<{}, Behavior<O>>;
export function dynamic(behavior: Behavior<Child>): Component<{}, {}>;
export function dynamic<O>(
  behavior: Behavior<Child<O>>
): Component<{}, Behavior<O>> {
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

class ComponentList<A, O> extends Component<{}, Behavior<O[]>> {
  constructor(
    private compFn: (a: A) => Component<O, any>,
    private listB: Behavior<A[]>,
    private getKey: (a: A, index: number) => number | string
  ) {
    super();
  }
  run(parent: DomApi, listDestroyed: Future<boolean>): Out<{}, Behavior<O[]>> {
    // The reordering code below is neither pretty nor fast. But it at
    // least avoids recreating elements and is quite simple.
    const resultB = sinkBehavior<O[]>([]);
    let keyToElm: Record<string, ComponentStuff<O>> = {};
    const parentWrap = new FixedDomPosition(parent, listDestroyed);
    this.listB.subscribe((newAs) => {
      const newKeyToElm: Record<string, ComponentStuff<O>> = {};
      const newArray: O[] = [];
      // Re-add existing elements and new elements
      for (let i = 0; i < newAs.length; i++) {
        const a = newAs[i];
        const key = this.getKey(a, i);
        let stuff = keyToElm[key];
        if (stuff === undefined) {
          const destroy = sinkFuture<boolean>();
          const recorder = new DomRecorder(parentWrap);
          const out = this.compFn(a).run(
            recorder,
            destroy.combine(listDestroyed)
          );
          stuff = { elms: recorder.elms, out: out.selected, destroy };
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
    return { selected: {}, output: resultB };
  }
}

export function list<A extends string | number, O>(
  componentCreator: (a: A) => Component<O, any>,
  listB: Behavior<A[]>,
  getKey?: (a: A, index: number) => number | string
): Component<{}, Behavior<O[]>>;
export function list<A, O>(
  componentCreator: (a: A) => Component<O, any>,
  listB: Behavior<A[]>,
  getKey: (a: A, index: number) => number | string
): Component<{}, Behavior<O[]>>;
export function list<A, O>(
  componentCreator: (a: A) => Component<O, any>,
  listB: Behavior<A[]>,
  getKey: (a: A, index: number) => number | string = id as any
): Component<{}, Behavior<O[]>> {
  return new ComponentList(componentCreator, listB, getKey);
}
