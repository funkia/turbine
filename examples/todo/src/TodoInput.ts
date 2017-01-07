import {Behavior, stepper} from "hareactive/behavior";
import {Stream, snapshot, filter, changes, merge} from "hareactive/stream";
import {Now} from "hareactive/now";
import {Properties} from "../../../src/dom-builder";

import {runMain, Component, component, e} from "../../../src";
import {input} from "../../../src/elements";

const KEYCODE_ENTER = 13;
const isEnterKey = (ev: any) => ev.keyCode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

type FromView = {
  checkAllS: Stream<any>,
  keyup: Stream<Event>,
  inputValue: Behavior<string>
};

type ToView = {
  clearedValue: Behavior<string>
};

type Out = {
  checkAllS: Stream<any>,
  enterTodoS: Stream<string>
};

export const todoInput = component<ToView, FromView, Out>(
  ({keyup, inputValue}) => {
    const enterPressed = keyup.filter(isEnterKey);
    const enterTodoS = snapshot(inputValue, enterPressed).filter(isValidValue);
    const clearedValue = stepper(
      "", merge(changes(inputValue), enterPressed.mapTo(""))
    );
    return Now.of([{clearedValue}, {enterTodoS}]);
  },
  ({clearedValue}: ToView) =>
    input({
      class: "new-todo",
      props: {value: clearedValue},
      attribute: {
        autofocus: "true", autocomplete: "off", placeholder: "What needs to bo done?"
      }
    })
);
