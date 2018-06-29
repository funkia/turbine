import { Behavior, sample, scan, Stream, combine } from "@funkia/hareactive";
import { elements, modelView, Component, fgo } from "../../../src";
const { br, div, button } = elements;

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

type CounterViewInput = {
  count: Behavior<number>;
};

const counterModel = fgo(function*({
  incrementClick,
  decrementClick
}: CounterModelInput) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const changes = combine(increment, decrement);
  const count = yield sample(scan((n, m) => n + m, 0, changes));
  return { count };
});

const counterView = ({ count }: CounterViewInput) =>
  div([
    "Counter ",
    count,
    " ",
    button(
      { class: "btn btn-default", output: { incrementClick: "click" } },
      " + "
    ),
    " ",
    button(
      { class: "btn btn-default", output: { decrementClick: "click" } },
      " - "
    )
  ]);

const counter = modelView(counterModel, counterView);

export const main2 = counter();
