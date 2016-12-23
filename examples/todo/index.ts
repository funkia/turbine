import {go} from "jabz/monad";
import {Now} from "hareactive/now";
import {Stream} from "hareactive/stream";
import {runMain, component, e, elements} from "../../src";
const {h1, p} = elements;

import {todoInput} from "./src/TodoInput";
import {todoList} from "./src/TodoList";
import {todoFooter} from "./src/TodoFooter";

const sectionTodoApp = e("section.todoapp");
const headerHeader = e("header.header");

const app = sectionTodoApp(function* () {
  const {children: {checkAllS, enterTodoS}} = yield headerHeader(function* () {
    yield h1("todos");
    return yield todoInput;
  });
  yield todoList(enterTodoS);
  yield todoFooter;
  return {checkAllS};
});
const footer = e("footer.info", function*() {
  yield p("Double-click to edit a todo");
  yield p("Written with Funnel");
  yield p("Part of TodoMVC");
});


runMain("body", app.chain(footer));
