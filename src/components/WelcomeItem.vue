<template>
  <div class="w-full h-full" ref="graphContainer"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Sigma from 'sigma';
import Graph from 'graphology';

const graphContainer = ref(null);
let sigmaInstance = null;

onMounted(() => {
  if (graphContainer.value) {
    const graph = new Graph();

    // Add nodes
    graph.addNode("n1", { x: 0, y: 0, size: 10, label: "Node 1", color: "#E57373" });
    graph.addNode("n2", { x: -5, y: 5, size: 10, label: "Node 2", color: "#81C784" });
    graph.addNode("n3", { x: 5, y: 5, size: 10, label: "Node 3", color: "#64B5F6" });
    graph.addNode("n4", { x: 0, y: 10, size: 10, label: "Node 4", color: "#FFD54F" });
    graph.addNode("n5", { x: -5, y: 15, size: 10, label: "Node 5", color: "#9575CD" });
    graph.addNode("n6", { x: 5, y: 15, size: 10, label: "Node 6", color: "#4DB6AC" });


    // Add edges
    graph.addEdge("n1", "n2", { type: "line", label: "edge 1-2", size: 2 });
    graph.addEdge("n1", "n3", { type: "line", label: "edge 1-3", size: 2 });
    graph.addEdge("n2", "n4", { type: "line", label: "edge 2-4", size: 2 });
    graph.addEdge("n3", "n4", { type: "line", label: "edge 3-4", size: 2 });
    graph.addEdge("n4", "n5", { type: "line", label: "edge 4-5", size: 2 });
    graph.addEdge("n4", "n6", { type: "line", label: "edge 4-6", size: 2 });


    sigmaInstance = new Sigma(graph, graphContainer.value, {
      // We don't want to directly assign the node's label to be rendered
      renderLabels: false,
      // We want to display the node's label on hover
      labelRenderer: (context, data, settings) => {
        context.font = settings.labelFont;
        context.fillStyle = settings.labelColor.color;
        context.fillText(data.label, data.x + data.size + 5, data.y + 5);
      }
    });

    // Enable drag and drop of nodes
    let draggedNode = null;
    sigmaInstance.on('downNode', (e) => {
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, 'highlighted', true);
    });

    sigmaInstance.getMouseCaptor().on('mousemove', (e) => {
      if (draggedNode) {
        const pos = sigmaInstance.viewportToGraph(e);
        graph.setNodeAttribute(draggedNode, 'x', pos.x);
        graph.setNodeAttribute(draggedNode, 'y', pos.y);
      }
    });

    sigmaInstance.getMouseCaptor().on('mouseup', () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, 'highlighted');
        draggedNode = null;
      }
    });
  }
});

onBeforeUnmount(() => {
  if (sigmaInstance) {
    sigmaInstance.kill();
  }
});
</script>

<style>
/* You can add any additional styles here if needed */
</style>