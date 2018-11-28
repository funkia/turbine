import { Behavior, Stream, moment, combine } from "@funkia/hareactive";
import { Component, elements, modelView, fgo } from "../../../src";
const { span, button, ul, li, a, footer, strong } = elements;
import { navigate, Router } from "@funkia/rudolph";
import { get } from "../../../src/utils";

// import {mapTraverseFlat} from "./TodoApp";
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

const filterItem = (name: string) =>
  li(
    a(
      {
        style: {
          cursor: "pointer"
        }
      },
      name
    ).output({
      [`filterBtn${name}`]: "click"
    })
  );

const model = function*(
  {
    filterBtnActive,
    filterBtnAll,
    filterBtnCompleted,
    clearCompleted
  }: FromView,
  { router }
) {
  const navs = combine(
    filterBtnAll.mapTo("all"),
    filterBtnActive.mapTo("active"),
    filterBtnCompleted.mapTo("completed")
  );
  yield navigate(router, navs);
  return { clearCompleted };
};

const view = ({}, { todosB, areAnyCompleted }: Params) => {
  const hidden = todosB.map(isEmpty);
  const itemsLeft = moment(
    (at) => at(todosB).filter((t) => !at(t.completed)).length
  );
  return footer({ class: ["footer", { hidden }] }, [
    span({ class: "todo-count" }, [
      strong(itemsLeft),
      itemsLeft.map(formatRemainer)
    ]),
    ul({ class: "filters" }, [
      filterItem("All"),
      filterItem("Active"),
      filterItem("Completed")
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
