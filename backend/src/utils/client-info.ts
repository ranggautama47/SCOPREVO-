import { Request } from 'express';

export interface ClientMeta {
  ip: string;
  device: string;
}

export function getClientMeta(req: Request): ClientMeta {
  // Prioritas: x-forwarded-for (kalau di belakang proxy/EdgeOne) → req.ip → socket
  const forwarded = req.headers['x-forwarded-for'];
  let ip: string;
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0];
  } else {
    ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }

  // IPv6-mapped IPv4 (::ffff:127.0.0.1) → 127.0.0.1
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);

  const ua = (req.headers['user-agent'] as string) ?? '';
  return { ip, device: parseUserAgent(ua) };
}

function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device';

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Urutan penting: Edge/Opera mengandung Chrome, Chrome mengandung Safari
  if (/Edg\//.test(ua)) {
    const m = ua.match(/Edg\/(\d+)\./);
    browser = m ? `Edge ${m[1]}` : 'Edge';
  } else if (/OPR\/|Opera/.test(ua)) {
    const m = ua.match(/OPR\/(\d+)\./);
    browser = m ? `Opera ${m[1]}` : 'Opera';
  } else if (/Firefox\//.test(ua)) {
    const m = ua.match(/Firefox\/(\d+)\./);
    browser = m ? `Firefox ${m[1]}` : 'Firefox';
  } else if (/Chrome\//.test(ua)) {
    const m = ua.match(/Chrome\/(\d+)\./);
    browser = m ? `Chrome ${m[1]}` : 'Chrome';
  } else if (/Safari\//.test(ua)) {
    const m = ua.match(/Version\/(\d+)\./);
    browser = m ? `Safari ${m[1]}` : 'Safari';
  }

  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return `${os} / ${browser}`;
}