import {
  map, streamFromEvent, stepper, Now, toggle, sample, snapshot,
  switcher, Behavior, combine, scan, snapshotWith, loopNow
} from "@funkia/hareactive";
import { lift } from "@funkia/jabz";
import { runComponent, elements, go, fgo, modelView } from "../../../src";
const { span, input, div } = elements;

type Point = { x: number, y: number };

const mousemove = streamFromEvent(window, "mousemove");
const mousePosition = stepper(
  { x: 0, y: 0 }, mousemove.map((e) => ({ x: e.pageX, y: e.pageY }))
).at();

const addPoint = (p1, p2) => ({ x: p1.x + p2.x, y: p1.y + p2.y });

const pos = (x, y): Point => ({ x, y });

const boxModel = fgo(function* ({ startDrag, endDrag }, color: string) {
  const startDragAt = snapshot(mousePosition, startDrag);
  const dragOffset = map(
    (p) => map((p2) => ({ x: p2.x - p.x, y: p2.y - p.y }), mousePosition),
    startDragAt
  );
  const offset: Behavior<Point> = yield sample(switcher(
    Behavior.of({ x: 0, y: 0 }),
    combine(dragOffset, endDrag.mapTo(Behavior.of({ x: 0, y: 0 })))
  ));
  const committed = yield sample(scan(addPoint, { x: 0, y: 0 }, snapshot(offset, endDrag)));
  const position = lift(addPoint, committed, offset);
  const isBeingDragged = yield sample(toggle(false, startDrag, endDrag));
  return { isBeingDragged, position };
});

const boxView = ({ isBeingDragged, position }, color: string) =>
  div({
    class: ["box", { dragged: isBeingDragged }],
    style: {
      background: color,
      left: position.map(({ x }) => x + "px"),
      top: position.map(({ y }) => y + "px")
    },
    output: { startDrag: "mousedown", endDrag: "mouseup" }
  });

const box = modelView(boxModel, boxView);

const main = go(function* () {
  yield box("red");
});

runComponent("#mount", main);
