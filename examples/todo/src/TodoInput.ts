import {
  Stream, snapshot, changes, combine, Behavior, stepper, sample
} from "@funkia/hareactive";

import { elements, modelView } from "../../../src";
const { input, span } = elements;

const KEYCODE_ENTER = 13;
const isEnterKey = (ev: any) => ev.keyCode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

type Looped = {
  enterPressed: Stream<Event>,
  value: Behavior<string>
};

export type Out = {
  enterTodoS: Stream<string>
};

function* model({ enterPressed, value }) {
  const enterTodoS = snapshot(value, enterPressed).filter(isValidValue);
  const clearedValue = yield sample(stepper(
    "", combine(changes(value), enterPressed.mapTo(""))
  ));
  return { enterTodoS, clearedValue };
}

const view = ({ clearedValue }) => input({
  class: "new-todo",
  output: { keyup: "keyup", value: "inputValue" },
  props: { value: clearedValue },
  attrs: {
    autofocus: "true", autocomplete: "off", placeholder: "What needs to be done?"
  }
}).map((output) => ({ enterPressed: output.keyup.filter(isEnterKey), ...output }));

export default modelView(model, view)();
