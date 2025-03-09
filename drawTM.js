let colors1 = {
    'A': '#ff0000',
    'B': '#ff8000',
    'C': '#0000ff',
    'D': '#00ff00',
    'E': '#ff00ff',
};

let colors2 = {
    'A': '#ff0000',
    'B': '#ff8000',
    'C': '#00ff00',
    'D': '#0000ff',
    'E': '#ff00ff',
};

function td(...children) {
    let elem = document.createElement('td');
    for (let child of children) {
        elem.append(child);
    }
    return elem;
}

function tr(...children) {
    let elem = document.createElement('tr');
    for (let child of children) {
        elem.appendChild(child);
    }
    return elem;
}

function drawTM(elem, tm, colors=colors1, unreachable=null) {
    function state(name) {
        let elem = document.createElement('span');
        elem.style.color = colors[name];
        elem.innerText = name;
        return elem;
    }

    function transition(tx) {
        if (tx === undefined) {
            if (unreachable !== null) {
                let elem = document.createElement('span');
                elem.style.color = unreachable;
                elem.classList.add('unreachable');
                elem.innerText = '---';
                return td(elem);
            } else {
                return td('---');
            }
        }

        return td(tx.slice(0,2), state(tx.slice(2)));
    }

    if (typeof elem === 'string') {
        elem = document.querySelector(elem);
    }

    let table = document.createElement('table');
    table.append(tr(td(), td('0'), td('1')));
    for (let s in colors) {
        table.append(tr(td(state(s)),
            transition(tm['0'+s]),
            transition(tm['1'+s])));
    }
    table.classList.add('tm-table');
    elem.appendChild(table);
    return {undo: () => elem.removeChild(table)};
}

function fromStandard(std) {
    let tm = {};
    const parts = std.split('_');
    for (let i = 0; i < parts.length; i++) {
        const state = 'ABCDE'[i];
        const part = parts[i];
        for (let j = 0; 3*j < part.length; j++) {
            const tx = part.slice(3*j, 3*j+3);
            if (tx !== '---') {
                tm[j + state] = tx;
            }
        }
    }

    return tm;
}

function randomChoice(options) {
    let x = Math.floor(Math.random() * options.length);
    return options[x];
}

function execTM(elem, tm) {
    const tapeSize = 19;

    if (typeof elem === 'string') {
        elem = document.querySelector(elem);
    }

    let tape = document.createElement('div');
    tape.classList.add('tape-outer');

    let tapeInner = document.createElement('div');
    tape.append(tapeInner);
    tapeInner.classList.add('tape');
    for (let i = 0; i < tapeSize; i++) {
        let cell = document.createElement('div');
        cell.classList.add('tape-cell');
        cell.innerText = '0';
        tapeInner.append(cell);
    }

    let head = document.createElement('div');
    head.classList.add('tape-head');
    head.classList.add('state-B');
    tapeInner.append(head);

    function setPosition(i) {
        head.style.left = `calc(${i * 4}rem + 1px)`;
    }

    setPosition(Math.floor(tapeSize / 2));

    elem.appendChild(tape);
    return {
        undo: () => elem.removeChild(tape),
    };
}
