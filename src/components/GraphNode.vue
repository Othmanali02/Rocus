<template>
  <div class="graph-wrapper" :class="{ 'dark-mode': isDarkMode }">
    <!-- Profile Picture Button -->
    <div class="profile-container">
      <button class="profile-btn" @click="handleProfileClick">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
          alt="Profile">
      </button>
    </div>

    <!-- Search Container -->
    <div class="search-container">
      <input type="text" class="search-input" placeholder="Search clusters..." @input="performSearch($event.target.value)">
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
    <div class="controls">
      <button class="control-btn" @click="resetView">Reset View</button>
      <button class="control-btn" @click="refreshData">Refresh Data</button>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading clusters...</p>
      </div>
    </div>

    <!-- Settings Popup -->
    <div class="settings-overlay" v-if="showSettings" @click="closeSettings">
      <div class="settings-popup" @click.stop>
        <div class="settings-header">
          <h3>Graph Settings</h3>
          <button class="close-btn" @click="closeSettings">&times;</button>
        </div>

        <!-- Dark Mode Toggle -->
        <div class="setting-group">
          <label>Dark Mode:</label>
          <button class="theme-toggle" @click="toggleDarkMode">
            <div class="toggle-slider" :class="{ active: isDarkMode }"></div>
            <span class="toggle-text">{{ isDarkMode ? 'ON' : 'OFF' }}</span>
          </button>
        </div>

        <div class="setting-group">
          <label>Node Size:</label>
          <input type="range" min="0.5" max="2" step="0.1" v-model="settings.nodeSize" @input="updateNodeSizes">
          <span>{{ settings.nodeSize }}x</span>
        </div>

        <div class="setting-group">
          <label>Animation Speed:</label>
          <input type="range" min="0.1" max="2" step="0.1" v-model="settings.animationSpeed">
          <span>{{ settings.animationSpeed }}x</span>
        </div>

        <div class="setting-group">
          <label>Show Connections:</label>
          <input type="checkbox" v-model="showConnections" @change="toggleConnections">
        </div>

        <div class="setting-group">
          <label>Similarity Threshold:</label>
          <input type="range" min="0.3" max="0.9" step="0.05" v-model="settings.similarityThreshold" @input="updateConnections">
          <span>{{ settings.similarityThreshold }}</span>
        </div>

        <div class="settings-actions">
          <button class="reset-btn" @click="resetSettings">Reset to Default</button>
        </div>
      </div>
    </div>

    <!-- Node Detail Popup -->
    <div class="node-popup" v-if="selectedNode" :style="nodePopupStyle" @click.stop>
      <div class="popup-header">
        <h4>{{ selectedNode.topic }}</h4>
        <button class="popup-close" @click="closeNodePopup">&times;</button>
      </div>
      <div class="popup-content" v-if="!loadingNodeDetails">
        <div class="popup-field">
          <strong>Cluster ID:</strong> {{ selectedNode.cluster_id }}
        </div>
        <div class="popup-field">
          <strong>Websites:</strong> {{ selectedNode.website_count }}
        </div>
        <div class="popup-field" v-if="nodeDetails">
          <strong>Description:</strong> {{ nodeDetails.ai_summary?.summary || 'No description available' }}
        </div>
        <div class="popup-field">
          <strong>Website List:</strong>
          <div class="website-list">
            <div v-for="website in selectedNode.websites" :key="website.id" class="website-item" @click="loadWebsiteDetails(website.id)">
              <strong>{{ website.title }}</strong><br>
              <span class="website-url">{{ website.url }}</span><br>
              <span class="website-domain">{{ website.domain }}</span>
            </div>
          </div>
        </div>
        <div class="popup-field">
          <strong>Connections:</strong> {{ getConnectionCount(selectedNode) }}
        </div>
      </div>
      <div class="popup-content" v-else>
        <div class="loading-details">
          <div class="small-spinner"></div>
          <p>Loading details...</p>
        </div>
      </div>
    </div>

    <!-- Graph Container -->
    <div id="graph-container" ref="graphContainer" @click="handleBackgroundClick"></div>

    <!-- Tooltip -->
    <div class="tooltip" id="tooltip" ref="tooltip"></div>

    <!-- Zoom Info -->
    <div class="zoom-info">
      Mouse wheel to zoom • Click and drag to pan • Click clusters for details
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as d3 from 'd3';

