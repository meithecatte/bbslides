# Formal verification of the 5th Busy Beaver value

{.author}
Tristan Stérin, Maja Kądziołka  
bbchallenge.org

{pause up-at-unpause}
## The busy beaver function

{.has-biopic}
> {.biopic}
> ![](TiborRado.jpg) Tibor Radó, 1895 — 1965
>
> {.for-biopic}
> > {.definition}
> > > $BB(n)$: maximum number of steps done by a halting 2-symbol Turing machine
> > > with $n$ states starting from an all-0 tape.
> > 
> > {.cite}
> > T. Radó. On Non-computable Functions. Bell System Technical Journal, 41(3):877–884. 1962. {pause}
> >
> > {.informal #bang4buck}
> > BB(n) = "Maximum algorithmic bang for your buck" {pause}
> >
> > {.informal .stamp}
> > UNCOMPUTABLE {pause up-at-unpause=bang4buck}

{#small-values}
Small busy beaver values:
- BB(1) = 1, BB(2) = 6 [[Radó, 1962]]{.cite-list}
- BB(3) = 21           [[Radó and Lin, 1963]]{.cite-list}
- BB(4) = 107          [[Brady, 1983]]{.cite-list}

{pause}

{.indent}
> For each 4-state Turing machine, witness that it halts
> within 107 steps, or __prove it never halts__ {pause} (which can be hard{.red} in general)

{pause up-at-unpause=small-values #hardness}
## Mathematical hardness of busy beaver values

Any $\Pi_1$ statement (i.e. $\forall x, P(x)$ for computable $P$) can be converted
into a Turing machine that halts iff the statement is false,
by searching for counterexamples.

{.example title="Goldbach's conjecture, 1742"}
> Every positive even integer can be written as a sum of two primes.

{pause up-at-unpause=hardness}

1. Enumerate all even numbers $n$
2. For each $n$, enumerate all primes $p < n$ and test all sums
3. Halt if no sum reaches the current $n$

{pause}

There is a 25-state Turing machine that implements the above.
[[anonymous, 2016]]{.cite} Verified in Lean! [[lengyijun, 2024]]{.cite}

{pause}

Hence, knowing BB(25) is "at least as hard" as solving Goldbach's conjecture.

{pause center-at-unpause=small-values}
<!-- TODO
{pause reveal-at-unpause=bb5}
- BB(5) = 47,176,870   [[Marxen and Buntrock, 1989]]{.cite-list}
-->

{pause up-at-unpause #proof-outline}
## Proof outline

### 1. Enumerate [all]{#scarequotes} 5-state Turing machines {pause}

- There are $21^{10} \approx 1.67 \cdot 10^{13}$ possible 5-state Turing machines {pause}
- Only [$181,385,789$]{.green} after symmetries and pruning

{pause exec-at-unpause}
```slip-script
let elem = document.querySelector("#scarequotes");
let oldText = elem.innerText;
elem.innerText = '"' + oldText + '"';
return {undo: () => elem.innerText = oldText};
```

### 2. Try automated proof strategies {pause}

- Deciders: programs that, given a TM, output one of

{.verdicts}
> [HALTS]{.verdict .green}
>
> [DOESN'T HALT]{.verdict .blue}
>
> [UNKNOWN]{.verdict .red} {pause}
> $\Downarrow$  
> try another decider {pause}

### 3. Manually inspect what's left {pause}

- Holdouts: machines with the most interesting behavior

<!-- TODO: some visualizers here? -->

{pause up-at-unpause}
## Efficient TM enumeration

{.has-biopic}
> {.biopic}
> ![](AllenHBrady.webp) Allen Brady, 1934 — 2024
>
> {.for-biopic}
> > Naive enumeration has many redundant machines:
> >
> > - states can be renamed and rearranged without change of behavior
> > - machines differing only in unreachable parts
> >
> > Solution: enumerate-as-you-go, choosing transitions when the TM reaches them.
> >
> > This is known as **Tree Normal Form enumeration** [[Brady, 1966]]{.cite}

{#tnf-example}

{pause exec-at-unpause}
```slip-script
let colors = {
    'A': '#ff0000',
    'B': '#ff8000',
    'C': '#0000ff',
    'D': '#00ff00',
    'E': '#ff00ff',
};

function state(name) {
    let elem = document.createElement('span');
    elem.style.color = colors[name];
    elem.innerText = name;
    return elem;
}

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

function transition(tx) {
    if (tx === undefined) {
        return td('---');
    }

    return td(tx.slice(0,2), state(tx.slice(2)));
}

function drawTM(elem, tm) {
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
    elem.replaceWith(table);
}

slip.drawTM = drawTM;

let tm = {'0A': '1RB'};
drawTM('#tnf-example', tm);
```

<style>
.author {
    text-align: center;
    font-size: 1.5em;
}

.biopic {
    display: block;
    font-size: 20pt;
    text-align: center;
    order: 2;
}

.biopic img {
    width: 100%;
    padding-bottom: 1.5rem;
}

.has-biopic {
    display: grid;
    gap: 3rem;
    grid-template-columns: 2fr 1fr;
}

.cite, .cite-list {
    font-size: 16pt;
    color: blue;
}

.cite-list {
    position: absolute;
    left: 25rem;
}

.cite-list::before {
    content: " ";
    font-size: 18pt;
}

.informal {
    color: orange;
    text-align: center;
    font-weight: bold;
    font-size: 32pt;
}

.red {
    color: red;
}

.green {
    color: green;
}

.blue {
    color: blue;
}

.verdict {
    font-weight: bold;
    font-family: monospace;
    font-size: 32pt;
    text-align: center;
    display: block;
}

.verdicts {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;
}

.stamp {
    color: red;
    font-family: monospace;
    padding-top: 2rem;
    transform: rotate(-25deg);
}

.slip-body {
    position: relative;
}

.indent {
    margin-left: 10rem;
}

ul {
    line-height: 1.6;
}

.tm-table {
    font-family: monospace;
    background: #111827;
    color: white;
    padding: 0.5rem;
}

.tm-table td, .tm-table th {
    padding: 0 0.5rem;
}
</style>
