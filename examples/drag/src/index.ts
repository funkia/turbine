import {
  map, streamFromEvent, stepper, Now, toggle, sample, snapshot,
  switcher, Behavior, combine
} from "@funkia/hareactive";
import { runComponent, elements, go, fgo, modelView } from "../../../src";
const { span, input, div } = elements;

const mousemove = streamFromEvent(window, "mousemove");
const mousePosition = stepper(
  { x: 0, y: 0 }, mousemove.map((e) => ({ x: e.pageX, y: e.pageY }))
).at();

const boxModel = fgo(function* ({ startDrag, endDrag }, color: string) {
  const startDragAt = snapshot(mousePosition, startDrag);
  const dragOffset = map(
    (p) => map((p2) => ({ x: p2.x - p.x, y: p2.y - p.y }), mousePosition),
    startDragAt
  );
  const offset: Behavior<{x: number, y: number}> = yield sample(switcher(
    Behavior.of({ x: 0, y: 0 }),
    combine(dragOffset, endDrag.mapTo(Behavior.of({ x: 0, y: 0 })))
  ));
  const position = yield sample(stepper({x: 0, y: 0}, snapshot(offset, endDrag)));
  const endDragAt = snapshot(mousePosition, endDrag);
  const isBeingDragged = yield sample(toggle(false, startDrag, endDrag));
  return { isBeingDragged, offset };
}, Now);

const boxView = ({ isBeingDragged, offset }, color: string) =>
  div({
    class: "box",
    classToggle: { dragged: isBeingDragged },
    style: {
      background: color,
      left: offset.map(({ x }) => x + "px"),
      top: offset.map(({ y }) => y + "px")
    },
    output: { startDrag: "mousedown", endDrag: "mouseup" }
  });

const box = modelView(boxModel, boxView);

const main = go(function* () {
  yield box("red");
});

runComponent("#mount", main);
