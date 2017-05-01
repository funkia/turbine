import { flatten, foldr, go, lift, combine } from "@funkia/jabz";
import {
  Behavior, combineList, map, Now, sample, scan, scanS,
  stepper, Stream, switchStream
} from "@funkia/hareactive";

import { Component, dynamic, elements, list, loop, modelView, runComponent } from "../../../src";
const { ul, li, p, br, button, h1, div } = elements;

import { main1 } from "./version1";
import { main2 } from "./version2";
import { main3 } from "./version3";
import { counterList as main4 } from "./version4";

const numberToApp = {
  1: main1,
  2: main2,
  3: main3,
  4: main4
};

type AppId = keyof (typeof numberToApp);

function selectorButton(n: AppId, selected: Behavior<AppId>): Component<Stream<AppId>> {
  return button({
    class: "btn btn-default",
    classToggle: { active: selected.map((m) => n === m) }
  }, `Version ${n}`).map(({ click }) => click.mapTo(n));
}

const versionSelector = modelView(
  function ({ selectVersion }) {
    const selected = stepper("1", selectVersion);
    return Now.of([{ selected }, { selected }]);
  },
  function ({ selected }) {
    return div({class: "btn-group"}, function* () {
      const
        select1 = yield selectorButton("1", selected),
        select2 = yield selectorButton("2", selected),
        select3 = yield selectorButton("3", selected),
        select4 = yield selectorButton("4", selected);
      return { selectVersion: combine(select1, select2, select3, select4) };
    });
  }
);

const main = go(function* (): Iterator<Component<any>> {
  const { selected } = yield versionSelector();
  const currentApp = selected.map((n: AppId) => numberToApp[n]);
  yield div(dynamic(currentApp));
  return {};
});

runComponent("#mount", main);
