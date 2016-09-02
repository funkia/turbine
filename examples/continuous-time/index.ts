import {stepper, map} from "../../src/Behavior";
import {empty, snapshotWith} from "../../src/Events";
import {Component, h, br} from "../../src/DOMBuilder";
import {mount} from "../../src/bootstrap";
import timeB from "../../src/timeB";

const formatTime = (t: number): string => (new Date(t)).toTimeString().split(" ")[0];

const mmssB = map(formatTime, timeB);

function app(): Component {
  const btnClick = empty();

  const messageFromClick =
    snapshotWith((_, t) => "You last pressed the button at " + t, mmssB, btnClick);
  const clickTimeMessage = stepper("You've not clicked the button yet", messageFromClick);

  return h("div", { on: {}}, [
    h("span", ["Current time is: ", mmssB]),
    br(),
    br(),
    h("button", {on: {"click": btnClick }}, ["Click to snap time"]),
    br(),
    br(),
    h("span", [clickTimeMessage])
  ]);

}

mount("body", app);
