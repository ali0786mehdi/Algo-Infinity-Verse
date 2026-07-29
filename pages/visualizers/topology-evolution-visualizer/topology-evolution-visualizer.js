/**
 * Algo-Infinity-Verse | NEAT Topology Evolution Visualizer
 * Animates Genetic Crossover using Historical Innovation Numbers.
 */

// Basic Data Structures
class ConnectionGene {
    constructor(inNode, outNode, weight, enabled, innovationNum) {
        this.inNode = inNode;
        this.outNode = outNode;
        this.weight = weight;
        this.enabled = enabled;
        this.innovationNum = innovationNum;
    }
}

class Genome {
    constructor() {
        this.connections = [];
        this.maxNode = 0;
    }
    addConnection(conn) {
        this.connections.push(conn);
        this.maxNode = Math.max(this.maxNode, conn.inNode, conn.outNode);
    }
    sortByInnovation() {
        this.connections.sort((a, b) => a.innovationNum - b.innovationNum);
    }
}

class NeatVisualizer {
    constructor() {
        // Canvases
        this.canvasA = document.getElementById('canvas-parent-a');
        this.canvasB = document.getElementById('canvas-parent-b');
        this.canvasChild = document.getElementById('canvas-child');
        this.ctxA = this.canvasA.getContext('2d');
        this.ctxB = this.canvasB.getContext('2d');
        this.ctxChild = this.canvasChild.getContext('2d');

        // DOM Tracks
        this.trackA = document.getElementById('track-parent-a');
        this.trackB = document.getElementById('track-parent-b');
        this.trackChild = document.getElementById('track-child');
        
        // UI
        this.btnPlay = document.getElementById('btn-play');
        this.btnStep = document.getElementById('btn-step');
        this.btnReset = document.getElementById('btn-reset');
        this.speedSlider = document.getElementById('speed-slider');
        this.statusText = document.getElementById('status-text');
        
        this.valMatching = document.getElementById('val-matching');
        this.valDisjoint = document.getElementById('val-disjoint');

        // Genomes
        this.genomeA = new Genome();
        this.genomeB = new Genome();
        this.genomeChild = new Genome();
        
        // Hardcoded optimal coordinates for educational display (In->Hidden->Out layers)
        this.nodeLayout = {
            1: { x: 0.15, y: 0.3 }, // Input 1
            2: { x: 0.15, y: 0.7 }, // Input 2
            3: { x: 0.85, y: 0.5 }, // Output 1
            4: { x: 0.50, y: 0.25 }, // Hidden 1
            5: { x: 0.50, y: 0.75 }  // Hidden 2
        };

        // State Machine
        this.geneElementsA = new Map(); // innovNum -> DOM element
        this.geneElementsB = new Map();
        
        this.generator = null;
        this.isPlaying = false;
        this.animSpeed = 1.0;
        this.autoPlayTimeout = null;

        this.init();
    }

    init() {
        this.bindEvents();
        window.addEventListener('resize', () => this.drawAllNetworks());
        this.resetEngine();
    }

