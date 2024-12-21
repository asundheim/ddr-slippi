const { spawn } =
    require('child_process');

const dolphin =
    spawn(
        '"C:\\Users\\ander\\AppData\\Roaming\\Slippi Launcher\\playback\\Slippi Dolphin.exe"', [
            '-i data/playback.json',
            ''
        ],
        { shell: true }
    );
dolphin.stdout.on('data',
    (data) => {
        console.log(`stdout: ${data}`);
    });

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