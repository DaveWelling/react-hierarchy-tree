(function createThings(){
    const thingGrid = document.querySelector('#thingGrid');
    let count = 0;
    for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 4; j++) {
            const thing = document.createElement('div');
            const row = (i % 25);
            const column = (i+(Math.floor(Math.random() * j * 100))) %25;
            const id = 'thing' + count;
            thing.id = id;
            thing.classList.add('thing');

            thing.style['grid-row-start'] = row;
            thing.style['grid-row-end'] = row;
            thing.style['grid-column-start'] = column;
            thing.style['grid-column-end'] = column;
            thingGrid.appendChild(thing);
            count++;
        }
    }
    setInterval(() => {
        const picker = Math.floor(Math.random() * 100);
        const color = ['yellow', 'blue', 'red'][picker % 3];
        const id = '#thing' + picker;
        const thing = document.querySelector(id);
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const newY = y - thing.offsetTop;
        const newX = x - thing.offsetLeft;
        thing.style['background-color'] = color;
        thing.animate([
            { height: '4vh', width: '4vw', opacity: 1, transform: 'translate(0px, 0px) rotate(0deg)'},
            { height: '1vw', width: '1vh', opacity: 0, transform: `translate(${newX}px, ${newY}px) rotate(360deg)`}
        ], {
            duration: 4000,
            iterations: 1,
            easing: 'ease-in'
        });
        // Remove color after animation.
        //setTimeout(()=>thing.style['background-color'] = '#d6c8a610', 4000);

    }, 2000);
})();