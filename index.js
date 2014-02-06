var max = Math.max
var min = Math.min
var toString = Object.prototype.toString

var canvasType = "[object Canvas]"
var contextType = "[object Context2D]"
var defaults = {
    width: "auto",
    height: "auto",
    srcX: 0,
    srcY: 0,
    dstX: 0,
    dstY: 0
}

module.exports = blend

function blend() { }

function blend(blender, src, dst, outImage, opts) {
    var srcW, srcH, dstW, dstH, outW, outH, srcData, dstData, outData

    var srcType = toString.apply(src)
    var dstType = toString.apply(dst)

    var srcX = opts.srcX || defaults.srxX
    var srcY = opts.srcY || defaults.srcY
    var dstX = opts.dstX || defaults.dstX
    var dstY = opts.dstY || defaults.dstY
    var outX = opts.outX || defaults.outX
    var outY = opts.outY || defaults.outY
    var width = opts.width || defaults.width
    var height = opts.height || defaults.height


    if (srcType === contextType) {
        srcW = src.canvas.width
        srcH = src.canvas.height
    } else {
        srcW = src.width
        srcH = src.height
    }

    if (dstType === contextType) {
        dstW = dst.canvas.width
        dstH = dst.canvas.height
    } else {
        dstW = dst.width
        dstH = dst.height
    }

    outW = outImage.width
    outH = outImage.height

    if (width === "auto") {
        width = srcW
    }

    if (height === "auto") {
        height = srcH
    }

    width = max(0, min(width, srcW - srcX, dstW - dstX, outW - outX))
    height = max(0, min(height, srcH - srcY, dstH - dstY, outH- outY))

    srcData = getImageData(src, srcX, srcY, width, height)
    dstData = getImageData(dst, dstX, dstY, width, height)

    if (outX === 0 && outY === 0 && outW === width && outH === height) {
        outData = outImage.data
    } else {
        outData = new Uint8ClampedArray(width * height * 4)
    }

    blender(srcData, dstData, outData)

    putImageData(outImage, outData, outX, outY, width, height)
}

function getImageData(image, x, y, width, height) {
    if (width >= image.width && height >= image.height) {
        return image.data
    }

    // clamp the width and height
    width = max(0, min(x + width, image.width - x))
    height = max(0, min(y + height, image.height - y))

    var surface = new Uint8ClampedArray(4 * width * height)

    var rowWidth = width * 4
    var srcWidth = image.width * 4
    var srcLeft = 4 * x


    for (var row = 0; row < height; row++) {
        var rowStart = (srcWidth * (row + y)) + srcLeft
        var rowEnd = rowStart + rowWidth

        surface.set(image.subarray(rowStart, rowEnd), row * rowWidth)
    }

    return surface
}

function putImageData(image, data, x, y, width, height) {
    if (image.data === data && x === 0 && y === 0) {
        return
    }

    // clamp the width and height
    width = max(0, min(x + width, image.width - x))
    height = max(0, min(y + height, image.height - y))

    var surface = image.data

    var rowWidth = width * 4
    var srcWidth = image.width * 4
    var srcLeft = 4 * x


    for (var row = 0; row < height; row++) {
        var rowStart = (srcWidth * (row + y)) + srcLeft
        var rowEnd = rowStart + rowWidth

        surface.set(image.subarray(rowStart, rowEnd), row * rowWidth)
    }
}
