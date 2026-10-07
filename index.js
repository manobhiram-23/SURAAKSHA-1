import { mockAlerts } from '@/lib/mockData';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { status } = req.query;
    const filtered = status && status !== 'all'
      ? mockAlerts.filter(a => a.status === status)
      : mockAlerts;
    return res.status(200).json(filtered);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
