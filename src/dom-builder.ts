import {
  Behavior,
  sinkBehavior,
  isBehavior,
  Stream,
  Now,
  streamFromEvent,
  behaviorFromEvent,
  Future,
  empty
} from "@funkia/hareactive";
import {
  Component,
  runComponent,
  viewObserve,
  Showable,
  Child,
  isChild,
  toComponent,
  Out,
  emptyComponent
} from "./component";
import { id, mergeDeep, assign, copyRemaps } from "./utils";

export type EventName = keyof HTMLElementEventMap;

export type Cp<A> = Component<A>;
export type Ch<A> = Child<A>;

export type StreamDescription<A> = [EventName, (evt: any) => A, A];

export function streamDescription<A, N extends EventName>(
  eventName: N,
  f: (evt: HTMLElementEventMap[N]) => A
): StreamDescription<A> {
  return <any>[eventName, f]; // The third value don't exist it's for type info only
}

export type StreamDescriptions = {
  [name: string]: StreamDescription<any>;
};

export type OutputStream<T extends StreamDescriptions> = {
  [K in keyof T]: Stream<T[K][2]>
};

export type BehaviorDescription<A> = [
  EventName,
  (evt: any) => A,
  (elm: HTMLElement) => A,
  A
];

export function behaviorDescription<A, N extends EventName>(
  eventName: N,
  f: (evt: HTMLElementEventMap[N]) => A,
  init: (elm: HTMLElement) => A
): BehaviorDescription<A> {
  return <any>[eventName, f, init]; // The fourth value don't exist it's for type info only
}

export type BehaviorDescriptions = {
  [name: string]: BehaviorDescription<any>;
};

export type BehaviorOutput<T extends BehaviorDescriptions> = {
  [K in keyof T]: Behavior<T[K][3]>
};

export type ActionDefinitions = {
  [name: string]: (element: HTMLElement, value: any) => void;
};

export type Actions = {
  [name: string]: Stream<any>;
};

export type Setters = {
  [name: string]: Behavior<any>;
};

export type Style = {
  [N in keyof CSSStyleDeclaration]?:
    | Behavior<CSSStyleDeclaration[N]>
    | CSSStyleDeclaration[N]
};

export type ClassNames = Behavior<string> | string;

export type ClassToggles = {
  [name: string]: boolean | Behavior<boolean>;
};

export type ClassDescription =
  | ClassNames
  | ClassToggles
  | ClassDescriptionArray;

export interface ClassDescriptionArray extends Array<ClassDescription> {}

export type Attributes = {
  [name: string]: (Showable | boolean) | Behavior<Showable | boolean>;
};

type _InitialProperties = {
  streams?: StreamDescriptions;
  behaviors?: BehaviorDescriptions;
  style?: Style;
  props?: {
    [name: string]: Showable | Behavior<Showable | boolean>;
  };
  attrs?: Attributes;
  actionDefinitions?: ActionDefinitions;
  actions?: Actions;
  setters?: { [name: string]: Behavior<any> };
  class?: ClassDescription;
  entry?: { class?: string };
};

export type InitialProperties =
  | _InitialProperties
  | (_InitialProperties & Attributes);

export type DefaultOutput = {
  [E in EventName]: Stream<HTMLElementEventMap[E]>
};

export type InitialOutput<P extends InitialProperties> = OutputStream<
  (P & { streams: StreamDescriptions })["streams"]
> &
  BehaviorOutput<(P & { behaviors: BehaviorDescriptions })["behaviors"]> &
  DefaultOutput;

// An array of names of all DOM events
export const allDomEvents: EventName[] = <any>Object.getOwnPropertyNames(
  Object.getPrototypeOf(Object.getPrototypeOf(document))
)
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

const attributeSetter = (element: HTMLElement) => (
  key: string,
  value: Showable | boolean
) => {
  if (value === true) {
    element.setAttribute(key, "");
  } else if (value === false) {
    element.removeAttribute(key);
  } else {
    element.setAttribute(key, value.toString());
  }
};

const propertySetter = (element: HTMLElement) => (
  key: string,
  value: Showable | boolean
) => ((<any>element)[key] = value);

const classSetter = (element: HTMLElement) => (key: string, value: boolean) =>
  element.classList.toggle(key, value);

const styleSetter = (element: HTMLElement) => (key: string, value: string) =>
  (element.style[<any>key] = value);

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
  elm: HTMLElement,
  isStreamActions: boolean,
  actionDefinitions: ActionDefinitions,
  actions: Actions | Setters | undefined
): void {
  if (actions !== undefined) {
    for (const name of Object.keys(actions)) {
      const actionTrigger = actions[name];
      const actionDefinition = actionDefinitions[name];
      if (isStreamActions) {
        actionTrigger.subscribe((value) => actionDefinition(elm, value));
      } else {
        viewObserve(
          (value) => actionDefinition(elm, value),
          <any>actionTrigger
        );
      }
    }
  }
}

