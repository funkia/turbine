import { Behavior, stepper, Stream } from "@funkia/hareactive";
import { go } from "@funkia/jabz";
import { elements, fgo, runComponent, view, component } from "../../../src";
import { main1 } from "./version1";
import { main2 } from "./version2";
import { main3 } from "./version3";
import { main4 } from "./version4";

const { button, div } = elements;

const numberToApp = { "1": main1, "2": main2, "3": main3, "4": main4 };

type AppId = keyof (typeof numberToApp);

const selectorButton = (n: AppId, selected: Behavior<AppId>) =>
  view(
    button(
      {
        class: ["btn btn-default", { active: selected.map((m) => n === m) }]
      },
      `Version ${n}`
    ).output((o) => ({ selectVersion: o.click.mapTo(n).log(n) }))
  );

type FromView = {
  selectVersion: Stream<AppId>;
};

type FromModel = {
  selected: Behavior<AppId>;
};

const versionSelector = component<FromView, FromModel>(
  fgo(function*({ selectVersion }) {
    const selected = yield stepper("1", selectVersion);
    return div({ class: "btn-group" }, [
      selectorButton("1", selected).output({ selectVersion: "selectVersion" }),
      selectorButton("2", selected).output({ selectVersion: "selectVersion" }),
      selectorButton("3", selected).output({ selectVersion: "selectVersion" }),
      selectorButton("4", selected).output({ selectVersion: "selectVersion" })
    ]).result({ selected });
  })
);

const main = go(function*() {
  const { selected } = yield versionSelector.output({ selected: "selected" });
  const currentApp = selected.map((n: AppId) => numberToApp[n]);
  yield div(currentApp);
  return {};
});

runComponent("#mount", main);
