import { Behavior, accum, Stream, combine } from "@funkia/hareactive";
import { elements, fgo, component } from "../../../src";
const { div, button } = elements;

type On = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

const counter = component<On>(
  fgo(function*({ incrementClick, decrementClick }) {
    const increment = incrementClick.mapTo(1);
    const decrement = decrementClick.mapTo(-1);
    const changes = combine(increment, decrement);
    const count = yield accum((n, m) => n + m, 0, changes);

    return div([
      "Counter ",
      count,
      " ",
      button({ class: "btn btn-default" }, " + ").output({
        incrementClick: "click"
      }),
      " ",
      button({ class: "btn btn-default" }, " - ").output({
        decrementClick: "click"
      })
    ]);
  })
);

export const main2 = counter;
