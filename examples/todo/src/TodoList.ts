import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
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
const checkbox = e("input.toggle[type=checkbox]", {
  behaviors: [
    ["change", "checked", (evt) => {
      console.log(evt)
      return 1;
    }, 0]
  ]
});

const ul = e("ul.todo-list");
const btn = e("button.destroy");

const isEmpty = (list: any[]) => list.length == 0;

export type Item = {
  taskName: string,
  isCompleteB: Behavior<boolean>,
  isEditingB: Behavior<boolean>
};

export const toItem = (taskName: string): Item => ({
  taskName,
  isCompleteB: sink(false),
  isEditingB: sink(false)
});

function itemView({taskName, isCompleteB, isEditingB}: Item) {
  return li({
    class: "todo",
    classToggle: {completed: isCompleteB, editing: isEditingB}
  }, function*() {
    const {children} = yield div({class: "view"}, function*() {
      const checked = yield checkbox();
      yield label(taskName);
      yield btn();
      return {checked};
    });
    yield input({class: "edit"});
    return children;
  });
}

const arrayToLI = (list: Item[]) => list.map(itemView);

type ToView = {
  todosB: Behavior<Item[]>
};

export default ({todosB}: ToView) => sectionMain({
  classToggle: {
    hidden: todosB.map(isEmpty)
  }
}, function*() {
  yield checkboxAll();
  return yield ul(dynamic(todosB.map(arrayToLI)));
});
