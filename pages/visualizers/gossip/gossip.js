/* ============================================================
   Gossip Protocol Visualizer — UI layer (built on gossip-core.js + D3-force)
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";
let cluster = null;
let simulation = null;
let nodesData = [];
let selectedNode = null;
let playing = false;
let playTimer = null;
let lastInjectedKey = null;

const statusLine = document.getElementById("statusLine");
function setStatus(msg){ statusLine.textContent = msg; }

/* ---------- build / rebuild cluster + force layout ---------- */

function buildCluster(){
  const n = Math.max(6, Math.min(120, parseInt(document.getElementById("nodeCount").value, 10) || 50));
  cluster = new GossipCluster(n);
  selectedNode = null;
  lastInjectedKey = null;
  nodesData = Array.from({ length: n }, (_, i) => ({ id: i, x: 450 + (Math.random()-0.5)*300, y: 240 + (Math.random()-0.5)*220 }));

  if(simulation) simulation.stop();
  simulation = d3.forceSimulation(nodesData)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("center", d3.forceCenter(450, 240))
    .force("collide", d3.forceCollide(15))
    .on("tick", renderMeshPositionsOnly);

  renderMeshFull();
  renderDetail();
  renderConvergenceChart();
  setStatus(`Rebuilt a ${n}-node cluster. All nodes alive, no data injected yet.`);
}

/* ---------- status helpers ---------- */

function displayStatus(id){
  if(cluster.killedNodes.has(id)) return "killed";
  return cluster.believedStatus(id);
}

/* ---------- mesh rendering ---------- */

function renderMeshFull(){
  const svg = document.getElementById("meshSvg");
  svg.innerHTML = "";
  const linkLayer = document.createElementNS(SVG_NS, "g");
  linkLayer.setAttribute("id", "linkLayer");
  const nodeLayer = document.createElementNS(SVG_NS, "g");
  nodeLayer.setAttribute("id", "nodeLayer");
  svg.appendChild(linkLayer);
  svg.appendChild(nodeLayer);

  nodesData.forEach(d => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "node-group");
    g.setAttribute("data-id", d.id);
    g.setAttribute("role", "button");
    g.setAttribute("tabindex", "0");
    g.setAttribute("aria-label", `Node ${d.id}`);
    g.style.cursor = "pointer";

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", 11);
    circle.setAttribute("class", "mesh-node " + displayStatus(d.id));
    g.appendChild(circle);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", "mesh-node-label");
    label.setAttribute("y", 22);
    label.textContent = d.id;
    g.appendChild(label);

    g.addEventListener("click", () => onNodeClick(d.id));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNodeClick(d.id);
      }
    });
    nodeLayer.appendChild(g);
  });

  renderMeshPositionsOnly();
}

function renderMeshPositionsOnly(){
  const nodeLayer = document.getElementById("nodeLayer");
  if(!nodeLayer) return;
  [...nodeLayer.children].forEach(g => {
    const id = parseInt(g.getAttribute("data-id"), 10);
    const d = nodesData[id];
    g.setAttribute("transform", `translate(${d.x},${d.y})`);
    const circle = g.querySelector("circle");
    let cls = "mesh-node " + displayStatus(id);
    if(selectedNode === id) cls += " selected";
    circle.setAttribute("class", cls);
  });
}

function flashGossipLinks(pairs){
  const linkLayer = document.getElementById("linkLayer");
  if(!linkLayer) return;
  pairs.forEach(([i, j]) => {
    const a = nodesData[i], b = nodesData[j];
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
    line.setAttribute("class", "gossip-link");
    linkLayer.appendChild(line);
    setTimeout(() => { line.style.opacity = "0"; }, 50);
    setTimeout(() => { line.remove(); }, 650);
  });
}

/* ---------- node interaction ---------- */

function onNodeClick(id){
  selectedNode = id;
  if(cluster.killedNodes.has(id)){
    cluster.reviveNode(id);
    setStatus(`Node ${id} revived — it will resume heartbeating and gossiping next round.`);
  } else {
    cluster.killNode(id);
    setStatus(`Node ${id} killed. Watch its φ climb across the cluster's other nodes before it's marked dead.`);
  }
  renderMeshPositionsOnly();
  renderDetail();
}

/* ---------- detail panel ---------- */

