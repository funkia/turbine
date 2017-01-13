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
  itemStuffList: Behavior<ItemOut[]>;
  checked: Behavior<boolean>;
};

export type Out = {
  deleteS: Stream<number>
  toggleAll: Behavior<boolean>
};

export type Params = {
  todoNames: Behavior<ItemParams[]>
};

export default ({todoNames}: Params) => component<ToView, FromView, Out>(
  function model({itemStuffList, checked}: FromView) {
    const deleteS = switchStream(itemStuffList.map((list) => combineList(list.map((a) => a.destroyItemId))))
    return Now.of([{}, {deleteS, toggleAll: checked}] as [ToView, Out]);
  },
  function view({}: ToView) {
    return section({
      class: "main",
      classToggle: {
	hidden: todoNames.map(isEmpty)
      }
    }, [
      checkbox({class: "toggle-all"}),
      ul({class: "todo-list"}, function* () {
	const itemStuffList = yield list(item, ({id}) => id.toString(), todoNames);
	return {itemStuffList};
      })
    ]);
  }
);
