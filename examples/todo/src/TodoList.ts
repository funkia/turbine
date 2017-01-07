import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";
import {Item, itemView, item} from "./Item";

import {runMain, Component, component, dynamic, list, e, elements} from "../../../src";
const {div, li, input, label} = elements;

const sectionMain = e("section.main");
const checkboxAll = e("input.toggle-all[type=checkbox]", {
  behaviors: [
    ["change", "checked", (evt) => {
      console.log(evt)
      return 1;
    }, 0]
  ]
});

const ul = e("ul.todo-list");

const isEmpty = (list: any[]) => list.length == 0;

const arrayToLI = (list: Item[]) => list.map(itemView);

type ToView = {
  todosB: Behavior<Item[]>,
  todoNames: Behavior<string[]>
};

export default ({todosB, todoNames}: ToView) => sectionMain({
  classToggle: {
    hidden: todosB.map(isEmpty)
  }
}, function*() {
  yield checkboxAll();
  return yield ul(list(item, (a: any) => a, todoNames));
});
