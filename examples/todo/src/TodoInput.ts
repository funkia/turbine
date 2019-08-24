import * as H from "@funkia/hareactive";

import { elements, fgo, component } from "../../../src";
const { input } = elements;

const KEYCODE_ENTER = 13;

type FromView = {
  enterPressed: H.Stream<Event>;
  value: H.Behavior<string>;
};

export type Out = {
  addItem: H.Stream<string>;
};

export default component<FromView, Out>(
  fgo(function*(on) {
    const clearedValue: H.Behavior<string> = yield H.stepper(
      "",
      H.combine(on.enterPressed.mapTo(""), H.changes(on.value))
    );
    const addItem = H.snapshot(clearedValue, on.enterPressed).filter(
      (title) => title !== ""
    );

    return input({
      class: "new-todo",
      value: clearedValue,
      autofocus: "true",
      autocomplete: "off",
      placeholder: "What needs to be done?"
    })
      .output((o) => ({
        value: o.value,
        enterPressed: o.keyup.filter((ev) => ev.keyCode === KEYCODE_ENTER)
      }))
      .result({ addItem });
  })
);
