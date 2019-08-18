import { Behavior, Stream, moment } from "@funkia/hareactive";
import { elements, view } from "../../../src";
const { span, button, ul, li, a, footer, strong } = elements;
import { Router, routePath } from "@funkia/rudolph";

import { Output as ItemOut } from "./Item";

export type Params = {
  todosB: Behavior<ItemOut[]>;
  areAnyCompleted: Behavior<boolean>;
  router: Router;
};

export type Out = {
  clearCompleted: Stream<any>;
};

const isEmpty = (list: any[]) => list.length === 0;
const formatRemainer = (value: number) => ` item${value === 1 ? "" : "s"} left`;

const filterItem = (
  name: string,
  path: string,
  selectedClass: Behavior<string>
) =>
  view(
    li(
      a(
        {
          href: `#/${path}`,
          class: {
            selected: selectedClass.map((s) => s === name)
          }
        },
        name
      ).output({ click: "click" })
    )
  );

const todoFooter = ({ router, todosB, areAnyCompleted }: Params) => {
  const hidden = todosB.map(isEmpty);
  const itemsLeft = moment(
    (at) => at(todosB).filter((t) => !at(t.completed)).length
  );

  const selectedClass = routePath(
    {
      "/active": () => "Active",
      "/completed": () => "Completed",
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
      filterItem("All", "", selectedClass),
      filterItem("Active", "active", selectedClass),
      filterItem("Completed", "completed", selectedClass)
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
