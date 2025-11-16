<template>
  <div class="graph-wrapper" :class="{ 'dark-mode': isDarkMode }">
    <!-- Profile Picture Button -->
    <div class="fixed top-5 left-5 z-[1000] flex gap-5 items-center">
      <img src="./images/rocus1.png" alt="Rocus" class="h-12 w-auto" />

      <button class="profile-btn" @click="handleProfileClick">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
          alt="Profile">
      </button>
    </div>

    <!-- Search Container -->
    <div class="search-container">
      <input type="text" class="search-input" placeholder="Search clusters..."
        @input="performSearch($event.target.value)">
      <button class="settings-btn" @click="toggleSettings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path
            d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24">
          </path>
        </svg>
      </button>
    </div>

    <!-- Control Buttons -->
    <div class="fixed top-5 right-5 z-[1000] flex gap-2.5">
      <button class="control-btn" @click="resetView">Reset View</button>
      <button class="control-btn" @click="refreshData">Refresh Data</button>
      <button class="control-btn" v-if="explodedNode" @click="collapseNode">Collapse</button>
    </div>

    <!-- WebSocket Connection Status -->
    <div v-if="connectionStatus !== 'hidden'" class="connection-status" :class="connectionStatus">
      <div class="status-pulse"></div>
      <span v-if="connectionStatus === 'connected'">🟢 Connected</span>
      <span v-else-if="connectionStatus === 'connecting'">🟡 Connecting...</span>
      <span v-else-if="connectionStatus === 'disconnected'">🔴 Disconnected</span>
    </div>

    <!-- New Data Notification -->
    <div v-if="showNewDataNotification" class="new-data-notification">
      <div class="notification-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <span>New clusters detected! Updating graph...</span>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/30 z-[3000] flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-2xl">
        <div class="spinner"></div>
        <p class="mt-4 text-gray-700 dark:text-gray-300">Loading clusters...</p>
      </div>
    </div>

    <!-- Settings Popup -->
    <div class="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" v-if="showSettings"
      @click="closeSettings">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 min-w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl"
        @click.stop>
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-300 dark:border-gray-600">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Graph Settings</h3>
          <button class="close-btn" @click="closeSettings">&times;</button>
        </div>

        <div class="setting-group">
          <label>Dark Mode:</label>
          <button class="theme-toggle" @click="toggleDarkMode">
            <div class="toggle-slider" :class="{ active: isDarkMode }"></div>
            <span class="toggle-text">{{ isDarkMode ? 'ON' : 'OFF' }}</span>
          </button>
        </div>

        <div class="setting-group">
          <label>Node Size:</label>
          <input type="range" min="0.5" max="2" step="0.1" v-model="settings.nodeSize" @input="updateNodeSizes"
            class="flex-1 mx-2">
          <span class="min-w-[40px] text-right text-gray-600 dark:text-gray-400">{{ settings.nodeSize }}x</span>
        </div>

        <div class="setting-group">
          <label>Animation Speed:</label>
          <input type="range" min="0.1" max="2" step="0.1" v-model="settings.animationSpeed" class="flex-1 mx-2">
          <span class="min-w-[40px] text-right text-gray-600 dark:text-gray-400">{{ settings.animationSpeed }}x</span>
        </div>

        <div class="setting-group">
          <label>Show Connections:</label>
          <input type="checkbox" v-model="showConnections" @change="toggleConnections" class="scale-125">
        </div>

        <div class="setting-group">
          <label>Similarity Threshold:</label>
          <input type="range" min="0.3" max="0.9" step="0.05" v-model="settings.similarityThreshold"
            @input="updateConnections" class="flex-1 mx-2">
          <span class="min-w-[40px] text-right text-gray-600 dark:text-gray-400">{{ settings.similarityThreshold
          }}</span>
        </div>

        <div class="mt-5 pt-4 border-t border-gray-300 dark:border-gray-600">
          <button class="reset-btn" @click="resetSettings">Reset to Default</button>
        </div>
      </div>
    </div>

    <!-- Website Sticky Note -->
    <div class="sticky-note" v-if="selectedWebsite" :style="stickyNoteStyle" @click.stop>
      <div class="sticky-note-header" @mousedown="startDraggingSticky">
        <h4>{{ selectedWebsite.title }}</h4>
        <button class="sticky-close" @click="closeStickyNote">&times;</button>
      </div>
      <div class="sticky-note-content">
        <div class="sticky-field">
          <strong>Cluster ID:</strong> {{ selectedWebsite.parentCluster }}
        </div>
        <div class="sticky-field">
          <strong>Domain:</strong> {{ selectedWebsite.domain }}
        </div>
        <div class="sticky-field" v-if="websiteDetails">
          <strong>Description:</strong> {{ websiteDetails.ai_summary || 'No description available' }}
        </div>
        <div class="sticky-field">
          <a :href="selectedWebsite.url" target="_blank" class="cute-link">
            🔗 Visit Website
          </a>
        </div>
        <div class="sticky-field" v-if="selectedWebsite.processed_at">
          <strong>Processed:</strong> {{ formatDate(selectedWebsite.processed_at) }}
        </div>
      </div>
    </div>

    <!-- Discover Similar Websites Modal -->
    <div class="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center" v-if="showDiscoverModal"
      @click="closeDiscoverModal">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-2xl"
        @click.stop>
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-300 dark:border-gray-600">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Discover Similar Websites
          </h3>
          <button class="close-btn" @click="closeDiscoverModal">&times;</button>
        </div>

        <div class="py-2">
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Found {{ similarWebsites.length }} websites related to <strong>{{ explodedNode?.topic }}</strong>
          </p>

          <!-- Loading State -->
          <div v-if="isLoadingSimilar" class="flex flex-col items-center justify-center py-12">
            <div class="spinner-small"></div>
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Searching the web...</p>
          </div>

          <!-- Similar Websites List -->
          <div v-else-if="similarWebsites.length > 0" class="flex flex-col gap-3">
            <div v-for="(website, index) in similarWebsites" :key="index" class="similar-website-item"
              @click="openExternalLink(website.url)">
              <div class="flex items-start gap-3">
                <div class="similar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm text-black font-semibold truncate">
                    {{ website.title }}
                  </h4>
                  <p class="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                    {{ website.domain || new URL(website.url).hostname }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {{ website.snippet || website.description || 'No description available' }}
                  </p>
                </div>
                <div class="external-link-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              class="mb-4 opacity-50">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p class="text-sm">No similar websites found</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Graph Container -->
    <div id="graph-container" ref="graphContainer" @click="handleBackgroundClick"
      class="w-full h-full cursor-grab active:cursor-grabbing"></div>

    <!-- Tooltip -->
    <div class="tooltip" id="tooltip" ref="tooltip"></div>

    <!-- Zoom Info -->
    <div class="zoom-info">
      Mouse wheel to zoom • Click and drag to pan • Click clusters to explode
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import * as d3 from 'd3';

