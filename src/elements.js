"use strict";
exports.__esModule = true;
var dom_builder_1 = require("./dom-builder");
exports.input = dom_builder_1.element("input", {
    actionDefinitions: {
        focus: function (element) { return element.focus(); }
    },
    behaviors: {
        inputValue: dom_builder_1.behaviorDescription("input", function (evt) { return evt.target.value; }, function (elm) { return elm.value; })
    }
});
function getTargetChecked(event) {
    return event.target.checked;
}
exports.checkbox = dom_builder_1.element("input[type=checkbox]", {
    behaviors: {
        checked: dom_builder_1.behaviorDescription("change", getTargetChecked, function (elm) { return elm.checked; })
    },
    streams: {
        checkedChange: dom_builder_1.streamDescription("change", getTargetChecked)
    }
});
exports.button = dom_builder_1.element("button");
exports.a = dom_builder_1.element("a");
exports.label = dom_builder_1.element("label");
exports.br = dom_builder_1.element("br")();
exports.span = dom_builder_1.element("span");
exports.div = dom_builder_1.element("div");
exports.p = dom_builder_1.element("p");
exports.h1 = dom_builder_1.element("h1");
exports.ul = dom_builder_1.element("ul");
exports.li = dom_builder_1.element("li");
exports.strong = dom_builder_1.element("strong");
exports.section = dom_builder_1.element("section");
exports.nav = dom_builder_1.element("nav");
exports.aside = dom_builder_1.element("aside");
exports.article = dom_builder_1.element("article");
exports.header = dom_builder_1.element("header");
exports.footer = dom_builder_1.element("footer");
var component_1 = require("./component");
exports.text = component_1.text;
