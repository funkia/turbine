"use strict";
exports.__esModule = true;
var hareactive_1 = require("@funkia/hareactive");
var index_1 = require("../../src/index");
var input = index_1.elements.input, p = index_1.elements.p, button = index_1.elements.button, div = index_1.elements.div, h1 = index_1.elements.h1;
var formatTime = function (t) { return (new Date(t)).toTimeString().split(" ")[0]; };
function model(_a) {
    var snapClick = _a.snapClick;
    var msgFromClick = hareactive_1.map(function (t) { return "You last pressed the button at " + formatTime(t); }, hareactive_1.snapshot(hareactive_1.time, snapClick));
    var message = hareactive_1.stepper("You've not clicked the button yet", msgFromClick);
    return hareactive_1.Now.of([{ time: hareactive_1.time, message: message }, {}]);
}
function* view(_a) {
    var time = _a.time, message = _a.message;
    yield h1("Continuous time example");
    yield p(index_1.dynamic(hareactive_1.map(formatTime, time)));
    var snapClick = (yield p(button("Click to snap time"))).click;
    yield p(index_1.dynamic(message));
    return { snapClick: snapClick };
}
var main = index_1.modelView(model, view)();
index_1.runComponent("#mount", main);
