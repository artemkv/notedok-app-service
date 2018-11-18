"use strict";

const QUnit = require("qunit");
const Util = require("../src/modules/util");

QUnit.test("line count - basic", function (assert) {
    var text = "1\n2\n3";

    assert.equal(Util.countLines(text), 3, "line count - basic");
});

QUnit.test("line count - empty text", function (assert) {
    var text = "";

    assert.equal(Util.countLines(text), 0, "line count - empty text");
});

QUnit.test("line count - no text", function (assert) {
    assert.equal(Util.countLines(null), 0, "line count - no text");
});

QUnit.test("line count - empty lines", function (assert) {
    var text = "1\n2\n\n3\n";

    assert.equal(Util.countLines(text), 5, "line count - empty lines");
});

QUnit.test("line count - long line", function (assert) {
    var text = "0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 01234567890123456789";

    assert.equal(Util.countLines(text), 2, "line count - long line");
});

QUnit.test("line count - very long line", function (assert) {
    var text = "0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 01234567890123456789";

    assert.equal(Util.countLines(text), 3, "line count - very long line");
});

QUnit.test("line count - combined", function (assert) {
    var text = "1\n0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 0123456789012345678901234567890123456789 01234567890123456789\n\n3";

    assert.equal(Util.countLines(text), 6, "line count - very long line");
});