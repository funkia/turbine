import { elements as E } from "../../../src";

// Counter
const counterView = E.div([
  "Counter ",
  1,
  " ",
  E.button({ class: "btn btn-default" }, "+"),
  " ",
  E.button({ class: "btn btn-default" }, " - ")
]);

export const main1 = counterView;
