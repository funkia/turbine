import { combine } from "@funkia/jabz";
import * as H from "@funkia/hareactive";
import { elements, component } from "../../../src";
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
  component<FromView, Output>((on, start) => {
    // Restore potentially persisted todo item
    const persistKey = itemIdToPersistKey(props.id);
    const defaultItem = { taskName: props.name, completed: false };
    const savedItem = start(
      H.sample(itemBehavior<typeof defaultItem>(persistKey))
    );
    const initial = savedItem ? savedItem : defaultItem;

    const editing = start(H.toggle(false, on.startEditing, on.stopEditing));
    const nameChange = H.snapshot(on.newName, on.stopEditing.filter((b) => b));

    // Initialize task to restored values
    const taskName = start(H.stepper(initial.taskName, nameChange));
    const completed = start(
      H.stepper(initial.completed, combine(on.toggleTodo, props.toggleAll))
    );

    // Persist todo item
    const item = H.lift(
      (taskName, completed) => ({ taskName, completed }),
      taskName,
      completed
    );
    start(
      H.performStream(H.changes(item).map((i) => setItemIO(persistKey, i)))
    );

    const destroyItem = combine(
      on.deleteClicked,
      nameChange.filter((s) => s === "")
    );
    const destroyItemId = destroyItem.mapTo(props.id);

    // Remove persist todo item
    start(H.performStream(destroyItem.mapTo(removeItemIO(persistKey))));

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
        }).use({ toggleTodo: "checkedChange" }),
        label(taskName).use({ startEditing: "dblclick" }),
        button({ class: "destroy" }).use({ deleteClicked: "click" })
      ]),
      input({
        class: "edit",
        value: H.snapshot(on.taskName, on.startEditing),
        actions: { focus: on.startEditing }
      }).use((o) => ({
        newName: o.value,
        stopEditing: H.combine(
          o.keyup.filter((ev) => ev.keyCode === enter).mapTo(true),
          H.keepWhen(o.blur, editing).mapTo(true),
          o.keyup.filter((ev) => ev.keyCode === esc).mapTo(false)
        )
      }))
    ])
      .use(() => ({ taskName, editing }))
      .output({ destroyItemId, completed, id: props.id });
  });
