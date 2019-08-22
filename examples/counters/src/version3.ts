import {
  Behavior,
  combine,
  map,
  accum,
  scan,
  Stream
} from "@funkia/hareactive";

import { elements, fgo, list, component } from "../../../src";
const { br, div, button, h1, ul } = elements;

const add = (n: number, m: number) => n + m;
const apply = <A, B>(f: (a: A) => B, a: A) => f(a);

type CounterModelInput = {
  incrementClick: Stream<any>;
  decrementClick: Stream<any>;
};

type CounterOutput = {
  count: Behavior<number>;
};

const counter = () =>
  component<CounterModelInput, CounterOutput>(
    fgo(function*(on) {
      const increment = on.incrementClick.mapTo(1);
      const decrement = on.decrementClick.mapTo(-1);
      const count = yield accum(add, 0, combine(increment, decrement));

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
      ]).result({ count });
    })
  );

type ListOn = {
  addCounter: Stream<Event>;
};

const counterList = component<ListOn>(
  fgo(function*({ addCounter }) {
    const nextId: Stream<number> = yield scan(add, 2, addCounter.mapTo(1));
    const appendCounterFn = map(
      (id) => (ids: number[]) => ids.concat([id]),
      nextId
    );
    const counterIds = yield accum<(a: number[]) => number[], number[]>(
      apply,
      [0],
      appendCounterFn
    );
    return [
      h1("Counters"),
      button({ class: "btn btn-primary" }, "Add counter").output({
        addCounter: "click"
      }),
      br,
      ul(list(counter, counterIds))
    ];
  })
);

export const main3 = counterList;
