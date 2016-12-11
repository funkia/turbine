import {Behavior, stepper} from "hareactive/behavior";
import {Stream, snapshot} from "hareactive/stream";
import {Now} from "hareactive/now";
import {sequence_} from "jabz/foldable";

import {Component, component, runMain, list, e, text, dynamic, elements} from "../../src";
const {span, button, br, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const getLength = (s: string) => s.length;

// The behaviors that the model exposes to the view. This must be an
// object of behaviors. The `model` function below must return this
// object, the `view` function then receives it as its argument.
type ToView = {
  validB: Behavior<boolean>,
  lengthB: Behavior<number>
};

// Types representing the behaviors and streams that the view create.
// These are passed into the `model` function.
type ViewOut = {
  emailB: Behavior<string>,
  calcLength: Stream<Event>
};

// The code below creates a `Component` from a `model` function and a
// `view` function. `component` hooks these up in a feedback loop so
// that `model` and `view` are circularly dependent.
const main = component<ToView, ViewOut, {}>(
  function* model({emailB, calcLength}): Iterator<Now<any>> {
    const validB = emailB.map(isValidEmail);
    // Whenever `calcLength` occurs we snapshots the value of `emailB`
    // and gets its length with `getLength`
    const lengthUpdate = snapshot(emailB, calcLength).map(getLength);
    const lengthB = stepper(0, lengthUpdate);
    return Now.of([{validB, lengthB}, {}]);
  },
  function* view({validB, lengthB}): Iterator<Component<any>> {
    yield span("Please enter an email address: ");
    const {inputValue: emailB} = yield input();
    yield div([``
      text("The address is "),
      dynamic(validB.map(t => t ? "valid" : "invalid"))
    ]);
    const {click: calcLength} = yield button("Calculate length");
    yield div(["The length of the email is ", dynamic(lengthB)]);
    return Component.of({emailB, calcLength});
  }
);

// `runMain` should be the only impure function in application code
runMain("#mount", main);
