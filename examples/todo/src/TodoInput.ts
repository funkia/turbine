import {Behavior} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now} from "hareactive/now";

import {runMain, Component, component, e} from "../../../src";

const KEYCODE_ENTER = 13;
const isEnterKey = (keycode: number) => keycode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

type FromView = {
  checkAllS: Stream<any>,
  keyup: Stream<number>,
  inputValue: Behavior<string>
}

type Out = {
  checkAllS: Stream<any>,
  enterTodoS: Stream<string>
};

const input = e("input.new-todo[autofocus][autocomplete=off][placeholder=What needs to be done?]", {
  streams: [
    ["keyup", "keyup", (evt: any) => evt.keyCode]
  ],
  behaviors: [
    ["input", "inputValue", (evt: any) => evt.target.value, ""]
  ]
});

export const todoInput = component<{}, FromView, Out>(
  function model({keyup, inputValue}): Now<[{}, Out]> {
    const enterS = keyup.filter(isEnterKey);
    const enterTodoS = snapshot(inputValue, enterS).filter(isValidValue);
    return Now.of([{}, {enterTodoS}]);
  },
  function view() {
    return input();
  }
);
