import {go} from "jabz/monad";
import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
const {label, li, a} = elements;

const footer = e("footer.footer");
const strong = e("strong");
const formatRemainer = (value: number) => `${value} item${(value == 1)?"":"s"} left`;
const remainer = (remainingB: Behavior<number>) => e("span.todo-count")(strong(remainingB.map(formatRemainer)));
const filterItem = (name: string) => li(a(name));
const ul = e("ul.filters")(function*() {
  yield filterItem("All");
  yield filterItem("Active");
  yield filterItem("Completed");
});
const clearBtn = e("button.clear-completed")("Clear completed");


export const todoFooter = go(function*() {
  const {children} = yield footer(function*() {
    yield remainer(sink(2));
    yield ul;
    yield clearBtn;
    return {};
  });
  return children
});
