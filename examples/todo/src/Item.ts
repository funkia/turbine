import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {Component, component, elements} from "../../../src";
const {div, li, input, label, button, checkbox} = elements;

export type Item = {
  taskName: Behavior<string>,
  isCompleteB: Behavior<boolean>,
  isEditingB: Behavior<boolean>
};

export const toItem = (taskName: Behavior<string>): Item => ({
  taskName,
  isCompleteB: sink(false),
  isEditingB: sink(false)
});

const itemView = ({taskName, isCompleteB, isEditingB}: Item) =>
  li({
    wrapper: true,
    class: "todo",
    classToggle: {completed: isCompleteB, editing: isEditingB}
  }, [
    div({class: "view"}, [
      checkbox({class: "toggle", name: {checked: "completed"}}),
      label(taskName),
      button({class: "destroy", name: {click: "destroyS"}}),
    ]),
    input({class: "edit"})
  ]);

export function item(name: string): Component<{}> {
  return component(
    ({checked}) => {
      const taskName = Behavior.of(name);
      const item = toItem(Behavior.of(name));
      return Now.of([{
        taskName,
        isCompleteB: checked,
        isEditingB: Behavior.of(false)
      }, {}])
    },
    itemView
  );
}
