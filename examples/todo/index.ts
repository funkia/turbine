import {Behavior, scan} from "hareactive/behavior";
import {Now, sample} from "hareactive/now";
import {Stream, snapshot} from "hareactive/stream";
import {runMain, component, e, elements} from "../../src";
const {h1, p} = elements;

import {todoInput} from "./src/TodoInput";
import todoList from "./src/TodoList";
import {todoFooterView} from "./src/TodoFooter";

const sectionTodoApp = e("section.todoapp");
const headerHeader = e("header.header");
const concat = <A>(a: A[], b: A[]): A[] => [].concat(b, a);

const footer = e("footer.info", function*() {
  yield p("Double-click to edit a todo");
  yield p("Written with Funnel");
  yield p("Part of TodoMVC");
});

type FromView = {
  enterTodoS: Stream<string>
};

function* model({enterTodoS}: FromView) {
  const todosB = yield sample(scan(concat, [], enterTodoS));
  return [{todosB}, {}];
}

type ToView = {
  todosB: Behavior<string[]>
};

function* view({todosB}: ToView) {
  const {children} = yield sectionTodoApp(function* () {
    const {children: {checkAllS, enterTodoS}} = yield headerHeader(function* () {
      yield h1("todos");
      return yield todoInput;
    });
    yield todoList({todosB});
    yield todoFooterView({todosB});
    return {checkAllS, enterTodoS};
  });
  yield footer();
  return children;
}

const app = component(model, view);




runMain("body", app);
