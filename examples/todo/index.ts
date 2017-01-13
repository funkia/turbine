import {sequence} from "jabz/traversable";
import {
  Behavior, scan,
  Now, sample,
  Stream, scanS
} from "hareactive";
import {runMain, component, elements} from "../../src";
const {h1, p, header, footer, section} = elements;

import todoInput, {Out as InputOut} from "./src/TodoInput";
import todoList, {Params as ListParams, Out as ListOut} from "./src/TodoList";
import {Params as ItemParams} from "./src/Item";
import todoFooter, {Params as FooterParams} from "./src/TodoFooter";

const concat = <A>(a: A[], b: A[]): A[] => [].concat(b, a);

const toItemParams = (name: string, items: ItemParams[]) => concat(items, [{
  id: items[0] == undefined ? 0 : items[0].id + 1,
  name
}]);

type FromView = ListOut & InputOut;

function* model({enterTodoS, toggleAll, deleteS}: FromView) {
  const todoNames: Behavior<any> = yield sample(scan(toItemParams, [], enterTodoS));
  return [{todoNames}, {}];
}

type ToView = ListParams & FooterParams;

function view({todoNames}: ToView) {
  return [
    section({class: "todoapp"}, [
      header({class: "header"}, [
	h1("todos"),
	todoInput
      ]),
      todoList({todoNames}),
      todoFooter({todosB: todoNames})
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
