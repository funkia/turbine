import {
  Behavior, sink, isBehavior, Stream, empty, Now
} from "hareactive";
import {
  Component, runComponentNow,
  viewObserve, Showable, Child, isChild, toComponent
} from "./component";
import { id, rename, mergeDeep } from "./utils";

export type EventName = keyof HTMLElementEventMap;

export type Cp<A> = Component<A>;

export type StreamDescription<A> = [EventName, (evt: any) => A, A];

export function streamDescription<A, N extends EventName>(
  eventName: N, f: (evt: HTMLElementEventMap[N]) => A
): StreamDescription<A> {
  return <any>[eventName, f]; // The third value don't exist it's for type info only
}

export type StreamDescriptions = {
  [name: string]: StreamDescription<any>
}

export type OutputStream<T extends StreamDescriptions> = {
  [K in keyof T]: Stream<T[K][2]>
}

export type BehaviorDescription<A> = [EventName, (evt: any) => A, (elm: HTMLElement) => A, A];

export function behaviorDescription<A, N extends EventName>(
  eventName: N, f: (evt: HTMLElementEventMap[N]) => A, init: (elm: HTMLElement) => A
): BehaviorDescription<A> {
  return <any>[eventName, f, init]; // The fourth value don't exist it's for type info only
}

export type BehaviorDescriptions = {
  [name: string]: BehaviorDescription<any>
}

export type BehaviorOutput<T extends BehaviorDescriptions> = {
  [K in keyof T]: Behavior<T[K][3]>
}

export type ActionDefinitions = {
  [name: string]: (element: HTMLElement, value: any) => void
};

export type Actions = {
  [name: string]: Stream<any>
};

export type Setters = {
  [name: string]: Behavior<any>
};

export type Style = {
  [N in keyof CSSStyleDeclaration]?: Behavior<CSSStyleDeclaration[N]> | CSSStyleDeclaration[N]
}

export type InitialProperties = {
  wrapper?: boolean,
  streams?: StreamDescriptions,
  behaviors?: BehaviorDescriptions,
  style?: Style,
  props?: {
    [name: string]: Showable | Behavior<Showable | boolean>;
  },
  attrs?: {
    [name: string]: (Showable | boolean) | Behavior<(Showable | boolean)>;
  },
  actionDefinitions?: ActionDefinitions,
  actions?: Actions,
  setters?: { [name: string]: Behavior<any> },
  class?: string,
  classToggle?: {
    [name: string]: boolean | Behavior<boolean>;
  }
};

export type DefaultOutput = {
  [E in EventName]: Stream<HTMLElementEventMap[E]>
}

export type InitialOutput<P extends InitialProperties> =
  OutputStream<(P & {streams: {}})["streams"]> & BehaviorOutput<(P & {behaviors: {}})["behaviors"]> & DefaultOutput;

// An array of names of all DOM events
export const allDomEvents: EventName[] =
  <any>Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(document)))
    .filter((i) => i.indexOf("on") === 0)
    .map((name) => name.slice(2));

// Output streams that _all_ elements share
const defaultStreams: StreamDescriptions = {};

for (const name of allDomEvents) {
  defaultStreams[name] = streamDescription(name, id);
}

const defaultProperties = {
  streams: defaultStreams
};

const attributeSetter = (element: HTMLElement) => (key: string, value: boolean | string) => {
  if (value === true) {
    element.setAttribute(key, "");
  } else if (value === false) {
    element.removeAttribute(key);
  } else {
    element.setAttribute(key, value);
  }
};

const propertySetter = (element: HTMLElement) => (key: string, value: string) =>
  (<any>element)[key] = value;

const classSetter = (element: HTMLElement) => (key: string, value: boolean) =>
  element.classList.toggle(key, value);

const styleSetter = (element: HTMLElement) => (key: string, value: string) =>
  element.style[<any>key] = value;

