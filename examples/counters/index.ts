import {foldr} from "jabz/foldable";
import {lift} from "jabz/applicative";
import {flatten} from "jabz/monad";
import {
  Now, sample, Behavior, stepper, scan, Stream, combine, map, combineList, switchStream, scanS
} from "hareactive";

import {Component, component, list, dynamic, text, runMain, elements} from "../../src";
const {span, input, ul, li, p, br, button, div, h1} = elements;

const add = (n: number, m: number) => n + m;
const append = <A>(a: A, as: A[]) => as.concat([a]);
const apply = <A>(f: (a: A) => A, a: A) => f(a);
const getter = (prop: string) => (obj: Object) => obj[prop];

// Counter

type Id = number;

type CounterModelOut = {
  count: Behavior<number>
};

type CounterViewOut = {
  incrementClick: Stream<any>,
  decrementClick: Stream<any>,
  deleteClick: Stream<any>
};

type CounterOut = {
  count: Behavior<number>,
  deleteS: Stream<Id>
};

const counter = (id: Id) => component<CounterModelOut, CounterViewOut, CounterOut> (
  function* counterModel({incrementClick, decrementClick, deleteClick}) {
    const increment = incrementClick.mapTo(1);
    const decrement = decrementClick.mapTo(-1);
    const deleteS = deleteClick.mapTo(id);
    const count = yield sample(scan(add, 0, combine(increment, decrement)));
    return [{count}, {count, deleteS}];
  },
  function counterView({count}) {
    return li([
      "Counter ",
      count,
      " ",
      button({name: {click: "incrementClick"}}, " + ", ),
      " ",
      button({name: {click: "decrementClick"}}, " - "),
      " ",
      button({name: {click: "deleteClick"}}, "x"),
      br
    ]);
  }
);

type ToView = {
  counterIds: Behavior<number[]>,
  sum: Behavior<number>
};

type ToModel = {
  addCounter: Stream<Event>,
  listOut: Behavior<CounterOut[]>
};

function* mainModel({addCounter, listOut}: ToModel): Iterator<Now<any>> {
  const removeIdB = listOut.map((l) => combineList(l.map(o => o.deleteS)));
  const sum = <Behavior<number>>flatten(map(
    (list) => foldr(({count}, sum) => lift(add, count, sum), Behavior.of(0), list),
    listOut
  ));
  const removeCounterIdFn =
    switchStream(removeIdB).map((id) => (arr: number[]) => arr.filter((i) => i !== id));
  const nextId: Stream<number> =
    yield sample(scanS(add, 2, addCounter.mapTo(1)));
  const appendCounterFn =
    map((id) => (ids: number[]) => ids.concat([id]), nextId);
  const modifications =
    combine(appendCounterFn, removeCounterIdFn);
  const counterIds =
    yield sample(scan(apply, [0,1,2], modifications));
  return [{counterIds, sum}, {}];
}

function* mainView({sum, counterIds}: ToView): Iterator<Component<any>> {
  yield h1("Counters");
  yield p(["Sum ", sum]);
  const {click: addCounter} = yield button("Add counter");
  yield br;
  yield br;
  const listOut = yield ul(list(counter, (n: number) => n, counterIds));
  return {addCounter, listOut};
}

const main = component<ToView, ToModel, {}>(mainModel, mainView);

runMain("body", main);
