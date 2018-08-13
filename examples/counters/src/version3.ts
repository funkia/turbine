import {
  Behavior,
  combine,
  map,
  Now,
  sample,
  scan,
  scanS,
  Stream
} from "@funkia/hareactive";
import { elements, fgo, list, ModelReturn, modelView } from "../../../src";
const { br, div, button, h1, ul } = elements;

const add = (n: number, m: number) => n + m;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

type CounterViewInput = {
  count: Behavior<number>;
};

type CounterOutput = {
  count: Behavior<number>;
};

const counterModel = fgo(function*({
  incrementClick,
  decrementClick
}: CounterModelInput): ModelReturn<CounterViewInput> {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const count = yield sample(scan(add, 0, combine(increment, decrement)));
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

type ViewInput = {
  counterIds: Behavior<number[]>;
  sum: Behavior<number>;
};

type ModelInput = {
  addCounter: Stream<Event>;
  listOut: Behavior<CounterOutput[]>;
};

const counterListModel = fgo(function*({
  addCounter,
  listOut
}: ModelInput): Iterator<Now<any>> {
  const nextId: Stream<number> = yield sample(
    scanS(add, 2, addCounter.mapTo(1))
  );
  const appendCounterFn = map(
    (id) => (ids: number[]) => ids.concat([id]),
    nextId
  );
  const counterIds = yield sample(scan(apply, [0], appendCounterFn));
  return { counterIds };
});

const counterListView = ({ sum, counterIds }: ViewInput) => [
  h1("Counters"),
  button(
    { class: "btn btn-primary", output: { addCounter: "click" } },
    "Add counter"
  ),
  br,
  ul(list(counter, counterIds).output((o) => ({ listOut: o })))
];

const counterList = modelView(counterListModel, counterListView);

export const main3 = counterList();
