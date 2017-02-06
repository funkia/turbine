import {
  Stream, snapshot, changes, combine,
  Behavior, stepper,
  Now
} from "hareactive";
import {Properties} from "../../../src/dom-builder";

import {component} from "../../../src";
import {input} from "../../../src/elements";

const KEYCODE_ENTER = 13;
const isEnterKey = (ev: any) => ev.keyCode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

type FromView = {
  keyup: Stream<Event>,
  inputValue: Behavior<string>
};

type ToView = {
  clearedValue: Behavior<string>
};

export type Out = {
  enterTodoS: Stream<string>
};

function model({keyup, inputValue}: FromView) {
  const enterPressed = keyup.filter(isEnterKey);
  const enterTodoS = snapshot(inputValue, enterPressed).filter(isValidValue);
  const clearedValue = stepper(
    "", combine(changes(inputValue), enterPressed.mapTo(""))
  );
  return Now.of([{clearedValue}, {enterTodoS}] as [ToView, Out]);
}

function view({clearedValue}: ToView) {
  return input({
    class: "new-todo",
    props: {value: clearedValue},
    attribute: {
      autofocus: "true", autocomplete: "off", placeholder: "What needs to be done?"
    }
  });
}

export default component<ToView, FromView, Out>(model, view);
