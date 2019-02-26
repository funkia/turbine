import { elements } from "../../../src";
const { div, button } = elements;

// Counter
const counterView = div([
  "Counter ",
  1,
  " ",
  button({ class: "btn btn-default" }, "+"),
  " ",
  button({ class: "btn btn-default" }, " - ")
]);

export const main1 = counterView;