// ==============================================
// VUE REFS AND REACTIVE STATE
// ==============================================
const graphContainer = ref(null);
const tooltip = ref(null);
const showSettings = ref(false);
const isDarkMode = ref(false);
const selectedWebsite = ref(null);
const stickyNoteStyle = ref({});
const isLoading = ref(false);
const websiteDetails = ref(null);
const explodedNode = ref(null);
const showDiscoverModal = ref(false);
const isLoadingSimilar = ref(false);
const similarWebsites = ref([]);

// WebSocket state
const wsConnection = ref(null);
const connectionStatus = ref('disconnected');
const showNewDataNotification = ref(false);
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const settings = reactive({
  nodeSize: 1.0,
  animationSpeed: 1.0,
  similarityThreshold: 0.5
});

// ==============================================
// GLOBAL VARIABLES
// ==============================================
let graphData;
let rawClusters = [];
let rawSimilarities = {};
let simulation;
let showConnections = ref(true);
let searchTerm = '';
let svg, container, zoom;
let websiteNodes = [];

// Sticky note dragging
let isDraggingSticky = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// ==============================================
// API CONFIGURATION
// ==============================================
const API_BASE_URL = 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

// ==============================================
// WEBSOCKET FUNCTIONS
// ==============================================
function connectWebSocket() {
  if (wsConnection.value?.readyState === WebSocket.OPEN) {
    return;
  }

  connectionStatus.value = 'connecting';
  console.log('🔌 Connecting to WebSocket...');

  try {
    wsConnection.value = new WebSocket('ws://localhost:5000/ws');

    wsConnection.value.onopen = () => {
      connectionStatus.value = 'connected';
      reconnectAttempts = 0;
      console.log('✅ WebSocket connected');

      setTimeout(() => {
        if (connectionStatus.value === 'connected') {
          connectionStatus.value = 'hidden';
        }
      }, 3000);
    };

    wsConnection.value.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsConnection.value.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      connectionStatus.value = 'disconnected';
    };

    wsConnection.value.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      connectionStatus.value = 'disconnected';
      wsConnection.value = null;

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`⏳ Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    connectionStatus.value = 'disconnected';
  }
}

function disconnectWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (wsConnection.value) {
    wsConnection.value.close();
    wsConnection.value = null;
  }

  connectionStatus.value = 'disconnected';
}

async function handleWebSocketMessage(message) {
  console.log('📨 WebSocket message:', message);

  if (message.type === 'cluster_update' || message.type === 'website_added') {
    showNewDataNotification.value = true;

    await loadData();

    if (simulation) {
      simulation.nodes(graphData.nodes);
      simulation.force('link').links(graphData.links);
      simulation.alpha(0.5).restart();
      renderGraph();
    }

    setTimeout(() => {
      showNewDataNotification.value = false;
    }, 4000);
  }

  if (message.type === 'ping') {
    if (wsConnection.value?.readyState === WebSocket.OPEN) {
      wsConnection.value.send(JSON.stringify({ type: 'pong' }));
    }
  }
}

// ==============================================
// API FUNCTIONS
// ==============================================
async function fetchClusters() {
  try {
    console.log('📡 Fetching clusters...');
    const response = await axios.get('/clusters');
    console.log('✅ Clusters response:', response.data);
    return response.data.clusters || [];
  } catch (error) {
    console.error('❌ Error fetching clusters:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

async function fetchSimilarities() {
  try {
    console.log('📡 Fetching similarities...');
    const response = await axios.get('/cluster-similarities');
    console.log('✅ Similarities response:', response.data);
    return response.data.similarities || {};
  } catch (error) {
    console.error('❌ Error fetching similarities:', error);
    return {};
  }
}

async function fetchWebsiteDetails(websiteId) {
  try {
    console.log('📡 Fetching website details for:', websiteId);
    const response = await axios.get(`/website/${websiteId}`);
    console.log('✅ Website details:', response.data);
    return response.data.website || null;
  } catch (error) {
    console.error('❌ Error fetching website details:', error);
    return null;
  }
}

async function searchSimilarWebsites(query) {
  try {
    console.log('📡 Searching for similar websites:', query);
    const response = await axios.get('/search', {
      params: { q: query }
    });
    console.log('✅ Search results:', response.data);
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Error searching similar websites:', error);
    return [];
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function openExternalLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ==============================================
// DATA PROCESSING
// ==============================================
function processApiData(clusters, similarities) {
  console.log('🔄 Processing API data:', { clusters, similarities });

  const nodes = clusters.map((cluster, index) => {
    const baseSize = Math.max(15, Math.min(40, cluster.website_count * 8 + 15));
    return {
      id: cluster.cluster_id,
      cluster_id: cluster.cluster_id,
      topic: cluster.topic,
      website_count: cluster.website_count,
      websites: cluster.websites || [],
      similar_links: cluster.similar_links || [],
      size: baseSize,
      baseSize: baseSize,
      type: 'cluster',
      x: Math.cos(index * 2 * Math.PI / clusters.length) * 300,
      y: Math.sin(index * 2 * Math.PI / clusters.length) * 300,
      metadata: {
        description: `Cluster containing ${cluster.website_count} websites about ${cluster.topic}`,
        tags: ['cluster', cluster.topic.toLowerCase().replace(/\s+/g, '-')]
      }
    };
  });

  const links = [];
  Object.entries(similarities).forEach(([sourceId, targets]) => {
    Object.entries(targets).forEach(([targetId, similarity]) => {
      if (similarity >= settings.similarityThreshold &&
        !links.some(l => (l.source === sourceId && l.target === targetId) ||
          (l.source === targetId && l.target === sourceId))) {
        links.push({
          source: sourceId,
          target: targetId,
          similarity: similarity,
          strength: similarity,
          type: 'cluster-link'
        });
      }
    });
  });

  console.log('✅ Processed data:', { nodeCount: nodes.length, linkCount: links.length });
  return { nodes, links };
}

async function loadData() {
  isLoading.value = true;
  try {
    console.log('🔄 Loading data...');
    const [clusters, similarities] = await Promise.all([
      fetchClusters(),
      fetchSimilarities()
    ]);

    console.log('📊 Data loaded:', {
      clusterCount: clusters.length,
      hasSimularities: Object.keys(similarities).length > 0
    });

    rawClusters = clusters;
    rawSimilarities = similarities;
    graphData = processApiData(clusters, similarities);

    if (graphData.nodes.length === 0) {
      console.warn('⚠️ No clusters found, falling back to placeholder data');
      graphData = generatePlaceholderData();
    } else {
      console.log('✅ Graph data ready:', graphData);
    }

  } catch (error) {
    console.error('❌ Error loading data:', error);
    graphData = generatePlaceholderData();
  } finally {
    isLoading.value = false;
  }
}

function generatePlaceholderData() {
  console.log('🔄 Generating placeholder data...');
  const categories = ['Ideas', 'Concepts', 'Projects', 'Notes', 'Research', 'Tasks'];
  const nodes = [];
  const nodeCount = 6;

  const nodeNames = [
    'Machine Learning', 'Artificial Intelligence', 'Data Science',
    'Web Development', 'Cloud Computing', 'Cybersecurity'
  ];

  for (let i = 0; i < nodeCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const baseSize = Math.random() * 15 + 15;
    nodes.push({
      id: `placeholder-${i}`,
      cluster_id: `placeholder-${i}`,
      topic: nodeNames[i] || `Cluster ${i + 1}`,
      website_count: Math.floor(Math.random() * 5) + 1,
      websites: [],
      similar_links: [],
      size: baseSize,
      baseSize: baseSize,
      type: 'cluster',
      x: Math.cos(i * 2 * Math.PI / nodeCount) * 200,
      y: Math.sin(i * 2 * Math.PI / nodeCount) * 200,
      metadata: {
        description: `Placeholder cluster for ${nodeNames[i] || 'various topics'}`,
        tags: [category.toLowerCase(), 'placeholder']
      }
    });
  }

  const links = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    if (Math.random() < 0.6) {
      links.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        similarity: 0.5 + Math.random() * 0.3,
        strength: 0.5,
        type: 'cluster-link'
      });
    }
  }

  return { nodes, links };
}

async function refreshData() {
  console.log('🔄 Refreshing data...');
  selectedWebsite.value = null;
  explodedNode.value = null;
  await loadData();
  if (simulation) {
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    simulation.alpha(1).restart();
    renderGraph();
  }
}

function updateConnections() {
  if (rawClusters.length > 0) {
    graphData = processApiData(rawClusters, rawSimilarities);
    simulation.force('link').links(graphData.links);
    simulation.alpha(0.3).restart();
    renderGraph();
  }
}

// ==============================================
// EXPLODE/COLLAPSE FUNCTIONALITY
// ==============================================
function explodeNode(clusterNode) {
  if (explodedNode.value) {
    collapseNode();
  }

  explodedNode.value = clusterNode;
  const centerX = clusterNode.x;
  const centerY = clusterNode.y;
  const radius = 80;

  websiteNodes = [];
  const totalNodes = clusterNode.websites.length + 1;
  const angleStep = (2 * Math.PI) / totalNodes;

  clusterNode.websites.forEach((website, index) => {
    const angle = angleStep * index;
    const websiteNode = {
      id: `website-${website.id}`,
      websiteId: website.id,
      title: website.title,
      url: website.url,
      domain: website.domain,
      processed_at: website.processed_at,
      size: 10,
      baseSize: 10,
      type: 'website',
      parentCluster: clusterNode.id,
      x: centerX,
      y: centerY,
      targetX: centerX + Math.cos(angle) * radius,
      targetY: centerY + Math.sin(angle) * radius,
      animationDelay: index * 50
    };
    websiteNodes.push(websiteNode);
    graphData.nodes.push(websiteNode);

    graphData.links.push({
      source: clusterNode.id,
      target: websiteNode.id,
      type: 'website-link'
    });
  });

  const discoverAngle = angleStep * clusterNode.websites.length;
  const discoverNode = {
    id: `discover-${clusterNode.id}`,
    title: 'Discover Similar',
    size: 14,
    baseSize: 14,
    type: 'discover',
    parentCluster: clusterNode.id,
    x: centerX,
    y: centerY,
    targetX: centerX + Math.cos(discoverAngle) * radius,
    targetY: centerY + Math.sin(discoverAngle) * radius,
    animationDelay: clusterNode.websites.length * 50
  };
  websiteNodes.push(discoverNode);
  graphData.nodes.push(discoverNode);

  graphData.links.push({
    source: clusterNode.id,
    target: discoverNode.id,
    type: 'discover-link'
  });

  simulation.nodes(graphData.nodes);
  simulation.force('link').links(graphData.links);
  simulation.alpha(0.5).restart();

  renderGraph();

  websiteNodes.forEach((node, index) => {
    setTimeout(() => {
      const d3Node = graphData.nodes.find(n => n.id === node.id);
      if (d3Node) {
        d3Node.fx = node.targetX;
        d3Node.fy = node.targetY;
      }
      simulation.alpha(0.3).restart();
    }, node.animationDelay);
  });

  setTimeout(() => {
    websiteNodes.forEach(node => {
      const d3Node = graphData.nodes.find(n => n.id === node.id);
      if (d3Node) {
        d3Node.fx = null;
        d3Node.fy = null;
      }
    });
  }, (websiteNodes.length * 50) + 700);
}

function collapseNode() {
  if (!explodedNode.value) return;

  const centerX = explodedNode.value.x;
  const centerY = explodedNode.value.y;

  websiteNodes.forEach((node, index) => {
    setTimeout(() => {
      const d3Node = graphData.nodes.find(n => n.id === node.id);
      if (d3Node) {
        d3Node.fx = centerX;
        d3Node.fy = centerY;
      }
      simulation.alpha(0.3).restart();
    }, index * 30);
  });

  setTimeout(() => {
    graphData.nodes = graphData.nodes.filter(node =>
      node.type !== 'website' && node.type !== 'discover'
    );

    graphData.links = graphData.links.filter(link =>
      link.type !== 'website-link' && link.type !== 'discover-link'
    );

    websiteNodes = [];
    explodedNode.value = null;
    selectedWebsite.value = null;

    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    simulation.alpha(0.5).restart();

    renderGraph();
  }, (websiteNodes.length * 30) + 400);
}

async function handleDiscoverClick() {
  if (!explodedNode.value) return;

  showDiscoverModal.value = true;
  isLoadingSimilar.value = true;
  similarWebsites.value = [];

  try {
    const results = await searchSimilarWebsites(explodedNode.value.topic);
    similarWebsites.value = results;
  } catch (error) {
    console.error('Error loading similar websites:', error);
  } finally {
    isLoadingSimilar.value = false;
  }
}

// ==============================================
// STICKY NOTE DRAGGING
// ==============================================
function startDraggingSticky(e) {
  isDraggingSticky = true;
  const stickyEl = e.currentTarget.parentElement;
  dragOffsetX = e.clientX - stickyEl.offsetLeft;
  dragOffsetY = e.clientY - stickyEl.offsetTop;
  document.addEventListener('mousemove', handleStickyDrag);
  document.addEventListener('mouseup', stopStickyDrag);
}

function handleStickyDrag(e) {
  if (!isDraggingSticky) return;
  stickyNoteStyle.value = {
    left: e.clientX - dragOffsetX + 'px',
    top: e.clientY - dragOffsetY + 'px'
  };
}

function stopStickyDrag() {
  isDraggingSticky = false;
  document.removeEventListener('mousemove', handleStickyDrag);
  document.removeEventListener('mouseup', stopStickyDrag);
}

// ==============================================
// GRAPH INITIALIZATION AND RENDERING
// ==============================================
async function initializeGraph() {
  const width = graphContainer.value.clientWidth;
  const height = graphContainer.value.clientHeight;

  await loadData();

  svg = d3.select(graphContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  container = svg.append('g');

  zoom = d3.zoom()
    .scaleExtent([0.2, 3])
    .on('zoom', (event) => {
      container.attr('transform', event.transform);
    });

  svg.call(zoom);

  simulation = d3.forceSimulation(graphData.nodes)
    .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(d => d.type === 'website-link' ? 80 : 200).strength(0.03))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(d => d.size * settings.nodeSize + 15))
    .force('x', d3.forceX().strength(0.02))
    .force('y', d3.forceY().strength(0.02));

  renderGraph();

  setTimeout(() => {
    const bounds = container.node().getBBox();
    if (bounds.width > 0 && bounds.height > 0) {
      const fullWidth = bounds.width;
      const fullHeight = bounds.height;
      const midX = bounds.x + fullWidth / 2;
      const midY = bounds.y + fullHeight / 2;

      const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8;
      const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

      svg.transition()
        .duration(2000)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  }, 500);
}

function renderGraph() {
  container.selectAll('.links').data([null]).join('g').attr('class', 'links');
  container.selectAll('.nodes').data([null]).join('g').attr('class', 'nodes');
  container.selectAll('.labels').data([null]).join('g').attr('class', 'labels');

  const linkGroup = container.select('.links');
  const nodeGroup = container.select('.nodes');
  const labelGroup = container.select('.labels');

  const links = linkGroup.selectAll('.link')
    .data(graphData.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`)
    .join('line')
    .attr('class', d => `link ${d.type}`)
    .style('opacity', d => {
      if (d.type === 'website-link' || d.type === 'discover-link') return 0.6;
      return showConnections.value ? 0.4 : 0;
    })
    .style('stroke-width', d => {
      if (d.type === 'website-link' || d.type === 'discover-link') return 1.5;
      return Math.max(1, (d.similarity || 0.5) * 4);
    })
    .style('stroke', d => {
      if (d.type === 'discover-link') return '#95a5a6';
      if (d.type === 'website-link') return '#adb5bd';
      return '#adb5bd';
    });

  const nodes = nodeGroup.selectAll('.node')
    .data(graphData.nodes, d => d.id)
    .join('circle')
    .attr('class', d => `node ${d.type}`)
    .attr('data-id', d => d.id)
    .attr('r', d => d.size * settings.nodeSize)
    .attr('fill', d => {
      if (d.type === 'discover') {
        return isDarkMode.value ? '#3498db' : '#3498db';
      }
      if (d.type === 'website') {
        return isDarkMode.value ? '#2c3e50' : '#f8f9fa';
      }
      return isDarkMode.value ? '#2c3e50' : '#f8f9fa';
    })
    .attr('stroke', d => {
      if (d.type === 'discover') {
        return isDarkMode.value ? '#2980b9' : '#2980b9';
      }
      if (d.type === 'website') {
        return isDarkMode.value ? '#34495e' : '#dee2e6';
      }
      return isDarkMode.value ? '#34495e' : '#dee2e6';
    })
    .attr('stroke-width', 2)
    .call(drag(simulation));

  const labels = labelGroup.selectAll('.node-label')
    .data(graphData.nodes, d => d.id)
    .join('text')
    .attr('class', 'node-label')
    .text(d => {
      if (d.type === 'website') return d.title.substring(0, 20) + (d.title.length > 20 ? '...' : '');
      if (d.type === 'discover') return '';
      return d.topic;
    })
    .style('font-size', d => {
      if (d.type === 'website') return '8px';
      if (d.type === 'discover') return '18px';
      return Math.max(10, (d.size * settings.nodeSize) / 3.5) + 'px';
    })
    .style('fill', d => {
      if (d.type === 'discover') return '#ffffff';
      return '#000000';
    })
    .style('font-weight', d => d.type === 'discover' ? '400' : '500');

  nodes
    .on('mouseover', handleNodeMouseOver)
    .on('mouseout', handleNodeMouseOut)
    .on('click', handleNodeClick);

  simulation.on('tick', () => {
    links
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodes
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    labels
      .attr('x', d => d.x)
      .attr('y', d => {
        if (d.type === 'website' || d.type === 'discover') return d.y + 4;
        return d.y + (d.size * settings.nodeSize) + 18;
      });
  });
}

