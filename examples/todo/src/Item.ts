import { combine } from "@funkia/jabz";
import {
  Behavior,
  changes,
  filter,
  keepWhen,
  performStream,
  sample,
  snapshot,
  stepper,
  Stream,
  lift,
  toggle
} from "@funkia/hareactive";

import { modelView, elements, fgo, Component } from "../../../src";
const { div, li, input, label, button, checkbox } = elements;

import { setItemIO, itemBehavior, removeItemIO } from "./localstorage";

const enter = 13;
const esc = 27;
const isKey = (keyCode: number) => (ev: { keyCode: number }) =>
  ev.keyCode === keyCode;
export const itemIdToPersistKey = (id: number) => `todoItem:${id}`;
export const itemOutputToId = ({ id }: Output) => id;

export type Item = {
  taskName: Behavior<string>;
  isComplete: Behavior<boolean>;
};

export type PersistedItem = {
  taskName: string;
  isComplete: boolean;
};

export type Input = {
  name: string;
  id: number;
  toggleAll: Stream<boolean>;
  currentFilter: Behavior<string>;
};

type FromView = {
  toggleTodo: Stream<boolean>;
  taskName: Behavior<string>;
  startEditing: Stream<any>;
  nameBlur: Stream<any>;
  deleteClicked: Stream<any>;
  nameKeyup: Stream<any>;
  newNameInput: Stream<any>;
};

export type Output = {
  taskName: Behavior<string>;
  isComplete: Behavior<boolean>;
  newName: Behavior<string>;
  isEditing: Behavior<boolean>;
  focusInput: Stream<any>;
  hidden: Behavior<boolean>;
  destroyItemId: Stream<number>;
  completed: Behavior<boolean>;
  id: number;
};

const itemModel = fgo(function*(
  {
    toggleTodo,
    startEditing,
    nameBlur,
    deleteClicked,
    nameKeyup,
    newNameInput,
    taskName
  }: FromView,
  { toggleAll, name: initialName, id, currentFilter }: Input
): any {
  const enterPress = filter(isKey(enter), nameKeyup);
  const enterNotPressed = yield toggle(true, startEditing, enterPress);
  const cancel = filter(isKey(esc), nameKeyup);
  const notCancelled = yield toggle(true, startEditing, cancel);
  const stopEditing = combine(
    enterPress,
    keepWhen(nameBlur, enterNotPressed),
    cancel
  );
  const isEditing = yield toggle(false, startEditing, stopEditing);
  const newName = yield stepper(
    initialName,
    combine(
      newNameInput.map((ev) => ev.target.value),
      snapshot(taskName, cancel)
    )
  );
  const nameChange = snapshot(newName, keepWhen(stopEditing, notCancelled));

  // Restore potentially persisted todo item
  const persistKey = itemIdToPersistKey(id);
  const savedItem = yield sample(itemBehavior(persistKey));
  const initial =
    savedItem === null
      ? { taskName: initialName, isComplete: false }
      : savedItem;

  // Initialize task to restored values
  const taskName_: Behavior<string> = yield stepper(
    initial.taskName,
    nameChange
  );
  const isComplete: Behavior<boolean> = yield stepper(
    initial.isComplete,
    combine(toggleTodo, toggleAll)
  );

  // Persist todo item
  const item = lift(
    (taskName, isComplete) => ({ taskName, isComplete }),
    taskName_,
    isComplete
  );
  yield performStream(
    changes(item).map((i: PersistedItem) => setItemIO(persistKey, i))
  );

  const destroyItem = combine(
    deleteClicked,
    nameChange.filter((s) => s === "")
  );
  const destroyItemId = destroyItem.mapTo(id);

  // Remove persist todo item
  yield performStream(destroyItem.mapTo(removeItemIO(persistKey)));

  const hidden = lift(
    (complete, filter) =>
      (filter === "completed" && !complete) ||
      (filter === "active" && complete),
    isComplete,
    currentFilter
  );

  return {
    taskName: taskName_,
    isComplete,
    isEditing,
    newName,
    focusInput: startEditing,
    id,
    destroyItemId,
    completed: isComplete,
    hidden
  };
});

function itemView(
  { taskName, isComplete, isEditing, focusInput, hidden }: Output,
  _: Input
): Component<any, FromView> {
  return li(
    {
      class: ["todo", { completed: isComplete, editing: isEditing, hidden }]
    },
    [
      div({ class: "view" }, [
        checkbox({
          class: "toggle",
          props: { checked: isComplete }
        }).output({ toggleTodo: "checkedChange" }),
        label(taskName).output({ startEditing: "dblclick" }),
        button({ class: "destroy" }).output({ deleteClicked: "click" })
      ]),
      input({
        class: "edit",
        props: { value: taskName },
        actions: { focus: focusInput }
      }).output({
        newNameInput: "input",
        nameKeyup: "keyup",
        nameBlur: "blur"
      })
    ]
  ).output((o) => ({ taskName, ...o }));
}

export default modelView(itemModel, itemView);
