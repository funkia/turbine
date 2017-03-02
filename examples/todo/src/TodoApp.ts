import {combine, fromMaybe, lift, Maybe, traverse} from "jabz";
import {
  Behavior, scan, map,
  sample, snapshot,
  Stream, switchStream, combineList, async, Future, switcher, plan, performStream, changes, snapshotWith
} from "hareactive";
import {component, elements, list} from "../../../src";
const {h1, p, header, footer, section, checkbox, ul} = elements;
import {get} from "../../../src/utils";

import todoInput, {Out as InputOut} from "./TodoInput";
import item, {Output as ItemOut, Input as ItemParams} from "./Item";
import todoFooter, { Params as FooterParams } from "./TodoFooter";
import {setItemIO, getItemIO} from "./index";

const isEmpty = (list: any[]) => list.length === 0;
const apply = <A>(f: (a: A) => A, a: A) => f(a);

type FromView = {
  toggleAll: Stream<boolean>,
  itemOutputs: Behavior<ItemOut[]>,
  clearCompleted: Stream<{}>
} & InputOut;

type ToView = {
  toggleAll: Stream<boolean>,
  todoNames: Behavior<ItemParams[]>,
  itemOutputs: Behavior<ItemOut[]>,
  areAllCompleted: Behavior<boolean>
} & FooterParams;

export function mapTraverseFlat<A, B>(fn: (a: A) => Behavior<B>, behavior: Behavior<A[]>): Behavior<B[]> {
  return behavior.map(l => traverse(Behavior, fn, l)).flatten<B[]>();
}

function getCompletedIds(outputs: Behavior<ItemOut[]>): Behavior<number[]> {
  return mapTraverseFlat(
    ({completed: completedB, id}) => map((completed) => ({completed, id}), completedB),
    outputs
  ).map((list) => list.filter(get("completed")).map(get("id")));
}

function* model({enterTodoS, toggleAll, clearCompleted, itemOutputs}: FromView) {
  const nextId = itemOutputs.map((outs) => outs.reduce((maxId, {id}) => Math.max(maxId, id), 0) + 1);
  const newTodoS: Stream<ItemParams> = snapshotWith((name, id) => ({name, id}), nextId, enterTodoS);

  const deleteS = switchStream(itemOutputs.map((list) => combineList(list.map(get("destroyItemId")))));

  const completedIds = getCompletedIds(itemOutputs);
  const areAllCompleted =
    lift((currentIds, currentOuts) => currentIds.length === currentOuts.length, completedIds, itemOutputs);
  const areAnyCompleted = completedIds.map(isEmpty).map((b) => !b);

  // Modifications
  const prependTodoFn = newTodoS.map((todo) => (list: ItemParams[]) => combine([todo], list));
  const removeTodoFn = deleteS.map((removeId) => (list: ItemParams[]) => list.filter(({id}) => id !== removeId));
  const clearCompletedFn =
    snapshot(completedIds, clearCompleted).map((ids) => (list: ItemParams[]) => list.filter(({id}) => !ids.includes(id)));

  const modifications = combineList([prependTodoFn, removeTodoFn, clearCompletedFn]);

  const savedTodoName: Future<Maybe<ItemParams[]>> = yield async(getItemIO("todoList"));
  const restoredTodoNames = yield plan(savedTodoName.map((maybeList) => {
    const initial = fromMaybe([], maybeList);
    return sample(scan(apply, initial, modifications));
  }));
  const todoNames: Behavior<ItemParams[]> = switcher(Behavior.of([]), restoredTodoNames);
  yield performStream(changes(todoNames).map((n) => setItemIO("todoList", n)));
  return [{itemOutputs, todoNames, clearAll: clearCompleted, areAnyCompleted, toggleAll, areAllCompleted}, {}];
}

function view({itemOutputs, todoNames, areAnyCompleted, toggleAll, areAllCompleted}: ToView) {
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
        checkbox({class: "toggle-all", props: {checked: areAllCompleted}, name: {checkedChange: "toggleAll"}}),
        ul({class: "todo-list"}, function*() {
          const itemOutputs = yield list(item.bind(undefined, toggleAll), ({id}) => id.toString(), todoNames);
          return {itemOutputs};
        })
      ]),
      todoFooter({todosB: itemOutputs, areAnyCompleted})
    ]),
    footer({class: "info"}, [
      p("Double-click to edit a todo"),
      p("Written with Funnel"),
      p("Part of TodoMVC")
    ])
  ];
}

export const app = component(model, view);