function handleClass(
  desc: ClassDescription | ClassDescription[],
  elm: HTMLElement
): void {
  if (isBehavior(desc)) {
    let previousClasses: string[];
    viewObserve((value) => {
      if (previousClasses !== undefined) {
        elm.classList.remove(...previousClasses);
      }
      previousClasses = value.split(" ");
      elm.classList.add(...previousClasses);
    }, desc);
  } else if (Array.isArray(desc)) {
    for (const d of desc) {
      handleClass(d, elm);
    }
  } else if (typeof desc === "string") {
    const classes = desc.split(" ");
    elm.classList.add(...classes);
  } else {
    handleObject(desc, elm, classSetter);
  }
}

function handleEntryClass(desc: string, elm: HTMLElement): void {
  const classes = desc.split(" ");
  elm.classList.add(...classes);
  // Wait two frames so that we get one frame with the class
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elm.classList.remove(...classes);
    });
  });
}

const propKeywords = ["style", "attrs", "props", "class", "actionDefinitions", "actions", "setters", "entry", "behaviors", "streams", "output"];
export function handleProps<A>(
  props: Properties<A> & { output?: OutputNames<A> },
  elm: HTMLElement
): A {
  let output: any = {};

  let attrs = Object.assign({}, props.attrs);
  for (const [key, value] of Object.entries(props)) {
    if (!propKeywords.includes(key) && attrs[key] === undefined) {
      attrs[key] = value;
    }
  }

  handleObject(<any>props.style, elm, styleSetter);
  handleObject(attrs, elm, attributeSetter);
  handleObject(props.props, elm, propertySetter);
  if (props.class !== undefined) {
    handleClass(props.class, elm);
  }
  if (props.entry !== undefined) {
    if (props.entry.class !== undefined) {
      handleEntryClass(props.entry.class, elm);
    }
  }
  if (props.actionDefinitions !== undefined) {
    handleCustom(elm, true, props.actionDefinitions, props.actions);
    handleCustom(elm, false, props.actionDefinitions, props.setters);
  }
  if (props.behaviors !== undefined) {
    for (const name of Object.keys(props.behaviors)) {
      const [evt, extractor, initialFn] = props.behaviors[name];
      let a: Behavior<any> | undefined = undefined;
      const initial = initialFn(elm);
      Object.defineProperty(output, name, {
        enumerable: true,
        get: (): Behavior<any> => {
          if (a === undefined) {
            a = behaviorFromEvent(elm, evt, initial, extractor);
          }
          return a;
        }
      });
    }
  }
  if (props.streams !== undefined) {
    for (const name of Object.keys(props.streams)) {
      const [evt, extractor] = props.streams[name];
      let a: Stream<any> | undefined = undefined;
      if (output[name] === undefined) {
        Object.defineProperty(output, name, {
          enumerable: true,
          get: (): Stream<any> => {
            if (a === undefined) {
              a = streamFromEvent(elm, evt, extractor);
            }
            return a;
          }
        });
      }
    }
  }
  if (props.output !== undefined) {
    for (const name of Object.keys(props.output)) {
      if (output[name] === undefined) {
        output[name] = output[props.output[name]];
      }
    }
  }
  return output;
}

class DomComponent<O, P, A> extends Component<O & P, A & P> {
  constructor(
    private tagName: string,
    private props: Properties<A> & { output?: OutputNames<A> },
    private child?: Component<P, any>
  ) {
    super();
    if (child !== undefined) {
      this.child = toComponent(child);
    }
  }
  run(parent: Node, destroyed: Future<boolean>): Out<O & P, A & P> {
    const elm = document.createElement(this.tagName);

    const output: any = handleProps(this.props, elm);

    const explicitOutput = this.props.output
      ? Object.keys(this.props.output)
      : [];
    const explicit: any = {};
    for (const name of explicitOutput) {
      explicit[name] = output[name];
    }

    parent.appendChild(elm);

    if (this.child !== undefined) {
      const childResult = this.child.run(elm, destroyed.mapTo(false));
      Object.assign(explicit, childResult.explicit);
      Object.assign(output, childResult.explicit);
    }
    destroyed.subscribe((toplevel) => {
      if (toplevel) {
        parent.removeChild(elm);
      }
      // TODO: cleanup listeners
    });
    return { explicit, output };
  }
}

export type OutputNames<A> = {
  [name: string]: keyof A;
};

export type Properties<A> = InitialProperties;

export type PropsOutput<A, O extends OutputNames<A>> = {
  output?: O;
} & InitialProperties;

export type OutputRenamed<A, B extends OutputNames<A>> = {
  [N in keyof B]: A[B[N]]
} &
  A;