function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

// ==============================================
// EVENT HANDLERS
// ==============================================
function handleNodeMouseOver(event, d) {
  const tooltipEl = d3.select(tooltip.value);
  tooltipEl.transition().duration(200 / settings.animationSpeed).style('opacity', 1);

  let tooltipContent = '';
  if (d.type === 'cluster') {
    tooltipContent = `<strong>${d.topic}</strong><br>Websites: ${d.website_count}<br>Click to explode`;
  } else if (d.type === 'website') {
    tooltipContent = `<strong>${d.title}</strong><br>${d.domain}<br>Click for details`;
  } else if (d.type === 'discover') {
    tooltipContent = `<strong>Discover Similar</strong><br>Find related websites`;
  }

  tooltipEl.html(tooltipContent)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px');

  if (d.type === 'cluster') {
    highlightConnections(d);
  }
}

function handleNodeMouseOut() {
  d3.select(tooltip.value).transition().duration(200 / settings.animationSpeed).style('opacity', 0);
  clearHighlights();
}

async function handleNodeClick(event, d) {
  event.stopPropagation();

  if (d.type === 'cluster') {
    explodeNode(d);
  } else if (d.type === 'website') {
    await showWebsiteDetails(event, d);
  } else if (d.type === 'discover') {
    await handleDiscoverClick();
  }
}

