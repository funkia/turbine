import {map} from "jabz";
import {
  Behavior, stepper,
  Stream, snapshot, filter,
  Now, combine, at, combineList
} from "hareactive";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

const enter = 13;
const esc = 27;
const isKey = (keyCode: number) => (ev: {keyCode: number}) => ev.keyCode === keyCode;

export type Item = {
  taskName: Behavior<string>,
  isComplete: Behavior<boolean>,
  isEditing: Behavior<boolean>
};

export type Params = {
  name: string,
  id: number
};

type FromView = {
  toggle: Stream<boolean>,
  taskName: Behavior<string>,
  startEditing: Stream<any>,
  nameBlur: Stream<any>,
  deleteClicked: Stream<number>,
  nameKeyup: Stream<any>,
  newNameInput: Stream<any>
};

type ToView = Item & {newName: Behavior<string>};

export type Out = {
  id: number,
  destroyItemId: Stream<number>,
  completed: Behavior<boolean>
};

function keepWhen<A>(stream: Stream<A>, behavior: Behavior<boolean>): Stream<A> {
  return stream.filter((_) => at(behavior));
}

export default function item(toggleAll: Stream<boolean>, {name: initialName, id}: Params): Component<Out> {
  return component<ToView, FromView, Out>(
    function itemModel({toggle, startEditing, nameBlur, deleteClicked, nameKeyup, newNameInput, taskName}: FromView) {
      const enterPress = filter(isKey(enter), nameKeyup);
      const enterNotPressed =
        stepper(true, combine(enterPress.mapTo(false), startEditing.mapTo(true)));
      const cancel = filter(isKey(esc), nameKeyup);
      const notCancelled = stepper(true, combine(cancel.mapTo(false), startEditing.mapTo(true)));
      const stop =
        combineList([enterPress, keepWhen(nameBlur, enterNotPressed), cancel]).mapTo(false);
      const editing = stepper(false, startEditing.mapTo(true).combine(stop));

      const newName = stepper(
        initialName,
        combine(newNameInput.map((ev) => ev.target.value), snapshot(taskName, cancel))
      );
      const nameChange = snapshot(newName, keepWhen(stop, notCancelled));
      const name = stepper(initialName, nameChange);

      const destroyItem = combine(deleteClicked, nameChange.filter((s) => s === ""));
      const destroyItemId = destroyItem.mapTo(id);

      const isComplete = stepper(false, toggle.combine(toggleAll));
      return Now.of([{
        taskName: name,
        isComplete,
        isEditing: editing,
        newName
      }, {
        id, destroyItemId, completed: isComplete
      }] as [ToView, Out]);
    },
    function itemView({taskName, isComplete, isEditing, newName}: ToView) {
      return map((out) => ({taskName, ...out}), li({
        wrapper: true,
        class: "todo",
        classToggle: {completed: isComplete, editing: isEditing}
      }, [
        div({class: "view"}, [
          checkbox({
            class: "toggle", name: {checkedChange: "toggle"},
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
