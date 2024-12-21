const { SlippiGame } = require("@slippi/slippi-js");

const game = new SlippiGame("data/game.slp");

const frames = game.getFrames();
const start = 108 * 60
const end = 125 * 60

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
    frames: []
}

for (let i = start; i < end; i++)
{
    let out = getInput(frames[i].players[1].pre.buttons, frames[i-1].players[1].pre.buttons)

    frameData["frames"].push(out)
}

var json = JSON.stringify(frameData)
var fs = require('fs')
fs.writeFile('data/ddr.json', json, 'utf8', () => {})