async function showWebsiteDetails(event, websiteNode) {
  selectedWebsite.value = websiteNode;
  websiteDetails.value = null;

  const containerRect = graphContainer.value.getBoundingClientRect();
  const nodeScreenX = event.pageX - containerRect.left;
  const nodeScreenY = event.pageY - containerRect.top;

  const stickyWidth = 300;
  const stickyHeight = 280;

  let left = nodeScreenX + 20;
  let top = nodeScreenY - stickyHeight / 2;

  if (left + stickyWidth > containerRect.width) {
    left = nodeScreenX - stickyWidth - 20;
  }
  if (top < 20) top = 20;
  if (top + stickyHeight > containerRect.height - 20) {
    top = containerRect.height - stickyHeight - 20;
  }

  stickyNoteStyle.value = {
    left: left + 'px',
    top: top + 'px'
  };

  try {
    const details = await fetchWebsiteDetails(websiteNode.websiteId);
    websiteDetails.value = details;
  } catch (error) {
    console.error('Error loading website details:', error);
  }
}

function handleBackgroundClick() {
  selectedWebsite.value = null;
}

function closeStickyNote() {
  selectedWebsite.value = null;
  websiteDetails.value = null;
}

function closeDiscoverModal() {
  showDiscoverModal.value = false;
  similarWebsites.value = [];
}

