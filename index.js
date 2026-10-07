import { getAlerts, addAlert } from '@/lib/mockData';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { status, search, severity } = req.query;
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

    const created = addAlert({
      account,
      platform: platform || 'Web / Social',
      type,
      severity: Number(severity) || 5,
      reason: reason || 'Flagged manually by SOC analyst',
      reportedBy: '1 officer',
      evidence: evidence || {
        postLink: 'https://security.soc/manual-report',
        content: 'Flagged via SURAAKSHA Officer Portal',
        timestamp: new Date().toISOString()
      },
      accountProfile: accountProfile || {
        username: account.replace('@', ''),
        followers: 'Unknown',
        created: new Date().toISOString().split('T')[0],
        location: 'Analyst Flagged'
      }
    });

    return res.status(201).json(created);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
