var max = Math.max
var min = Math.min
var toString = Object.prototype.toString

var contextType = "[object CanvasRenderingContext2D]"
var defaults = {
    width: "auto",
    height: "auto",
    srcX: 0,
    srcY: 0,
    dstX: 0,
    dstY: 0,
    outX: 0,
    outY: 0
}

module.exports = blend

function blend(blender, src, dst, out, opts) {
    var srcW, srcH, dstW, dstH, outW, outH, srcImage, dstImage, outImage

    var srcType = toString.apply(src)
    var dstType = toString.apply(dst)
    var outType = toString.apply(out)

    opts = opts || defaults

    var srcX = opts.srcX || defaults.srcX
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

    if (outType === contextType) {
        outW = out.canvas.width
        outH = out.canvas.height
    } else {
        outW = out.width
        outH = out.height
    }

    if (width === "auto") {
        width = srcW
    }

    if (height === "auto") {
        height = srcH
    }

    width = max(0, min(width, srcW - srcX, dstW - dstX, outW - outX))
    height = max(0, min(height, srcH - srcY, dstH - dstY, outH- outY))

    if (width === 0 || height === 0) {
        return
    }

    srcImage = getImageData(src, srcX, srcY, width, height)
    dstImage = getImageData(dst, dstX, dstY, width, height)

    if (out === dst) {
        outImage = dstImage
    } else if (outType !== contextType &&
        outX === 0 &&
        outY === 0 &&
        outW === width &&
        outH === height
    ) {
        outImage = out
    } else {
        outImage = {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 4)
        }
    }

    blender(srcImage.data, dstImage.data, outImage.data)

    putImageData(out, outImage, outX, outY)
}

function getImageData(image, x, y, width, height) {
    if (toString.apply(image) === contextType) {
        return image.getImageData(x, y, width, height)
    }

    if (x === 0 && y === 0 && width >= image.width && height >= image.height) {
        return image
    }

    var imageData = image.data

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

        surface.set(imageData.subarray(rowStart, rowEnd), row * rowWidth)
    }

    return {
        width: width,
        height: height,
        data: surface
    }
}

function putImageData(dst, src, x, y) {
    // if you put an image over itself in the same place then exit early
    if (src === dst && x === 0 && y === 0) {
        return
    }

    if (toString.apply(dst) === contextType) {
        var imageData = dst.createImageData(src.width, src.height)
        imageData.data.set(src.data)
        dst.putImageData(imageData, x, y)
        return
    }

    var srcMinX = x
    var srcMinY = y
    var srcMaxX = x + src.width - 1
    var srcMaxY = y + src.height - 1

    var dstMinX = 0
    var dstMinY = 0
    var dstMaxX = dst.width - 1
    var dstMaxY = dst.height - 1

    // bbox overlap check
    if (srcMinX > dstMaxX || srcMaxX < dstMinX ||
        srcMinY > dstMaxY || srcMaxY < dstMinY) {
        return
    }

    var oMinX = max(srcMinX, dstMinX)
    var oMinY = max(srcMinY, dstMinY)
    var oMaxX = min(srcMaxX, dstMaxX)
    var oMaxY = min(srcMaxY, dstMaxY)


    var source = src.data
    var destination = dst.data

    var srcLeft = max(oMinX - x, 0)
    var srcTop = max(oMinY - y, 0)
    var srcWidth = src.width
    var dstLeft = oMinX
    var dstTop = oMinY
    var dstWidth = dst.width
    var rows = oMaxY - oMinY + 1
    var columns = oMaxX - oMinX + 1

    for (var row = 0; row < rows; row++) {
        var srcStart = 4 * ((srcWidth * (row + srcTop)) + srcLeft)
        var srcEnd = srcStart + (4 * columns)
        var dstStart = 4 * ((dstWidth * (row + dstTop)) + dstLeft)

        destination.set(source.subarray(srcStart, srcEnd), dstStart)
    }
}
