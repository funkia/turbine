import {
  Stream, snapshot, changes, combine,
  Behavior, stepper,
} from "hareactive";

import {loop} from "../../../src";
import {input} from "../../../src/elements";

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

export default loop<Looped & Out>(function*({enterPressed, value}: Looped) {
  const enterTodoS = snapshot(value, enterPressed).filter(isValidValue);
  const clearedValue = stepper(
    "", combine(changes(value), enterPressed.mapTo(""))
  );
  const {keyup, inputValue: value_} = yield input({
    class: "new-todo",
    props: {value: clearedValue},
    attribute: {
      autofocus: "true", autocomplete: "off", placeholder: "What needs to be done?"
    }
  });
  enterPressed = keyup.filter(isEnterKey);
  return {enterPressed, value: value_, enterTodoS};
}).map(({enterTodoS}) => ({enterTodoS}));
