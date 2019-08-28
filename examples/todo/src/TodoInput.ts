import * as H from "@funkia/hareactive";

import { component, elements as E } from "../../../src";

const KEYCODE_ENTER = 13;

type On = {
  clear: H.Stream<unknown>;
  value: H.Behavior<string>;
};

export type Out = {
  addItem: H.Stream<string>;
};

export default component<On, Out>((on) => {
  const addItem = H.snapshot(on.value, on.clear).filter((desc) => desc !== "");

  return E.input({
    class: "new-todo",
    value: on.clear.mapTo(""),
    autofocus: "true",
    autocomplete: "off",
    placeholder: "What needs to be done?"
  })
    .use((o) => ({
      value: o.value,
      clear: o.keyup.filter((ev) => ev.keyCode === KEYCODE_ENTER)
    }))
    .output({ addItem });
});
