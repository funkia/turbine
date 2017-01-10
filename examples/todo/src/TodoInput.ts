import {
  Stream, snapshot, filter, changes, combine,
  Behavior, stepper,
  Now
} from "hareactive";
import {Properties} from "../../../src/dom-builder";

import {runMain, Component, component, e} from "../../../src";
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

type Out = {
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
      autofocus: "true", autocomplete: "off", placeholder: "What needs to bo done?"
    }
  });
}

export const todoInput = component<ToView, FromView, Out>(model, view);
