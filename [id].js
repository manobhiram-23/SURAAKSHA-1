import { mockAlerts } from '@/lib/mockData';

// In-memory store (replace with a real DB in production)
let alertsStore = [...mockAlerts];

export default function handler(req, res) {
  const { id } = req.query;
  const alertId = parseInt(id);
  const alert = alertsStore.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ message: 'Alert not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(alert);
  }

  if (req.method === 'PATCH') {
    const { decision, notes, status } = req.body;
    alertsStore = alertsStore.map(a =>
      a.id === alertId
        ? {
            ...a,
            ...(decision !== undefined && { decision }),
            ...(notes !== undefined && { notes }),
            ...(status !== undefined && { status }),
          }
        : a
    );
    const updated = alertsStore.find(a => a.id === alertId);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
