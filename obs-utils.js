import * as fs from 'fs';

export async function start_recording(obs)
{
    await obs.call('StartRecord');
}

export async function stop_recording(obs)
{
    await obs.call('StopRecord')
}

export async function set_scene(obs, sceneName)
{
    await obs.call('SetCurrentProgramScene', {sceneName: sceneName})
}

export async function get_output_folder(obs)
{
    return (await obs.call('GetRecordDirectory')).recordDirectory
}

export async function set_output_folder(obs, folderPath)
{
    fs.mkdirSync(folderPath, {recursive: true})
    await obs.call('SetRecordDirectory', {recordDirectory: folderPath})
}

export async function get_output_filename(obs)
{
    return (await obs.call('GetProfileParameter',
    {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting'
    })).parameterValue;
}

export async function set_output_filename(obs, fileName)
{
    await obs.call('SetProfileParameter', 
    {
        parameterCategory: 'Output',
        parameterName: 'FilenameFormatting',
        parameterValue: fileName
    })
}

export async function validate_scenes(obs)
{
    let scenes = (await obs.call('GetSceneList')).scenes

    let found_slippi = false;
    let found_ddr = false;
    for (let i = 0; i < scenes.length; i++)
    {
        if (scenes[i].sceneName == 'slippi')
        {
            found_slippi = true;
        }

        if (scenes[i].sceneName == 'ddr')
        {
            found_ddr = true;
        }
    }

    if (!found_ddr)
    {
        console.error('No scene in OBS named "ddr"');
        throw new Error("Unable to record arrows");
    }

    if (!found_slippi)
    {
        console.error('No scene in OBS named "slippi"');
        throw new Error("Unable to record slippi");
    }
}