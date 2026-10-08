import { getAlerts, updateAlert } from '@/lib/mockData';
import { supabase, isSupabaseConfigured, formatSupabaseAlert } from '@/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const alertId = parseInt(id);
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

  const newStatus = statusMap[decision] || 'reviewed';
  const reviewedAt = new Date().toISOString();
  const reviewedBy = officerId || 'Senior Cyber Officer #4492';

  // 1. Try Supabase update
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          decision,
          notes: notes || '',
          status: newStatus,
          reviewed_at: reviewedAt,
          reviewed_by: reviewedBy,
          updated_at: reviewedAt,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (!error && data) {
        return res.status(200).json({
          success: true,
          message: 'Report submitted successfully to Supabase',
          alert: formatSupabaseAlert(data),
        });
      }
      if (error) {
        console.error('Supabase report update error:', error);
      }
    } catch (err) {
      console.error('Supabase report update exception:', err);
    }
  }

  // 2. In-memory fallback
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ message: 'Alert not found' });
  }

  const updated = updateAlert(alertId, {
    decision,
    notes: notes !== undefined ? notes : alert.notes,
    status: newStatus,
    reviewedAt,
    reviewedBy
  });

  return res.status(200).json({
    success: true,
    message: 'Report submitted successfully',
    alert: updated
  });
}
