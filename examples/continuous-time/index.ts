import { map, snapshot, stepper, Stream, time } from "@funkia/hareactive";
import { elements as E, runComponent, component } from "../../src/index";

const formatTime = (t: number) => new Date(t).toTimeString().split(" ")[0];

type On = {
  snapClick: Stream<any>;
};

const main = component<On>((on, start) => {
  const msgFromClick = map(
    (t) => "You last pressed the button at " + formatTime(t),
    snapshot(time, on.snapClick)
  );
  const message = start(
    stepper("You've not clicked the button yet", msgFromClick)
  );

  return [
    E.h1("Continuous time example"),
    E.p(map(formatTime, time)),
    E.p(E.button("Click to snap time").use({ snapClick: "click" })),
    E.p(message)
  ];
});

runComponent("#mount", main);
