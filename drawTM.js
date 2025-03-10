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
    const tapeSize = 39;
    let position;
    let state = 'A';

    if (typeof elem === 'string') {
        elem = document.querySelector(elem);
    }

    if (typeof table === 'string') {
        table = document.querySelector(table);
    }

    table = table.querySelector('table');

    let tapeOuter = document.createElement('div');
    tapeOuter.classList.add('tape-outer');

    let tape = document.createElement('div');
    tapeOuter.append(tape);
    tape.classList.add('tape');
    for (let i = 0; i < tapeSize; i++) {
        let cell = document.createElement('div');
        cell.classList.add('tape-cell');
        cell.classList.add('zero');
        cell.innerText = '0';
        tape.append(cell);
    }

    let head = document.createElement('div');
    head.classList.add('tape-head');
    head.classList.add('state-A');
    tape.append(head);

    function setPosition(i) {
        position = i;
        head.style.left = `${i * 2}em`;
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
        const cell = tape.querySelectorAll('.tape-cell')[position];
        return cell.innerText;
    }

    function writeTape(sym) {
        const cell = tape.querySelectorAll('.tape-cell')[position];
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
            undo() {
                setPosition(oldPosition);
                enterState(oldState);
                writeTape(oldContents);
                doHighlight();
            }
        };
    }

    function stepWithHistory() {
        const cloned = tapeOuter.cloneNode(true);
        elem.insertBefore(cloned, tapeOuter);
        const exec = executeStep();

        applyHighlightRule(elem.children.length - 2);
        applyHighlightRule(elem.children.length - 1);
        return {
            undo() {
                exec.undo();
                elem.removeChild(cloned);
                applyHighlightRule(elem.children.length - 2);
                applyHighlightRule(elem.children.length - 1);
            }
        };
    }

    function animateSteps(n, ms=100) {
        let undos = [];

        const skip = animate(async function * () {
            for (let i = 0; i < n; i++) {
                undos.push(execCycler.stepWithHistory());
                yield ms;
            }
        });

        return {
            undo: async function() {
                await skip();
                while (undos.length > 0) {
                    undos.pop().undo();
                }
            }
        };
    }

    function highlightRule(i, n) {
        return i == n;
    }

    function applyHighlightRule(i) {
        if (highlightRule(i, elem.children.length - 1)) {
            elem.children[i].classList.remove('previous');
        } else {
            elem.children[i].classList.add('previous');
        }
    }

    function setHighlightRule(f) {
        const old = highlightRule;
        highlightRule = f;

        for (let i = 0; i < elem.children.length; i++) {
            applyHighlightRule(i);
        }

        return {
            undo() {
                setHighlightRule(old);
            }
        };
    }

    setPosition(Math.floor(tapeSize / 2));
    doHighlight();

    elem.appendChild(tapeOuter);
    return {
        undo() {
            elem.removeChild(tapeOuter);
            removeHighlight();
        },
        executeStep,
        stepWithHistory,
        animateSteps,
        setHighlightRule,
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function animate(iter) {
    let skipAnimationResolve;
    let skipped = false;

    const skipPromise = new Promise(resolve => {
        skipAnimationResolve = resolve;
    });

    async function doit() {
        let afterwards = null;
        let done = false;
        const skip = skipPromise.then(resolve => {
            if (!done) {
                afterwards = resolve;
            } else {
                resolve();
            }
        });

        for await (const ms of iter()) {
            await Promise.race([sleep(ms), skip]);
        }

        done = true;

        if (afterwards != null) {
            afterwards();
        }
    }

    doit();

    return skipAnimation = () => {
        return new Promise(resolve => {
            if (!skipped) {
                skipped = true;
                skipAnimationResolve(resolve);
            } else {
                resolve();
            }
        });
    };
}

function drawTMs(selector, tms) {
    const row = document.querySelector(selector);

    const skip = animate(async function * () {
        for (const line of tms.trim().split('\n')) {
            const [tm, status] = line.split(',');
            const box = document.createElement('div');
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
            yield 100;
        }
    });

    return {
        undo: async function() {
            await skip();
            row.replaceChildren();
        }
    };
}

function revealVerdicts(selector) {
    const skipPrevious = skipAnimation;

    const skip = animate(async function * () {
        await skipPrevious();
        const verdicts = document.querySelectorAll(`${selector} .verdict`);
        for (const verdict of verdicts) {
            verdict.classList.remove('unrevealed');
            yield 100;
        }
    });

    return {
        undo: async function() {
            await skip();
            const verdicts = document.querySelectorAll(`${selector} .verdict`);
            for (const verdict of verdicts) {
                verdict.classList.add('unrevealed');
            }
        }
    };
}
