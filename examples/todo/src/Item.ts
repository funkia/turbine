import {
  Behavior, stepper, scan, sink, Stream, snapshot, filter, map
} from "hareactive";
import {Now, sample} from "hareactive/now";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

export type Item = {
  taskName: Behavior<string>,
  isCompleteB: Behavior<boolean>,
  isEditing: Behavior<boolean>
};

export const toItem = (taskName: Behavior<string>): Item => ({
  taskName,
  isCompleteB: sink(false),
  isEditing: sink(false)
});

export function item(name: string): Component<{}> {
  return component(
    function itemModel({checked, taskName, startEditing, stopEditing}) {
      startEditing.map((l) => console.log(l));
      const editing = stepper(false, startEditing.mapTo(true).combine(stopEditing.mapTo(false)));
      const item = toItem(Behavior.of(name));
      return Now.of([{
        taskName,
        isCompleteB: checked,
        isEditing: editing
      }, {}])
    },
    function itemView({taskName, isCompleteB, isEditing}: Item) {
      return li({
        wrapper: true,
        class: "todo",
        classToggle: {completed: isCompleteB, editing: isEditing}
      }, [
        div({class: "view"}, [
          checkbox({class: "toggle", name: {checked: "completed"}}),
          label({name: {dblclick: "startEditing"}}, taskName),
          button({class: "destroy", name: {click: "destroyS"}}),
        ]),
        input({
          class: "edit", props: {value: name},
          name: {inputValue: "taskName", blur: "stopEditing"}
        })
      ]);
    }
  );
}
