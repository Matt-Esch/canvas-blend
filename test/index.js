var test = require("tape")

var canvasBlend = require("../index")

test("canvasBlend is a function", function (assert) {
    assert.equal(typeof canvasBlend, "function")
    assert.end()
})
