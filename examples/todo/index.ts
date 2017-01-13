import {sequence} from "jabz/traversable";
import {
  Behavior, scan,
  Now, sample,
  Stream, scanS, combine
} from "hareactive";
import {runMain, component, elements} from "../../src";
const {h1, p, header, footer, section} = elements;

import todoInput, {Out as InputOut} from "./src/TodoInput";
import todoList, {Params as ListParams, Out as ListOut} from "./src/TodoList";
import {Params as ItemParams} from "./src/Item";
import todoFooter, {Params as FooterParams} from "./src/TodoFooter";

const concat = <A>(a: A[], b: A[]): A[] => [].concat(a, b);
const apply = <A>(f: (a: A) => A, a: A) => f(a);

const toItemParams = (name: string, prev: ItemParams) => ({
  id: prev.id + 1,
  name
});

type FromView = ListOut & InputOut;

function* model({enterTodoS, toggleAll, deleteS}: FromView) {
  const newTodoS: Stream<ItemParams> = yield sample(scanS(toItemParams, {id: 0}, enterTodoS));
  const prependNewTodoS = newTodoS.map((todo) => (list: ItemParams[]) => concat([todo], list));
  const removeTodoS = deleteS.map((removeId) => (list: ItemParams[]) => list.filter(({id}) => id !== removeId));
  const modifications = combine(prependNewTodoS, removeTodoS);
  const todoNames: Behavior<ItemParams[]> = yield sample(scan(apply, [], modifications));
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
