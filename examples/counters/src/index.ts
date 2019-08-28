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
    ).use((o) => ({ selectVersion: o.click.mapTo(n) }))
  );

type On = {
  selectVersion: Stream<AppId>;
};

type FromModel = {
  selected: Behavior<AppId>;
};

const versionSelector = component<On, FromModel>((on, start) => {
  const selected = start(stepper("1", on.selectVersion));
  return div({ class: "btn-group" }, [
    selectorButton("1", selected).use({ selectVersion: "selectVersion" }),
    selectorButton("2", selected).use({ selectVersion: "selectVersion" }),
    selectorButton("3", selected).use({ selectVersion: "selectVersion" }),
    selectorButton("4", selected).use({ selectVersion: "selectVersion" })
  ]).output({ selected });
});

const main = component<FromModel>((on) => {
  const currentApp = on.selected.map((n: AppId) => numberToApp[n]);
  return [versionSelector.use({ selected: "selected" }), div(currentApp)];
});

runComponent("#mount", main);