    bindEvents() {
        this.btnPlay.addEventListener('click', () => {
            if (this.isPlaying) this.pause();
            else this.play();
        });
        
        this.btnStep.addEventListener('click', () => {
            this.pause();
            this.step();
        });
        
        this.btnReset.addEventListener('click', () => this.resetEngine());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
        });
    }

    resetEngine() {
        this.pause();
        this.genomeChild = new Genome();
        this.valMatching.textContent = '0';
        this.valDisjoint.textContent = '0';
        
        this.trackA.innerHTML = '';
        this.trackB.innerHTML = '';
        this.trackChild.innerHTML = '';
        this.geneElementsA.clear();
        this.geneElementsB.clear();

        this.setupHardcodedGenomes();
        
        this.drawNetwork(this.canvasA, this.ctxA, this.genomeA, '#06b6d4');
        this.drawNetwork(this.canvasB, this.ctxB, this.genomeB, '#7c3aed');
        this.drawNetwork(this.canvasChild, this.ctxChild, this.genomeChild, '#10b981'); // Empty

        this.buildGenomeDOM(this.genomeA, this.trackA, this.geneElementsA);
        this.buildGenomeDOM(this.genomeB, this.trackB, this.geneElementsB);
        
        this.generator = this.crossoverGenerator();
        this.btnStep.disabled = false;
        this.btnPlay.disabled = false;
        this.updateStatus("Genomes initialized. Ready to perform Historic Alignment.");
    }

    setupHardcodedGenomes() {
        // Parent A (Fitter)
        this.genomeA.addConnection(new ConnectionGene(1, 4, 1.0, true, 1));
        this.genomeA.addConnection(new ConnectionGene(2, 4, -0.5, false, 2)); // Disabled
        this.genomeA.addConnection(new ConnectionGene(4, 3, 0.8, true, 3));
        this.genomeA.addConnection(new ConnectionGene(1, 3, 0.2, true, 4));
        this.genomeA.addConnection(new ConnectionGene(5, 4, 0.1, true, 8)); // Disjoint

        // Parent B
        this.genomeB.addConnection(new ConnectionGene(1, 4, 0.5, true, 1));
        this.genomeB.addConnection(new ConnectionGene(2, 4, 0.9, true, 2));
        this.genomeB.addConnection(new ConnectionGene(4, 3, -0.4, true, 3));
        this.genomeB.addConnection(new ConnectionGene(2, 5, 0.7, true, 5)); // Disjoint
        this.genomeB.addConnection(new ConnectionGene(5, 3, 0.6, true, 6)); // Excess
        this.genomeB.addConnection(new ConnectionGene(1, 5, -0.2, true, 7)); // Excess

        this.genomeA.sortByInnovation();
        this.genomeB.sortByInnovation();
    }

    /* --- DOM Genome Track Builders --- */

    buildGenomeDOM(genome, track, mapRef) {
        // Initially pack blocks tightly to the left
        genome.connections.forEach((conn, index) => {
            const block = document.createElement('div');
            block.className = `gene-block ${conn.enabled ? '' : 'gene-disabled'}`;
            block.innerHTML = `
                <span class="gene-in">${conn.innovationNum}</span>
                <span class="gene-nodes">${conn.inNode}&rarr;${conn.outNode}</span>
            `;
            
            // Initial packed position
            const widthOffset = 48; // 44px width + 4px gap
            block.style.transform = `translateX(${index * widthOffset}px)`;
            
            track.appendChild(block);
            mapRef.set(conn.innovationNum, block);
        });
    }

    /* --- Core Crossover Logic (Generator) --- */

    *crossoverGenerator() {
        // Phase 1: Alignment
        yield { msg: "Phase 1: Aligning homologous genes using Historical Innovation Numbers." };
        
        let maxInnovation = 0;
        this.genomeA.connections.forEach(c => maxInnovation = Math.max(maxInnovation, c.innovationNum));
        this.genomeB.connections.forEach(c => maxInnovation = Math.max(maxInnovation, c.innovationNum));

        const widthOffset = 48;
        let alignmentIndex = 0;
        let matchCount = 0;
        let disjointExcessCount = 0;

        for (let i = 1; i <= maxInnovation; i++) {
            const elA = this.geneElementsA.get(i);
            const elB = this.geneElementsB.get(i);
            
            if (!elA && !elB) continue; // Gap in innovation numbers

            // Animate Sliding to align columns
            const targetTransform = `translateX(${alignmentIndex * widthOffset}px)`;
            if (elA) elA.style.transform = targetTransform;
            if (elB) elB.style.transform = targetTransform;

            // Classify relationship
            if (elA && elB) {
                elA.classList.add('gene-highlight-match');
                elB.classList.add('gene-highlight-match');
            } else if (elA || elB) {
                // Determine if Disjoint or Excess based on parent ranges
                const activeEl = elA || elB;
                const otherGenome = elA ? this.genomeB : this.genomeA;
                const maxOther = otherGenome.connections.length > 0 ? otherGenome.connections[otherGenome.connections.length - 1].innovationNum : 0;
                
                if (i <= maxOther) {
                    activeEl.classList.add('gene-highlight-disjoint');
                } else {
                    activeEl.classList.add('gene-highlight-excess');
                }
            }
            alignmentIndex++;
        }
        
        yield { msg: "Alignment complete. Matching genes found. Scanning to produce offspring..." };

        // Phase 2: Gene Selection
        alignmentIndex = 0;
        for (let i = 1; i <= maxInnovation; i++) {
            const elA = this.geneElementsA.get(i);
            const elB = this.geneElementsB.get(i);
            const connA = this.genomeA.connections.find(c => c.innovationNum === i);
            const connB = this.genomeB.connections.find(c => c.innovationNum === i);
            
            if (!connA && !connB) continue;

            const targetTransform = `translateX(${alignmentIndex * widthOffset}px)`;
            
            // Highlight scanning
            if(elA) elA.style.transform = `${targetTransform} scale(1.1) translateY(-5px)`;
            if(elB) elB.style.transform = `${targetTransform} scale(1.1) translateY(-5px)`;

            yield { msg: `Evaluating Innovation Gene ${i}...` };

            let inheritedConn = null;
            let sourceColorClass = '';

            if (connA && connB) {
                // Matching Gene: Inherit randomly
                matchCount++;
                this.valMatching.textContent = matchCount;
                if (Math.random() > 0.5) {
                    inheritedConn = Object.assign({}, connA);
                    sourceColorClass = 'text-cyan';
                } else {
                    inheritedConn = Object.assign({}, connB);
                    sourceColorClass = 'text-purple';
                }
                
                // If either parent has it disabled, child has 75% chance to disable
                if (!connA.enabled || !connB.enabled) {
                    inheritedConn.enabled = Math.random() > 0.75;
                }
                this.updateStatus(`Matching Gene ${i}. Inherited randomly from ${sourceColorClass === 'text-cyan' ? 'Parent A' : 'Parent B'}.`);

            } else {
                // Disjoint/Excess Gene: Inherit from fitter parent (Parent A)
                disjointExcessCount++;
                this.valDisjoint.textContent = disjointExcessCount;
                
                if (connA) {
                    inheritedConn = Object.assign({}, connA);
                    this.updateStatus(`Disjoint/Excess Gene ${i}. Inherited from fitter Parent A.`);
                } else {
                    this.updateStatus(`Disjoint/Excess Gene ${i} belongs to less fit Parent B. Discarded.`);
                }
            }

            // Animate Drop into Child Genome Track
            if (inheritedConn) {
                this.genomeChild.addConnection(inheritedConn);
                
                const block = document.createElement('div');
                block.className = `gene-block ${inheritedConn.enabled ? '' : 'gene-disabled'}`;
                block.style.transform = targetTransform;
                // Animate dropping from above
                block.style.opacity = '0';
                block.style.marginTop = '-30px';
                
                block.innerHTML = `
                    <span class="gene-in">${inheritedConn.innovationNum}</span>
                    <span class="gene-nodes">${inheritedConn.inNode}&rarr;${inheritedConn.outNode}</span>
                `;
                this.trackChild.appendChild(block);
                
                // Trigger reflow for CSS transition
                void block.offsetWidth;
                block.style.opacity = '1';
                block.style.marginTop = '0px';
            }

            // Restore scale
            if(elA) elA.style.transform = targetTransform;
            if(elB) elB.style.transform = targetTransform;

            alignmentIndex++;
            yield; 
        }

        yield { msg: "Genome Crossover complete. Constructing Child Neural Topology..." };
        this.drawNetwork(this.canvasChild, this.ctxChild, this.genomeChild, '#10b981');
        yield { msg: "Evolution Successful! Offspring network generated." };
    }

    /* --- Neural Graph Canvas Rendering --- */

    drawAllNetworks() {
        this.drawNetwork(this.canvasA, this.ctxA, this.genomeA, '#06b6d4');
        this.drawNetwork(this.canvasB, this.ctxB, this.genomeB, '#7c3aed');
        this.drawNetwork(this.canvasChild, this.ctxChild, this.genomeChild, '#10b981');
    }

    drawNetwork(canvas, ctx, genome, baseColor) {
        // Adjust Canvas Dpi
        const wrapper = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = wrapper.clientWidth * dpr;
        canvas.height = (wrapper.clientHeight - 40) * dpr; // 40px for header
        ctx.scale(dpr, dpr);

        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        
        ctx.clearRect(0, 0, w, h);
        if (genome.connections.length === 0) return;

        // Collect unique nodes from genome
        const activeNodes = new Set();
        genome.connections.forEach(c => {
            activeNodes.add(c.inNode);
            activeNodes.add(c.outNode);
        });

        // Draw Connections
        genome.connections.forEach(c => {
            const start = this.nodeLayout[c.inNode];
            const end = this.nodeLayout[c.outNode];
            if (!start || !end) return;

            const sx = start.x * w; const sy = start.y * h;
            const ex = end.x * w; const ey = end.y * h;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            
            // Curve lines slightly for aesthetics
            const cp1x = sx + (ex - sx) * 0.5;
            const cp1y = sy;
            const cp2x = sx + (ex - sx) * 0.5;
            const cp2y = ey;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);

            if (c.enabled) {
                ctx.strokeStyle = c.weight >= 0 ? baseColor : '#f43f5e'; // Base color or Red if negative
                ctx.lineWidth = 2 + Math.abs(c.weight);
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw Nodes
        activeNodes.forEach(id => {
            const pos = this.nodeLayout[id];
            if (!pos) return;
            const px = pos.x * w; const py = pos.y * h;

            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = baseColor;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '10px "Inter"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(id, px, py);
        });
    }

    /* --- Run Execution Logic --- */

    step() {
        if (!this.generator) return;
        const { value, done } = this.generator.next();
        if (done) {
            this.pause();
            this.btnStep.disabled = true;
            this.btnPlay.disabled = true;
            return;
        }
        if (value && value.msg) this.updateStatus(value.msg);
    }

    play() {
        this.isPlaying = true;
        this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        this.btnPlay.classList.replace('btn-primary', 'btn-accent');
        
        const tick = () => {
            if (!this.isPlaying) return;
            this.step();
            if (this.btnStep.disabled) {
                this.pause();
                return;
            }
            const delay = Math.max(150, 1000 / this.animSpeed);
            this.autoPlayTimeout = setTimeout(tick, delay);
        };
        tick();
    }

    pause() {
        this.isPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Run Crossover';
        this.btnPlay.classList.replace('btn-accent', 'btn-primary');
    }
    
    updateStatus(msg) {
        this.statusText.textContent = msg;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NeatVisualizer();
});
