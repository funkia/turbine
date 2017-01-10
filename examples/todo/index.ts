import {
  Behavior, scan,
  Now, sample,
  Stream
} from "hareactive";
import {runMain, component, e, elements} from "../../src";
const {h1, p, header, footer, section} = elements;

import {todoInput} from "./src/TodoInput";
import todoList from "./src/TodoList";
import {Item, toItem} from "./src/Item";
import {todoFooterView} from "./src/TodoFooter";

const concat = <A>(a: A[], b: A[]): A[] => [].concat(b, a);

type FromView = {
  enterTodoS: Stream<string>
};

function* model({enterTodoS}: FromView) {
  const todoNames = yield sample(scan(concat, [], enterTodoS));
  return [{todoNames}, {}];
}

type ToView = {
  todoNames: Behavior<string[]>;
};

function view({todoNames}: ToView) {
  return [
    section({class: "todoapp"}, [
      header({class: "header"}, [
	h1("todos"),
	todoInput
      ]),
      todoList({todoNames}),
      todoFooterView({todosB: todoNames})
    ]),
    footer({class: "info"}, [
      p("Double-click to edit a todo"),
      p("Written with Funnel"),
      p("Part of TodoMVC")
    ])
  ];
}

const app = component(model, view);

runMain("body", app);
