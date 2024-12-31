import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { spawn, fork } = require('child_process');
const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const fs = require('fs')
const readline = require('readline');
const find = require('find-process')
const { SlippiGame } = require("@slippi/slippi-js");

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

async function kill_slippis()
{
    let slippis = await find("name", /Slippi Dolphin/)
    for (var slippi of slippis)
    {
        process.kill(slippi.pid, 'SIGTERM')
    }
}

function set_player_only_gecko()
{
    let player_only_ini_contents = fs.readFileSync('data/player-only.ini')
    fs.writeFileSync(`${gecko_code_path}`, player_only_ini_contents)
}

function set_stage_only_gecko()
{
    let stage_only_ini_contents = fs.readFileSync('data/stage-only.ini')
    fs.writeFileSync(`${gecko_code_path}`, stage_only_ini_contents)
}

function set_unmodified_gecko()
{
    let unmodified_ini_contents = fs.readFileSync('data/unmodified.ini')
    fs.writeFileSync(`${gecko_code_path}`, unmodified_ini_contents)
}

const gecko_code_path = 'C:\\Users\\ander\\AppData\\Roaming\\Slippi Launcher\\playback\\User\\GameSettings\\GALE01.ini'

const obs_settings = {
    ip: 'ws://172.19.176.1',
    port: '4455'
}

let startedRecording = false;
async function start_recording(obs)
{
    await obs.call('StartRecord')
    startedRecording = true
}

async function stop_recording(obs)
{
    await obs.call('StopRecord')
}

async function set_scene(obs, sceneName)
{
    await obs.call('SetCurrentProgramScene', {sceneName: sceneName})
}

async function set_output_folder(obs, folderPath)
{
    fs.mkdirSync(folderPath, {recursive: true})
    await obs.call('SetRecordDirectory', {recordDirectory: folderPath})
}

async function set_output_filename(obs, fileName)
{
    await obs.call('SetProfileParameter', 
    {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting',
        parameterValue: fileName
    })
}

let framesSkipped = []
function launchDolphinForRecording(obs, startFrame, stopFrame, playbackPath, autostart)
{
    const dolphin = spawn
    (
        '"C:\\Users\\ander\\AppData\\Roaming\\Slippi Launcher\\playback\\Slippi Dolphin.exe"', 
        [
            `-i ${playbackPath}`,
            '-e "C:\\Users\\ander\\Downloads\\Super Smash Bros. Melee (v1.02) - Rebuilt, v1.iso"',
            '--cout'
        ],
        { 
            shell: true 
        }
    );

    let onComplete = undefined
    let ret = new Promise(resolve => { onComplete = resolve})
    
    const frameRegex = /\[CURRENT_FRAME\] (\d+)/

    dolphin.stdout.on('data',
        (data) =>
        {
            let match = data.toString().match(frameRegex)
            if (match !== null)
            {
                let frameNum = parseInt(match[1])

                if (frameNum == startFrame && autostart)
                {
                    start_recording(obs)
                    startedRecording = true
                    console.log(`started recording on frame: ${frameNum}`)
                }
                
                if (!startedRecording)
                {
                    console.log(`skipped frame: ${frameNum}`)
                    framesSkipped.push(frameNum)
                }
                else
                {
                    console.log(`recorded frame: ${frameNum}`)
                }

                if (frameNum == stopFrame)
                {
                    stop_recording(obs).then(() => 
                    {
                        dolphin.kill()
                        console.log(`Stopped recording`)
                        onComplete()
                    });
                }
            }
            else
            {
                //console.log(`ignoring ${data}`)
            }
        }
    );

    dolphin.stderr.on('data',
        (data) => {
            console.error(`stderr: ${data}`);
    });

    dolphin.on('close',
        (code) => {
            console.log(
                `child process exited with code ${code}`
            );
        });

    return ret;
}

function read_write_inputs()
{
    var get_inputs = fork('./get-inputs.js')
    let onComplete = undefined
    let ret = new Promise(resolve => { onComplete = resolve })

    get_inputs.on('exit', (code) => 
    {
        onComplete();
    })

    return ret;
}

