import {go} from "jabz/monad";
import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
const {label, li, a} = elements;

const footer = e("footer.footer");
const strong = e("strong");
const formatRemainer = (value: number) => `${value} item${(value == 1)?"":"s"} left`;
const remainer = (remainingB: Behavior<number>) => e("span.todo-count", strong(remainingB.map(formatRemainer)))();
const filterItem = (name: string) => li(a(name));
const ul = e("ul.filters", function*() {
  yield filterItem("All");
  yield filterItem("Active");
  yield filterItem("Completed");
})();

const clearBtn = e("button.clear-completed", {
  streams: [
    ["click", "clickS", (evt) => 1]
  ]
})("Clear completed");

const length = (list: any[]) => list.length;
const isEmpty = (list: any[]) => list.length == 0;

type toView = {
  todosB: Behavior<any[]>
}

export function todoFooterView({todosB}: toView) {
  return footer({
    classToggle: {
      hidden: todosB.map(isEmpty)
    }
  }, function*() {
    yield remainer(todosB.map(length));
    yield ul;
    yield clearBtn;
    return {};
  });
}
