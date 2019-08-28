import * as H from "@funkia/hareactive";
import { streamFromEvent } from "@funkia/hareactive/dom";
import { runComponent, elements as E, component } from "../../../src";

type Point = { x: number; y: number };

const mousemove = streamFromEvent(window, "mousemove", (e) => ({
  x: e.pageX,
  y: e.pageY
}));

const addPoint = (p1: Point, p2: Point) => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y
});

type BoxModelInput = {
  startDrag: H.Stream<void>;
  endDrag: H.Stream<void>;
};

const box = (color: string) =>
  component<BoxModelInput>((on, start) => {
    const mousePosition = start(H.stepper({ x: 0, y: 0 }, mousemove));
    const startDragAt = H.snapshot(mousePosition, on.startDrag);
    const dragOffset = H.map(
      (p) => H.map((p2) => ({ x: p2.x - p.x, y: p2.y - p.y }), mousePosition),
      startDragAt
    );
    const offset: H.Behavior<Point> = start(
      H.switcher(
        H.Behavior.of({ x: 0, y: 0 }),
        H.combine(dragOffset, on.endDrag.mapTo(H.Behavior.of({ x: 0, y: 0 })))
      )
    );
    const committed: H.Behavior<Point> = start(
      H.accum(addPoint, { x: 0, y: 0 }, H.snapshot(offset, on.endDrag))
    );
    const position = H.lift(addPoint, committed, offset);
    const isBeingDragged = start(H.toggle(false, on.startDrag, on.endDrag));

    return E.div({
      class: ["box", { dragged: isBeingDragged }],
      style: {
        background: color,
        left: position.map(({ x }) => x + "px"),
        top: position.map(({ y }) => y + "px")
      }
    }).use({ startDrag: "mousedown", endDrag: "mouseup" });
  });

runComponent("#mount", box("red"));
