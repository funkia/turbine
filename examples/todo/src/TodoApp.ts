import { fgo, sequence, IO, combine } from "@funkia/jabz";
import * as H from "@funkia/hareactive";
import { elements, list, component } from "../../../src";
const { h1, p, header, footer, section, checkbox, ul, label } = elements;
import { locationHashB } from "@funkia/rudolph";

import todoInput, { Out as InputOut } from "./TodoInput";
import item, {
  Output as ItemOut,
  Props as ItemParams,
  itemIdToPersistKey
} from "./Item";
import todoFooter from "./TodoFooter";
import { setItemIO, itemBehavior, removeItemIO } from "./localstorage";

const isEmpty = (array: any[]) => array.length === 0;
const includes = <A>(a: A, list: A[]) => list.indexOf(a) !== -1;

type FromView = {
  toggleAll: H.Stream<boolean>;
  itemOutputs: H.Behavior<ItemOut[]>;
  clearCompleted: H.Stream<{}>;
} & InputOut;

// A behavior representing the current value of the localStorage property
const todoListStorage = itemBehavior("todoList");

const getCompletedIds = (outputs: H.Behavior<ItemOut[]>) =>
  H.moment((at) => {
    return at(outputs)
      .filter((o) => at(o.completed))
      .map((o) => o.id);
  });

type ListModel<A, B> = {
  prependItemS: H.Stream<A>;
  removeKeyListS: H.Stream<B[]>;
  itemToKey: (a: A) => B;
  initial: A[];
};

// This model handles the modification of the list of Todos
function listModel<A, B>(props: ListModel<A, B>) {
  return H.accumCombine(
    [
      [props.prependItemS, (item, list) => [item].concat(list)],
      [
        props.removeKeyListS,
        (keys, list) =>
          list.filter((item) => !includes(props.itemToKey(item), keys))
      ]
    ],
    props.initial
  );
}

export const app = component<FromView>(
  fgo(function*(on) {
    const nextId = on.itemOutputs.map(
      (outs) => outs.reduce((maxId, { id }) => Math.max(maxId, id), 0) + 1
    );

    const newTodoS = H.snapshotWith(
      (name, id) => ({ name, id }),
      nextId,
      on.addItem
    );
    const deleteS = H.shiftCurrent(
      on.itemOutputs.map((list) =>
        list.length > 0 ? combine(...list.map((o) => o.destroyItemId)) : H.empty
      )
    );
    const completedIds = getCompletedIds(on.itemOutputs);

    const savedTodoName: ItemParams[] = yield H.sample(todoListStorage);
    const restoredTodoName = savedTodoName === null ? [] : savedTodoName;

    const clearCompletedIdS = H.snapshot(completedIds, on.clearCompleted);
    const removeListS = combine(deleteS.map((a) => [a]), clearCompletedIdS);
    const todoNames = yield listModel<{ id: number; name: string }, number>({
      prependItemS: newTodoS,
      removeKeyListS: removeListS,
      itemToKey: ({ id }) => id,
      initial: restoredTodoName
    });

    yield H.performStream(
      clearCompletedIdS.map((ids) =>
        sequence(IO, ids.map((id) => removeItemIO(itemIdToPersistKey(id))))
      )
    );
    yield H.performStream(
      H.changes(todoNames).map((n) => setItemIO("todoList", n))
    );

    const areAllCompleted = H.lift(
      (a, b) => a.length === b.length,
      completedIds,
      on.itemOutputs
    );
    const areAnyCompleted = completedIds.map(isEmpty).map((b) => !b);

    // Strip the leading `/` from the hash location
    const currentFilter = locationHashB.map((s) => s.slice(1));
    const hidden = todoNames.map(isEmpty);

    const itemsLeft = H.moment(
      (at) => at(on.itemOutputs).filter((t) => !at(t.completed)).length
    );

    return [
      section({ class: "todoapp" }, [
        header({ class: "header" }, [
          h1("todos"),
          todoInput.output({ addItem: "addItem" })
        ]),
        section(
          {
            class: ["main", { hidden }]
          },
          [
            checkbox({
              class: "toggle-all",
              attrs: { id: "toggle-all" },
              props: { checked: areAllCompleted }
            }).output({ toggleAll: "checkedChange" }),
            label({ attrs: { for: "toggle-all" } }, "Mark all as complete"),
            ul(
              { class: "todo-list" },
              list(
                (n) =>
                  item({ toggleAll: on.toggleAll, currentFilter, ...n }).output(
                    {
                      completed: "completed",
                      destroyItemId: "destroyItemId",
                      id: "id"
                    }
                  ),
                todoNames,
                (o) => o.id
              ).output((o) => ({ itemOutputs: o }))
            )
          ]
        ),
        todoFooter({
          itemsLeft,
          areAnyCompleted,
          currentFilter,
          hidden
        }).output({ clearCompleted: "clearCompleted" })
      ]),
      footer({ class: "info" }, [
        p("Double-click to edit a todo"),
        p("Written with Turbine"),
        p("Part of TodoMVC")
      ])
    ];
  })
);
