const { basename, join }= require('path')
const util = require('util')
const child_process = require('child_process')
const exec = util.promisify(child_process.exec)
const execFile = util.promisify(child_process.execFile)

const logo = join(__dirname, '..', './watermark.png')

async function applyBorder (img, width, color) {
    try {
        return await execFile('convert', [
            img,
            '-bordercolor', color,
            '-border', width,
            img
        ])
    } catch (e) {
        console.error(e)
    }
}

async function applyLogo (img, logo, gravity, geometry) {
    const command = `convert -composite -gravity ${gravity} -geometry ${geometry} "${img}" ${logo} "${img}"`
    try {
        // I don't know why but this command needs a shell so we use exec
        // instead of execFile like our other ImageMagick commands.
        return await exec(command)
    } catch (e) {
        console.error(e)
    }
}

async function watermark (img) {
    const { stdout, stderr } = await execFile('identify', ['-format', '%w', img])
    const width = parseInt(stdout)

    // Border width is roughly 0.7% of image's width. This is based on image
    // mockups where an image with a width of 1800px was given a 12px border.
    const borderWidth = Math.floor(width * 0.7 * 0.01)
    const borderColor = '#21bf73'
    await applyBorder(img, borderWidth, borderColor)

    if (basename(img).startsWith('cover-')) return

    const gravity = 'SouthEast'
    const logoWidth = Math.round(width / 4)
    const logoOffset = Math.round(width / 200) + borderWidth
    const geometry = `${logoWidth}x+${logoOffset}+${logoOffset}`
    return await applyLogo(img, logo, gravity, geometry)
}

module.exports = watermark
