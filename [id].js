import { getAlerts, updateAlert } from '@/lib/mockData';
import { supabase, isSupabaseConfigured, formatSupabaseAlert } from '@/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  const alertId = parseInt(id);

  if (req.method === 'GET') {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .eq('id', alertId)
          .single();
        if (!error && data) {
          return res.status(200).json(formatSupabaseAlert(data));
        }
      } catch (err) {
        console.error('Supabase GET /alerts/[id] error:', err);
      }
    }

    const alerts = getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    return res.status(200).json(alert);
  }

  if (req.method === 'PATCH') {
    const { decision, notes, status } = req.body;

    if (isSupabaseConfigured && supabase) {
      try {
        const patch = { updated_at: new Date().toISOString() };
        if (decision !== undefined) patch.decision = decision;
        if (notes !== undefined) patch.notes = notes;
        if (status !== undefined) patch.status = status;

        const { data, error } = await supabase
          .from('alerts')
          .update(patch)
          .eq('id', alertId)
          .select()
          .single();

        if (!error && data) {
          return res.status(200).json(formatSupabaseAlert(data));
        }
      } catch (err) {
        console.error('Supabase PATCH /alerts/[id] error:', err);
      }
    }

    const updated = updateAlert(alertId, {
      ...(decision !== undefined && { decision }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status })
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