function renderDetail(){
  const box = document.getElementById("detailBox");
  const tag = document.getElementById("selectedTag");
  if(selectedNode === null){
    tag.textContent = "click a node";
    box.textContent = "Click any node above to inspect its heartbeat, and how a few other nodes currently perceive it.";
    return;
  }
  const id = selectedNode;
  tag.textContent = `node ${id}`;
  const self = cluster.views[id].get(id);
  const status = displayStatus(id);
  const statusClass = status === "alive" ? "good" : status === "suspect" ? "warn" : "bad";

  const observerIds = [];
  for(let i = 0; i < cluster.n && observerIds.length < 4; i++){
    if(i !== id && cluster.isAlive(i)) observerIds.push(i);
  }

  let html = `<div class="dhead">Node ${id}</div>`;
  html += `<div class="detail-row"><span class="k">Status: </span><span class="v ${statusClass}">${status}</span></div>`;
  html += `<div class="detail-row"><span class="k">Own heartbeat counter: </span><span class="v">${self.heartbeat}</span></div>`;
  html += `<div class="detail-row"><span class="k">Data version: </span><span class="v">${self.version}</span></div>`;
  const safeData = self.data === null ? "—" : String(self.data).replace(/[&<>'"]/g, c => `&#${c.charCodeAt(0)};`);
  html += `<div class="detail-row"><span class="k">Data value: </span><span class="v">${safeData}</span></div>`;
  html += `<br><div class="k">As perceived by other nodes:</div>`;
  observerIds.forEach(obs => {
    const p = cluster.phiOf(obs, id);
    const cls = classify(p);
    const clsColor = cls === "alive" ? "good" : cls === "suspect" ? "warn" : "bad";
    html += `<div class="detail-row"><span class="k">node ${obs} sees φ=</span><span class="v ${clsColor}">${p.toFixed(2)} (${cls})</span></div>`;
  });
  box.innerHTML = html;
}

/* ---------- convergence chart ---------- */

function renderConvergenceChart(){
  const svg = document.getElementById("convergenceSvg");
  svg.innerHTML = "";
  const W = 500, H = 280, padL = 40, padB = 30, padT = 16, padR = 16;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const axisX = document.createElementNS(SVG_NS, "line");
  axisX.setAttribute("x1", padL); axisX.setAttribute("y1", H - padB);
  axisX.setAttribute("x2", W - padR); axisX.setAttribute("y2", H - padB);
  axisX.setAttribute("class", "convergence-axis");
  svg.appendChild(axisX);
  const axisY = document.createElementNS(SVG_NS, "line");
  axisY.setAttribute("x1", padL); axisY.setAttribute("y1", padT);
  axisY.setAttribute("x2", padL); axisY.setAttribute("y2", H - padB);
  axisY.setAttribute("class", "convergence-axis");
  svg.appendChild(axisY);

  const yLabel100 = document.createElementNS(SVG_NS, "text");
  yLabel100.setAttribute("x", 6); yLabel100.setAttribute("y", padT + 4);
  yLabel100.setAttribute("class", "convergence-label"); yLabel100.textContent = "100%";
  svg.appendChild(yLabel100);
  const yLabel0 = document.createElementNS(SVG_NS, "text");
  yLabel0.setAttribute("x", 12); yLabel0.setAttribute("y", H - padB + 4);
  yLabel0.setAttribute("class", "convergence-label"); yLabel0.textContent = "0%";
  svg.appendChild(yLabel0);

  if(!lastInjectedKey){
    const msg = document.createElementNS(SVG_NS, "text");
    msg.setAttribute("x", W/2); msg.setAttribute("y", H/2);
    msg.setAttribute("class", "convergence-label");
    msg.setAttribute("text-anchor", "middle");
    msg.textContent = "Inject data to see convergence over rounds";
    svg.appendChild(msg);
    return;
  }

  const points = cluster.convergenceLog.filter(p => p.key === lastInjectedKey);
  if(points.length === 0) return;
  const minRound = points[0].round;
  const maxRound = Math.max(...points.map(p => p.round), minRound + 1);
  const xScale = r => padL + ((r - minRound) / (maxRound - minRound)) * plotW;
  const yScale = f => padT + (1 - f) * plotH;

  let d = "";
  points.forEach((p, i) => {
    const x = xScale(p.round), y = yScale(p.fraction);
    d += (i === 0 ? "M" : "L") + x + "," + y + " ";
  });
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d.trim());
  path.setAttribute("class", "convergence-line");
  svg.appendChild(path);

  const xLabelEnd = document.createElementNS(SVG_NS, "text");
  xLabelEnd.setAttribute("x", W - padR); xLabelEnd.setAttribute("y", H - padB + 16);
  xLabelEnd.setAttribute("class", "convergence-label"); xLabelEnd.setAttribute("text-anchor", "end");
  xLabelEnd.textContent = `round ${maxRound}`;
  svg.appendChild(xLabelEnd);

  const converged = points.find(p => p.fraction >= 1);
  if(converged){
    const cx = xScale(converged.round), cy = yScale(1);
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", 4);
    dot.setAttribute("class", "convergence-marker");
    svg.appendChild(dot);
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", cx); label.setAttribute("y", cy - 10);
    label.setAttribute("class", "convergence-label"); label.setAttribute("text-anchor", "middle");
    label.textContent = `100% @ round ${converged.round}`;
    svg.appendChild(label);
  }
}

/* ---------- stepping ---------- */

function stepRound(){
  cluster.step();
  flashGossipLinks(cluster.lastGossipPairs);
  renderMeshPositionsOnly();
  if(selectedNode !== null) renderDetail();
  if(lastInjectedKey) renderConvergenceChart();
  setStatus(`Round ${cluster.round}: ${cluster.lastGossipPairs.length} gossip exchange(s) fired.`);
}

function stopPlaying(){
  playing = false;
  if(playTimer) clearInterval(playTimer);
  playTimer = null;
  document.getElementById("btnPlay").textContent = "▶ Start Gossiping";
}
function togglePlay(){
  if(playing){ stopPlaying(); return; }
  playing = true;
  document.getElementById("btnPlay").textContent = "⏸ Pause";
  const speed = parseInt(document.getElementById("speedSlider").value, 10);
  playTimer = setInterval(stepRound, speed);
}

/* ---------- actions ---------- */

function injectRandomData(){
  const aliveIds = [];
  for(let i = 0; i < cluster.n; i++) if(cluster.isAlive(i)) aliveIds.push(i);
  if(aliveIds.length === 0){ setStatus("No alive nodes to inject data into."); return; }
  const target = aliveIds[Math.floor(Math.random() * aliveIds.length)];
  const value = "v" + Math.floor(Math.random() * 10000);
  const pc = cluster.injectData(target, value);
  lastInjectedKey = pc.key;
  setStatus(`Injected "${value}" at node ${target}. Watch the convergence chart — this update needs to reach every alive node.`);
  renderConvergenceChart();
}

function simulateHiccup(){
  const aliveIds = [];
  for(let i = 0; i < cluster.n; i++) if(cluster.isAlive(i)) aliveIds.push(i);
  if(aliveIds.length === 0) return;
  const target = aliveIds[Math.floor(Math.random() * aliveIds.length)];
  cluster.hiccupNode(target, 3 + Math.floor(Math.random() * 3));
  selectedNode = target;
  setStatus(`Node ${target} will go silent for a few rounds (simulated latency spike) — watch its φ rise and, if it's brief enough, recover without ever being marked dead.`);
  renderDetail();
}

/* ---------- wire up UI ---------- */

document.getElementById("btnRebuild").addEventListener("click", () => { stopPlaying(); buildCluster(); });
document.getElementById("btnPlay").addEventListener("click", togglePlay);
document.getElementById("btnStep").addEventListener("click", () => { stopPlaying(); stepRound(); });
document.getElementById("speedSlider").addEventListener("input", (e) => {
  document.getElementById("speedVal").textContent = `${e.target.value}ms`;
  if(playing){ stopPlaying(); togglePlay(); }
});
document.getElementById("btnInject").addEventListener("click", injectRandomData);
document.getElementById("btnHiccup").addEventListener("click", simulateHiccup);
document.getElementById("btnReviveAll").addEventListener("click", () => {
  for(let i = 0; i < cluster.n; i++) cluster.reviveNode(i);
  cluster.hiccupNodes.clear();
  renderMeshPositionsOnly();
  renderDetail();
  setStatus("All nodes revived.");
});

/* ---------- boot ---------- */
buildCluster();
