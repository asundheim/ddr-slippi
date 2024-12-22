# ddr-slippi
This is a collection of scripts and tools to generate input overlays from a Slippi replay in the style of Dance Dance Revolution:

<video src="assets/example.mp4"></video>

The tricky part is recording the characters and the stage separately, so they can be composited together with the arrow animations. As it stands, this project is incredibly unportable, as to run it yourself you will need to configure:
- OBS websocket settings
- OBS recording settings
- Slippi playback settings

in the code and on your machine.

You will also need to copy your target replay file to `data/game.slp`, and specify the frame ranges to record.

I was not able to default enable the develop mode backgrounds and fix the camera, so you'll want to give yourself a ~10s buffer before your clip to toggle that in the replay, then press `ENTER` in the terminal to manually start the recording. Subsequent recordings of the stage background and inputs will sync to your manual start point.

## Outputs
After getting everything set up, this program will automatically(ish):
- Enable dev mode background gecko codes
- Record a green-screened video of just the characters
- Enable character and particle effect hiding gecko codes
- Record a video of just the camera moving around the stage, using the exact frame ranges as the first video
- Generate `ddr.json`, a data file containing all the inputs of the frame range for your player
- Play back the inputs into an Electron window rendering the arrows, and record that - it should be almost 3 seconds longer, but it will be a consistent offset from the gameplay clips to make it easier to composite
- Reset gecko codes for future playback
- All outputs go to `videos/{frame_end_number}/`