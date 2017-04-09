import {foldr, lift, flatten} from "@funkia/jabz";
import {
  Now, sample, Behavior, scan, Stream, combine, map, combineList, switchStream, scanS
} from "@funkia/hareactive";

import {Component, modelView, list, runComponent, elements} from "../../src";
const {ul, li, p, br, button, h1} = elements;

const add = (n: number, m: number) => n + m;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

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

const counter = (id: Id) => modelView<CounterModelOut, CounterViewOut, CounterOut> (
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
      button({output: {incrementClick: "click"}}, " + "),
      " ",
      button({output: {decrementClick: "click"}}, " - "),
      " ",
      button({output: {deleteClick: "click"}}, "x"),
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

const main = modelView<ToView, ToModel, {}>(mainModel, mainView);

runComponent("body", main);