function handleProfileClick() {
  alert('Profile functionality would be implemented here');
}

function performSearch(term) {
  searchTerm = term.toLowerCase();

  if (!term) {
    clearSearchHighlights();
    return;
  }

  const matchingNodes = graphData.nodes.filter(node =>
    node.type === 'cluster' && (
      node.topic.toLowerCase().includes(searchTerm) ||
      node.websites.some(website =>
        website.title.toLowerCase().includes(searchTerm) ||
        website.url.toLowerCase().includes(searchTerm) ||
        website.domain.toLowerCase().includes(searchTerm)
      )
    )
  );

  highlightSearchResults(matchingNodes);

  if (matchingNodes.length > 0) {
    const firstMatch = matchingNodes[0];
    const width = graphContainer.value.clientWidth;
    const height = graphContainer.value.clientHeight;
    svg.transition()
      .duration(1000 / settings.animationSpeed)
      .call(zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.2)
          .translate(-firstMatch.x, -firstMatch.y)
      );
  }
}

function highlightSearchResults(matchingNodes) {
  const matchingIds = new Set(matchingNodes.map(d => d.id));
  container.select('.nodes').selectAll('.node').classed('highlighted', d => matchingIds.has(d.id));
  container.select('.labels').selectAll('.node-label').classed('highlighted', d => matchingIds.has(d.id));
}

