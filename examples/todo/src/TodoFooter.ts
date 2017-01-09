import {Behavior} from "hareactive/behavior";
import {Component, dynamic, elements} from "../../../src";
const {span, button, label, ul, li, a, footer, strong} = elements;

import {Item} from "./Item";

const length = (list: any[]) => list.length;
const isEmpty = (list: any[]) => list.length == 0;

type toView = {
  todosB: Behavior<string[]>
};

const formatRemainer = (value: number) => ` item${(value == 1)?"":"s"} left`;
const filterItem = (name: string) => li(a(name));

export function todoFooterView({todosB}: toView) {
  const hidden = todosB.map(isEmpty);
  const lengthB = todosB.map(length);
  return footer({
    class: "footer", classToggle: {hidden}
  }, function*() {
    yield span({class: "todo-count"}, [strong(lengthB), lengthB.map(formatRemainer)]);
    yield ul({class: "filters"}, function*() {
      yield filterItem("All");
      yield filterItem("Active");
      yield filterItem("Completed");
    });
    const {click} = yield button({class: "clear-completed"}, "Clear completed");
    return {};
  });
}
