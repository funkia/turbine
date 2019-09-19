import { elements as E, runComponent, component } from "../../src";
import * as H from "@funkia/hareactive";

function resetOn<A>(
  b: H.Behavior<H.Behavior<A>>,
  reset: H.Stream<any>
): H.Behavior<H.Behavior<A>> {
  return b.chain((bi) => H.switcherFrom(bi, H.snapshot(b, reset)));
}

type TimerOn = {
  elapsed: H.Behavior<number>;
  maxTime: H.Behavior<number>;
  resetTimer: H.Stream<any>;
};

const timer = component<TimerOn>((on, start) => {
  const change = H.lift(
    (max, cur) => (cur <= max ? 1 / 1000 : 0),
    on.maxTime,
    on.elapsed
  );
  const elapsed = start(
    H.sample(resetOn(H.integrateFrom(change), on.resetTimer))
  );
  return E.div([
    E.h1("Timer"),
    E.span(0),
    E.progress({
      value: elapsed,
      max: on.maxTime
    }),
    E.span(on.maxTime),
    E.div(["Elapsed seconds: ", elapsed.map(Math.round)]),
    E.input({ type: "range", min: 0, max: 60, value: 10 }).use((o) => ({
      maxTime: o.value.map(parseFloat)
    })),
    E.div({}, E.button("Reset").use({ resetTimer: "click" }))
  ]).use((_) => ({ elapsed }));
});

runComponent("#mount", timer);
