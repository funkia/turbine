import {
  Behavior, stepper, scan, sink,
  Stream, snapshot, filter, map,
  Now, sample
} from "hareactive";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

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
  stopEditing: Stream<any>,
  destroyItem: Stream<number>
};

type ToView = Item;

export type Out = {
  id: number,
  destroyItemId: Stream<number>,
  completed: Behavior<boolean>
};

export default function item(toggleAll: Stream<boolean>, {name, id}: Params): Component<Out> {
  return component<ToView, FromView, Out>(
    function itemModel({toggle, taskName, startEditing, stopEditing, destroyItem}: FromView) {
      const editing = stepper(false, startEditing.mapTo(true).combine(stopEditing.mapTo(false)));
      const destroyItemId = destroyItem.mapTo(id);
      const isComplete = stepper(false, toggle.combine(toggleAll));
      return Now.of([{
        taskName,
        isComplete,
        isEditing: editing
      }, {
        id, destroyItemId, completed: isComplete
      }] as [ToView, Out]);
    },
    function itemView({taskName, isComplete, isEditing}: Item) {
      return li({
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
          button({class: "destroy", name: {click: "destroyItem"}})
        ]),
        input({
          class: "edit", props: {value: name},
          name: {inputValue: "taskName", blur: "stopEditing"}
        })
      ]);
    }
  );
}
