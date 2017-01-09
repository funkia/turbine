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

export function view({taskName, isCompleteB, isEditingB}: Item) {
  return li({
    wrapper: true,
    class: "todo",
    classToggle: {completed: isCompleteB, editing: isEditingB}
  }, function*() {
    const children = yield div({class: "view"}, function*() {
      const {checked} = yield checkbox({class: "toggle"});
      yield label(taskName);
      const {click: destroyS} = yield button({class: "destroy"});
      return {checked, destroyS};
    });
    const {editName} = yield input({class: "edit"});
    return {editName, children};
  });
}

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
    view
  );
}
