const ipc = require("electron").ipcRenderer;

ipc.send('[LOADED]')
ipc.on('[START]', () => {
    fetch('data/ddr.json')
    .then(data => data.json())
    .then(data => {
        console.log(data);
    
        let i = 0;
        let buffer = 0;
        var stop = false;
        var frameCount = 0;
        var fps, fpsInterval, startTime, now, then, elapsed;
    
        function onFrame(){
            if (i >= data.frames.length){
                stop = true;

                setTimeout(() => {
                    ipc.send('[STOP]')
                }, 3000)
    
                return
            }

            ipc.send(`[${i}]`)
    
            for (let j = 0; j < data.frames[i].length; j++)
            {
                let button = data.frames[i][j];

                const arrowAnimation = 
                [
                    { 
                        top: "100%",
                        offset: 0,
                    },
                    {
                        top: "0%",
                        offset: .95
                    },
                    {
                        top: "0%",
                        visibility: 'hidden',
                        offset: 1
                    }
                ]
    
                const arrowAnimationTiming = 
                {
                    duration: 3000,
                    iterations: 1,
                    fill: 'both'
                }
    
                var arrow = document.createElement('img')
                arrow.src = `assets/arrow_${button}.png`
                arrow.className = `${button} arrow`
                arrow.style.zIndex = -i
        
                document.body.append(arrow)
                arrow.animate(arrowAnimation, arrowAnimationTiming)
    
                setTimeout(() => {
                    arrow.src = `assets/arrow_${button}_anim.gif`
                }, 2725)
            }
    
            if (data.frames[i].length > 0 && buffer <= 0)
            {
                buffer = 20
    
                setTimeout(() => {
                    var text = document.createElement('img')
                    text.className = 'text'
                    text.style.zIndex = 10000
    
                    const textAnimation = 
                    [
                        { 
                            
                        },
                        {
    
                        },
                        {
                            visibility: 'hidden'
                        }
                    ]
    
                    const textTiming = 
                    {
                        duration: 15 * 1000.0 / 60.0,
                        iterations: 1,
                        fill: 'both',
                        easing: 'ease-out'
                    }
                    
                    var src = ""
                    var randOffset = (Math.random() * 10) - 5
    
                    // if (i > 1000)
                    // {
                    //     src = "assets/boo.png"
                    //     text.style.left = `${100 + randOffset}px`
                    // }
                    
                    var r = Math.random()
                    if (r > .35)
                    {
                        src = "assets/perfect.png"
                        textAnimation[0].transform = 'scale(1.20, 2.50)'

                        textAnimation[1].offset = 0.65
                        textAnimation[1].transform = 'scale(1)'
                        text.style.left = `${60 + randOffset}px`
                    }
                    else if (r > .15)
                    {
                        src = "assets/great.png"
                        textAnimation[0].transform = 'scale(1.5)'

                        textAnimation[1].offset = 0.65
                        textAnimation[1].transform = 'scale(1)'

                        text.style.left = `${75 + randOffset}px`
                    }
                    else
                    {
                        text.style.left = `${85 + randOffset}px`
                        src = "assets/good.png"
                    }
                    
    
                    text.src = src
    
                    document.body.append(text)
                    text.animate(textAnimation, textTiming)
                }, 3000)
            }
    
            i++;
            buffer--;
        }
    
        function startAnimating(fps) {
            fpsInterval = 1000 / fps;
            then = window.performance.now();
            startTime = then;
            console.log(startTime);
            animate();
        }
    
        function animate(newtime) 
        {
            // stop
            if (stop) 
            {
                return;
            }
        
            // request another frame
        
            requestAnimationFrame(animate);
        
            // calc elapsed time since last loop
            now = newtime;
            elapsed = now - then;
        
            // if enough time has elapsed, draw the next frame
            if (elapsed > fpsInterval) 
            {
                // Get ready for next frame by setting then=now, but...
                // Also, adjust for fpsInterval not being multiple of 16.67
                then = now - (elapsed % fpsInterval);
    
                // draw stuff here
                onFrame()
            }
        }
        
        startAnimating(60)
    })
})


