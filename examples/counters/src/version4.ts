import { foldr, lift, flatten } from "@funkia/jabz";
import {
  Now,
  sample,
  Behavior,
  scan,
  Stream,
  combine,
  map,
  switchStream,
  scanS
} from "@funkia/hareactive";

import { Component, modelView, list, elements, fgo } from "../../../src";
const { ul, li, p, br, button, h1 } = elements;

const add = (n: number, m: number) => n + m;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

// Counter

type Id = number;

type CounterModelOut = {
  count: Behavior<number>;
};

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
  deleteClick: Stream<any>;
};

type CounterOutput = {
  count: Behavior<number>;
  deleteS: Stream<Id>;
};

const counterModel = fgo(function*(
  { incrementClick, decrementClick, deleteClick }: CounterModelInput,
  id: Id
) {
  const increment = incrementClick.mapTo(1);
  const decrement = decrementClick.mapTo(-1);
  const deleteS = deleteClick.mapTo(id);
  const count = yield sample(scan(add, 0, combine(increment, decrement)));
  return { count, deleteS };
});

function counterView({ count }: CounterModelOut) {
  return li([
    "Counter ",
    count,
    " ",
    button({ class: "btn btn-default" }, " + ").output({
      incrementClick: "click"
    }),
    " ",
    button({ class: "btn btn-default" }, " - ").output({
      decrementClick: "click"
    }),
    " ",
    button({ class: "btn btn-default" }, "x").output({
      deleteClick: "click"
    })
  ]);
}

const counter = modelView(counterModel, counterView);

type ToView = {
  counterIds: Behavior<number[]>;
  sum: Behavior<number>;
};

type ToModel = {
  addCounter: Stream<Event>;
  listOut: Behavior<CounterOutput[]>;
};

const mainModel = fgo(function*({
  addCounter,
  listOut
}: ToModel): Iterator<Now<any>> {
  const removeIdB = listOut.map(
    (l) => console.log(l) || combine(...l.map((o) => o.deleteS))
  );
  const sum = <Behavior<number>>(
    flatten(
      map(
        (list) =>
          foldr(
            ({ count }, sum) => lift(add, count, sum),
            Behavior.of(0),
            list
          ),
        listOut
      )
    )
  );
  const removeCounterIdFn = switchStream(removeIdB).map(
    (id) => (arr: number[]) => arr.filter((i) => i !== id)
  );
  const nextId: Stream<number> = yield sample(
    scanS(add, 2, addCounter.mapTo(1))
  );
  const appendCounterFn = map((id) => (ids: Id[]) => ids.concat([id]), nextId);
  const modifications = combine(appendCounterFn, removeCounterIdFn);
  const counterIds = yield sample(scan(apply, [0, 1, 2], modifications));
  return { counterIds, sum };
});

const counterListView = ({ sum, counterIds }: ToView) => [
  h1("Counters"),
  p(["Sum ", sum]),
  button({ class: "btn btn-primary" }, "Add counter").output({
    addCounter: "click"
  }),
  br,
  ul(
    list((n) => counter(n).output((o) => o), counterIds).output((o) => ({
      listOut: o
    }))
  )
];

export const counterList = modelView<ToView, ToModel>(
  mainModel,
  counterListView
)();
