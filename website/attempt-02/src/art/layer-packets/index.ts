// layer-packets (art-spec card 8): the section 5 diagram. Four pieces on one 48-tick story:
// lab-bench (clients) · lane-left (job + escrow → / ← certified result) · vault (Bellproof) ·
// lane-right (encrypted challenges → / ← quantum answers). All four share POSTER, so pieces mounted
// together start on the same story tick and stay causal. See README.md.

export { labBench } from './lab';
export { vault } from './vault';
export { laneLeft, laneRight } from './lanes';
