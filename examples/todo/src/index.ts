import "todomvc-app-css/index.css";
import { runComponent } from "../../../src";
import { app } from "./TodoApp";
import { createRouter } from "@funkia/rudolph";

const router = createRouter({
  useHash: true
});

runComponent("#mount", app(router));
