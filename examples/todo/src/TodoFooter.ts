import * as H from "@funkia/hareactive";
import { elements, view } from "../../../src";
const { span, button, ul, li, a, footer, strong } = elements;

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
    li(
      a(
        {
          href: `#/${path}`,
          class: { selected: currentFilter.map((s) => s === path) }
        },
        name
      ).use({ click: "click" })
    )
  );

const todoFooter = (props: Props) =>
  view(
    footer({ class: ["footer", { hidden: props.hidden }] }, [
      span({ class: "todo-count" }, [
        strong(props.itemsLeft),
        props.itemsLeft.map((n) => ` item${n === 1 ? "" : "s"} left`)
      ]),
      ul({ class: "filters" }, [
        filterItem("All", "", props.currentFilter),
        filterItem("Active", "active", props.currentFilter),
        filterItem("Completed", "completed", props.currentFilter)
      ]),
      button(
        { class: ["clear-completed", { hidden: props.noneAreCompleted }] },
        "Clear completed"
      ).use({ clearCompleted: "click" })
    ])
  );

export default todoFooter;
