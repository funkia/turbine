import {Behavior, stepper} from "hareactive/behavior";
import {Stream, snapshot} from "hareactive/stream";
import {Now} from "hareactive/now";

import {Component, component, runMain, elements, loop} from "../../src";
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
  function model({emailB, calcLength}): Now<any> {
    const validB = emailB.map(isValidEmail);
    // Whenever `calcLength` occurs we snapshots the value of `emailB`
    // and gets its length with `getLength`
    const lengthUpdate = snapshot(emailB, calcLength).map(getLength);
    const lengthB = stepper(0, lengthUpdate);
    return Now.of([{validB, lengthB}, {}]);
  },
  function view({validB, lengthB}) {
    return [
      span("Please enter an email address: "),
      input({name: {inputValue: "emailB"}}),
      div([
        "The address is ",
        validB.map(t => t ? "valid" : "invalid")
      ]),
      button({name: {click: "calcLength"}}, "Calculate length"),
      div([
        "The length of the email is ", lengthB
      ])
    ];
  }
);

// `runMain` should be the only impure function in application code
runMain("#mount", main);
