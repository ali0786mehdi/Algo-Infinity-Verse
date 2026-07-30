/**
 * Algo-Infinity-Verse | FABRIK Inverse Kinematics Visualizer
 * Geometric mathematical engine demonstrating Forward and Backward iterative vector snapping.
 */

// 2D Vector Math Library
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static distance(v1, v2) {
        return Math.hypot(v2.x - v1.x, v2.y - v1.y);
    }
    static sub(v1, v2) {
        return new Vec2(v1.x - v2.x, v1.y - v2.y);
    }
    static add(v1, v2) {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }
    static multiply(v, scalar) {
        return new Vec2(v.x * scalar, v.y * scalar);
    }
    static normalize(v) {
        const len = Math.hypot(v.x, v.y);
        if (len === 0) return new Vec2(0, 0);
        return new Vec2(v.x / len, v.y / len);
    }
    copy() {
        return new Vec2(this.x, this.y);
    }
}

class FabrikVisualizer {
    constructor() {
        // UI Bindings
        this.canvas = document.getElementById('fabrik-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.btnPlay = document.getElementById('btn-play');
        this.btnReset = document.getElementById('btn-reset');
        this.speedSlider = document.getElementById('speed-slider');
        this.valIterations = document.getElementById('val-iterations');
        this.valError = document.getElementById('val-error');
        this.statusText = document.getElementById('status-text');

        // Robotic Arm State
        this.numJoints = 5;
        this.segmentLengths = [120, 100, 80, 60]; // Lengths between joints
        this.totalLength = this.segmentLengths.reduce((a, b) => a + b, 0);
        this.joints = []; // Array of Vec2 positions
        this.baseOrigin = new Vec2(0, 0);
        
        // Target Orb State
        this.target = new Vec2(0, 0);
        this.isDragging = false;
        
        // Engine State
        this.tolerance = 0.5;
        this.iterationCount = 0;
        this.activePhase = 'CONVERGED'; // FORWARD, BACKWARD, UNREACHABLE, CONVERGED
        
        this.generator = null;
        this.isPlaying = true;
        this.animSpeed = 1.0;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.resetArm();
        this.startRenderLoop();
    }

    bindEvents() {
        this.btnPlay.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            this.btnPlay.innerHTML = this.isPlaying ? '<i class="fa-solid fa-pause"></i> Pause Engine' : '<i class="fa-solid fa-play"></i> Run Engine';
            this.btnPlay.classList.toggle('btn-primary');
            this.btnPlay.classList.toggle('btn-accent');
        });
        