function clearSearchHighlights() {
  container.select('.nodes').selectAll('.node').classed('highlighted', false);
  container.select('.labels').selectAll('.node-label').classed('highlighted', false);
}

function highlightConnections(node) {
  const connectedNodeIds = new Set();
  const connectedLinks = new Set();

  graphData.links.forEach(link => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;

    if (sourceId === node.id && link.type === 'cluster-link') {
      connectedNodeIds.add(targetId);
      connectedLinks.add(link);
    } else if (targetId === node.id && link.type === 'cluster-link') {
      connectedNodeIds.add(sourceId);
      connectedLinks.add(link);
    }
  });

  container.select('.nodes').selectAll('.node').classed('connection-highlight', d => d.id === node.id || connectedNodeIds.has(d.id));
  container.select('.links').selectAll('.link').classed('highlighted', d => connectedLinks.has(d));
}

function clearHighlights() {
  if (!searchTerm) {
    container.select('.nodes').selectAll('.node').classed('highlighted', false);
    container.select('.labels').selectAll('.node-label').classed('highlighted', false);
  }
  container.select('.nodes').selectAll('.node').classed('connection-highlight', false);
  container.select('.links').selectAll('.link').classed('highlighted', false);
}

// ==============================================
// SETTINGS FUNCTIONS
// ==============================================
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function closeSettings() {
  showSettings.value = false;
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  updateTheme();
}

