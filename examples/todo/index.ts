import {Behavior, scan, sink} from "hareactive/behavior";
import {Now, sample} from "hareactive/now";
import {Stream, snapshot} from "hareactive/stream";
import {runMain, component, e, elements} from "../../src";
const {h1, p, header, footer} = elements;

import {todoInput} from "./src/TodoInput";
import todoList from "./src/TodoList";
import {Item, toItem} from "./src/Item";
import {todoFooterView} from "./src/TodoFooter";

const concat = <A>(a: A[], b: A[]): A[] => [].concat(b, a);

const sectionTodoApp = e("section.todoapp");
const headerHeader = e("header.header");

const todoFooter = footer({class: "info"}, [
  p("Double-click to edit a todo"),
  p("Written with Funnel"),
  p("Part of TodoMVC")
]);

type FromView = {
  enterTodoS: Stream<string>
};

function* model({enterTodoS}: FromView) {
  const todoNames = yield sample(scan(concat, [], enterTodoS));
  const todoItemListB: Behavior<Item[]> = todoNames.map((list: string[]) => list.map(toItem));

  return [{todoNames, todoItemListB}, {}];
}

type ToView = {
  todoItemListB: Behavior<Item[]>,
  todoNames: Behavior<string[]>
};

function* view({todoItemListB, todoNames}: ToView) {
  const {children} = yield sectionTodoApp(function* () {
    const {checkAllS, enterTodoS} = yield header({class: "header"}, function* () {
      yield h1("todos");
      return yield todoInput;
    });
    yield todoList({todosB: todoItemListB, todoNames});
    yield todoFooterView({todosB: todoItemListB});
    return {checkAllS, enterTodoS};
  });
  yield todoFooter;
  return children;
}

const app = component(model, view);




runMain("body", app);
