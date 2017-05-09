import {
  Stream, snapshot, changes, combine,
  Behavior, stepper
} from "@funkia/hareactive";

import { loop, elements } from "../../../src";
const { input, span } = elements;

const KEYCODE_ENTER = 13;
const isEnterKey = (ev: any) => ev.keyCode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

// declare input type
type Looped = {
  // we need to react to ENTER key, so take the stream of keys pressed
  enterPressed: Stream<Event>,

  /* 
    As we already have the keypress event stream, 
    we can simplify/reduce the input value stream 
    to its behavior part only, taking away the event part.
    That way we don't need to merge the two streams
    and have a cleaner separation of concerns
  */
  value: Behavior<string>
};


// Was this meant to me inside the view?

// perhaps easier syntax: input({ placeholder: 'foo'})
// get input value stream/behavior
input({ attrs: { placeholder: "foo" } }).chain(

  // reference input value as `a`
  ({ inputValue: a }) => input().chain(

    // reference value as `b`
    ({ inputValue: b }) => span(["Combined text: ", a, b])
  )
);

export type Out = {
  enterTodoS: Stream<string>
};

export default loop<Looped & Out>(

  function* ({ 
    // keypress: Stream
    enterPressed, 
    // input value: Behavior
    value 
  }: Looped) {
    // const enterTodoS = snapshot(value, enterPressed).filter(isValidValue);

    const clearedValue = stepper(
      "", 
      combine(changes(value), enterPressed.mapTo(""))
    );

    const { keyup, inputValue: value_ } = yield input({
      class: "new-todo",
      props: { value: clearedValue },
      attrs: {
        autofocus: "true", autocomplete: "off", placeholder: "What needs to be done?"
      }
    });
    // const enterPressed_ = keyup.filter(isEnterKey);

    // Just this plain object?
    // What about the vnode?
    return { 

      // ENTER key stream
      enterPressed: keyup.filter(isEnterKey), 

      // current input value: Behavior
      value: value_, 

      // stream of valid input values
      // (but we could have taken it directly from the input stream)
      enterTodoS: snapshot(value, enterPressed).filter(isValidValue) 

      // Question: Do we really need all values here, 
      // if we only take ones followed by the ENTER key?

    };
  }

).map(
  ({ enterTodoS }) => ({ enterTodoS })
);


