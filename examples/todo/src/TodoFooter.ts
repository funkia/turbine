import {go} from "jabz/monad";
import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
const {span, button, label, ul, li, a, footer} = elements;

import {Item} from "./Item";

const strong = e("strong");
const formatRemainer = (value: number) => `${value} item${(value == 1)?"":"s"} left`;

const filterItem = (name: string) => li(a(name));

const length = (list: any[]) => list.length;
const isEmpty = (list: any[]) => list.length == 0;

type toView = {
  todosB: Behavior<string[]>
};

export function todoFooterView({todosB}: toView) {
  const hidden = todosB.map(isEmpty);
  return footer({
    class: "footer", classToggle: {hidden}
  }, function*() {
    yield span({class: "todo-count"}, strong(todosB.map(length).map(formatRemainer)));
    yield ul({class: "filters"}, function*() {
      yield filterItem("All");
      yield filterItem("Active");
      yield filterItem("Completed");
    });
    const {click} = yield button({class: "clear-completed"}, "Clear completed");
    return {};
  });
}
