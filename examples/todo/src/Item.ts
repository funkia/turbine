import { combine, fromMaybe, lift, map, Maybe, fgo } from "@funkia/jabz";
import {
  Behavior,
  changes,
  filter,
  Future,
  keepWhen,
  performStream,
  sample,
  snapshot,
  stepper,
  Stream,
  switcher,
  toggle
} from "@funkia/hareactive";
import { Router, routePath } from "@funkia/rudolph";

import { Component, modelView, elements } from "../../../src";
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
  router: Router;
};

type FromView = {
  toggleTodo: Stream<boolean>;
  taskName: Behavior<string>;
  startEditing: Stream<any>;
  nameBlur: Stream<any>;
  deleteClicked: Stream<number>;
  nameKeyup: Stream<any>;
  newNameInput: Stream<any>;
};

type ToView = {
  taskName: Behavior<string>;
  isComplete: Behavior<boolean>;
  newName: Behavior<string>;
  isEditing: Behavior<boolean>;
  focusInput: Stream<any>;
  hidden: Behavior<boolean>;
};

export type Output = {
  id: number;
  destroyItemId: Stream<number>;
  completed: Behavior<boolean>;
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
  { toggleAll, name: initialName, id, router }: Input
): any {
  const enterPress = filter(isKey(enter), nameKeyup);
  const enterNotPressed = yield sample(toggle(true, startEditing, enterPress));
  const cancel = filter(isKey(esc), nameKeyup);
  const notCancelled = yield sample(toggle(true, startEditing, cancel));
  const stopEditing = combine(
    enterPress,
    keepWhen(nameBlur, enterNotPressed),
    cancel
  );
  const isEditing = yield sample(toggle(false, startEditing, stopEditing));
  const newName = yield sample(
    stepper(
      initialName,
      combine(
        newNameInput.map((ev) => ev.target.value),
        snapshot(taskName, cancel)
      )
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
  const taskName_ = yield sample(stepper(initial.taskName, nameChange));
  const isComplete: Behavior<boolean> = yield sample(
    stepper(initial.isComplete, combine(toggleTodo, toggleAll).log())
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

  const shouldHide = routePath(
    {
      active: () => (a: boolean) => a,
      completed: () => (a: boolean) => !a,
      "*": () => () => false
    },
    router
  );

  const hidden = lift((a, fn) => fn(a), isComplete, shouldHide);

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

function itemView({
  taskName,
  isComplete,
  isEditing,
  newName,
  focusInput,
  hidden
}: ToView) {
  return map(
    (out) => ({ taskName, ...out }),
    li(
      {
        class: ["todo", { completed: isComplete, editing: isEditing, hidden }]
      },
      [
        div({ class: "view" }, [
          checkbox({
            class: "toggle",
            output: { toggleTodo: "checkedChange" },
            props: { checked: isComplete }
          }),
          label({ output: { startEditing: "dblclick" } }, taskName),
          button({ class: "destroy", output: { deleteClicked: "click" } })
        ]),
        input({
          class: "edit",
          props: { value: taskName },
          output: {
            newNameInput: "input",
            nameKeyup: "keyup",
            nameBlur: "blur"
          },
          actions: { focus: focusInput }
        })
      ]
    )
  );
}

export default modelView(itemModel, itemView);
