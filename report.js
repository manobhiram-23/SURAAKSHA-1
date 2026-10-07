import { mockAlerts } from '@/lib/mockData';

let alertsStore = [...mockAlerts];

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const alertId = parseInt(id);
  const alert = alertsStore.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ message: 'Alert not found' });
  }

  const { decision, notes, officerId } = req.body;

  if (!decision) {
    return res.status(400).json({ message: 'Decision is required' });
  }

  alertsStore = alertsStore.map(a =>
    a.id === alertId
      ? {
          ...a,
          decision,
          notes: notes || a.notes,
          status: 'reviewed',
          reviewedAt: new Date().toISOString(),
          reviewedBy: officerId || 'unknown',
        }
      : a
  );

  const updated = alertsStore.find(a => a.id === alertId);

  return res.status(200).json({
    success: true,
    message: 'Report submitted successfully',
    alert: updated,
  });
}
