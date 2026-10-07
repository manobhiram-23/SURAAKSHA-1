export function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function getSeverityClass(severity) {
  if (severity >= 8) return 'critical';
  if (severity >= 6) return 'high';
  if (severity >= 4) return 'medium';
  return 'low';
}

export function getSeverityLabel(severity) {
  if (severity >= 8) return 'Critical';
  if (severity >= 6) return 'High';
  if (severity >= 4) return 'Medium';
  return 'Low';
}

export function getStatusLabel(status) {
  const statusMap = {
    open: 'Open',
    reviewed: 'Reviewed',
    escalated: 'Escalated'
  };
  return statusMap[status] || 'Unknown';
}
