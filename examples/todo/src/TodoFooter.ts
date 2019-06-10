import { Behavior, Stream, moment, combine } from "@funkia/hareactive";
import { elements, modelView, fgo } from "../../../src";
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
  filterBtnAll: Stream<any>;
  filterBtnActive: Stream<any>;
  filterBtnCompleted: Stream<any>;
  clearCompleted: Stream<any>;
};

const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${value === 1 ? "" : "s"} left`;

const model = function*(
  {
    filterBtnActive,
    filterBtnAll,
    filterBtnCompleted,
    clearCompleted
  }: FromView,
  { router }: { router: Router }
) {
  const navs = combine(
    filterBtnAll.mapTo("all"),
    filterBtnActive.mapTo("active"),
    filterBtnCompleted.mapTo("completed")
  );
  yield navigate(router, navs);
  return { clearCompleted };
};

const view = ({  }: Out, { router, todosB, areAnyCompleted }: Params) => {
  const hidden = todosB.map(isEmpty);
  const itemsLeft = moment(
    (at) => at(todosB).filter((t) => !at(t.completed)).length
  );

  const selectedClass = routePath(
    {
      active: () => "active",
      completed: () => "completed",
      "*": () => "all"
    },
    router
  );

  return footer({ class: ["footer", { hidden }] }, [
    span({ class: "todo-count" }, [
      strong(itemsLeft),
      itemsLeft.map(formatRemainer)
    ]),
    ul({ class: "filters" }, [
      li(
        a(
          {
            style: {
              cursor: "pointer"
            },
            class: {
              selected: selectedClass.map((s) => s === "all")
            }
          },
          "All"
        ).output({
          filterBtnAll: "click"
        })
      ),
      li(
        a(
          {
            style: {
              cursor: "pointer"
            },
            class: {
              selected: selectedClass.map((s) => s === "active")
            }
          },
          "Active"
        ).output({
          filterBtnActive: "click"
        })
      ),
      li(
        a(
          {
            style: {
              cursor: "pointer"
            },
            class: {
              selected: selectedClass.map((s) => s === "completed")
            }
          },
          "Completed"
        ).output({
          filterBtnCompleted: "click"
        })
      )
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

const todoFooter = modelView<Out, FromView, Params>(fgo(model), view);

export default todoFooter;
