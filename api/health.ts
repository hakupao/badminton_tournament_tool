import type { VercelRequest, VercelResponse } from '@vercel/node';

const healthPayload = () => ({
  status: 'ok',
  message: '羽毛球赛事管理系统 MVP 版本',
  timestamp: new Date().toISOString(),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(healthPayload());
}
