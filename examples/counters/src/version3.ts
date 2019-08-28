import { Behavior, map, accum, scan, Stream } from "@funkia/hareactive";

import { elements, list, component } from "../../../src";
const { br, li, button, h1, ul } = elements;

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
    h1("Counters"),
    button({ class: "btn btn-primary" }, "Add counter").use({
      addCounter: "click"
    }),
    br,
    ul(list(counter, counterIds))
  ];
});

export const main3 = counterList;
