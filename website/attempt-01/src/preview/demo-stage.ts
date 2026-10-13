// preview.html?piece=bands-stage · the hero block choreography of art-spec card 15 running on the blocks API,
// with the placeholder piece as the riders. The bands agent and sections-1 build on this.

import { clock, motion, mountAll, stage, type ChoreoStep, type StageLayout } from '../engine';

export const HERO_LG: StageLayout = {
  module: 128,
  blocks: [
    { id: 'L1', col: 0, rowFromFloor: 0, size: 1, step: 'v' },
    { id: 'L2', col: 0, rowFromFloor: 1, size: 1, step: 'i' },
    { id: 'L3', col: 0, rowFromFloor: 2, size: 1, step: 'b', rider: { piece: 'placeholder', variant: 'wide', dx: 0, dy: 0 } },
    { id: 'F1', col: 1, rowFromFloor: 0, size: 1, step: 'c' },
    { id: 'F2', col: 1, rowFromFloor: 1, size: 0.5, step: 'u' },
    { id: 'R1', col: 8, rowFromFloor: 0, size: 1, step: 'a', rider: { piece: 'placeholder', dx: 4, dy: 0 } },
    { id: 'RR1', col: 9, rowFromFloor: 0, size: 1, step: 'i' },
    { id: 'RR2', col: 9, rowFromFloor: 1, size: 1, step: 'b' },
    { id: 'D', col: 9, rowFromFloor: 3, size: 1, step: 'v', kind: 'diamond' },
    { id: 'RRa', col: 9, rowFromFloor: -1, size: 1, step: 'c' },
    { id: 'RRb', col: 9, rowFromFloor: -2, size: 1, step: 'a' },
  ],
};

const RIGHT_STACK: Array<[string, { dy: number }]> = [['RR1', { dy: 1 }], ['RR2', { dy: 1 }], ['D', { dy: 1 }], ['RRa', { dy: 1 }], ['RRb', { dy: 1 }]];
const LEFT_STACK: Array<[string, { dy: number }]> = [['L1', { dy: -1 }], ['L2', { dy: -1 }], ['L3', { dy: -1 }]];

/** The six moves of card 15 (start times in ms). */
export const HERO_CHOREO: ChoreoStep[] = [
  { at: 0, moves: [...LEFT_STACK, ...RIGHT_STACK] },
  { at: 1800, moves: [['F1', { dx: 1 }], ['F2', { dx: 1 }]] },
  { at: 3400, moves: [['R1', { dx: -1 }]] },
  { at: 5200, moves: [['R1', { dy: -0.5 }]] },
  { at: 6800, moves: [...LEFT_STACK, ...RIGHT_STACK] },
  { at: 8600, moves: [['F1', { dx: 1 }], ['F2', { dx: 1 }]] },
];

export function demoStage(host: HTMLElement, info: HTMLElement): void {
  const root = document.createElement('div');
  root.className = 'stage-demo';
  root.id = 'stage-root';
  host.replaceChildren(root);
  const st = stage(root, HERO_LG);
  mountAll(root);
  const seq = st.choreo(HERO_CHOREO, { yoyo: true, hold: 1000 });
  const intro = st.enter();
  const run = () => {
    if (motion.reduced) { st.setStatic(); return; }
    intro.play();
    setTimeout(() => seq.play(), intro.duration + 300);
  };
  run();
  motion.onChange((r) => { if (r) { intro.pause(); seq.pause(); st.setStatic(); } else seq.play(); });
  (window as unknown as { __stage: unknown }).__stage = { stage: st, seq, intro };
  info.innerHTML = `<h1>bands-stage</h1><p>Hero layout (lg, M=128) with the six-move yoyo choreography from art-spec card 15. Riders are the placeholder piece.</p>
  <dl><dt>cycle</dt><dd>${seq.duration} ms forward + 1000 hold, then reverse</dd><dt>quantise</dt><dd>4 px</dd></dl>
  <div class="controls"><button id="s-play">play</button><button id="s-pause">pause</button><button id="s-rev">reverse</button><button id="s-reset">reset</button></div><p id="s-live"></p>`;
  document.getElementById('s-play')!.onclick = () => seq.play();
  document.getElementById('s-pause')!.onclick = () => seq.pause();
  document.getElementById('s-rev')!.onclick = () => seq.reverse();
  document.getElementById('s-reset')!.onclick = () => { seq.stop(); seq.seek(0); };
  const live = document.getElementById('s-live')!;
  setInterval(() => { live.textContent = `t=${Math.round(seq.time)} ms dir=${seq.direction} playing=${seq.playing} clock=${clock.running ? 'running' : 'idle'} subs=${clock.size}`; }, 200);
}
