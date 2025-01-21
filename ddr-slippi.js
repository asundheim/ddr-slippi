import { createRequire } from "module";
import 
{
    start_recording, 
    stop_recording, 
    set_scene, 
    get_output_folder, 
    get_output_filename,
    set_output_filename, 
    set_output_folder, 
    validate_scenes
} from "./obs-utils.js";

import
{
    set_player_only_gecko,
    set_stage_only_gecko,
    set_unmodified_gecko,
    validate_slippi
} from './slippi-utils.js'

const require = createRequire(import.meta.url);
const { spawn, fork } = require('child_process');
const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const fs = require('fs')
const readline = require('readline');
const find = require('find-process')
const { SlippiGame } = require("@slippi/slippi-js");

let config_path = fs.existsSync('data/config.local.json') ? 'data/config.local.json' : 'data/config.json'
let config = JSON.parse(fs.readFileSync(config_path))

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

const gecko_code_path = config.slippi_replay_gecko_path;

const obs_settings = {
    ip: `${config.obs_websocket.ip}`,
    port: `${config.obs_websocket.port}`
};

let startedRecording = false;

let framesSkipped = []
function launchDolphinForRecording(obs, config, startFrame, stopFrame, playbackPath, autostart)
{
    const dolphin = spawn
    (
        `"${config.slippi_replay_exe_path}"`, 
        [
            `-i`,
            `"${fs.realpathSync(playbackPath).replaceAll('\\', '\\\\')}"`,
            `-e`,
            `"${fs.realpathSync(config.ssbm_iso_path).replaceAll('\\', '\\\\')}"`,
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

    // the JS version of a TCS...gross
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

    let your_port = game.getMetadata().players[0].names.code === config.your_connect_code ? 0 : 1
    console.log(`${game.getMetadata().players[your_port].names.netplay} is player ${your_port}`)

    const opp = game.getMetadata().players[your_port ^ 1]
    let opp_name = opp.names.code

    replay_data = {opp: {name: opp_name}}
}

let orig_output_path = await get_output_folder(obs);
let orig_output_name = await get_output_filename(obs);
console.log(`Original OBS output path: ${orig_output_path}`)
console.log(`Original OBS filename format: ${orig_output_name}`)

// time to do stuff
try
{
    await validate_scenes(obs)
    validate_slippi(config)

    await set_output_folder(obs, `${fs.realpathSync('./videos')}\\${playbackInfo.endFrame}-${replay_data.opp.name}\\`)
    await set_scene(obs, 'slippi')
    await set_output_filename(obs, `characters-${playbackInfo.endFrame}-${replay_data.opp.name}`)
    
    // first get the greenscreen recording
    set_player_only_gecko(gecko_code_path)
    let recordingPromise = launchDolphinForRecording(obs, config, playbackInfo.startFrame, playbackInfo.endFrame, playback_path, false)
    await askQuestion("Press {ENTER} to begin recording.")
    await start_recording(obs)
    startedRecording = true
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
    set_stage_only_gecko(gecko_code_path)
    await set_scene(obs, 'slippi')
    await set_output_filename(obs, `stage-${playbackInfo.endFrame}-${replay_data.opp.name}`)
    await launchDolphinForRecording(obs, config, playbackInfo.startFrame, playbackInfo.endFrame, new_playback_path, true)
    
    await kill_slippis()
    
    // write out the input data
    await read_write_inputs()
    
    // now record the arrows
    await set_scene(obs, 'ddr')
    await set_output_filename(obs, `arrows-${playbackInfo.endFrame}-${replay_data.opp.name}`)
    
    await record_arrows();
    
    set_unmodified_gecko(gecko_code_path);
    let recordRegular = await askQuestion('Record clip with default settings? [y] >')
    if (recordRegular === 'y')
    {
        await set_scene(obs, 'slippi')
        await set_output_filename(obs, `regular-${playbackInfo.endFrame}-${replay_data.opp.name}`)
        await launchDolphinForRecording(obs, config, playbackInfo.startFrame, playbackInfo.endFrame, new_playback_path, true)
        await kill_slippis()
    }
}
finally
{
    await kill_slippis();

    set_unmodified_gecko(gecko_code_path);
    
    await set_output_filename(obs, orig_output_name)
    await set_output_folder(obs, orig_output_path)

    await obs.disconnect();
}

process.exit(0)