// ==============================================
// VUE REFS AND REACTIVE STATE
// ==============================================
const graphContainer = ref(null);
const tooltip = ref(null);
const showSettings = ref(false);
const isDarkMode = ref(false);
const selectedNode = ref(null);
const nodePopupStyle = ref({});
const isLoading = ref(false);
const loadingNodeDetails = ref(false);
const nodeDetails = ref(null);

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

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// ==============================================
// API CONFIGURATION
// ==============================================
const API_BASE_URL = 'http://localhost:5000';

// ==============================================
// API FUNCTIONS
// ==============================================
async function fetchClusters() {
  try {
    const response = await fetch(`${API_BASE_URL}/clusters`);
    if (!response.ok) throw new Error('Failed to fetch clusters');
    const data = await response.json();
    return data.clusters || [];
  } catch (error) {
    console.error('Error fetching clusters:', error);
    return [];
  }
}

async function fetchSimilarities() {
  try {
    const response = await fetch(`${API_BASE_URL}/cluster-similarities`);
    if (!response.ok) throw new Error('Failed to fetch similarities');
    const data = await response.json();
    return data.similarities || {};
  } catch (error) {
    console.error('Error fetching similarities:', error);
    return {};
  }
}

async function fetchWebsiteDetails(websiteId) {
  try {
    const response = await fetch(`${API_BASE_URL}/website/${websiteId}`);
    if (!response.ok) throw new Error('Failed to fetch website details');
    const data = await response.json();
    return data.website || null;
  } catch (error) {
    console.error('Error fetching website details:', error);
    return null;
  }
}

// ==============================================
// DATA PROCESSING
// ==============================================
function processApiData(clusters, similarities) {
  const nodes = clusters.map((cluster, index) => {
    const baseSize = Math.max(15, Math.min(40, cluster.website_count * 8 + 15));
    return {
      id: cluster.cluster_id,
      cluster_id: cluster.cluster_id,
      topic: cluster.topic,
      website_count: cluster.website_count,
      websites: cluster.websites,
      size: baseSize,
      baseSize: baseSize,
      // Position nodes in a rough circle initially
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
      // Only create link if similarity meets threshold and we haven't already created this link
      if (similarity >= settings.similarityThreshold && 
          !links.some(l => (l.source === sourceId && l.target === targetId) || 
                           (l.source === targetId && l.target === sourceId))) {
        links.push({
          source: sourceId,
          target: targetId,
          similarity: similarity,
          strength: similarity
        });
      }
    });
  });

  return { nodes, links };
}

async function loadData() {
  isLoading.value = true;
  try {
    const [clusters, similarities] = await Promise.all([
      fetchClusters(),
      fetchSimilarities()
    ]);
    
    rawClusters = clusters;
    rawSimilarities = similarities;
    graphData = processApiData(clusters, similarities);
    
    if (graphData.nodes.length === 0) {
      console.warn('No clusters found, falling back to placeholder data');
      graphData = generatePlaceholderData();
    }
    
  } catch (error) {
    console.error('Error loading data:', error);
    graphData = generatePlaceholderData();
  } finally {
    isLoading.value = false;
  }
}

function generatePlaceholderData() {
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
      size: baseSize,
      baseSize: baseSize,
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
        strength: 0.5
      });
    }
  }

  return { nodes, links };
}

