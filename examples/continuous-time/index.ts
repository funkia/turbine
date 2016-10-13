import {go} from "jabz/monad";

import {Behavior, stepper, time} from "hareactive/Behavior";
import {Stream, snapshot} from "hareactive/Stream";
import {Now, sample} from "hareactive/Now";

import {Component, component} from "../../src/component";
import {runMain} from "../../src/bootstrap"
import {list} from "../../src/dom-builder";
import {span, input, br, text, button, div, h1} from "../../src/elements";

const formatTime = (t: number): string => (new Date(t)).toTimeString().split(" ")[0];

type ToView = [Behavior<number>, Behavior<string>];

type ViewOut = {
  snapClick: Stream<any>
};

const main = component<ToView, ViewOut, {}>({
  model: ({snapClick}) => go(function*(): Iterator<Now<any>> {
    const msgFromClick =
      snapshot(time, snapClick).map((t) => "You last pressed the button at " + formatTime(t));
    const message = stepper("You've not clicked the button yet", msgFromClick);
    return Now.of([[time, message], {}]);
  }),
  view: ([time, message]) => go(function*(): Iterator<Component<any>> {
    yield text(time.map(formatTime));
    yield br;
    const {click: snapClick} = yield button("Click to snap time");
    yield br;
    yield text(message);
    return Component.of({snapClick});
  }),
});

runMain("body", main);
