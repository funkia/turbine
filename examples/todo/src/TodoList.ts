import {
  Behavior, stepper, scan, sink,
  Stream, snapshot, filter, combineList, switchStream,
  Now, sample
} from "hareactive";
import item, {Item, Out as ItemOut, Params as ItemParams} from "./Item";

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

export default ({todoNames}: Params) => component<ToView, FromView, Out>(
  function todoListModel({itemOutputs, checked}: FromView) {
    const deleteS = switchStream(itemOutputs.map((list) => combineList(list.map((a) => a.destroyItemId))))
    return Now.of([
      {}, {deleteS, toggleAll: checked, itemOutputs}
    ] as [ToView, Out]);
  },
  function todoListView({}: ToView) {
    return section({
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
  }
);
