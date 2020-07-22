import * as H from "@funkia/hareactive";
import { elements as E, view } from "../../../src";

export type Props = {
  currentFilter: H.Behavior<string>;
  itemsLeft: H.Behavior<number>;
  noneAreCompleted: H.Behavior<boolean>;
  hidden: H.Behavior<boolean>;
};

const filterItem = (
  name: string,
  path: string,
  currentFilter: H.Behavior<string>
) =>
  view(
    E.li(
      E.a(
        {
          href: `#/${path}`,
          class: { selected: currentFilter.map((s) => s === path) },
        },
        name
      ).use({ click: "click" })
    )
  );

const todoFooter = (props: Props) =>
  view(
    E.footer({ class: ["footer", { hidden: props.hidden }] }, [
      E.span({ class: "todo-count" }, [
        E.strong(props.itemsLeft),
        props.itemsLeft.map((n) => ` item${n === 1 ? "" : "s"} left`),
      ]),
      E.ul({ class: "filters" }, [
        filterItem("All", "", props.currentFilter),
        filterItem("Active", "active", props.currentFilter),
        filterItem("Completed", "completed", props.currentFilter),
      ]),
      E.button(
        { class: ["clear-completed", { hidden: props.noneAreCompleted }] },
        "Clear completed"
      ).use({ clearCompleted: "click" }),
    ])
  );

export default todoFooter;
