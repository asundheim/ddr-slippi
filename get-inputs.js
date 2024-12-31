import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { SlippiGame } = require("@slippi/slippi-js");
const fs = require('fs')

const game = new SlippiGame("data/game.slp");

const frames = game.getFrames();
let recording_range = JSON.parse(fs.readFileSync('data/playback_new.json'))
let start = recording_range.startFrame
let end = recording_range.endFrame

console.log(`startFrame: ${start} endFrame: ${end}`)

let ders_port = game.getMetadata().players[0].names.netplay === "ders" ? 0 : 1
console.log(`ders is player ${ders_port}`)
const opp = game.getMetadata().players[ders_port ^ 1]
let opp_name = opp.names.code

function is_set(buttonState, mask)
{
    return (buttonState & mask) != 0
}
    
function getInput(currentButtons, previousButtons)
{
    let s = (currentButtons ^ previousButtons) & currentButtons;
    const stick_up = 0x00010000
    const stick_down = 0x00020000
    const stick_left = 0x00040000
    const stick_right = 0x00080000
    const c_up = 0x00100000
    const c_down = 0x00200000
    const c_left = 0x00400000
    const c_right = 0x00800000
    const a_button = 0x0100
    const b_button = 0x0200
    const x_button = 0x0400
    const y_button = 0x0800
    const r_t = 0x0020
    const l_t = 0x0040
    const z = 0x0010

    let buttonMap = {
        up: stick_up,
        down: stick_down,
        left: stick_left,
        right: stick_right,
        upc: c_up,
        downc: c_down,
        leftc: c_left,
        rightc: c_right,
        a: a_button,
        b: b_button,
        z: z,
        rt: r_t,
        y: y_button
    }

    let buttonsPressed = []
    for (const [key, value] of Object.entries(buttonMap))
    {
        if (is_set(s, value))
        {
            buttonsPressed.push(key)
        }
    }
   
    return buttonsPressed
}

let frameData = 
{
    frames: [],
    opp:
    {
        name: opp_name
    }
}

for (let i = start; i < end; i++)
{
    let out = getInput(frames[i].players[ders_port].pre.buttons, frames[i-1].players[ders_port].pre.buttons)

    frameData["frames"].push(out)
}

var json = JSON.stringify(frameData)
fs.writeFileSync('data/ddr.json', json, 'utf8', () => {})

process.exit(0)