        this.btnReset.addEventListener('click', () => this.resetArm());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animSpeed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = `${this.animSpeed.toFixed(1)}x`;
        });

        // Mouse & Touch Dragging Events
        const startDrag = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const mousePos = new Vec2(
                (clientX - rect.left) * (this.canvas.width / rect.width / window.devicePixelRatio),
                (clientY - rect.top) * (this.canvas.height / rect.height / window.devicePixelRatio)
            );

            // If clicked near target orb
            if (Vec2.distance(mousePos, this.target) < 40) {
                this.isDragging = true;
                this.updateTarget(mousePos);
            }
        };

        const moveDrag = (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            this.updateTarget(new Vec2(
                (clientX - rect.left) * (this.canvas.width / rect.width / window.devicePixelRatio),
                (clientY - rect.top) * (this.canvas.height / rect.height / window.devicePixelRatio)
            ));
        };

        const endDrag = () => { this.isDragging = false; };

        this.canvas.addEventListener('mousedown', startDrag);
        this.canvas.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);
        
        this.canvas.addEventListener('touchstart', startDrag, {passive: false});
        this.canvas.addEventListener('touchmove', moveDrag, {passive: false});
        window.addEventListener('touchend', endDrag);
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Reposition base dynamically
        const w = wrapper.clientWidth;
        const h = wrapper.clientHeight;
        this.baseOrigin = new Vec2(w / 2, h - 80);
        
        // If not dragging, reset to keep arm safely in view
        if(!this.isDragging) this.resetArm();
    }

    resetArm() {
        this.joints = [this.baseOrigin.copy()];
        
        // Initialize joints straight up
        for (let i = 0; i < this.segmentLengths.length; i++) {
            const prev = this.joints[i];
            this.joints.push(new Vec2(prev.x, prev.y - this.segmentLengths[i]));
        }
        
        // Target placed slightly off-center
        const endEffector = this.joints[this.joints.length - 1];
        this.target = new Vec2(endEffector.x + 100, endEffector.y + 50);
        
        this.generator = this.fabrikSolver();
        this.updateUIStatus("Arm Reset. Awaiting drag interactions.", "");
    }

    updateTarget(pos) {
        this.target = pos;
        this.generator = this.fabrikSolver(); // Restart the generator with new target
    }

    /* --- Core FABRIK Geometric Solver (Generator) --- */

    *fabrikSolver() {
        this.iterationCount = 0;
        const n = this.joints.length;
        
        while (true) {
            const distToBase = Vec2.distance(this.baseOrigin, this.target);
            
            // Phase: Unreachable Target (Stretching)
            if (distToBase > this.totalLength) {
                this.activePhase = 'UNREACHABLE';
                this.updateUIStatus("Target is unreachable. Stretching arm linearly.", "unreachable");
                
                // Calculate unit vector from base to target
                const dir = Vec2.normalize(Vec2.sub(this.target, this.baseOrigin));
                
                // Align all joints along this line
                for (let i = 1; i < n; i++) {
                    const scaledDir = Vec2.multiply(dir, this.segmentLengths[i-1]);
                    this.joints[i] = Vec2.add(this.joints[i-1], scaledDir);
                }
                
                this.updateTelemetry();
                yield; // Wait for next tick (user might drag closer)
                continue;
            }
            
            // Phase: Reachable Target (Iterative Convergence)
            const err = Vec2.distance(this.joints[n - 1], this.target);
            this.updateTelemetry(err);
            
            if (err < this.tolerance) {
                this.activePhase = 'CONVERGED';
                this.updateUIStatus("End-effector converged precisely on target.", "");
                yield; 
                continue;
            }

            this.iterationCount++;
            
            /* --- 1. Backward Reach (Snapping to Target) --- */
            this.activePhase = 'BACKWARD';
            this.updateUIStatus(`Iteration ${this.iterationCount}: Backward Reach pulling joints to target.`, "backward");
            
            // End-effector snaps to target
            this.joints[n - 1] = this.target.copy();
            
            // Pull previous joints along their vector lines
            for (let i = n - 2; i >= 0; i--) {
                const r = Vec2.distance(this.joints[i+1], this.joints[i]);
                const lambda = this.segmentLengths[i] / r;
                
                // Linearly interpolate vector constraint: P_i = (1-λ)P_{i+1} + λP_i
                this.joints[i].x = (1 - lambda) * this.joints[i+1].x + lambda * this.joints[i].x;
                this.joints[i].y = (1 - lambda) * this.joints[i+1].y + lambda * this.joints[i].y;
            }
            yield; 
            
            /* --- 2. Forward Reach (Snapping to Base) --- */
            this.activePhase = 'FORWARD';
            this.updateUIStatus(`Iteration ${this.iterationCount}: Forward Reach snapping base to origin.`, "forward");
            
            // Base snaps back to origin
            this.joints[0] = this.baseOrigin.copy();
            
            // Push subsequent joints forward along their vector lines
            for (let i = 0; i < n - 1; i++) {
                const r = Vec2.distance(this.joints[i+1], this.joints[i]);
                const lambda = this.segmentLengths[i] / r;
                
                // Linearly interpolate vector constraint: P_{i+1} = (1-λ)P_i + λP_{i+1}
                this.joints[i+1].x = (1 - lambda) * this.joints[i].x + lambda * this.joints[i+1].x;
                this.joints[i+1].y = (1 - lambda) * this.joints[i].y + lambda * this.joints[i+1].y;
            }
            yield; 
        }
    }

    /* --- UI & Telemetry --- */

    updateTelemetry(err = null) {
        this.valIterations.textContent = this.iterationCount;
        
        if (err !== null) {
            this.valError.textContent = err.toFixed(2);
            this.valError.className = err < this.tolerance ? 'metric-value text-emerald' : 'metric-value text-warning';
        }
    }

    updateUIStatus(msg, phaseStr) {
        this.statusText.textContent = msg;
        
        document.querySelectorAll('.phase-item').forEach(el => el.classList.remove('active-phase'));
        if (phaseStr) {
            const el = document.getElementById(`phase-${phaseStr}`);
            if (el) el.classList.add('active-phase');
        }
    }

    /* --- Canvas Render Loop --- */

    startRenderLoop() {
        let lastTime = 0;
        
        const loop = (timestamp) => {
            const deltaTime = timestamp - lastTime;
            
            if (this.isPlaying && this.generator) {
                // Throttle execution speed via UI Slider (1.0x = approx 15fps for visual clarity)
                const frameDelay = 1000 / (15 * this.animSpeed);
                if (deltaTime > frameDelay) {
                    this.generator.next();
                    lastTime = timestamp;
                }
            }
            
            this.drawPhysicsState();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    drawPhysicsState() {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, w, h);

        // Determine Theme colors based on Phase
        let armColor = '#475569';
        let jointGlow = 'transparent';
        
        if (this.activePhase === 'BACKWARD') {
            armColor = '#7c3aed'; jointGlow = '#7c3aed';
        } else if (this.activePhase === 'FORWARD') {
            armColor = '#06b6d4'; jointGlow = '#06b6d4';
        } else if (this.activePhase === 'UNREACHABLE') {
            armColor = '#f43f5e'; jointGlow = '#f43f5e';
        } else if (this.activePhase === 'CONVERGED') {
            armColor = '#10b981';
        }

        // Draw Arm Segments
        this.ctx.beginPath();
        this.ctx.moveTo(this.joints[0].x, this.joints[0].y);
        for (let i = 1; i < this.joints.length; i++) {
            this.ctx.lineTo(this.joints[i].x, this.joints[i].y);
        }
        this.ctx.strokeStyle = armColor;
        this.ctx.lineWidth = 12;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = jointGlow;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // reset

        // Draw Base Anchor (Origin)
        this.ctx.beginPath();
        this.ctx.arc(this.baseOrigin.x, this.baseOrigin.y, 14, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fill();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.stroke();

        // Draw Joints
        this.ctx.fillStyle = '#fff';
        for (let i = 1; i < this.joints.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.joints[i].x, this.joints[i].y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw Target Orb
        this.ctx.beginPath();
        this.ctx.arc(this.target.x, this.target.y, 18, 0, Math.PI * 2);
        this.ctx.fillStyle = this.isDragging ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.2)';
        this.ctx.fill();
        
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#10b981';
        this.ctx.stroke();
        
        // Target Inner Core
        this.ctx.beginPath();
        this.ctx.arc(this.target.x, this.target.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#10b981';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#10b981';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FabrikVisualizer();
});
