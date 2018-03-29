import { combine, map } from "@funkia/jabz";
import {
  Component,
  elements,
  modelView,
  list,
  ModelReturn
} from "../../../src";
import {
  Now,
  Behavior,
  sample,
  scan,
  scanS,
  Stream,
  switchStream
} from "@funkia/hareactive";
const { br, div, button, h1, p, ul } = elements;

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

function* counterModel({
  incrementClick,
  decrementClick
}: CounterModelInput): ModelReturn<CounterViewInput> {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const count = yield sample(scan(add, 0, combine(increment, decrement)));
  return { count };
}

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

function* counterListModel({
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
}

function* counterListView({
  sum,
  counterIds
}: ViewInput): Iterator<Component<any>> {
  yield h1("Counters");
  const { click: addCounter } = yield button(
    { class: "btn btn-primary" },
    "Add counter"
  );
  yield br;
  const { listOut } = yield ul(
    list(counter, counterIds).output((o) => ({ listOut: o }))
  );
  return { addCounter, listOut };
}

const counterList = modelView(counterListModel, counterListView);

export const main3 = counterList();