async function refreshData() {
  selectedNode.value = null;
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
    .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(200).strength(0.03))
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
    .attr('class', 'link')
    .style('opacity', showConnections.value ? 0.4 : 0)
    .style('stroke-width', d => Math.max(1, (d.similarity || 0.5) * 4));

  const nodes = nodeGroup.selectAll('.node')
    .data(graphData.nodes, d => d.id)
    .join('circle')
    .attr('class', 'node')
    .attr('r', d => d.size * settings.nodeSize)
    .attr('fill', isDarkMode.value ? '#2c3e50' : '#f8f9fa')
    .attr('stroke', isDarkMode.value ? '#34495e' : '#dee2e6')
    .attr('stroke-width', 2)
    .call(drag(simulation));

  const labels = labelGroup.selectAll('.node-label')
    .data(graphData.nodes, d => d.id)
    .join('text')
    .attr('class', 'node-label')
    .text(d => d.topic)
    .style('font-size', d => Math.max(10, (d.size * settings.nodeSize) / 3.5) + 'px')
    .style('fill', '#000000');

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
      .attr('y', d => d.y + (d.size * settings.nodeSize) + 18);
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
  tooltipEl.html(`
    <strong>${d.topic}</strong><br>
    Websites: ${d.website_count}<br>
    Click for more details
  `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px');

  highlightConnections(d);
}

function handleNodeMouseOut() {
  d3.select(tooltip.value).transition().duration(200 / settings.animationSpeed).style('opacity', 0);
  clearHighlights();
}

async function handleNodeClick(event, d) {
  event.stopPropagation();

  selectedNode.value = d;
  loadingNodeDetails.value = true;
  nodeDetails.value = null;

  // Position popup
  const containerRect = graphContainer.value.getBoundingClientRect();
  const nodeScreenX = event.pageX - containerRect.left;
  const nodeScreenY = event.pageY - containerRect.top;

  const popupWidth = 400;
  const popupHeight = 350;

  let left = nodeScreenX + 20;
  let top = nodeScreenY - popupHeight / 2;

  if (left + popupWidth > containerRect.width) {
    left = nodeScreenX - popupWidth - 20;
  }
  if (top < 20) top = 20;
  if (top + popupHeight > containerRect.height - 20) {
    top = containerRect.height - popupHeight - 20;
  }

  nodePopupStyle.value = {
    left: left + 'px',
    top: top + 'px'
  };

  // Load additional details for the first website if available
  if (d.websites && d.websites.length > 0) {
    try {
      const details = await fetchWebsiteDetails(d.websites[0].id);
      nodeDetails.value = details;
    } catch (error) {
      console.error('Error loading website details:', error);
    }
  }
  
  loadingNodeDetails.value = false;
}

async function loadWebsiteDetails(websiteId) {
  try {
    const details = await fetchWebsiteDetails(websiteId);
    if (details) {
      alert(`Website Details:\nTitle: ${details.title}\nURL: ${details.url}\nSummary: ${details.ai_summary?.summary || 'No summary available'}`);
    }
  } catch (error) {
    console.error('Error loading website details:', error);
    alert('Failed to load website details');
  }
}

function enablePopupDrag(popupEl, headerEl) {
  headerEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - popupEl.offsetLeft;
    dragOffsetY = e.clientY - popupEl.offsetTop;
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  });

  function handleDrag(e) {
    if (!isDragging) return;
    popupEl.style.left = e.clientX - dragOffsetX + 'px';
    popupEl.style.top = e.clientY - dragOffsetY + 'px';
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  }
}

watch(selectedNode, () => {
  nextTick(() => {
    const popupEl = document.querySelector('.node-popup');
    const headerEl = popupEl?.querySelector('.popup-header');
    if (popupEl && headerEl) {
      enablePopupDrag(popupEl, headerEl);
    }
  });
});

function handleBackgroundClick() {
  selectedNode.value = null;
}

function closeNodePopup() {
  selectedNode.value = null;
}

function handleProfileClick() {
  alert('Profile functionality would be implemented here');
}

function getConnectionCount(node) {
  return graphData.links.filter(link =>
    (link.source.id === node.id || link.source === node.id) || 
    (link.target.id === node.id || link.target === node.id)
  ).length;
}

