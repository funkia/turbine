import { accum, Stream, combine } from "@funkia/hareactive";
import { elements, component } from "../../../src";
const { div, button } = elements;

type On = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

const counter = component<On>((on, start) => {
  const increment = on.incrementClick.mapTo(1);
  const decrement = on.decrementClick.mapTo(-1);
  const changes = combine(increment, decrement);
  const count = start(accum((n, m) => n + m, 0, changes));

  return div([
    "Counter ",
    count,
    " ",
    button({ class: "btn btn-default" }, " + ").use({
      incrementClick: "click"
    }),
    " ",
    button({ class: "btn btn-default" }, " - ").use({
      decrementClick: "click"
    })
  ]);
});

export const main2 = counter;
