import { combine } from "@funkia/jabz";
import * as H from "@funkia/hareactive";
import { elements, fgo, component } from "../../../src";
const { div, li, input, label, button, checkbox } = elements;

import { setItemIO, itemBehavior, removeItemIO } from "./localstorage";

const enter = 13;
const esc = 27;

export type Props = {
  name: string;
  id: number;
  toggleAll: H.Stream<boolean>;
  currentFilter: H.Behavior<string>;
};

type FromView = {
  toggleTodo: H.Stream<boolean>;
  taskName: H.Behavior<string>;
  startEditing: H.Stream<any>;
  nameBlur: H.Stream<any>;
  deleteClicked: H.Stream<any>;
  cancel: H.Stream<any>;
  enter: H.Stream<any>;
  newNameInput: H.Stream<any>;
};

export type Output = {
  destroyItemId: H.Stream<number>;
  completed: H.Behavior<boolean>;
  id: number;
};

export default (props: Props) =>
  component<FromView, Output>(
    fgo(function*(on) {
      const enterNotPressed = yield H.toggle(true, on.startEditing, on.enter);
      const notCancelled = yield H.toggle(true, on.startEditing, on.cancel);
      const stopEditing = combine(
        on.enter,
        H.keepWhen(on.nameBlur, enterNotPressed),
        on.cancel
      );
      const editing = yield H.toggle(false, on.startEditing, stopEditing);
      const newName = yield H.stepper(
        props.name,
        combine(
          on.newNameInput.map((ev) => ev.target.value),
          H.snapshot(on.taskName, on.cancel)
        )
      );
      const nameChange = H.snapshot(
        newName,
        H.keepWhen(stopEditing, notCancelled)
      );

      // Restore potentially persisted todo item
      const persistKey = "todoItem:" + props.id;
      const savedItem = yield H.sample(itemBehavior(persistKey));
      const initial =
        savedItem === null
          ? { taskName: props.name, completed: false }
          : savedItem;

      // Initialize task to restored values
      const taskName: H.Behavior<string> = yield H.stepper(
        initial.taskName,
        nameChange
      );
      const completed: H.Behavior<boolean> = yield H.stepper(
        initial.completed,
        combine(on.toggleTodo, props.toggleAll)
      );

      // Persist todo item
      const item = H.lift(
        (taskName, completed) => ({ taskName, completed }),
        taskName,
        completed
      );
      yield H.performStream(
        H.changes(item).map((i) => setItemIO(persistKey, i))
      );

      const destroyItem = combine(
        on.deleteClicked,
        nameChange.filter((s) => s === "")
      );
      const destroyItemId = destroyItem.mapTo(props.id);

      // Remove persist todo item
      yield H.performStream(destroyItem.mapTo(removeItemIO(persistKey)));

      const hidden = H.lift(
        (complete, filter) =>
          (filter === "completed" && !complete) ||
          (filter === "active" && complete),
        completed,
        props.currentFilter
      );

      return li({ class: ["todo", { completed, editing, hidden }] }, [
        div({ class: "view" }, [
          checkbox({
            class: "toggle",
            props: { checked: completed }
          }).output({ toggleTodo: "checkedChange" }),
          label(taskName).output({ startEditing: "dblclick" }),
          button({ class: "destroy" }).output({ deleteClicked: "click" })
        ]),
        input({
          class: "edit",
          value: taskName,
          actions: { focus: on.startEditing }
        }).output((o) => ({
          newNameInput: o.input,
          nameBlur: o.blur,
          enter: o.keyup.filter((ev) => ev.keyCode === enter),
          cancel: o.keyup.filter((ev) => ev.keyCode === esc)
        }))
      ])
        .output(() => ({ taskName }))
        .result({ destroyItemId, completed, id: props.id });
    })
  );
