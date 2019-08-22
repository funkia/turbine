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

import { list, elements, fgo, component } from "../../../src";
const { ul, li, p, br, button, h1 } = elements;

const add = (n: number, m: number) => n + m;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

// Counter

type Id = number;

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
  deleteClick: Stream<any>;
};

type CounterOutput = {
  count: Behavior<number>;
  deleteS: Stream<Id>;
};

const counter = (id: Id) =>
  component<CounterModelInput>(
    fgo(function*({ incrementClick, decrementClick, deleteClick }) {
      const increment = incrementClick.mapTo(1);
      const decrement = decrementClick.mapTo(-1);
      const deleteS = deleteClick.mapTo(id);
      const count = yield accum(add, 0, combine(increment, decrement));

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
      ]).result({ count, deleteS });
    })
  );

type ToModel = {
  addCounter: Stream<Event>;
  listOut: Behavior<CounterOutput[]>;
};

const counterList = component<ToModel>(
  fgo(function*({ addCounter, listOut }) {
    const removeIdB = listOut.map((l) =>
      l.length > 0 ? combine(...l.map((o) => o.deleteS)) : <Stream<number>>empty
    );
    const sum = moment((at) =>
      at(listOut)
        .map((t) => at(t.count))
        .reduce(add, 0)
    );
    const removeCounterIdFn = shiftCurrent(removeIdB).map(
      (id) => (arr: number[]) => arr.filter((i) => i !== id)
    );
    const nextId: Stream<number> = yield scan(add, 2, addCounter.mapTo(1));
    const appendCounterFn = map(
      (id) => (ids: Id[]) => ids.concat([id]),
      nextId
    );
    const modifications = combine(appendCounterFn, removeCounterIdFn);
    const counterIds: Behavior<number[]> = yield accum(
      apply,
      [0, 1, 2],
      modifications
    );
    return [
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
  })
);

export const main4 = counterList;
