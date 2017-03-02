import {fromMaybe, lift, map, Maybe} from "jabz";
import {
  Behavior, stepper,
  Stream, snapshot, filter,
  combine, combineList, keepWhen, toggle, Future, async, switcher, performStream, changes
} from "hareactive";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

import {setItemIO, getItemIO} from "./index";

const enter = 13;
const esc = 27;
const isKey = (keyCode: number) => (ev: {keyCode: number}) => ev.keyCode === keyCode;

export type Item = {
  taskName: Behavior<string>,
  isComplete: Behavior<boolean>
};

export type PersistedItem = {
  taskName: string,
  isComplete: boolean
};

export type Input = {
  name: string,
  id: number
};

type FromView = {
  toggleTodo: Stream<boolean>,
  taskName: Behavior<string>,
  startEditing: Stream<any>,
  nameBlur: Stream<any>,
  deleteClicked: Stream<number>,
  nameKeyup: Stream<any>,
  newNameInput: Stream<any>
};

type ToView = {
  taskName: Behavior<string>,
  isComplete: Behavior<boolean>
  newName: Behavior<string>
  isEditing: Behavior<boolean>
};

export type Output = {
  id: number,
  destroyItemId: Stream<number>,
  completed: Behavior<boolean>
};

export default function item(toggleAll: Stream<boolean>, {name: initialName, id}: Input): Component<Output> {
  return component<ToView, FromView, Output>(
    function* itemModel({toggleTodo, startEditing, nameBlur, deleteClicked, nameKeyup, newNameInput, taskName}: FromView) {
      const enterPress = filter(isKey(enter), nameKeyup);
      const enterNotPressed = toggle(true, startEditing, enterPress);
      const cancel = filter(isKey(esc), nameKeyup);
      const notCancelled = toggle(true, startEditing, cancel);
      const stopEditing = combineList([enterPress, keepWhen(nameBlur, enterNotPressed), cancel]);
      const isEditing = toggle(false, startEditing, stopEditing);
      const newName = stepper(
        initialName,
        combine(newNameInput.map((ev) => ev.target.value), snapshot(taskName, cancel))
      );
      const nameChange = snapshot(newName, keepWhen(stopEditing, notCancelled));

      // Restore potentially persisted todo item
      const persistKey = `todoItem:${id}`;
      const savedItem: Future<Maybe<PersistedItem>> = yield async(getItemIO(persistKey));
      const restoredTodo: Future<Item> = savedItem.map((maybeItem) => {
        const initial = fromMaybe({taskName: initialName, isComplete: false}, maybeItem);
        return {
          taskName: stepper(initial.taskName, nameChange),
          isComplete: stepper(initial.isComplete, combine(toggleTodo, toggleAll))
        };
      });

      // Switch to the behaviors created from restored values
      const taskName_ = switcher(Behavior.of(initialName), restoredTodo.map(o => o.taskName));
      const isComplete = switcher(Behavior.of(false), restoredTodo.map(o => o.isComplete));

      // Persist todo item
      const item = lift((taskName, isComplete) => ({taskName, isComplete}), taskName_, isComplete);
      yield performStream(changes(item).map((i: PersistedItem) => setItemIO(persistKey, i)));

      const destroyItem = combine(deleteClicked, nameChange.filter((s) => s === ""));
      const destroyItemId = destroyItem.mapTo(id);
      return [{
        taskName: taskName_,
        isComplete,
        isEditing,
        newName
      }, {
        id, destroyItemId, completed: isComplete
      }] as [ToView, Output];
    },
    function itemView({taskName, isComplete, isEditing, newName}: ToView) {
      return map((out) => ({taskName, ...out}), li({
        class: "todo",
        classToggle: {completed: isComplete, editing: isEditing}
      }, [
        div({class: "view"}, [
          checkbox({
            class: "toggle", name: {checkedChange: "toggleTodo"},
            props: {checked: isComplete}
          }),
          label({name: {dblclick: "startEditing"}}, taskName),
          button({class: "destroy", name: {click: "deleteClicked"}})
        ]),
        input({
          class: "edit", props: {value: taskName},
          name: {input: "newNameInput", keyup: "nameKeyup", blur: "nameBlur"}
        })
      ]));
    }
  );
}
