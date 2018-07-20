import { fgo, combine, F1 } from "@funkia/jabz";
import { sample, scan, Stream, Behavior } from "@funkia/hareactive";
import { createElement, modelView } from "../../../src";

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

type CounterViewInput = {
  count: Behavior<number>;
};

const model = fgo(function*({
  incrementClick,
  decrementClick
}: CounterModelInput) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const changes = combine(increment, decrement);
  const count: number = yield sample(scan((n, m) => n + m, 0, changes));
  return { count };
});

const view = ({ count }: CounterViewInput) => (
  <div>
    Counter {count}
    <button output={{ incrementClick: "click" }}>+</button>
    <button output={{ decrementClick: "click" }}>-</button>
  </div>
);

const main = modelView<CounterViewInput, CounterModelInput>(model, view)();
export default main;
