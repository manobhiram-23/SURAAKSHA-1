import { getAlerts, addAlert } from '@/lib/mockData';
import { supabase, isSupabaseConfigured, formatSupabaseAlert } from '@/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, search, severity } = req.query;

    // 1. Try fetching from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('alerts').select('*').order('id', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        if (severity && severity !== 'all') {
          query = query.gte('severity', parseInt(severity));
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data) && data.length > 0) {
          let formatted = data.map(formatSupabaseAlert);

          if (search) {
            const term = search.toLowerCase();
            formatted = formatted.filter(a =>
              a.account.toLowerCase().includes(term) ||
              a.type.toLowerCase().includes(term) ||
              a.reason.toLowerCase().includes(term) ||
              (a.platform && a.platform.toLowerCase().includes(term))
            );
          }

          return res.status(200).json(formatted);
        }
      } catch (dbErr) {
        console.error('Supabase GET alerts error, falling back to local store:', dbErr);
      }
    }

    // 2. Fallback to in-memory store
    let alerts = getAlerts();

    if (status && status !== 'all') {
      alerts = alerts.filter(a => a.status === status);
    }

    if (severity && severity !== 'all') {
      const minSev = parseInt(severity);
      alerts = alerts.filter(a => a.severity >= minSev);
    }

    if (search) {
      const term = search.toLowerCase();
      alerts = alerts.filter(a =>
        a.account.toLowerCase().includes(term) ||
        a.type.toLowerCase().includes(term) ||
        a.reason.toLowerCase().includes(term) ||
        (a.platform && a.platform.toLowerCase().includes(term))
      );

    }

    return res.status(200).json(alerts);
  }

  if (req.method === 'POST') {
    const { account, platform, type, severity, reason, evidence, accountProfile } = req.body;
    if (!account || !type) {
      return res.status(400).json({ message: 'Account and type are required' });
    }

    const payload = {
      account,
      platform: platform || 'Web / Social',
      type,
      severity: Number(severity) || 5,
      reason: reason || 'Flagged manually by SOC analyst',
      status: 'open',
      reported_by: '1 officer',
      evidence: evidence || {
        postLink: 'https://security.soc/manual-report',
        content: 'Flagged via SURAAKSHA Officer Portal',
        timestamp: new Date().toISOString()
      },
      account_profile: accountProfile || {
        username: account.replace('@', ''),
        followers: 'Unknown',
        created: new Date().toISOString().split('T')[0],
        location: 'Analyst Flagged'
      }
    };

    // 1. Try writing to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return res.status(201).json(formatSupabaseAlert(data));
        }
        if (error) {
          console.error('Supabase POST alert error:', error);
        }
      } catch (dbErr) {
        console.error('Supabase POST exception:', dbErr);
      }
    }

    // 2. Fallback to in-memory store
    const created = addAlert({
      account,
      platform: payload.platform,
      type,
      severity: payload.severity,
      reason: payload.reason,
      reportedBy: payload.reported_by,
      evidence: payload.evidence,
      accountProfile: payload.account_profile
    });

    return res.status(201).json(created);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