function performSearch(term) {
  searchTerm = term.toLowerCase();

  if (!term) {
    clearSearchHighlights();
    return;
  }

  const matchingNodes = graphData.nodes.filter(node =>
    node.topic.toLowerCase().includes(searchTerm) ||
    node.websites.some(website => 
      website.title.toLowerCase().includes(searchTerm) ||
      website.url.toLowerCase().includes(searchTerm) ||
      website.domain.toLowerCase().includes(searchTerm)
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
    
    if (sourceId === node.id) {
      connectedNodeIds.add(targetId);
      connectedLinks.add(link);
    } else if (targetId === node.id) {
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
    .attr('fill', isDarkMode.value ? '#2c3e50' : '#f8f9fa')
    .attr('stroke', isDarkMode.value ? '#34495e' : '#dee2e6');
}

function updateNodeSizes() {
  container.select('.nodes').selectAll('.node')
    .transition()
    .duration(300 / settings.animationSpeed)
    .attr('r', d => d.baseSize * settings.nodeSize);

  container.select('.labels').selectAll('.node-label')
    .transition()
    .duration(300 / settings.animationSpeed)
    .style('font-size', d => Math.max(10, (d.baseSize * settings.nodeSize) / 3.5) + 'px');

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
  container.select('.links').selectAll('.link')
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
    selectedNode.value = null;
  }
};

watch(() => showConnections.value, () => {
  toggleConnections();
});

watch(() => isDarkMode.value, () => {
  updateTheme();
});

onMounted(() => {
  initializeGraph();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

</script>

<style scoped>
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

.profile-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
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

.controls {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
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

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-popup {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .settings-popup {
  background: #2c3e50;
  color: #ecf0f1;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dee2e6;
}

.dark-mode .settings-header {
  border-bottom-color: #4a5f7a;
}

.settings-header h3 {
  margin: 0;
  color: #495057;
  font-size: 18px;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .settings-header h3 {
  color: #ecf0f1;
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
  min-width: 120px;
  color: #495057;
  font-weight: 500;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .setting-group label {
  color: #ecf0f1;
}

.setting-group input[type="range"] {
  flex: 1;
  margin: 0 8px;
}

.setting-group input[type="checkbox"] {
  transform: scale(1.2);
}

.setting-group span {
  min-width: 40px;
  text-align: right;
  color: #6c757d;
  font-family: 'Liberation Sans', monospace;
}

.dark-mode .setting-group span {
  color: #bdc3c7;
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

.settings-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #dee2e6;
}

.dark-mode .settings-actions {
  border-top-color: #4a5f7a;
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
}

.reset-btn:hover {
  background: #5a6268;
}

.node-popup {
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
  animation: popupFadeIn 0.2s ease-out;
}

.dark-mode .node-popup {
  background: #feff9c;
  border-color: #34495e;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popup-header {
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

.dark-mode .popup-header {
  background: #feff9c;
  color: black;
  border-bottom-color: #4a5f7a;
}

.popup-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .popup-header h4 {}

.popup-close {
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

.popup-close:hover {
  background: #1a1a1a;
  color: white;
}

.dark-mode .popup-close {
  color: #bdc3c7;
}

.dark-mode .popup-close:hover {
  background: #4a5f7a;
  color: #ecf0f1;
}

.popup-content {
  padding: 20px;
}

.popup-field {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.popup-field strong {
  color: #495057;
  font-weight: 600;
  display: inline-block;
  min-width: 90px;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .popup-field strong {}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag {
  background: #1a1a1a;
  color: white; 
  font-weight: bold;
  padding: 2px 8px;   
  border-radius: 12px;
  font-size: 12px;
  font-family: 'Liberation Sans', Arial, sans-serif;
}

.dark-mode .tag {
  background: #4a5f7a;
  color: #ecf0f1;
}

#graph-container {
  width: 100%;
  height: 100%;
  cursor: grab;
}

#graph-container:active {
  cursor: grabbing;
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

:global(.node:hover) {
  stroke-width: 3px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
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


:global(.node-label.dark-mode) {
  color: #bdc3c7;
}


:global(.link) {
  stroke: #adb5bd;
  stroke-width: 1;
  transition: all 0.3s ease;
  stroke-dasharray: 2, 2;
  opacity: 0.3;
}

:global(.link.highlighted) {
  stroke: #3498db;
  stroke-width: 2;
  opacity: 0.8 !important;
  stroke-dasharray: none;
}
</style>