function updateTheme() {
  container.select('.nodes').selectAll('.node')
    .transition()
    .duration(300)
    .attr('fill', d => {
      if (d.type === 'discover') return '#3498db';
      if (d.type === 'website') return isDarkMode.value ? '#2c3e50' : '#f8f9fa';
      return isDarkMode.value ? '#2c3e50' : '#f8f9fa';
    })
    .attr('stroke', d => {
      if (d.type === 'discover') return '#2980b9';
      if (d.type === 'website') return isDarkMode.value ? '#34495e' : '#dee2e6';
      return isDarkMode.value ? '#34495e' : '#dee2e6';
    });
}

function updateNodeSizes() {
  container.select('.nodes').selectAll('.node')
    .transition()
    .duration(300 / settings.animationSpeed)
    .attr('r', d => d.baseSize * settings.nodeSize);

  container.select('.labels').selectAll('.node-label')
    .transition()
    .duration(300 / settings.animationSpeed)
    .style('font-size', d => {
      if (d.type === 'website') return '8px';
      if (d.type === 'discover') return '18px';
      return Math.max(10, (d.baseSize * settings.nodeSize) / 3.5) + 'px';
    });

  if (simulation) {
    simulation.force('collision', d3.forceCollide().radius(d => d.baseSize * settings.nodeSize + 15));
    simulation.alpha(0.3).restart();
  }
}

function resetSettings() {
  settings.nodeSize = 1.0;
  settings.animationSpeed = 1.0;
  settings.similarityThreshold = 0.5;
  isDarkMode.value = false;
  updateNodeSizes();
  updateTheme();
  updateConnections();
}

// ==============================================
// CONTROL FUNCTIONS
// ==============================================
function resetView() {
  const width = graphContainer.value.clientWidth;
  const height = graphContainer.value.clientHeight;
  const bounds = container.node().getBBox();

  if (bounds.width > 0 && bounds.height > 0) {
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;
    const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8;
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    svg.transition()
      .duration(1000 / settings.animationSpeed)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }
}

function toggleConnections() {
  container.select('.links').selectAll('.link.cluster-link')
    .transition()
    .duration(500 / settings.animationSpeed)
    .style('opacity', showConnections.value ? 0.4 : 0);
}

// ==============================================
// LIFECYCLE HOOKS
// ==============================================
const handleResize = () => {
  if (svg && graphContainer.value) {
    const width = graphContainer.value.clientWidth;
    const height = graphContainer.value.clientHeight;
    svg.attr('width', width).attr('height', height);
    selectedWebsite.value = null;
  }
};

watch(() => showConnections.value, () => {
  toggleConnections();
});

watch(() => isDarkMode.value, () => {
  updateTheme();
});

onMounted(() => {
  console.log('🚀 Component mounted, initializing graph...');
  initializeGraph();
  connectWebSocket();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  console.log('👋 Component unmounting, cleaning up...');
  disconnectWebSocket();
  window.removeEventListener('resize', handleResize);
});

</script>

<style scoped>
/* Keep all existing styles from the previous version */
@import url('https://fonts.googleapis.com/css2?family=Liberation+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');

.graph-wrapper {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Liberation Sans', Arial, sans-serif;
  background:
    repeating-linear-gradient(180deg,
      transparent,
      transparent 27px,
      #e1e8ed 27px,
      #e1e8ed 28px),
    linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%);
  background-size: 100% 28px, 100% 100%;
  transition: all 0.3s ease;
}

