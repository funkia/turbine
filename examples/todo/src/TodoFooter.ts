import { Behavior, Stream, moment, combine } from "@funkia/hareactive";
import { elements, modelView, view, fgo } from "../../../src";
const { span, button, ul, li, a, footer, strong } = elements;
import { navigate, Router, routePath } from "@funkia/rudolph";

import { Output as ItemOut } from "./Item";

export type Params = {
  todosB: Behavior<ItemOut[]>;
  areAnyCompleted: Behavior<boolean>;
  router: Router;
};

export type Out = {
  clearCompleted: Stream<any>;
};

type FromView = {
  selectAll: Stream<string>;
  selectActive: Stream<string>;
  selectCompleted: Stream<string>;
  clearCompleted: Stream<unknown>;
};

const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${value === 1 ? "" : "s"} left`;

const filterItem = (name: string, selectedClass: Behavior<string>) =>
  view(
    li(
      a(
        {
          style: {
            cursor: "pointer"
          },
          class: {
            selected: selectedClass.map((s) => s === name)
          }
        },
        name
      ).output({ click: "click" })
    )
  );

function* todoFooterModel(
  { selectAll, selectActive, selectCompleted, clearCompleted }: FromView,
  { router }: { router: Router }
) {
  const navs = combine(selectAll, selectActive, selectCompleted);
  yield navigate(router, navs);
  return { clearCompleted };
}

const todoFooterView = (
  {  }: Out,
  { router, todosB, areAnyCompleted }: Params
) => {
  const hidden = todosB.map(isEmpty);
  const itemsLeft = moment(
    (at) => at(todosB).filter((t) => !at(t.completed)).length
  );

  const selectedClass = routePath(
    {
      active: () => "Active",
      completed: () => "Completed",
      "*": () => "All"
    },
    router
  );

  return footer({ class: ["footer", { hidden }] }, [
    span({ class: "todo-count" }, [
      strong(itemsLeft),
      itemsLeft.map(formatRemainer)
    ]),
    ul({ class: "filters" }, [
      filterItem("All", selectedClass).output((o) => ({
        selectAll: o.click.mapTo("all")
      })),
      filterItem("Active", selectedClass).output((o) => ({
        selectActive: o.click.mapTo("active")
      })),
      filterItem("Completed", selectedClass).output((o) => ({
        selectCompleted: o.click.mapTo("completed")
      }))
    ]),
    button(
      {
        style: {
          visibility: areAnyCompleted.map((b) => (b ? "visible" : "hidden"))
        },
        class: "clear-completed"
      },
      "Clear completed"
    ).output({ clearCompleted: "click" })
  ]);
};

const todoFooter = modelView<Out, FromView, Params>(
  fgo(todoFooterModel),
  todoFooterView
);

export default todoFooter;
