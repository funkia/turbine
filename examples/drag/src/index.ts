import {
  map,
  streamFromEvent,
  stepper,
  toggle,
  snapshot,
  switcher,
  Behavior,
  combine,
  lift,
  runNow,
  Stream,
  accum
} from "@funkia/hareactive";
import { runComponent, elements, go, fgo, modelView } from "../../../src";
const { div } = elements;

type Point = { x: number; y: number };

const mousemove = streamFromEvent(window, "mousemove");
const mousePosition = runNow(
  stepper({ x: 0, y: 0 }, mousemove.map((e) => ({ x: e.pageX, y: e.pageY })))
);

const addPoint = (p1: Point, p2: Point) => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y
});

type BoxModelInput = {
  startDrag: Stream<void>;
  endDrag: Stream<void>;
};

const boxModel = fgo(function*(
  { startDrag, endDrag }: BoxModelInput,
  color: string
) {
  const startDragAt = snapshot(mousePosition, startDrag);
  const dragOffset = map(
    (p) => map((p2) => ({ x: p2.x - p.x, y: p2.y - p.y }), mousePosition),
    startDragAt
  );
  const offset: Behavior<Point> = yield switcher(
    Behavior.of({ x: 0, y: 0 }),
    combine(dragOffset, endDrag.mapTo(Behavior.of({ x: 0, y: 0 })))
  );
  const committed: Behavior<Point> = yield accum(
    addPoint,
    { x: 0, y: 0 },
    snapshot(offset, endDrag)
  );
  const position = lift(addPoint, committed, offset);
  const isBeingDragged = yield toggle(false, startDrag, endDrag);
  return { isBeingDragged, position };
});

type BoxViewInput = {
  position: Behavior<Point>;
  isBeingDragged: Behavior<boolean>;
};

const boxView = ({ isBeingDragged, position }: BoxViewInput, color: string) =>
  div({
    class: ["box", { dragged: isBeingDragged }],
    style: {
      background: color,
      left: position.map(({ x }) => x + "px"),
      top: position.map(({ y }) => y + "px")
    }
  }).use({ startDrag: "mousedown", endDrag: "mouseup" });

const box = modelView(boxModel, boxView);

const main = go(function*() {
  yield box("red");
});

runComponent("#mount", main);
