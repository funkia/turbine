import * as B from "hareactive/behavior";
import {Behavior, stepper, scan} from "hareactive/behavior";
import {
  Stream, merge, map, mergeList, switchStream, scanS
} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {Component, component, list, dynamic, text, runMain, elements} from "../../";
const {span, input, br, button, div, h1} = elements;

const add = (n: number, m: number) => n + m;
const append = <A>(a: A, as: A[]) => as.concat([a]);
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

const counter = (id: Id) => component<CounterModelOut, CounterViewOut, CounterOut> (
  function* counterModel({incrementClick, decrementClick, deleteClick}) {
    const increment = incrementClick.mapTo(1);
    const decrement = decrementClick.mapTo(-1);
    const deleteS = deleteClick.mapTo(id);
    const count = yield sample(scan(add, 0, merge(increment, decrement)));
    return [{count}, {count, deleteS}];
  },
  function* counterView({count}) {
    const {children: divStreams} = yield div(function*() {
      yield text("Counter ");
      yield dynamic(count);
      yield text(" ");
      const {click: incrementClick} = yield button(" + ");
      yield text(" ");
      const {click: decrementClick} = yield button(" - ");
      yield text(" ");
      const {click: deleteClick} = yield button("x");
      yield br;
      return {incrementClick, decrementClick, deleteClick};
    });
    return divStreams;
  }
);

type ToView = {
  counterIds: Behavior<number[]>
};

type ToModel = {
  addCounter: Stream<Event>,
  listOut: Behavior<CounterOut[]>
};

function* mainModel({addCounter, listOut}: ToModel): Iterator<Now<any>> {
  const removeIdB = listOut.map((l) => mergeList(l.map(o => o.deleteS)));
  const removeCounterIdFn =
    switchStream(removeIdB).map(id => arr => arr.filter(i => i !== id));
  const nextId: Stream<number> =
    yield sample(scanS(add, 2, addCounter.mapTo(1)));
  const appendCounterFn =
    map((id) => (ids: number[]) => ids.concat([id]), nextId);
  const modifications =
    merge(appendCounterFn, removeCounterIdFn);
  const counterIds =
    yield sample(scan(apply, [0,1,2], modifications));
  return [{counterIds}, {}];
}

function* mainView({counterIds}: ToView): Iterator<Component<any>> {
  yield h1("Counters");
  const {click: addCounter} = yield button("Add counter")
  yield br;
  yield br;
  const listOut = yield list(counter, (n: number) => n, counterIds);
  return {addCounter, listOut};
}

const main = component<ToView, ToModel, {}>(mainModel, mainView);

runMain("body", main);