function record_arrows()
{
    const electron = spawn
    (
        'npm', 
        [
            'start'
        ],
        { 
            shell: true 
        }
    );

    let onComplete = undefined
    let ret = new Promise(resolve => { onComplete = resolve })

    electron.on('exit', (code) => {
        console.log(`electron exited with code ${code}`)
        onComplete()
    })

    return ret;
}

const obs = new OBSWebSocket();
const { obsWebSocketVersion, negotiatedRpcVersion } = 
    await obs.connect(`${obs_settings.ip}:${obs_settings.port}`);
console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)

const playback_path = 'data/playback.json'
const new_playback_path = 'data/playback_new.json'

let playbackInfo = JSON.parse(fs.readFileSync(playback_path))
console.log(`got data: ${playbackInfo.startFrame}, ${playbackInfo.endFrame}, ${playbackInfo.replay}`)

let replay_data = null

let command = await askQuestion("Frame Start: ")
if (command !== "")
{
    let new_start_frame = parseInt(command)
    console.log(`starting recording at frame ${new_start_frame}`)

    command = await askQuestion("Frame End: ")
    let new_end_frame = parseInt(command)
    console.log(`ending recording at frame ${new_end_frame}`)

    console.log('archiving previous config and replay...')

    replay_data = JSON.parse(fs.readFileSync('data/ddr.json'))

    fs.mkdirSync(`old/${playbackInfo.endFrame}-${replay_data.opp.name}`, {recursive: true})
    fs.writeFileSync(`old/${playbackInfo.endFrame}-${replay_data.opp.name}/${playbackInfo.endFrame}-${replay_data.opp.name}.json`, JSON.stringify(playbackInfo))
    fs.copyFileSync('data/game.slp', `old/${playbackInfo.endFrame}-${replay_data.opp.name}/${playbackInfo.endFrame}-${replay_data.opp.name}.slp`)

    playbackInfo.startFrame = new_start_frame
    playbackInfo.endFrame = new_end_frame

    console.log('overwriting playback.json...')
    fs.writeFileSync('data/playback.json', JSON.stringify(playbackInfo))

    console.log('exiting...')
    process.exit(0)
}
else
{
    console.log('Recording previous...')
    const game = new SlippiGame("data/game.slp");

    let ders_port = game.getMetadata().players[0].names.netplay === "ders" ? 0 : 1
    console.log(`ders is player ${ders_port}`)

    const opp = game.getMetadata().players[ders_port ^ 1]
    let opp_name = opp.names.code

    replay_data = {opp: {name: opp_name}}
}

// time to do stuff
await set_output_folder(obs, `C:\\src\\ddr-slippi\\videos\\${playbackInfo.endFrame}-${replay_data.opp.name}\\`)
await set_scene(obs, 'slippi')
await set_output_filename(obs, `characters-${playbackInfo.endFrame}-${replay_data.opp.name}`)

// first get the greenscreen recording
set_player_only_gecko()
let recordingPromise = launchDolphinForRecording(obs, playbackInfo.startFrame, playbackInfo.endFrame, playback_path, false)
await askQuestion("Press {ENTER} to begin recording.")
await start_recording(obs)
await recordingPromise;

console.log(`Skipped ${framesSkipped}`)

if (framesSkipped.length > 0)
{
    playbackInfo.startFrame = framesSkipped[framesSkipped.length - 1] + 2
    console.log(`New start synced to ${playbackInfo.startFrame}`)
}
fs.writeFileSync(new_playback_path, JSON.stringify(playbackInfo))

await kill_slippis()

// done with greenscreen, now get background
set_stage_only_gecko()
await set_scene(obs, 'slippi')
await set_output_filename(obs, `stage-${playbackInfo.endFrame}-${replay_data.opp.name}`)
await launchDolphinForRecording(obs, playbackInfo.startFrame, playbackInfo.endFrame, new_playback_path, true)

await kill_slippis()

// write out the input data
await read_write_inputs()

// now record the arrows
await set_scene(obs, 'ddr')
await set_output_filename(obs, `arrows-${playbackInfo.endFrame}-${replay_data.opp.name}`)

await record_arrows();

await obs.disconnect();

set_unmodified_gecko();

process.exit(0)
