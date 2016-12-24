import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
const {label} = elements;

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
const inputEdit = e("input.edit");
const ul = e("ul.todo-list");
const li = e("li.todo");
const div = e("div.view");
const btn = e("button.destroy");

const isEmpty = (list: any[]) => list.length == 0;

type ItemToView = {
  taskName: string,
  isCompleteB: Behavior<boolean>,
  isEditingB: Behavior<boolean>
};

function itemView({taskName, isCompleteB, isEditingB}: ItemToView) {
  return li({
    class: {
      completed: isCompleteB,
      editing: isEditingB
    }
  }, function*() {
    const {children} = yield div(function*() {
      const checked = yield checkbox();
      yield label(taskName);
      yield btn();
      return {checked};
    });
    yield inputEdit();
    return children;
  });
}

const arrayToLI = (list: string[]) => list.map((taskName) => itemView({
  taskName,
  isCompleteB: sink(false),
  isEditingB: sink(false)
}));

type ToView = {
  todosB: Behavior<string[]>
};

export default ({todosB}: ToView) => sectionMain({
  class: {
    hidden: todosB.map(isEmpty)
  }
}, function*() {
  yield checkboxAll();
  return yield ul(dynamic(todosB.map(arrayToLI)));
});
