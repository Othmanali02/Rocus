<template>
    <div class="relative w-full">
        <div class="rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10" style="background: #1A1A1A;">
            <div class="flex items-center gap-2 px-4 py-3" style="background: #2A2A2A;">
                <span class="w-3 h-3 rounded-full" style="background: #FF5F57;"></span>
                <span class="w-3 h-3 rounded-full" style="background: #FEBC2E;"></span>
                <span class="w-3 h-3 rounded-full" style="background: #28C840;"></span>
                <span class="ml-3 text-xs font-medium" style="color: #9A9A9A;">rocus.io</span>
            </div>

            <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" preserveAspectRatio="xMidYMid meet"
                class="w-full h-auto block">
                <defs>
                    <radialGradient id="heroBgGlow" cx="50%" cy="30%" r="85%">
                        <stop offset="0%" stop-color="#30456A" />
                        <stop offset="55%" stop-color="#20304A" />
                        <stop offset="100%" stop-color="#1A1A1A" />
                    </radialGradient>
                    <filter id="heroNodeGlow" x="-150%" y="-150%" width="400%" height="400%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="heroPulseGlow" x="-300%" y="-300%" width="700%" height="700%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <rect :width="svgWidth" :height="svgHeight" fill="url(#heroBgGlow)" />

                <!-- Faint drifting-depth backdrop, purely atmospheric -->
                <circle v-for="p in PARTICLES" :key="p.key" :cx="p.x" :cy="p.y" r="2" fill="#8FB8EA"
                    :opacity="particleOpacity(p.phase)" />

                <!-- Standing graph, always visible - the "living map" stays connected -->
                <line v-for="link in links" :key="link.key" :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2"
                    stroke="#4A90E2" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="5 7"
                    :stroke-dashoffset="dashOffset" />

                <!-- Small beacon traveling each link - constant ambient motion, "data flowing" -->
                <circle v-for="p in linkPulses" :key="p.key" :cx="p.x" :cy="p.y" r="3.5" fill="#B9D9FF"
                    filter="url(#heroPulseGlow)" />

                <!-- Spokes from the exploding cluster out to its ring of satellite nodes -->
                <line v-for="sat in satellites" :key="`spoke-${sat.key}`" :x1="activeCluster.x" :y1="activeCluster.y"
                    :x2="sat.x" :y2="sat.y" :stroke="activeCluster.color" :stroke-opacity="sat.opacity * 0.55"
                    stroke-width="2" />

                <circle v-for="sat in satellites" :key="sat.key" :cx="sat.x" :cy="sat.y" r="8" :fill="sat.color"
                    :opacity="sat.opacity" filter="url(#heroNodeGlow)" />

                <g v-for="(c, i) in clusterPositions" :key="c.id">
                    <circle :cx="c.x" :cy="c.y" :r="i === activeIndex ? (34 + activePulse) : 26" :fill="c.color"
                        :opacity="i === activeIndex ? 1 : 0.85" filter="url(#heroNodeGlow)"
                        style="transition: opacity 0.35s ease;" />
                    <circle :cx="c.x" :cy="c.y" :r="i === activeIndex ? (34 + activePulse) : 26" fill="none"
                        stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5" />
                    <text :x="c.x" :y="c.y + (i === activeIndex ? 56 : 48)" text-anchor="middle" fill="#F0F4FA"
                        font-size="17" font-weight="600">{{ c.label }}</text>
                </g>
            </svg>
        </div>

        <div class="mt-6 text-center" style="min-height: 2.5rem;">
            <p class="text-xl sm:text-2xl font-semibold text-[#4A90E2] transition-opacity duration-300"
                :style="{ opacity: captionOpacity }">
                {{ activeCluster.caption }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const svgWidth = 900;
const svgHeight = 640;

// Loosely mirrors the real dashboard's cluster/explosion mechanic
// (useGraphEngine.js performExplosion: ring nodes placed via
// angleStep = 2*PI/n around the cluster center) but reimplemented as a
// deterministic, elapsed-time-only animation rather than a live d3-force
// simulation - there's no user interaction to react to here, and a pure
// time->position function can't drift or misbehave the way an accumulating
// physics sim can over a long-running decorative loop.
const CLUSTERS = [
    { id: "research", label: "Research", bx: 190, by: 190, satellites: 5, color: "#4A90E2", caption: "Save any page, note, or file" },
    { id: "work", label: "Work", bx: 500, by: 400, satellites: 6, color: "#6AB4F5", caption: "Auto-clustered by topic" },
    { id: "recipes", label: "Recipes", bx: 730, by: 160, satellites: 4, color: "#8B7CF6", caption: "Explore instantly with AI" },
    { id: "travel", label: "Travel", bx: 750, by: 470, satellites: 4, color: "#38BDF8", caption: "One living graph, not a list" },
];

const LINKS = [
    ["research", "work"],
    ["work", "recipes"],
    ["work", "travel"],
    ["research", "recipes"],
];

// Fixed, hand-placed so they don't recompute/jump every frame - only their
// twinkle opacity is animated (see particleOpacity), never their position.
const PARTICLES = [
    { key: "p1", x: 70, y: 90, phase: 0 },
    { key: "p2", x: 860, y: 80, phase: 1.1 },
    { key: "p3", x: 50, y: 560, phase: 2.4 },
    { key: "p4", x: 870, y: 590, phase: 0.6 },
    { key: "p5", x: 320, y: 40, phase: 3.1 },
    { key: "p6", x: 630, y: 610, phase: 1.7 },
    { key: "p7", x: 860, y: 320, phase: 2.9 },
    { key: "p8", x: 30, y: 320, phase: 0.3 },
    { key: "p9", x: 470, y: 590, phase: 2.1 },
    { key: "p10", x: 150, y: 470, phase: 1.4 },
    { key: "p11", x: 800, y: 470, phase: 3.4 },
    { key: "p12", x: 400, y: 560, phase: 0.9 },
    { key: "p13", x: 580, y: 55, phase: 2.6 },
    { key: "p14", x: 260, y: 260, phase: 1.9 },
];

const CLUSTER_PERIOD = 3.6; // seconds each cluster gets a turn exploding - snappier than a lazy corporate loop
const EXPAND_START = 0.25;
const EXPAND_END = 0.8;
const HOLD_END = 2.2;
const COLLAPSE_END = 2.8;

const easeInCubic = (t) => t * t * t;
// A slight overshoot on the way out gives the ring a springy "pop" instead
// of a flat linear-feeling expansion - much more fun to watch on a loop.
const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const p = t - 1;
    return 1 + c3 * p * p * p + c1 * p * p;
};

