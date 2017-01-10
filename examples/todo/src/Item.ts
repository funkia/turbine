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

export const toItem = (taskName: Behavior<string>): Item => ({
  taskName,
  isComplete: sink(false),
  isEditing: sink(false)
});

type FromView = {
  checked: Behavior<boolean>,
  taskName: Behavior<string>,
  startEditing: Stream<any>,
  stopEditing: Stream<any>,
  destroyItem: Stream<number>
};

type ToView = Item;

type Out = {
  destroyItem: Stream<number>
};

export function item(name: string): Component<{}> {
  return component(
    function itemModel({checked, taskName, startEditing, stopEditing, destroyItem}: FromView) {
      const editing = stepper(false, startEditing.mapTo(true).combine(stopEditing.mapTo(false)));
      const item = toItem(Behavior.of(name));
      return Now.of([{
        taskName,
        isComplete: checked,
        isEditing: editing
      }, {
	destroyItem
      }] as [ToView, Out]);
    },
    function itemView({taskName, isComplete, isEditing}: Item) {
      return li({
        wrapper: true,
        class: "todo",
        classToggle: {completed: isComplete, editing: isEditing}
      }, [
        div({class: "view"}, [
          checkbox({class: "toggle", name: {checked: "completed"}}),
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