.graph-wrapper.dark-mode {
  background:
    repeating-linear-gradient(180deg,
      transparent,
      transparent 27px,
      #2c3e50 27px,
      #2c3e50 28px),
    linear-gradient(90deg, #1a1a1a 0%, #2c2c2c 100%);
  background-size: 100% 28px, 100% 100%;
}

.profile-btn {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid #dee2e6;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dark-mode .profile-btn {
  background: #2c3e50;
  border-color: #34495e;
}

.profile-btn img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.search-container {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 500px;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.dark-mode .search-container {
  background: #2c3e50;
  border-color: #34495e;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  padding: 12px 16px;
  flex: 1;
  color: #495057;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .search-input {
  color: #ecf0f1;
}

.search-input::placeholder {
  color: #adb5bd;
}

.dark-mode .search-input::placeholder {
  color: #7f8c8d;
}

.settings-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px 12px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: #e9ecef;
  color: #495057;
  transform: translateY(-1px);
}

.dark-mode .settings-btn {
  background: #34495e;
  border-color: #4a5f7a;
  color: #bdc3c7;
}

.dark-mode .settings-btn:hover {
  background: #4a5f7a;
  color: #ecf0f1;
}

.control-btn {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #495057;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.control-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.dark-mode .control-btn {
  background: #2c3e50;
  border-color: #34495e;
  color: #ecf0f1;
}

.dark-mode .control-btn:hover {
  background: #34495e;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 15px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.dark-mode .close-btn {
  color: #bdc3c7;
}

.dark-mode .close-btn:hover {
  background: #34495e;
  color: #ecf0f1;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
}

.setting-group label {
  min-width: 140px;
  color: #495057;
  font-weight: 500;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .setting-group label {
  color: #ecf0f1;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.dark-mode .theme-toggle {
  background: #34495e;
  border-color: #4a5f7a;
}

.toggle-slider {
  width: 20px;
  height: 20px;
  background: #6c757d;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-slider.active {
  background: #3498db;
  transform: translateX(20px);
}

.toggle-text {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  min-width: 25px;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .toggle-text {
  color: #bdc3c7;
}

.reset-btn {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
  font-family: 'Liberation Sans', Arial, sans-serif;
  width: 100%;
}

.reset-btn:hover {
  background: #5a6268;
}

/* Sticky Note Styles */
.sticky-note {
  position: fixed;
  background: #feff9c;
  border: 2px solid #feffc2;
  border-radius: 12px;
  padding: 0;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1500;
  font-family: 'Liberation Sans', Arial, sans-serif;
  animation: stickyFadeIn 0.2s ease-out;
}

.dark-mode .sticky-note {
  background: #feff9c;
  border-color: #34495e;
}

@keyframes stickyFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.sticky-note-header {
  display: flex;
  justify-content: space-between;
  cursor: move;
  user-select: none;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 0px solid #dee2e6;
  background: #feff9c;
  border-radius: 10px 10px 0 0;
}

.sticky-note-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.sticky-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticky-close:hover {
  background: #1a1a1a;
  color: white;
}

.sticky-note-content {
  padding: 20px;
}

.sticky-field {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.sticky-field strong {
  color: #495057;
  font-weight: 600;
  display: inline-block;
  min-width: 90px;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.cute-link {
  display: inline-block;
  background: #1a1a1a;
  color: white;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 12px;
  transition: all 0.2s ease;
}

.cute-link:hover {
  background: #000;
  transform: translateY(-2px);
}

/* Similar Websites Modal Styles */
.similar-website-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.similar-website-item:hover {
  background: #e9ecef;
  border-color: #3498db;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.dark-mode .similar-website-item {
  background: #34495e;
}

.dark-mode .similar-website-item:hover {
  background: #4a5f7a;
  border-color: #3498db;
}

.similar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  flex-shrink: 0;
  color: #3498db;
}

.dark-mode .similar-icon {
  background: #2c3e50;
}

.external-link-icon {
  color: #95a5a6;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.similar-website-item:hover .external-link-icon {
  color: #3498db;
  transform: translate(2px, -2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tooltip {
  position: absolute;
  background: rgba(33, 37, 41, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2000;
  max-width: 250px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-family: 'Liberation Sans', Arial, sans-serif;
  line-height: 1.4;
}

.zoom-info {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #6c757d;
  border: 1px solid #dee2e6;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .zoom-info {
  background: rgba(44, 62, 80, 0.9);
  color: #bdc3c7;
  border-color: #34495e;
}

/* Global styles for D3 elements */
:global(.node) {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

:global(.node:hover) {
  stroke-width: 3px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

:global(.node.website),
:global(.node.discover) {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

:global(.node.website:hover),
:global(.node.discover:hover) {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
}

:global(.node.highlighted) {
  stroke: #e74c3c !important;
  stroke-width: 4px;
  filter: drop-shadow(0 0 12px rgba(231, 76, 60, 0.4));
  fill: #fff5f5 !important;
}

:global(.node.connection-highlight) {
  stroke: #3498db !important;
  stroke-width: 3px;
  filter: drop-shadow(0 0 10px rgba(52, 152, 219, 0.3));
}

:global(.node-label) {
  font-family: 'Liberation Sans', Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
  transition: all 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8));
}

:global(.node-label.highlighted) {
  font-weight: 700;
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.9));
  transform: scale(1.1);
}

:global(.link) {
  transition: all 0.3s ease;
}

:global(.link.cluster-link) {
  stroke: #adb5bd;
  stroke-dasharray: 2, 2;
}

:global(.link.website-link),
:global(.link.discover-link) {
  stroke: #adb5bd;
  opacity: 0.6;
}

:global(.link.highlighted) {
  stroke: #3498db;
  stroke-width: 2;
  opacity: 0.8 !important;
  stroke-dasharray: none;
}

/* WebSocket Connection Status */
.connection-status {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.connection-status.connected {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.connection-status.disconnected {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.connection-status.connecting {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* New Data Notification */
.new-data-notification {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  padding: 16px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Liberation Sans', Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(100px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}
</style>