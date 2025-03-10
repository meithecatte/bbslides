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

function execTM(elem, tm, table) {
    const tapeSize = 19;
    let position;
    let state = 'A';

    if (typeof elem === 'string') {
        elem = document.querySelector(elem);
    }

    if (typeof table === 'string') {
        table = document.querySelector(table);
    }

    table = table.querySelector('table');

    let tape = document.createElement('div');
    tape.classList.add('tape-outer');

    let tapeInner = document.createElement('div');
    tape.append(tapeInner);
    tapeInner.classList.add('tape');
    for (let i = 0; i < tapeSize; i++) {
        let cell = document.createElement('div');
        cell.classList.add('tape-cell');
        cell.classList.add('zero');
        cell.innerText = '0';
        tapeInner.append(cell);
    }

    let head = document.createElement('div');
    head.classList.add('tape-head');
    head.classList.add('state-A');
    tapeInner.append(head);

    function setPosition(i) {
        position = i;
        head.style.left = `calc(${i * 4}rem + 1px)`;
    }

    function enterState(newState) {
        head.classList.remove('state-' + state);
        state = newState;
        head.classList.add('state-' + state);
    }

    function removeHighlight() {
        let previous = table.querySelectorAll('.active-tx');
        for (let p of previous) {
            p.classList.remove('active-tx');
        }
    }

    function highlightTransition(sym, state) {
        removeHighlight();

        let row = table.children[1 + 'ABCDE'.indexOf(state)];
        let td = row.children[1 + +sym];
        td.classList.add('active-tx');
    }

    function readTape() {
        const cell = tapeInner.querySelectorAll('.tape-cell')[position];
        return cell.innerText;
    }

    function writeTape(sym) {
        const cell = tapeInner.querySelectorAll('.tape-cell')[position];
        cell.innerText = sym;
        if (sym == '0') {
            cell.classList.remove('one');
            cell.classList.add('zero');
        } else {
            cell.classList.remove('zero');
            cell.classList.add('one');
        }
    }

    function doHighlight() {
        highlightTransition(readTape(), state);
    }

    function executeStep() {
        const oldPosition = position;
        const oldState = state;

        const oldContents = readTape();
        const tx = tm[oldContents + state];
        writeTape(tx.slice(0, 1));

        if (tx.slice(1, 2) == 'R') {
            setPosition(position + 1);
        } else {
            setPosition(position - 1);
        }

        enterState(tx.slice(2, 3));
        doHighlight();

        return {
            undo: () => {
                setPosition(oldPosition);
                enterState(oldState);
                writeTape(oldContents);
                doHighlight();
            }
        };
    }

    setPosition(9);
    doHighlight();

    elem.appendChild(tape);
    return {
        undo: () => {
            elem.removeChild(tape);
            removeHighlight();
        },
        executeStep,
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawTMs(selector, tms) {
    const row = document.querySelector(selector);
    let boxes = [];

    for (const line of tms.trim().split('\n')) {
        const [tm, status] = line.split(',');
        const box = document.createElement('div');
        box.classList.add('unrevealed');
        drawTM(box, fromStandard(tm));
        const statusLine = document.createElement('span');
        statusLine.classList.add('verdict');
        statusLine.classList.add('unrevealed');
        if (status == 'halt') {
            statusLine.innerText = "HALTS";
            statusLine.classList.add('green');
        } else {
            statusLine.innerText = "DOESN'T\nHALT";
            statusLine.classList.add('blue');
        }
        box.append(statusLine);

        row.append(box);
        boxes.push(box);
    }

    async function doit() {
        for (const box of boxes) {
            box.classList.remove('unrevealed');
            await sleep(100);
        }
    }

    doit();

    return {
        undo: () => {
            row.replaceChildren();
        }
    };
}

function revealVerdicts(selector) {
    const verdicts = document.querySelectorAll(`${selector} .verdict`);
    async function doit() {
        for (const verdict of verdicts) {
            verdict.classList.remove('unrevealed');
            await sleep(100);
        }
    }

    doit();

    return {
        undo: () => {
            for (const verdict of verdicts) {
                verdict.classList.add('unrevealed');
            }
        }
    };
}
