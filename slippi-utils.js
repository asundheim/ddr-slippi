import * as fs from 'fs';

export function set_player_only_gecko(path)
{
    let player_only_ini_contents = fs.readFileSync('data/player-only.ini')
    fs.writeFileSync(`${path}`, player_only_ini_contents)
}

export function set_stage_only_gecko(path)
{
    let stage_only_ini_contents = fs.readFileSync('data/stage-only.ini')
    fs.writeFileSync(`${path}`, stage_only_ini_contents)
}

export function set_unmodified_gecko(path)
{
    let unmodified_ini_contents = fs.readFileSync('data/unmodified.ini')
    fs.writeFileSync(`${path}`, unmodified_ini_contents)
}

export function validate_slippi(config)
{
    if (!fs.existsSync(config.slippi_replay_exe_path))
    {
        console.error(`No Slippi Dolphin.exe found at ${config.slippi_replay_exe_path}`);
        throw new Error("Unable to launch slippi");
    }

    if (!fs.existsSync(config.slippi_replay_gecko_path))
    {
        console.error(`No GALE01.ini found at ${config.slippi_replay_gecko_path}`);
        throw new Error("Unable to set gecko codes for slippi");
    }

    if (!fs.existsSync(config.ssbm_iso_path))
    {
        console.error(`No melee .iso found at ${config.ssbm_iso_path}`);
        throw new Error('Unable to launch slippi for recording')
    }

    if (!fs.existsSync('data/game.slp'))
    {
        console.error('No file found at data/game.slp')
        throw new Error('Unable to launch replay for recording')
    }
}