import {
  Behavior, stepper, time, Stream, snapshot, Now, sample, map
} from "@funkia/hareactive";

import {
  Component, modelView, runComponent, list, elements, dynamic, fgo
} from "../../src/index";
const { input, p, button, div, h1 } = elements;

const formatTime = (t: number): string => (new Date(t)).toTimeString().split(" ")[0];

type ToView = {
  time: Behavior<number>,
  message: Behavior<string>
};

type ViewOut = {
  snapClick: Stream<any>
};

const model = fgo(function* ({ snapClick }: ViewOut) {
  const msgFromClick = map(
    (t) => "You last pressed the button at " + formatTime(t),
    snapshot(time, snapClick)
  );
  const message = yield sample(stepper("You've not clicked the button yet", msgFromClick));
  return {time, message};
});

function* view({ time, message }: ToView): Iterator<Component<any>> {
  yield h1("Continuous time example");
  yield p(map(formatTime, time));
  const { click: snapClick } = yield p(button("Click to snap time"));
  yield p(message);
  return { snapClick };
}

const main = modelView<ToView, ViewOut>(model, view)();

runComponent("#mount", main);
