// QA demo (not shipped): drives the chain-flow pieces the way design-spec §5.7 asks the #flow section to.
// Scroll progress → step 1..7 → the job token walks down the spine in 4-px steps, each on-chain block
// clicks (clickChainBlock) as the token arrives, the token's `progress` input carries the escrow coin
// until Settle, and the settle scene alternates honest / cheat underneath.
// Query: ?q=0..1 forces the progress (stills) · ?rm=1 reduced motion.

import '../../../engine/engine.css';
import { clock, motion, mount, moveUnits, onScrollProgress, registerModule, type Mounted } from '../../../engine';
import * as chainFlow from '../index';
import { clickChainBlock, resetChainBlock, stepOf } from '../index';

registerModule(chainFlow as unknown as Record<string, unknown>, 'chain-flow');
const q = new URLSearchParams(location.search);
if (q.get('rm') === '1') motion.force(true);
motion.init();

const STEPS = [
  { title: 'Post job', body: 'Spec hash, tolerance, escrow.', lane: 'on', mode: 'post' },
  { title: 'Stake', body: 'The provider bonds collateral.', lane: 'on', mode: 'stake' },
  { title: 'Commit', body: 'A hash of the secret challenge keys goes on-chain.', lane: 'on', mode: 'commit' },
  { title: 'Run', body: 'Encrypted challenge rounds.', lane: 'off' },
  { title: 'Reveal', body: 'The challenge keys are published.', lane: 'on', mode: 'reveal' },
  { title: 'Verify', body: 'Anyone checks the transcript.', lane: 'off', piece: 'magnifier-scroll' },
  { title: 'Settle', body: 'Pay and certify, or slash and refund.', lane: 'on', mode: 'settle' },
] as const;

const ROW = 128;
const rows = document.getElementById('rows')!;
const hud = document.getElementById('hud')!;
const blocks = new Map<number, Mounted>();
const cards: HTMLElement[] = [];

STEPS.forEach((s, i) => {
  const row = document.createElement('div');
  row.className = 'row';
  const card = document.createElement('div');
  card.className = `card ${s.lane}`;
  card.innerHTML = `<b>${i + 1}</b><span><strong>${s.title}</strong><br>${s.body}</span>`;
  const empty = document.createElement('div');
  if (s.lane === 'on') row.append(card, empty); else row.append(empty, card);
  rows.append(row);
  cards.push(card);
  // absolutely placed wrapper (engine.css makes every .px position: relative, so the mount target sits inside)
  const wrap = document.createElement('div');
  wrap.className = `gut ${s.lane === 'on' ? 'l' : 'r'}`;
  wrap.style.top = `${i * ROW + 32}px`;
  const gut = document.createElement('span');
  wrap.append(gut);
  rows.append(wrap);
  if ('mode' in s) blocks.set(i, mount(gut, 'chain-block', { inputs: { mode: s.mode, lit: false } }));
  else if ('piece' in s) mount(gut, s.piece);
  else wrap.style.outline = '1px dashed #DEDBD3';        // fridge-mini lives here (another agent's piece)
});

const settleWrap = document.createElement('span');
settleWrap.id = 'settle-wrap';
settleWrap.style.top = `${7 * ROW + 8}px`;
rows.append(settleWrap);
rows.style.height = `${7 * ROW + 8 + 96 + 16}px`;
const settle = mount(settleWrap, 'settle');

const tokenEl = document.createElement('span');
tokenEl.id = 'token';
rows.append(tokenEl);
const token = mount(tokenEl, 'job-token', { inputs: { progress: 0 } });

// token motion: target row from progress; walks 2 art px per tick (8 css px), arrival clicks the block
const yFor = (step: number) => (step * ROW + 40) / 4;          // art units; 128·step + 40 is a multiple of 4
let target = 0, at = 0, y = yFor(0), arrived = -1;
moveUnits(tokenEl, 0, y);

function arrive(step: number): void {
  token.set('walk', false);
  token.set('progress', step / 6);
  const b = blocks.get(step);
  if (b && b.io.lit === false) {
    clickChainBlock(b);
    const c = cards[step];
    c.classList.add('flash');                                   // the card's left bar flashes azure for 1 tick
    const sub = { kind: 'tick' as const, onTick() { c.classList.remove('flash'); clock.remove(sub); } };
    clock.add(sub);
  }
  for (const [i, m] of blocks) if (i > step && m.io.lit !== false) resetChainBlock(m);
  arrived = step;
}

function setTarget(step: number): void {
  target = step;
  if (motion.reduced) { at = step; y = yFor(step); moveUnits(tokenEl, 0, y); for (let s = 0; s <= step; s++) { const b = blocks.get(s); if (b) clickChainBlock(b); } token.set('progress', step / 6); return; }
}

clock.add({
  kind: 'tick',
  onTick() {
    const goal = yFor(target);
    if (y !== goal) {
      token.set('walk', true);
      y += Math.sign(goal - y) * Math.min(2, Math.abs(goal - y));
      moveUnits(tokenEl, 0, y);
      at = Math.round((y * 4 - 40) / ROW);
    } else if (arrived !== target) arrive(target);
    hud.textContent = `step ${target + 1} · token row ${at + 1} · settle ${settle.state()} · blocks ${[...blocks.values()].map((m) => m.state()).join(' ')}`;
  },
});

const forced = q.get('q');
if (forced !== null) setTarget(stepOf(Number(forced)));
else onScrollProgress(document.getElementById('flow')!, (p) => setTarget(stepOf(Math.min(1, Math.max(0, (p - 0.3) / 0.45)))));
declare global { interface Window { __demo: unknown } }
window.__demo = { blocks, token, settle, setTarget };
