import { combine } from "@funkia/jabz";
import * as H from "@funkia/hareactive";
import { elements, fgo, component } from "../../../src";
const { div, li, input, label, button, checkbox } = elements;

import { setItemIO, itemBehavior, removeItemIO } from "./localstorage";

const enter = 13;
const esc = 27;
export const itemIdToPersistKey = (id: number) => `todoItem:${id}`;

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
  deleteClicked: H.Stream<any>;
  stopEditing: H.Stream<boolean>;
  newName: H.Behavior<string>;
  editing: H.Behavior<boolean>;
};

export type Output = {
  destroyItemId: H.Stream<number>;
  completed: H.Behavior<boolean>;
  id: number;
};

export default (props: Props) =>
  component<FromView, Output>(
    fgo(function*(on) {
      // Restore potentially persisted todo item
      const persistKey = itemIdToPersistKey(props.id);
      const savedItem = yield H.sample(itemBehavior(persistKey));
      const initial =
        savedItem === null
          ? { taskName: props.name, completed: false }
          : savedItem;

      const editing = yield H.toggle(false, on.startEditing, on.stopEditing);
      const nameChange = H.snapshot(
        on.newName,
        on.stopEditing.filter((b) => b)
      );

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
          value: H.snapshot(on.taskName, on.startEditing),
          actions: { focus: on.startEditing }
        }).output((o) => ({
          newName: o.value,
          stopEditing: H.combine(
            o.keyup.filter((ev) => ev.keyCode === enter).mapTo(true),
            H.keepWhen(o.blur, editing).mapTo(true),
            o.keyup.filter((ev) => ev.keyCode === esc).mapTo(false)
          )
        }))
      ])
        .output(() => ({ taskName, editing }))
        .result({ destroyItemId, completed, id: props.id });
    })
  );
