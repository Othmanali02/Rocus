export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("linux")) return "Linux";
  if (userAgent.includes("mac")) return "macOS";
  if (userAgent.includes("win")) return "Windows";
  return "Unknown";
}