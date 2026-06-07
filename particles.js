/**
 * Antigravity Interactive Particle Background
 * A high-performance, fluid particle system resembling Google's Antigravity effect.
 * Uses pure HTML5 Canvas, responsive radial wave motion, and Hooke's Law spring physics.
 */

class AntigravityParticles {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Physics and wave configuration
        this.config = {
            desktopCount: 2500,     // Number of particles on desktop
            mobileCount: 800,      // Scaled down for mobile performance
            ringSpacing: 16,        // Space between concentric rings in pixels
            springStiffness: 0.035, // Hooke's Law constant (k)
            damping: 0.90,          // Friction / drag coefficient
            influenceRadius: 180,   // Radius of mouse attraction in pixels
            mouseAttraction: 1.5,   // Strength of gravity towards cursor
            maxRings: 45,           // Maximum number of concentric circles
            waveSpeed: 0.0015,      // Wave speed multiplier
            rotationSpeed: 0.0003,  // Continuous slow rotation of the radial structure
            colorBucketsCount: 20   // Number of buckets to optimize rendering draw calls
        };

        // Current state
        this.particles = [];
        this.mouse = { x: null, y: null, targetX: null, targetY: null, active: false };
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.maxRadius = 0;
        this.time = 0;
        
        // Initialize HSL color stops for the gradient based on theme
        this.themes = {
            light: [
                { h: 195, s: 75, l: 45 }, // Softer Cyan/Blue for readability
                { h: 265, s: 60, l: 50 }, // Softer Purple
                { h: 325, s: 70, l: 50 }, // Softer Pink
                { h: 200, s: 85, l: 40 }  // Deep Cyan
            ],
            dark: [
                { h: 195, s: 85, l: 60 }, // Bright Cyan/Blue
                { h: 265, s: 80, l: 65 }, // Purple
                { h: 325, s: 85, l: 65 }, // Hot Pink
                { h: 25, s: 95, l: 60 }   // Warm Orange
            ]
        };

        const currentTheme = document.documentElement.getAttribute('data-theme') || 
                             localStorage.getItem('theme') || 
                             (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.colorStops = this.themes[currentTheme] || this.themes.light;

        this.init();
    }

    /**
     * Set up the canvas, bind events, generate particles, and kick off the animation.
     */
    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    /**
     * Capture window resizing to keep the canvas full-screen and update center coordinates.
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Max radial bounds based on the window proportions
        this.maxRadius = Math.min(this.width, this.height) * 0.55;

        // If particles already exist, recalculate base coordinates for responsiveness
        if (this.particles.length > 0) {
            this.updateBaseCoordinates();
        }
    }

    /**
     * Map a normalized value (0.0 to 1.0) into our HSL color gradient.
     */
    interpolateColor(t) {
        // Clamp t
        t = Math.max(0, Math.min(1, t));
        
        // Determine which segment of the gradient we are in
        const segmentsCount = this.colorStops.length - 1;
        const segment = Math.min(Math.floor(t * segmentsCount), segmentsCount - 1);
        const segmentProgress = (t - (segment / segmentsCount)) * segmentsCount;

        const start = this.colorStops[segment];
        const end = this.colorStops[segment + 1];

        // Linear interpolation for Hue, Saturation, and Lightness
        // Handles hue wrapping correctly
        let hStart = start.h;
        let hEnd = end.h;
        let diff = hEnd - hStart;
        if (diff > 180) {
            hEnd -= 360;
        } else if (diff < -180) {
            hEnd += 360;
        }

        let h = hStart + segmentProgress * (hEnd - hStart);
        if (h < 0) h += 360;

        const s = start.s + segmentProgress * (end.s - start.s);
        const l = start.l + segmentProgress * (end.l - start.l);

        return { h: Math.round(h), s: Math.round(s), l: Math.round(l) };
    }

