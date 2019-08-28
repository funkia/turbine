import {
  Behavior,
  scan,
  Stream,
  combine,
  map,
  accum,
  shiftCurrent,
  empty,
  moment
} from "@funkia/hareactive";

import { list, elements, component } from "../../../src";
const { ul, li, p, br, button, h1 } = elements;

const add = (n: number, m: number) => n + m;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

// Counter

type Id = number;

type CounterModelInput = {
  delta: Stream<number>;
  deleteClick: Stream<any>;
};

type CounterOutput = {
  count: Behavior<number>;
  deleteS: Stream<Id>;
};

const counter = (id: Id) =>
  component<CounterModelInput, CounterOutput>((on, start) => {
    const deleteS = on.deleteClick.mapTo(id);
    const count = start(accum(add, 0, on.delta));

    return li([
      "Counter ",
      count,
      " ",
      button({ class: "btn btn-default" }, " + ").use((o) => ({
        delta: o.click.mapTo(1)
      })),
      " ",
      button({ class: "btn btn-default" }, " - ").use((o) => ({
        delta: o.click.mapTo(-1)
      })),
      " ",
      button({ class: "btn btn-default" }, "x").use({
        deleteClick: "click"
      })
    ]).output({ count, deleteS });
  });

type ToModel = {
  addCounter: Stream<Event>;
  listOut: Behavior<CounterOutput[]>;
};

const counterList = component<ToModel>((on, start) => {
  const removeIdB = on.listOut.map((l) =>
    l.length > 0 ? combine(...l.map((o) => o.deleteS)) : <Stream<number>>empty
  );
  const sum = moment((at) =>
    at(on.listOut)
      .map((t) => at(t.count))
      .reduce(add, 0)
  );
  const removeCounterIdFn = shiftCurrent(removeIdB).map(
    (id) => (arr: number[]) => arr.filter((i) => i !== id)
  );
  const nextId = start(scan(add, 2, on.addCounter.mapTo(1)));
  const appendCounterFn = map((id) => (ids: Id[]) => ids.concat([id]), nextId);
  const modifications = combine(appendCounterFn, removeCounterIdFn);
  const counterIds = start(accum(apply, [0, 1, 2], modifications));
  return [
    h1("Counters"),
    p(["Sum ", sum]),
    button({ class: "btn btn-primary" }, "Add counter").use({
      addCounter: "click"
    }),
    br,
    ul(
      list((n) => counter(n).use((o) => o), counterIds).use((o) => ({
        listOut: o
      }))
    )
  ];
});

export const main4 = counterList;
