import { Behavior, combine, sample, stepper, Stream } from "@funkia/hareactive";
import { go } from "@funkia/jabz";
import {
  Component,
  dynamic,
  elements,
  fgo,
  modelView,
  runComponent
} from "../../../src";
import { main1 } from "./version1";
import { main2 } from "./version2";
import { main3 } from "./version3";
import { counterList as main4 } from "./version4";

const { ul, li, p, br, button, h1, div } = elements;

const numberToApp = {
  1: main1,
  2: main2,
  3: main3,
  4: main4
};

type AppId = keyof (typeof numberToApp);

function selectorButton(
  n: AppId,
  selected: Behavior<AppId>
): Component<{ select: Stream<AppId> }> {
  return button(
    {
      class: ["btn btn-default", { active: selected.map((m) => n === m) }]
    },
    `Version ${n}`
  ).map(({ click }) => ({
    select: click.mapTo(n)
  }));
}

type FromView = {
  selectVersion: Stream<AppId>;
};

type FromModel = {
  selected: Behavior<AppId>;
};

const versionSelector = modelView<FromModel, FromView>(
  fgo(function*({ selectVersion }) {
    const selected = yield sample(stepper("1", selectVersion));
    return { selected };
  }),
  ({ selected }) =>
    div({ class: "btn-group" }, [
      selectorButton("1", selected).output({ select1: "select" }),
      selectorButton("2", selected).output({ select2: "select" }),
      selectorButton("3", selected).output({ select3: "select" }),
      selectorButton("4", selected).output({ select4: "select" })
    ])
      .map((o) => ({
        selectVersion: combine(o.select1, o.select2, o.select3, o.select4)
      }))
      .output({ selectVersion: "selectVersion" })
);

const main = go(function*() {
  const { selected } = yield versionSelector();
  const currentApp = selected.map((n: AppId) => numberToApp[n]);
  yield div(dynamic(currentApp));
  return {};
});

runComponent("#mount", main);
