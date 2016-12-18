import {Behavior, stepper, time} from "hareactive/behavior";
import {Stream, snapshot} from "hareactive/stream";
import {Now, sample} from "hareactive/now";

import {Component, component, runMain, list, elements, dynamic} from "../../src";
const {span, input, br, text, button, div, h1} = elements;

const formatTime = (t: number): string => (new Date(t)).toTimeString().split(" ")[0];

type ToView = {
  time: Behavior<number>,
  message: Behavior<string>
};

type ViewOut = {
  snapClick: Stream<any>
};

function model({snapClick}): Now<any> {
  const msgFromClick =
    snapshot(time, snapClick).map((t) => "You last pressed the button at " + formatTime(t));
  const message = stepper("You've not clicked the button yet", msgFromClick);
  return Now.of([{time, message}, {}]);
}

function* view({time, message}): Iterator<Component<any>> {
  yield dynamic(time.map(formatTime));
  yield br;
  const {click: snapClick} = yield button("Click to snap time");
  yield br;
  yield dynamic(message);
  return {snapClick};
}

const main = component<ToView, ViewOut, {}>(model, view);

runMain("#mount", main);
