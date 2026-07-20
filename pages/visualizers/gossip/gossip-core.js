/* ============================================================
   Gossip Protocol + phi-Accrual Failure Detector — pure core logic
   ============================================================ */

/* ---------- math helpers ---------- */

// Abramowitz-Stegun erf approximation (max error ~1.5e-7)
function erf(x){
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return sign * y;
}
function normalCDF(x, mean, std){
  if(std <= 1e-9) return x >= mean ? 1 : 0;
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

/* ---------- phi-accrual failure detector ---------- */

class PhiAccrualDetector{
  constructor(windowSize = 20, minSamples = 4){
    this.windowSize = windowSize;
    this.minSamples = minSamples;
    this.intervals = []; // sliding window of gaps between fresh heartbeat observations
    this.lastFreshRound = null;
  }
  // called whenever a FRESH (strictly newer) heartbeat about the target is observed at round r
  recordHeartbeat(round){
    if(this.lastFreshRound !== null){
      const gap = round - this.lastFreshRound;
      if(gap > 0){
        this.intervals.push(gap);
        if(this.intervals.length > this.windowSize) this.intervals.shift();
      }
    }
    this.lastFreshRound = round;
  }
  // phi(t) at the given current round, t = time since last fresh heartbeat
  phi(currentRound){
    if(this.lastFreshRound === null) return 0; // never heard from it yet; not evaluable
    const t = currentRound - this.lastFreshRound;
    if(this.intervals.length < this.minSamples){
      // not enough samples for a stable distribution yet; fall back to a mild linear estimate
      return t <= 1 ? 0 : Math.min(t - 1, 3);
    }
    const n = this.intervals.length;
    const mean = this.intervals.reduce((a,b)=>a+b,0) / n;
    const variance = this.intervals.reduce((a,b)=>a+(b-mean)*(b-mean),0) / n;
    const std = Math.max(Math.sqrt(variance), 0.05); // floor to avoid degenerate zero-variance blowups
    const pLater = 1 - normalCDF(t, mean, std);
    if(pLater <= 1e-16) return 16; // cap (would be +Infinity otherwise)
    return -Math.log10(pLater);
  }
}

const PHI_SUSPECT_THRESHOLD = 3;
const PHI_DEAD_THRESHOLD = 8;
function classify(phiValue){
  if(phiValue >= PHI_DEAD_THRESHOLD) return "dead";
  if(phiValue >= PHI_SUSPECT_THRESHOLD) return "suspect";
  return "alive";
}

/* ---------- gossip cluster simulation ---------- */

class GossipCluster{
  constructor(n, rng = Math.random){
    this.n = n;
    this.rng = rng;
    this.round = 0;
    this.killedNodes = new Set();
    this.hiccupNodes = new Map(); // nodeId -> roundsRemainingOfSilence

    // per-node local view of the whole cluster: Map<targetId, {heartbeat, data, version}>
    this.views = [];
    // per (observer) a Map<targetId, PhiAccrualDetector>
    this.detectors = [];
    for(let i = 0; i < n; i++){
      const view = new Map();
      for(let j = 0; j < n; j++) view.set(j, { heartbeat: 0, data: null, version: 0 });
      this.views.push(view);
      const det = new Map();
      for(let j = 0; j < n; j++) if(j !== i) det.set(j, new PhiAccrualDetector());
      this.detectors.push(det);
    }
    this.convergenceLog = []; // { round, key, fraction } for telemetry
    this.pendingConvergence = []; // { key, targetVersion } being tracked
    this.lastGossipPairs = []; // for the "temporary glowing link" visualization: pairs exchanged in the most recent round
  }

  isAlive(id){ return !this.killedNodes.has(id); }

  killNode(id){ this.killedNodes.add(id); }
  reviveNode(id){
    this.killedNodes.delete(id);
    // resume heartbeating from current value; no special reset needed
  }
  hiccupNode(id, rounds){ this.hiccupNodes.set(id, rounds); }

  injectData(nodeId, value){
    const entry = this.views[nodeId].get(nodeId);
    entry.version += 1;
    entry.data = value;
    entry.heartbeat += 1;
    const key = `${nodeId}:${entry.version}`;
    const pc = { key, nodeId, targetVersion: entry.version, startRound: this.round };
    this.pendingConvergence.push(pc);
    return pc;
  }

  step(){
    this.round += 1;
    this.lastGossipPairs = [];

    const hiccuppingThisRound = new Set();
    // 1. Heartbeat tick for alive, non-hiccuping nodes
    for(let i = 0; i < this.n; i++){
      if(!this.isAlive(i)) continue;
      const hiccupLeft = this.hiccupNodes.get(i) || 0;
      if(hiccupLeft > 0){
        hiccuppingThisRound.add(i);
        this.hiccupNodes.set(i, hiccupLeft - 1);
        continue; // silent this round: no heartbeat tick, no gossip initiated
      }
      const self = this.views[i].get(i);
      self.heartbeat += 1;
    }

    // 2. Each alive, non-hiccuping node initiates gossip with a random peer (push-pull merge)
    const activeInitiators = [];
    for(let i = 0; i < this.n; i++){
      if(!this.isAlive(i)) continue;
      if(hiccuppingThisRound.has(i)) continue;
      activeInitiators.push(i);
    }
    for(const i of activeInitiators){
      const aliveTargets = [];
      for(let k = 0; k < this.n; k++) if(k !== i && this.isAlive(k)) aliveTargets.push(k);
      if(aliveTargets.length === 0) continue;
      const j = aliveTargets[Math.floor(this.rng() * aliveTargets.length)];
      this.exchangeAndMerge(i, j);
      this.lastGossipPairs.push([i, j]);
    }

    // 3. Convergence telemetry: what fraction of ALIVE nodes have caught up to each pending version
    const aliveIds = [];
    for(let i = 0; i < this.n; i++) if(this.isAlive(i)) aliveIds.push(i);
    for(const pc of this.pendingConvergence){
      if(pc.convergedRound !== undefined) continue;
      const caughtUp = aliveIds.filter(id => this.views[id].get(pc.nodeId).version >= pc.targetVersion).length;
      const fraction = aliveIds.length > 0 ? caughtUp / aliveIds.length : 1;
      this.convergenceLog.push({ round: this.round, key: pc.key, fraction });
      if(fraction >= 1){
        pc.convergedRound = this.round;
        pc.roundsToConverge = this.round - pc.startRound;
      }
    }
  }

  // node i and node j exchange full views and merge (keep higher heartbeat/version per entry)
  exchangeAndMerge(i, j){
    const viewI = this.views[i], viewJ = this.views[j];
    for(let k = 0; k < this.n; k++){
      const a = viewI.get(k), b = viewJ.get(k);
      if(b.heartbeat > a.heartbeat){
        this.observeFresh(i, k, b.heartbeat);
        viewI.set(k, { heartbeat: b.heartbeat, data: b.version >= a.version ? b.data : a.data, version: Math.max(a.version, b.version) });
      } else if(a.heartbeat > b.heartbeat){
        this.observeFresh(j, k, a.heartbeat);
        viewJ.set(k, { heartbeat: a.heartbeat, data: a.version >= b.version ? a.data : b.data, version: Math.max(a.version, b.version) });
      } else if(a.version !== b.version){
        // heartbeats tied but data version differs (can happen right after injection in the same round) — merge to the max version either way
        const winner = a.version > b.version ? a : b;
        viewI.set(k, { ...winner });
        viewJ.set(k, { ...winner });
      }
    }
  }

  observeFresh(observerId, targetId){
    if(observerId === targetId) return;
    const det = this.detectors[observerId].get(targetId);
    if(det) det.recordHeartbeat(this.round);
  }

  phiOf(observerId, targetId){
    const det = this.detectors[observerId] && this.detectors[observerId].get(targetId);
    if(!det) return 0;
    return det.phi(this.round);
  }

  // cluster-wide "believed status" of a target: majority vote across all OTHER alive observers
  believedStatus(targetId){
    const votes = { alive: 0, suspect: 0, dead: 0 };
    for(let i = 0; i < this.n; i++){
      if(i === targetId || !this.isAlive(i)) continue;
      const p = this.phiOf(i, targetId);
      votes[classify(p)]++;
    }
    const total = votes.alive + votes.suspect + votes.dead;
    if(total === 0) return "alive";
    if(votes.dead / total > 0.5) return "dead";
    if((votes.dead + votes.suspect) / total > 0.5) return "suspect";
    return "alive";
  }
}

if(typeof module !== "undefined"){
  module.exports = { erf, normalCDF, PhiAccrualDetector, classify, PHI_SUSPECT_THRESHOLD, PHI_DEAD_THRESHOLD, GossipCluster };
}
