import {Behavior, stepper, scan, sink} from "hareactive/behavior";
import {Stream, snapshot, filter} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {runMain, Component, component, dynamic, e, elements} from "../../../src";
const {div, li, input, label} = elements;

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

const checkbox = e("input.toggle[type=checkbox]", {
  behaviors: [
    ["change", "checked", (evt) => {
      return evt.target.checked;
    }, false]
  ]
});

const btn = e("button.destroy");

export function view({taskName, isCompleteB, isEditingB}: Item) {
  return li({
    wrapper: true,
    class: "todo",
    classToggle: {completed: isCompleteB, editing: isEditingB}
  }, function*() {
    const {checked} = yield div({class: "view"}, function*() {
      const {checked} = yield checkbox();
      yield label(taskName);
      yield btn();
      return {checked};
    });
    yield input({class: "edit"});
    return {checked};
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