function handleObject<A>(
  object: { [key: string]: A | Behavior<A> } | undefined,
  element: HTMLElement,
  createSetter: (element: HTMLElement) => (key: string, value: A) => void
): void {
  if (object !== undefined) {
    const setter = createSetter(element);
    for (const key of Object.keys(object)) {
      const value = object[key];
      if (isBehavior(value)) {
        viewObserve((newValue) => setter(key, newValue), value);
      } else {
        setter(key, value);
      }
    }
  }
}

function handleCustom(
  elm: HTMLElement, isStreamActions: boolean, actionDefinitions: ActionDefinitions, actions: Actions | Setters | undefined
): void {
  if (actions !== undefined) {
    for (const name of Object.keys(actions)) {
      const actionTrigger = actions[name];
      const actionDefinition = actionDefinitions[name];
      if (isStreamActions) {
        actionTrigger.subscribe((value) => actionDefinition(elm, value));
      } else {
        viewObserve((value) => actionDefinition(elm, value), <any>actionTrigger);
      }
    }
  }
}

class CreateDomNow<A> extends Now<A> {
  constructor(
    private parent: Node,
    private tagName: string,
    private props?: Properties<A>,
    private children?: Child
  ) { super(); };
  run(): A {
    let output: any = {};
    const elm = document.createElement(this.tagName);

    if (this.props !== undefined) {
      handleObject(<any>this.props.style, elm, styleSetter);
      handleObject(this.props.attrs, elm, attributeSetter);
      handleObject(this.props.props, elm, propertySetter);
      handleObject(this.props.classToggle, elm, classSetter);
      if (this.props.class !== undefined) {
        const classes = this.props.class.split(" ");
        for (const name of classes) {
          elm.classList.add(name);
        }
      }
      handleCustom(elm, true, this.props.actionDefinitions, this.props.actions);
      handleCustom(elm, false, this.props.actionDefinitions, this.props.setters);
      if (this.props.behaviors !== undefined) {
        for (const name of Object.keys(this.props.behaviors)) {
          const [evt, extractor, initialFn] = this.props.behaviors[name];
          let a: Behavior<any> = undefined;
          const initial = initialFn(elm);
          Object.defineProperty(output, name, {
            enumerable: true,
            get: (): Behavior<any> => {
              if (a === undefined) {
                a = behaviorFromEvent(evt, initial, extractor, elm);
              }
              return a;
            }
          });
        }
      }
      if (this.props.streams !== undefined) {
        for (const name of Object.keys(this.props.streams)) {
          const [evt, extractor] = this.props.streams[name];
          let a: Stream<any> = undefined;
          if (output[name] === undefined) {
            Object.defineProperty(output, name, {
              enumerable: true,
              get: (): Stream<any> => {
                if (a === undefined) {
                  a = streamFromEvent(evt, extractor, elm);
                }
                return a;
              }
            });
          }
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
    if (this.props.output !== undefined) {
      rename(output, this.props.output);
    }
    this.parent.appendChild(elm);
    return output;
  }
}

function parseCSSTagname(cssTagName: string): [string, InitialProperties] {
  const parsedTag = cssTagName.split(/(?=\.)|(?=#)|(?=\[)/);
  const result: InitialProperties = {};
  for (let i = 1; i < parsedTag.length; i++) {
    const token = parsedTag[i];
    switch (token[0]) {
      case "#":
        result.props = result.props || {};
        result.props.id = token.slice(1);
        break;
      case ".":
        result.classToggle = result.classToggle || {};
        result.classToggle[token.slice(1)] = true;
        break;
      case "[":
        result.attrs = result.attrs || {};
        const attr = token.slice(1, -1).split("=");
        result.attrs[attr[0]] = attr[1] || "";
        break;
      default:
        throw new Error("Unknown symbol");
    }
  }
  return [parsedTag[0], result];
}

export type OutputNames<A> = {
  [name: string]: (keyof A)
}

export type Properties<A> = {
  output?: OutputNames<A>,
} & InitialProperties;

export type OutputRenamed<A, B extends OutputNames<A>> = {
  [N in keyof B]: A[B[N]]
} & A;

export type ElementCreator<A> = {
  (props: Properties<A>): Cp<A>;
}

// `A` is the parents output
export type WrapperElementCreator<A> = {
  <B>(props: { wrapper: false } & Properties<A>): Cp<A>;
  <B>(props: Properties<A>, child: Cp<B>): Cp<B>;
  // When properties are given
  <B, C>(props: Properties<A>, child: [Cp<B>, Cp<C>]): Cp<B & C>;
  <B, C, D>(props: Properties<A>, child: [Cp<B>, Cp<C>, Cp<D>]): Cp<B & C & D>;
  <B, C, D, E>(props: Properties<A>, child: [Cp<B>, Cp<C>, Cp<D>, Cp<E>]): Cp<B & C & D & E>;
  <B, C, D, E, F>(props: Properties<A>, child: [Cp<B>, Cp<C>, Cp<D>, Cp<E>, Cp<F>]): Cp<B & C & D & E & F>;
  // Properties aren't given
  <B>(child: Cp<B>): Cp<B>;
  <B, C>(child: [Cp<B>, Cp<C>]): Cp<B & C>;
  <B, C, D>(child: [Cp<B>, Cp<C>, Cp<D>]): Cp<B & C & D>;
  <B, C, D, E>(child: [Cp<B>, Cp<C>, Cp<D>, Cp<E>]): Cp<B & C & D & E>;
  <B, C, D, E, F>(child: [Cp<B>, Cp<C>, Cp<D>, Cp<E>, Cp<F>]): Cp<B & C & D & E & F>;
  (props: Properties<A>, child: Child): Cp<any>;
} & ElementCreator<A>;

export type NonwrapperElementCreator<A> = {
  (): Cp<A>;
  (child: Child): Cp<A>;
  <O extends OutputNames<A>>(props: { output: O } & Properties<A>): Cp<OutputRenamed<A, O>>;
  <O extends OutputNames<A>>(props: { output: O } & Properties<A>, child: Child): Cp<OutputRenamed<A, O>>;
  (props: Properties<A>): Cp<A>;
  <B>(props: { wrapper: false } & Properties<A>, child: Child): Cp<A>;
  <B>(props: Properties<A>, child: Cp<B>): Cp<B>;
  <B, C>(props: Properties<A>, child: [Cp<B>, Cp<C>]): Cp<B & C>;
  <B, C, D>(props: Properties<A>, child: [Cp<B>, Cp<C>, Cp<D>]): Cp<B & C & D>;
  <B, C, D, E>(props: Properties<A>, child: [Cp<B>, Cp<C>, Cp<D>, Cp<E>]): Cp<B & C & D & E>;
  (props: Properties<A>, child: Child): Cp<A>;
} & ElementCreator<A>;

export function e<P extends InitialProperties>(tagName: string, props: { wrapper: true } & P):
  WrapperElementCreator<InitialOutput<P>>;
export function e<P extends InitialProperties>(tagName: string, props?: P):
  NonwrapperElementCreator<InitialOutput<P>>;
export function e(tagName: string, props: InitialProperties = {}): NonwrapperElementCreator<DefaultOutput> {
  const [parsedTagName, tagProps] = parseCSSTagname(tagName);
  props = mergeDeep(props, mergeDeep(defaultProperties, tagProps));
  function createElement(newPropsOrChildren?: InitialProperties | Child, newChildrenOrUndefined?: Child): Component<DefaultOutput> {
    if (newChildrenOrUndefined === undefined && isChild(newPropsOrChildren)) {
      return new Component((p) => new CreateDomNow<DefaultOutput>(p, parsedTagName, props, newPropsOrChildren));
    } else {
      const newProps = mergeDeep(props, newPropsOrChildren);
      return new Component((p) => new CreateDomNow<DefaultOutput>(p, parsedTagName, newProps, newChildrenOrUndefined));
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
