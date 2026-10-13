// The shared 48-tick story that lab-bench, vault, lane-left and lane-right all play.
// Every piece reads the same constants, so when the four are started on the same clock tick
// (they share one poster tick, see POSTER) the lanes and the vault stay causal.
//
//   0  · a job leaves the lab: the token (coin) and the job envelope enter lane-left
//  12  · POSTER: token mid-lane, envelope behind it, last job's certificate reaching the lab (lab screen ✓)
//  24  · the token reaches Bellproof → the vault door slides shut (24–27), glint on 27 (escrow locked)
//  28  · the dial turns to lock (28–31)
//  32  · the bell rings: verification passed (32–35)
//  36  · the vault slides open (36–39); the certificate leaves Bellproof into lane-left's return track
//  39  · the escrowed token is released from the vault and pays out (39–47)
//  42, 2 · encrypted challenge cards leave Bellproof in lane-right (16 px apart)
//  6 + 8k · a quantum answer leaves the provider in lane-right's return track (one every 8 ticks)

export const LOOP = 48;
export const POSTER = 12;
export const SPEED = 2;                 // px per tick for every packet
export const LANE = 48;                 // travel length of a lane, both orientations

// lane-left
export const COIN_ENTER = 0;            // token's leading edge at the near end
export const COIN_ARRIVE = 24;          // token's leading edge at the far end → vault shuts
export const TRAIN_GAP = 4;             // px between the token and the envelope behind it
export const CERT_LEAVE = 36;           // certificate's leading edge at the far end → vault opens

// vault
export const SHUT_START = 24;           // door begins to slide in (offset 3 → 0 over 24–27)
export const SHUT_HOME = 27;            // door flush; 1-tick glint
export const DIAL_START = 28;           // dial turns 28–31
export const DING_START = 32;           // bell rings 32–35 (pass)
export const OPEN_START = 36;           // door slides out (offset 1 → 4 over 36–39)
export const PAY_START = 39;            // released token pops out of the gap 39–47
export const DOOR_TRAVEL = 4;

// lane-right
export const CARD_LEAVE = [42, 50];     // ticks the two challenge cards' leading edges leave Bellproof (50 ≡ 2)
export const ANSWER_EVERY = 8;
export const ANSWER_PHASE = 6;          // answers leave the provider at 6, 14, 22, 30, 38, 46

// lab
export const RESULT_ON = 12;            // certificate's leading edge reaches the lab → screen shows ✓
export const RESULT_OFF = 36;

/** Positive modulo. */
export function mod(n: number, m: number): number { return ((n % m) + m) % m; }

/** Ticks since an event that recurs every LOOP ticks, in [0, LOOP). */
export function since(tick: number, at: number): number { return mod(tick - at, LOOP); }
