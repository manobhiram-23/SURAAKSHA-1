import { getAlerts, updateAlert } from '@/lib/mockData';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const alertId = parseInt(id);
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ message: 'Alert not found' });
  }

  const { decision, notes, officerId } = req.body;

  if (!decision) {
    return res.status(400).json({ message: 'Decision is required' });
  }

  const statusMap = {
    confirm: 'reviewed',
    dismiss: 'reviewed',
    escalate: 'escalated',
    investigate: 'investigating'
  };

  const updated = updateAlert(alertId, {
    decision,
    notes: notes !== undefined ? notes : alert.notes,
    status: statusMap[decision] || 'reviewed',
    reviewedAt: new Date().toISOString(),
    reviewedBy: officerId || 'Senior Cyber Officer #4492'
  });

  return res.status(200).json({
    success: true,
    message: 'Report submitted successfully',
    alert: updated
  });
}
