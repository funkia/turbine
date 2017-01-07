import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";
import {Item, item} from "./Item";

import {runMain, Component, component, dynamic, list, elements} from "../../../src";
const {div, li, input, label, ul, section, button, checkbox} = elements;

const isEmpty = (list: any[]) => list.length == 0;

type ToView = {
  todoNames: Behavior<string[]>
};

export default ({todoNames}: ToView) => section({
  class: "main",
  classToggle: {
    hidden: todoNames.map(isEmpty)
  }
}, function*() {
  yield checkbox({class: "toggle-all"});
  return yield ul({class: "todo-list"}, list(item, (a: any) => a, todoNames));
});
