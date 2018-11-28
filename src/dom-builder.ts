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
  emptyComponent,
  ToComponent,
  ComponentExplicitOutput,
  Remap
} from "./component";
import { id, mergeDeep, assign, copyRemaps, Merge } from "./utils";

export type EventName = keyof HTMLElementEventMap;

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

export type InitialOutput<P extends InitialProperties> = Merge<
  (P["streams"] extends StreamDescriptions ? OutputStream<P["streams"]> : {}) &
    (P["behaviors"] extends BehaviorDescriptions
      ? BehaviorOutput<P["behaviors"]>
      : {}) &
    DefaultOutput
>;

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
        viewObserve((value) => actionDefinition(elm, value), <any>(
          actionTrigger
        ));
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

const propKeywords = new Set([
  "style",
  "attrs",
  "props",
  "class",
  "actionDefinitions",
  "actions",
  "setters",
  "entry",
  "behaviors",
  "streams",
  "output"
]);

/**
 * Set of things that should be handled as properties and not attributes.
 */
const isProperty = new Set(["value"]);

export function handleProps<A>(props: Properties<A>, elm: HTMLElement): A {
  let output: any = {};

  let attrs = Object.assign({}, props.attrs);
  let properties = Object.assign({}, props.props);
  for (const [key, value] of Object.entries(props)) {
    if (!propKeywords.has(key)) {
      if (isProperty.has(key)) {
        properties[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }

  handleObject(<any>props.style, elm, styleSetter);
  handleObject(attrs, elm, attributeSetter);
  handleObject(properties, elm, propertySetter);
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
      const [evt, extractor, getter] = props.behaviors[name];
      let a: Behavior<any> | undefined = undefined;
      Object.defineProperty(output, name, {
        enumerable: true,
        get: (): Behavior<any> => {
          if (a === undefined) {
            a = behaviorFromEvent(elm, evt, getter, extractor);
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
    private props: Properties<A>,
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
    let explicit: any = {};

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

export type Properties<A> = InitialProperties & {
  output?: Record<string, keyof A>;
};

type ChildExplicitOutput<Ch extends Child> = ComponentExplicitOutput<
  ToComponent<Ch>
>;

// `O` is the parents output
export type Wrapped<P, O> = (undefined extends P
  ? {
      // Optional props
      // Only props
      (props?: P): Component<{}, O>;
      // Only child
      <Ch extends Child>(child: Ch): Component<
        ChildExplicitOutput<Ch>,
        ChildExplicitOutput<Ch> & O
      >;
    }
  : {
      // Required props
      // Only props
      (props: P): Component<{}, O>;
    }) & {
  // Both props and child
  <Ch extends Child>(props: P, child: Ch): Component<
    ChildExplicitOutput<Ch>,
    ChildExplicitOutput<Ch> & O
  >;
};

export function wrapper<P, O>(
  fn: (props: P, child: Component<any, any> | undefined) => Component<any, O>
): Wrapped<P, O> {
  function wrappedComponent(
    newPropsOrChild: P | Child,
    childOrUndefined: Child | undefined
  ) {
    const props =
      newPropsOrChild !== undefined && !isChild(newPropsOrChild)
        ? newPropsOrChild
        : undefined;
    const child =
      childOrUndefined !== undefined
        ? toComponent(childOrUndefined)
        : isChild(newPropsOrChild)
          ? toComponent(newPropsOrChild)
          : undefined;
    return fn(props!, child);
  }
  return <any>wrappedComponent;
}

export function element<P extends InitialProperties>(
  tagName: string,
  defaultElementProps?: P
) {
  const mergedProps: P = mergeDeep(defaultElementProps, defaultProperties);
  return wrapper(
    (
      p: InitialProperties | undefined,
      child: Component<any, any> | undefined
    ) => {
      const finalProps = mergeDeep(mergedProps, p);
      return new DomComponent(tagName, finalProps, child);
    }
  );
}
