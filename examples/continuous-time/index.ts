import {
  Behavior,
  map,
  snapshot,
  stepper,
  Stream,
  time
} from "@funkia/hareactive";
import { elements, fgo, modelView, runComponent } from "../../src/index";

const { p, button, h1 } = elements;

const formatTime = (t: number): string =>
  new Date(t).toTimeString().split(" ")[0];

type ToView = {
  time: Behavior<number>;
  message: Behavior<string>;
};

type ViewOut = {
  snapClick: Stream<any>;
};

const model = fgo(function*({ snapClick }: ViewOut) {
  const msgFromClick = map(
    (t) => "You last pressed the button at " + formatTime(t),
    snapshot(time, snapClick)
  );
  const message = yield stepper(
    "You've not clicked the button yet",
    msgFromClick
  );
  return { time, message };
});

const view = ({ time, message }: ToView) => [
  h1("Continuous time example"),
  p(map(formatTime, time)),
  p(button("Click to snap time").use({ snapClick: "click" })),
  p(message)
];

const main = modelView<ToView, ViewOut>(model, view)();

runComponent("#mount", main);