export type ChArr1<A> = [Ch<A>];
export type ChArr2<A, B> = [Ch<A>, Ch<B>];
export type ChArr3<A, B, C> = [Ch<A>, Ch<B>, Ch<C>];
export type ChArr4<A, B, C, D> = [Ch<A>, Ch<B>, Ch<C>, Ch<D>];
export type ChArr5<A, B, C, D, E> = [Ch<A>, Ch<B>, Ch<C>, Ch<D>, Ch<E>];
export type ChArr6<A, B, C, D, E, F> = [
  Ch<A>,
  Ch<B>,
  Ch<C>,
  Ch<D>,
  Ch<E>,
  Ch<F>
];
export type ChArr7<A, B, C, D, E, F, G> = [
  Ch<A>,
  Ch<B>,
  Ch<C>,
  Ch<D>,
  Ch<E>,
  Ch<F>,
  Ch<G>
];
export type ChArr8<A, B, C, D, E, F, G, H> = [
  Ch<A>,
  Ch<B>,
  Ch<C>,
  Ch<D>,
  Ch<E>,
  Ch<F>,
  Ch<G>,
  Ch<H>
];
export type ChArr9<A, B, C, D, E, F, G, H, I> = [
  Ch<A>,
  Ch<B>,
  Ch<C>,
  Ch<D>,
  Ch<E>,
  Ch<F>,
  Ch<G>,
  Ch<H>,
  Ch<I>
];

export type Generator = IterableIterator<any>;
// `A` is the parents output
export type ElementCreator<A> = {
  (): Cp<A>;
  // We cannot know what a generator function outputs
  (generator: Generator): Cp<any>;
  <O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    generator: Generator
  ): Cp<any>;
  // Properties are given
  <B, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr1<B>
  ): Cp<B & OutputRenamed<A, O>>;
  <B, C, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr2<B, C>
  ): Cp<B & C & OutputRenamed<A, O>>;
  <B, C, D, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr3<B, C, D>
  ): Cp<B & C & D & OutputRenamed<A, O>>;
  <B, C, D, E, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr4<B, C, D, E>
  ): Cp<B & C & D & E & OutputRenamed<A, O>>;
  <B, C, D, E, F, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr5<B, C, D, E, F>
  ): Cp<B & C & D & E & F & OutputRenamed<A, O>>;
  <B, C, D, E, F, G, O extends OutputNames<A> = {}>(
    props: PropsOutput<A, O>,
    child?: ChArr6<B, C, D, E, F, G>
  ): Cp<B & C & D & E & F & G & OutputRenamed<A, O>>;
  <O extends OutputNames<A>, B>(props: PropsOutput<A, O>, child?: Ch<B>): Cp<
    B & OutputRenamed<A, O>
  >;
  <B>(props: Properties<A>, child: Child<B>): Cp<B>;
  // Properties aren't given
  <B, C>(child: ChArr2<B, C>): Cp<A & B & C>;
  <B, C, D>(child: ChArr3<B, C, D>): Cp<A & B & C & D>;
  <B, C, D, E>(child: ChArr4<B, C, D, E>): Cp<A & B & C & D & E>;
  <B, C, D, E, F>(child: ChArr5<B, C, D, E, F>): Cp<A & B & C & D & E & F>;
  <B, C, D, E, F, G>(child: ChArr6<B, C, D, E, F, G>): Cp<
    A & B & C & D & E & F & G
  >;
  <B, C, D, E, F, G, H>(child: ChArr7<B, C, D, E, F, G, H>): Cp<
    A & B & C & D & E & F & G & H
  >;
  <B, C, D, E, F, G, H, I>(child: ChArr8<B, C, D, E, F, G, H, I>): Cp<
    A & B & C & D & E & F & G & H & I
  >;
  <B, C, D, E, F, G, H, I, J>(child: ChArr9<B, C, D, E, F, G, H, I, J>): Cp<
    A & B & C & D & E & F & G & H & I & J
  >;
  <B>(child: Ch<B>): Cp<A & B>;
  (props: Properties<A>): Cp<A>;
};

export function element<P extends InitialProperties>(
  tagName: string,
  props?: P
): ElementCreator<InitialOutput<P>> {
  const mergedProps: P = mergeDeep(props, defaultProperties);
  function createElement(
    newPropsOrChildren?: InitialProperties | Child,
    childOrUndefined?: Child
  ): Component<InitialOutput<P>> {
    const finalProps =
      newPropsOrChildren !== undefined && !isChild(newPropsOrChildren)
        ? mergeDeep(mergedProps, newPropsOrChildren)
        : mergedProps;
    const child =
      childOrUndefined !== undefined
        ? toComponent(childOrUndefined)
        : isChild(newPropsOrChildren)
          ? toComponent(newPropsOrChildren)
          : undefined;
    return new DomComponent<any, any, any>(tagName, finalProps, child);
  }
  return createElement as any;
}
