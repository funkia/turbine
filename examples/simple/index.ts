import {go} from "jabz/monad";
import {Behavior, stepper} from "hareactive/Behavior";
import {Stream, snapshot} from "hareactive/Stream";
import {Now} from "hareactive/Now";

import {Component, component, runMain, list, e, elements} from "../../src";
const {text, span, button, br, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const getLength = (s: string) => s.length;

// The behaviors that the model exposes to the view. This must be an
// array of behaviors. The `model` function below must return this
// array, the `view` function then receives it as its argument.
type ToView = [Behavior<boolean>, Behavior<number>];

// Types representing the behaviors and streams that the view create.
// These are passed into the `model` function.
type ViewOut = {
  emailB: Behavior<string>,
  calcLength: Stream<Event>
};

// The code below creates a `Component` from a `model` function and a
// `view` function. `component` hooks these up in a feedback loop so
// that `model` and `view` are circularly dependent.
const main = component<ToView, ViewOut, {}>({
  model: ({emailB, calcLength}) => go(function*(): Iterator<Now<any>> {
    const validB = emailB.map(isValidEmail);
    // Whenever `calcLength` occurs we snapshots the value of `emailB`
    // and gets its length with `getLength`
    const lengthUpdate = snapshot(emailB, calcLength).map(getLength);
    const lengthB = stepper(0, lengthUpdate);
    return Now.of([[validB, lengthB], {}]);
  }),
  view: ([validB, lengthB]) => go(function*(): Iterator<Component<any>> {
    yield span("Please enter an email address: ");
    const {inputValue: emailB} = yield input();
    yield br();
    yield text("The address is ");
    yield text(validB.map(t => t ? "valid" : "invalid"));
    yield br();
    const {click: calcLength} = yield button("Calculate length");
    yield span(" The length of the email is ");
    yield text(lengthB);
    return Component.of({emailB, calcLength});
  }),
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
