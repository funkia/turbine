import {sequence, combine} from "jabz";
import {
  Behavior, scan,
  Now, sample,
  Stream, scanS, switchStream, combineList
} from "hareactive";
import {runMain, component, elements, list} from "../../src";
const {h1, p, header, footer, section, checkbox, ul} = elements;
import {get} from "../../src/utils";

import todoInput, {Out as InputOut} from "./src/TodoInput";
import item, {Item, Out as ItemOut, Params as ItemParams} from "./src/Item";
import todoFooter, {Params as FooterParams} from "./src/TodoFooter";

const isEmpty = (list: any[]) => list.length == 0;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

const toItemParams = (name: string, prev: ItemParams) => ({
  id: prev.id + 1,
  name
});

type FromView = {
  toggleAll: Behavior<boolean>,
  itemOutputs: Behavior<ItemOut[]>,
  clearCompleted: Stream<{}>
} & InputOut;

type ToView = {
  todoNames: Behavior<ItemParams[]>,
  itemOutputs: Behavior<ItemOut[]>,
} & FooterParams;

function* model({enterTodoS, toggleAll, clearCompleted, itemOutputs}: FromView) {
  const newTodoS: Stream<ItemParams> = yield sample(scanS(toItemParams, {id: 0}, enterTodoS));
  const deleteS = switchStream(itemOutputs.map((list) => combineList(list.map(get("destroyItemId")))));
  const prependNewTodoS = newTodoS.map((todo) => (list: ItemParams[]) => combine([todo], list));
  const removeTodoS = deleteS.map((removeId) => (list: ItemParams[]) => list.filter(({id}) => id !== removeId));
  const modifications = combine(prependNewTodoS, removeTodoS);
  const todoNames: Behavior<ItemParams[]> = yield sample(scan(apply, [], modifications));
  return [{itemOutputs, todoNames, clearAll: clearCompleted}, {}];
}

function view({itemOutputs, todoNames}: ToView) {
  return [
    section({class: "todoapp"}, [
      header({class: "header"}, [
	h1("todos"),
	todoInput
      ]),
      section({
        class: "main",
        classToggle: {hidden: todoNames.map(isEmpty)}
      }, [
        checkbox({class: "toggle-all", name: {checked: "toggleAll"}}),
        ul({class: "todo-list"}, function*() {
          const itemOutputs = yield list(item, ({id}) => id.toString(), todoNames);
          return {itemOutputs};
        })
      ]),
      todoFooter({todosB: itemOutputs})
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
