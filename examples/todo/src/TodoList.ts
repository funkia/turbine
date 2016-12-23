import {Behavior, stepper, scan} from "hareactive/behavior";
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
const ul = e("ul.todo-list");
const li = e("li.todo");
const div = e("div.view");
const btn = e("button.destroy");

const concat = <A>(a: A[], b: A[]): A[] => [].concat(b, a);
const item = (taskName: string) => li(function*() {
  yield div(function*() {
    yield checkbox();
    yield label(taskName);
    yield btn();
  });
  return checkboxAll();
});
const arrayToLI = (list: string[]) => list.map(item);

type ToView = {
  todoS: Behavior<string[]>
};

export const todoList = (newItemsS: Stream<string>) => component<ToView, {}, {}>(
  function* model() {
    const todoS = yield sample(scan(concat, [], newItemsS));
    return [{todoS}, {}];
  },
  function view({todoS}: ToView) {
    return sectionMain(function* () {
      yield checkboxAll();
      return yield ul(dynamic(todoS.map(arrayToLI)));
    });
  }
);
