import { getAlerts, updateAlert } from '@/lib/mockData';

export default function handler(req, res) {
  const { id } = req.query;
  const alertId = parseInt(id);
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ message: 'Alert not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(alert);
  }

  if (req.method === 'PATCH') {
    const { decision, notes, status } = req.body;
    const updated = updateAlert(alertId, {
      ...(decision !== undefined && { decision }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status })
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
