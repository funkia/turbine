import { Behavior, Stream, moment } from "@funkia/hareactive";
import { elements, view } from "../../../src";
const { span, button, ul, li, a, footer, strong } = elements;

import { Output as ItemOut } from "./Item";

export type Params = {
  currentFilter: Behavior<string>;
  todosB: Behavior<ItemOut[]>;
  areAnyCompleted: Behavior<boolean>;
};

export type Out = {
  clearCompleted: Stream<any>;
};

const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${value === 1 ? "" : "s"} left`;

const filterItem = (
  name: string,
  path: string,
  currentFilter: Behavior<string>
) =>
  view(
    li(
      a(
        {
          href: `#/${path}`,
          class: {
            selected: currentFilter.map((s) => s === path)
          }
        },
        name
      ).output({ click: "click" })
    )
  );

const todoFooter = ({ currentFilter, todosB, areAnyCompleted }: Params) => {
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
      filterItem("All", "", currentFilter),
      filterItem("Active", "active", currentFilter),
      filterItem("Completed", "completed", currentFilter)
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

export default todoFooter;