    /**
     * Initialize/regenerate particle objects distributed in concentric rings.
     */
    createParticles() {
        this.particles = [];
        const isMobile = this.width < 768;
        const totalCount = isMobile ? this.config.mobileCount : this.config.desktopCount;

        // Determine actual rings based on size
        const numRings = Math.min(this.config.maxRings, Math.floor(this.maxRadius / this.config.ringSpacing));
        
        // Calculate the sum of ring ratios to distribute density proportionally
        let ringRatioSum = 0;
        for (let i = 1; i <= numRings; i++) {
            ringRatioSum += i; // Proportional to radius
        }

        // Generate particles per ring
        let particlesCreated = 0;
        for (let i = 1; i <= numRings; i++) {
            const ringRadius = i * this.config.ringSpacing;
            const ringRatio = i / ringRatioSum;
            
            // Calculate how many particles belong in this ring
            let particlesInRing = Math.round(totalCount * ringRatio);
            
            // Keep at least some particles in inner rings
            if (particlesInRing < 6) particlesInRing = 6;

            for (let j = 0; j < particlesInRing; j++) {
                if (particlesCreated >= totalCount) break;

                const angle = (j / particlesInRing) * Math.PI * 2;
                
                // Static base coordinates relative to center
                const baseX = ringRadius * Math.cos(angle);
                const baseY = ringRadius * Math.sin(angle);

                // Normalization factor for color interpolation
                const normRadius = i / numRings;
                const baseColor = this.interpolateColor(normRadius);
                
                // Map color to a specific discrete bucket index for draw call batching
                const colorBucket = Math.floor(normRadius * (this.config.colorBucketsCount - 0.001));

                // Create individual particle
                this.particles.push({
                    ringIndex: i,
                    angle: angle,
                    radius: ringRadius,
                    baseX: baseX,
                    baseY: baseY,
                    
                    // Current physical coordinates (start at base centered)
                    x: this.centerX + baseX,
                    y: this.centerY + baseY,
                    
                    // Velocity
                    vx: 0,
                    vy: 0,
                    
                    // Custom micro-behaviors
                    size: 1.0 + Math.random() * 1.5,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.8 + Math.random() * 0.4,
                    colorBucket: colorBucket,
                    baseColor: baseColor,
                    
                    // Precalculated HSL values to prevent string allocations in high-frequency loop
                    colorString: `hsla(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%,`
                });

                particlesCreated++;
            }
        }
    }

    /**
     * Responsively adjust all base locations during resize without resetting physical velocities.
     */
    updateBaseCoordinates() {
        const numRings = Math.min(this.config.maxRings, Math.floor(this.maxRadius / this.config.ringSpacing));
        
        this.particles.forEach(p => {
            // Recalculate original radius relative to scale
            const scaledRadius = (p.ringIndex / numRings) * this.maxRadius;
            p.radius = scaledRadius;
            p.baseX = scaledRadius * Math.cos(p.angle);
            p.baseY = scaledRadius * Math.sin(p.angle);
        });
    }

