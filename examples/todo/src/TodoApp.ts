import {
  fromMaybe,
  lift,
  Maybe,
  traverse,
  fgo,
  sequence,
  IO
} from "@funkia/jabz";
import {
  Behavior,
  scan,
  map,
  sample,
  snapshot,
  Stream,
  switchStream,
  combine,
  Future,
  switcher,
  plan,
  performStream,
  changes,
  snapshotWith,
  scanCombine,
  moment
} from "@funkia/hareactive";
import { modelView, elements, list, output } from "../../../src";
const { h1, p, header, footer, section, checkbox, ul, label } = elements;
import { Router } from "@funkia/rudolph";

import todoInput, { Out as InputOut } from "./TodoInput";
import item, {
  Output as ItemOut,
  Input as ItemParams,
  itemIdToPersistKey
} from "./Item";
import todoFooter, { Params as FooterParams } from "./TodoFooter";
import { setItemIO, itemBehavior, removeItemIO } from "./localstorage";

const isEmpty = (list: any[]) => list.length === 0;
const apply = <A>(f: (a: A) => A, a: A) => f(a);
const includes = <A>(a: A, list: A[]) => list.indexOf(a) !== -1;

type FromView = {
  toggleAll: Stream<boolean>;
  itemOutputs: Behavior<ItemOut[]>;
  clearCompleted: Stream<{}>;
} & InputOut;

type ToView = {
  toggleAll: Stream<boolean>;
  todoNames: Behavior<ItemParams[]>;
  itemOutputs: Behavior<ItemOut[]>;
  areAllCompleted: Behavior<boolean>;
} & FooterParams;

// A behavior representing the current value of the localStorage property
const todoListStorage = itemBehavior("todoList");

function getCompletedIds(outputs: Behavior<ItemOut[]>): Behavior<number[]> {
  return moment((at) => {
    return at(outputs)
      .filter((o) => at(o.completed))
      .map((o) => o.id);
  });
}

type ListModel<A, B> = {
  prependItemS: Stream<A>;
  removeKeyListS: Stream<B[]>;
  itemToKey: (a: A) => B;
  initial: A[];
};
// This model handles the modification of the list of Todos
function ListModel<A, B>({
  prependItemS,
  removeKeyListS,
  itemToKey,
  initial
}: ListModel<A, B>) {
  return sample(
    scanCombine(
      [
        [prependItemS, (item, list) => [item].concat(list)],
        [
          removeKeyListS,
          (keys, list) =>
            list.filter((item) => !includes(itemToKey(item), keys))
        ]
      ],
      initial
    )
  );
}

function* model({ addItem, toggleAll, clearCompleted, itemOutputs }: FromView) {
  const nextId = itemOutputs.map(
    (outs) => outs.reduce((maxId, { id }) => Math.max(maxId, id), 0) + 1
  );

  const newTodoS = snapshotWith((name, id) => ({ name, id }), nextId, addItem);
  const deleteS = switchStream(
    itemOutputs.map((list) => combine(...list.map((o) => o.destroyItemId)))
  );
  const completedIds = getCompletedIds(itemOutputs);

  const savedTodoName: ItemParams[] = yield sample(todoListStorage);
  const restoredTodoName = savedTodoName === null ? [] : savedTodoName;

  const getItemId = ({ id }: ItemParams) => id;

  const clearCompletedIdS = snapshot(completedIds, clearCompleted);
  const removeListS = combine(deleteS.map((a) => [a]), clearCompletedIdS);
  const todoNames = yield ListModel({
    prependItemS: newTodoS,
    removeKeyListS: removeListS,
    itemToKey: getItemId,
    initial: restoredTodoName
  });

  yield performStream(
    clearCompletedIdS.map((ids) =>
      sequence(IO, ids.map((id) => removeItemIO(itemIdToPersistKey(id))))
    )
  );
  yield performStream(changes(todoNames).map((n) => setItemIO("todoList", n)));

  const areAllCompleted = lift(
    (currentIds, currentOuts) => currentIds.length === currentOuts.length,
    completedIds,
    itemOutputs
  );
  const areAnyCompleted = completedIds.map(isEmpty).map((b) => !b);

  return {
    itemOutputs,
    todoNames,
    clearAll: clearCompleted,
    areAnyCompleted,
    toggleAll,
    areAllCompleted
  };
}

function view(
  {
    itemOutputs,
    todoNames,
    areAnyCompleted,
    toggleAll,
    areAllCompleted
  }: ToView,
  router: Router
) {
  return [
    section({ class: "todoapp" }, [
      header({ class: "header" }, [
        h1("todos"),
        output({ addItem: "addItem" }, todoInput)
      ]),
      section(
        {
          class: ["main", { hidden: todoNames.map(isEmpty) }]
        },
        [
          checkbox({
            class: "toggle-all",
            attrs: { id: "toggle-all" },
            props: { checked: areAllCompleted },
            output: { toggleAll: "checkedChange" }
          }),
          label({ attrs: { for: "toggle-all" } }, "Mark all as complete"),
          ul(
            { class: "todo-list" },
            list(
              (n) => item({ toggleAll, router, ...n }),
              todoNames,
              (o) => o.id
            ).output((o) => ({ itemOutputs: o }))
          )
        ]
      ),
      output(
        { clearCompleted: "clearCompleted" },
        todoFooter({ todosB: itemOutputs, areAnyCompleted, router })
      )
    ]),
    footer({ class: "info" }, [
      p("Double-click to edit a todo"),
      p("Written with Turbine"),
      p("Part of TodoMVC")
    ])
  ];
}

export const app = modelView<ToView, FromView, Router>(model, view);
