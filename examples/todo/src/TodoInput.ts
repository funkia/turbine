import {
  Stream,
  snapshot,
  changes,
  combine,
  Behavior,
  stepper,
  sample
} from "@funkia/hareactive";

import { elements, modelView, fgo } from "../../../src";
const { input } = elements;

const KEYCODE_ENTER = 13;
const isEnterKey = (ev: any) => ev.keyCode === KEYCODE_ENTER;
const isValidValue = (value: string) => value !== "";

type FromView = {
  enterPressed: Stream<Event>;
  value: Behavior<string>;
};

export type Out = {
  addItem: Stream<string>;
};

function* model({ enterPressed, value }: FromView) {
  const clearedValue: Behavior<string> = yield sample(
    stepper("", combine(enterPressed.mapTo(""), changes(value)))
  );
  const addItem = snapshot(clearedValue, enterPressed).filter(isValidValue);

  return { addItem, clearedValue };
}

const view = ({ clearedValue }) =>
  input({
    class: "new-todo",
    props: { value: clearedValue },
    attrs: {
      autofocus: "true",
      autocomplete: "off",
      placeholder: "What needs to be done?"
    }
  }).output((o) => ({
    value: o.value,
    enterPressed: o.keyup.filter(isEnterKey)
  }));

export default modelView(fgo(model), view)();