    /**
     * Bind mouse, touch, and visibility event listeners.
     */
    bindEvents() {
        // Desktop mouse tracking
        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = e.clientX;
            this.mouse.targetY = e.clientY;
            this.mouse.active = true;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.targetX = null;
            this.mouse.targetY = null;
            this.mouse.active = false;
        });

        // Mobile touch tracking
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.mouse.targetX = e.touches[0].clientX;
                this.mouse.targetY = e.touches[0].clientY;
                this.mouse.active = true;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.targetX = e.touches[0].clientX;
                this.mouse.targetY = e.touches[0].clientY;
                this.mouse.active = true;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.mouse.targetX = null;
            this.mouse.targetY = null;
            this.mouse.active = false;
        }, { passive: true });

        // Responsive resize
        window.addEventListener('resize', () => this.resize());

        // Pause animation when tab is inactive to save CPU/Battery
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.mouse.active = false;
            }
        });
    }

    /**
     * Main animation frame loop.
     */
    animate() {
        this.time = performance.now();
        
        // Smoothly interpolate current mouse position toward the target for fluid spring transition
        if (this.mouse.active && this.mouse.targetX !== null && this.mouse.targetY !== null) {
            if (this.mouse.x === null) {
                this.mouse.x = this.mouse.targetX;
                this.mouse.y = this.mouse.targetY;
            } else {
                // Smooth easing on mouse coordinates to prevent physics jittering
                this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.15;
                this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.15;
            }
        } else {
            this.mouse.x = null;
            this.mouse.y = null;
        }

        this.updatePhysics();
        this.draw();

        requestAnimationFrame(() => this.animate());
    }

    /**
     * Update the motion, ripples, and gravity equations of all particles.
     */
    updatePhysics() {
        const timeFactor = this.time * this.config.waveSpeed;
        const rotFactor = this.time * this.config.rotationSpeed;
        
        const m = this.mouse;
        const infRad = this.config.influenceRadius;
        const k = this.config.springStiffness;
        const damp = this.config.damping;
        const attract = this.config.mouseAttraction;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 1. Calculate breathing radial wave and slow orbital rotation
            const rotationAngle = p.angle + rotFactor;
            
            // Generate radial wave offsets based on distance and individual speed multi
            const waveOffset = (p.radius * 0.012 - timeFactor * p.speed);
            const radiusWave = p.radius + 15 * Math.sin(waveOffset);
            
            // Introduce subtle coordinate twists
            const angularWave = rotationAngle + 0.12 * Math.cos(p.radius * 0.007 + timeFactor * 0.5);

            // Compute resting target coordinate ("home")
            const homeX = this.centerX + radiusWave * Math.cos(angularWave);
            const homeY = this.centerY + radiusWave * Math.sin(angularWave);

            // 2. Hooke's Law Spring Force
            let forceX = (homeX - p.x) * k;
            let forceY = (homeY - p.y) * k;

            // 3. Mouse Gravitational Attraction Force
            if (m.x !== null && m.y !== null) {
                const dx = m.x - p.x;
                const dy = m.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < infRad && dist > 1) {
                    // Quadratic drop-off to create extremely smooth attraction bounds
                    const t = 1 - dist / infRad;
                    const forceStrength = t * t * attract;
                    
                    // Add gravity pulling toward cursor coordinates
                    forceX += (dx / dist) * forceStrength;
                    forceY += (dy / dist) * forceStrength;
                }
            }

            // 4. Update velocity with forces and damping (friction)
            p.vx = (p.vx + forceX) * damp;
            p.vy = (p.vy + forceY) * damp;

            // 5. Update physical positions
            p.x += p.vx;
            p.y += p.vy;
        }
    }

    /**
     * Premium optimized rendering. Grouping paths to draw 4,500 particles in just 20 draw calls.
     */
    draw() {
        // Clear canvas completely to keep it fully transparent and allow the body background to show
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Pre-group particles by color bucket to avoid redundant beginPath / fill calls
        const buckets = Array.from({ length: this.config.colorBucketsCount }, () => []);
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            buckets[p.colorBucket].push(p);
        }

        const opacityTime = this.time * 0.004;

        // Render each bucket sequentially with a single high-performance fill operation
        for (let b = 0; b < this.config.colorBucketsCount; b++) {
            const bucketParticles = buckets[b];
            if (bucketParticles.length === 0) continue;

            // Use the first particle's precomputed color for this bucket
            const first = bucketParticles[0];
            
            // Calculate a breathing opacity representing a starry twinkle
            const twinkle = 0.45 + 0.3 * Math.sin(opacityTime + b * 0.5);
            this.ctx.fillStyle = `${first.colorString} ${twinkle})`;

            this.ctx.beginPath();
            for (let i = 0; i < bucketParticles.length; i++) {
                const p = bucketParticles[i];
                // Render as small circles
                this.ctx.moveTo(p.x + p.size, p.y);
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
            this.ctx.fill();
        }
    }

    /**
     * Dynamically change the particle colors based on the current theme.
     */
    setTheme(theme) {
        if (!this.themes[theme]) return;
        this.colorStops = this.themes[theme];
        
        // Recalculate color properties for each particle using the new theme stops
        const numRings = Math.min(this.config.maxRings, Math.floor(this.maxRadius / this.config.ringSpacing));
        
        this.particles.forEach(p => {
            const normRadius = p.ringIndex / numRings;
            const baseColor = this.interpolateColor(normRadius);
            p.baseColor = baseColor;
            p.colorString = `hsla(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%,`;
        });
    }
}

// Automatically instantiate the background when loaded
document.addEventListener('DOMContentLoaded', () => {
    // Canvas is initialized automatically when DOM loads
    window.antigravityBackground = new AntigravityParticles('particle-canvas');
});
