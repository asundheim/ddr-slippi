fetch('data/ddr.json')
.then(data => data.json())
.then(data => {
    console.log(data);

    let i = 0;
    let buffer = 0;

    function onFrame(){
        if (i >= data.frames.length){
            clearInterval(intervalId)

            return
        }

        for (let j = 0; j < data.frames[i].length; j++)
        {
            let button = data.frames[i][j];

            // var container = document.createElement('div')
            // container.className = `${button} ${button}_`

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
                fill: 'both',
                delay: 500
            }

            var arrow = document.createElement('img')
            arrow.src = `assets/arrow_${button}.png`
            arrow.className = `${button} arrow`
            arrow.style.zIndex = -i
    
            document.body.append(arrow)
            arrow.animate(arrowAnimation, arrowAnimationTiming)

            setTimeout(() => {
                arrow.src = `assets/arrow_${button}_anim.gif`
            }, 3225)
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

                if (i > 1000)
                {
                    src = "assets/boo.png"
                    text.style.left = `${100 + randOffset}px`
                }
                else
                {
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
                }

                text.src = src

                document.body.append(text)
                text.animate(textAnimation, textTiming)
            }, 3225)
            
        }

        i++;
        buffer--;
    }

    intervalId = setInterval(onFrame, 1000.0 / 60.0)
})

