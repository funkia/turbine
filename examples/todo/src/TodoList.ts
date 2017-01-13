import {
  Behavior, stepper, scan, sink,
  Stream, snapshot, filter, combineList, switchStream,
  Now, sample
} from "hareactive";
import item, {Item, Out as ItemOut, Params as ItemParams} from "./Item";

import {get} from "../../../src/utils";
import {Component, list, elements, component} from "../../../src";
const {ul, checkbox, section} = elements;

const isEmpty = (list: any[]) => list.length == 0;

type ToView = {};

type FromView = {
  itemOutputs: Behavior<ItemOut[]>;
  checked: Behavior<boolean>;
};

export type Out = {
  deleteS: Stream<number>,
  toggleAll: Behavior<boolean>,
  itemOutputs: Behavior<ItemOut[]>
};

export type Params = {
  todoNames: Behavior<ItemParams[]>
};

const model = () => ({itemOutputs, checked}: FromView) => {
  const deleteS = switchStream(itemOutputs.map((list) => combineList(list.map(get("destroyItemId")))));
  return Now.of([
    {}, {deleteS, toggleAll: checked, itemOutputs}
  ] as [ToView, Out]);
}

const view = ({todoNames}: Params) => ({}: ToView) => section({
  class: "main",
  classToggle: {
    hidden: todoNames.map(isEmpty)
  }
}, [
  checkbox({class: "toggle-all"}),
  ul({class: "todo-list"}, function*() {
    const itemOutputs = yield list(item, ({id}) => id.toString(), todoNames);
    return {itemOutputs};
  })
]);


export default (p: Params) => component<ToView, FromView, Out>(model(), view(p));
