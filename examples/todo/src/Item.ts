import {map} from "jabz";
import {
  Behavior, stepper,
  Stream, snapshot, filter,
  Now, combine, combineList, keepWhen, toggle
} from "hareactive";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

const enter = 13;
const esc = 27;
const isKey = (keyCode: number) => (ev: {keyCode: number}) => ev.keyCode === keyCode;

export type Item = {
  id: number,
  taskName: Behavior<string>,
  isComplete: Behavior<boolean>
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
    function itemModel({toggleTodo, startEditing, nameBlur, deleteClicked, nameKeyup, newNameInput, taskName}: FromView) {
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
      const taskName_ = stepper(initialName, nameChange);
      const destroyItem = combine(deleteClicked, nameChange.filter((s) => s === ""));
      const destroyItemId = destroyItem.mapTo(id);
      const isComplete = stepper(false, combine(toggleTodo, toggleAll));
      return Now.of([{
        taskName: taskName_,
        isComplete,
        isEditing,
        newName
      }, {
        id, destroyItemId, completed: isComplete
      }] as [ToView, Output]);
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
          class: "edit", props: {value: newName},
          name: {input: "newNameInput", keyup: "nameKeyup", blur: "nameBlur"}
        })
      ]));
    }
  );
}