const elapsed = ref(0);
let rafId = null;
let startTime = null;

function tick(now) {
    if (startTime === null) startTime = now;
    elapsed.value = (now - startTime) / 1000;
    rafId = requestAnimationFrame(tick);
}

onMounted(() => {
    // A static half-expanded frame is more respectful of prefers-reduced-motion
    // than either a frozen "resting" graph or a silently-still animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        elapsed.value = EXPAND_END + 0.4;
        return;
    }
    rafId = requestAnimationFrame(tick);
});

onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId);
});

const clusterPositions = computed(() =>
    CLUSTERS.map((c, i) => ({
        ...c,
        x: c.bx + Math.sin(elapsed.value * 0.6 + i * 1.7) * 8,
        y: c.by + Math.cos(elapsed.value * 0.5 + i * 2.3) * 8,
    }))
);

const activeIndex = computed(() => Math.floor(elapsed.value / CLUSTER_PERIOD) % CLUSTERS.length);
const localT = computed(() => elapsed.value % CLUSTER_PERIOD);
const activeCluster = computed(() => clusterPositions.value[activeIndex.value]);

// A gentle breathing pulse on the active cluster's own radius, independent
// of the ring progress, so it still feels alive during the hold phase.
const activePulse = computed(() => Math.sin(elapsed.value * 3) * 2.5);

const ringProgress = computed(() => {
    const t = localT.value;
    if (t < EXPAND_START) return 0;
    if (t < EXPAND_END) return easeOutBack((t - EXPAND_START) / (EXPAND_END - EXPAND_START));
    if (t < HOLD_END) return 1;
    if (t < COLLAPSE_END) return 1 - easeInCubic((t - HOLD_END) / (COLLAPSE_END - HOLD_END));
    return 0;
});

const satellites = computed(() => {
    const cluster = activeCluster.value;
    const n = cluster.satellites;
    const progress = ringProgress.value;
    const radius = 105;
    const rotation = elapsed.value * 0.2;
    const items = [];
    for (let i = 0; i < n; i++) {
        const angle = ((2 * Math.PI) / n) * i + rotation;
        items.push({
            key: `${cluster.id}-${i}`,
            x: cluster.x + Math.cos(angle) * radius * progress,
            y: cluster.y + Math.sin(angle) * radius * progress,
            opacity: Math.min(1, Math.max(0, progress)),
            color: i % 2 === 0 ? cluster.color : "#FFFFFF",
        });
    }
    return items;
});

const captionFadeStart = COLLAPSE_END + 0.2;
const captionFadeEnd = CLUSTER_PERIOD - 0.1;
const captionOpacity = computed(() => {
    const t = localT.value;
    if (t < 0.4) return t / 0.4;
    if (t < captionFadeStart) return 1;
    if (t < captionFadeEnd) return Math.max(0, 1 - (t - captionFadeStart) / (captionFadeEnd - captionFadeStart));
    return 0;
});

const links = computed(() => {
    const byId = Object.fromEntries(clusterPositions.value.map((c) => [c.id, c]));
    return LINKS.map(([a, b], i) => ({
        key: `link-${i}`,
        x1: byId[a].x,
        y1: byId[a].y,
        x2: byId[b].x,
        y2: byId[b].y,
    }));
});

const linkPulses = computed(() =>
    links.value.map((link, i) => {
        const t = (elapsed.value * 0.35 + i * 0.27) % 1;
        return {
            key: `pulse-${link.key}`,
            x: link.x1 + (link.x2 - link.x1) * t,
            y: link.y1 + (link.y2 - link.y1) * t,
        };
    })
);

const dashOffset = computed(() => -elapsed.value * 18);

function particleOpacity(phase) {
    return 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(elapsed.value * 0.8 + phase));
}
</script>
