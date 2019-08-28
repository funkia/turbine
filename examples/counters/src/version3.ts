import { Behavior, map, accum, scan, Stream } from "@funkia/hareactive";

import { elements as E, list, component } from "../../../src";

const add = (n: number, m: number) => n + m;
const apply = <A, B>(f: (a: A) => B, a: A) => f(a);

type CounterOn = {
  delta: Stream<number>;
};

type CounterOutput = {
  count: Behavior<number>;
};

const counter = () =>
  component<CounterOn, CounterOutput>((on, start) => {
    const count = start(accum(add, 0, on.delta));

    return E.li([
      "Counter ",
      count,
      " ",
      E.button({ class: "btn btn-default" }, " + ").use((o) => ({
        delta: o.click.mapTo(1)
      })),
      " ",
      E.button({ class: "btn btn-default" }, " - ").use((o) => ({
        delta: o.click.mapTo(-1)
      }))
    ]).output({ count });
  });

type ListOn = {
  addCounter: Stream<Event>;
};

const counterList = component<ListOn>(({ addCounter }, start) => {
  const nextId = start(scan(add, 2, addCounter.mapTo(1)));
  const appendCounterFn = map(
    (id) => (ids: number[]) => ids.concat([id]),
    nextId
  );
  const counterIds = start(accum(apply, [0], appendCounterFn));
  return [
    E.h1("Counters"),
    E.button({ class: "btn btn-primary" }, "Add counter").use({
      addCounter: "click"
    }),
    E.br,
    E.ul(list(counter, counterIds))
  ];
});

export const main3 = counterList;
