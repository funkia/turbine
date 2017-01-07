import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, elements} from "../../../src";
const {div, li, input, label, ul, section, button, checkbox} = elements;

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

function itemView({taskName, isCompleteB: completed, isEditingB: editing}: Item) {
  return li({
    class: "todo",
    classToggle: {completed, editing}
  }, function*() {
    yield div({class: "view"}, function*() {
      const checked = yield checkbox({class: "toggle"});
      yield label(taskName);
      yield button({class: "destroy"});
      return {checked};
    });
    yield input({class: "edit"});
    return {};
  });
}

const arrayToLI = (list: Item[]) => list.map(itemView);

type ToView = {
  todosB: Behavior<Item[]>
};

export default ({todosB}: ToView) => section({
  class: "main",
  classToggle: {
    hidden: todosB.map(isEmpty)
  }
}, function*() {
  yield checkbox({class: "toggle-all"});
  return yield ul({class: "todo-list"}, dynamic(todosB.map(arrayToLI)));
});
