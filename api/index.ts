import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

export default function handler(req: IncomingMessage & { url?: string; query?: any; headers: any }, res: ServerResponse) {
  // Normalize URL for Vercel Serverless environment
  // Vercel may provide original path in headers or rewritten url
  const originalUrl = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'] || req.headers['x-forwarded-uri'] || req.url) as string;
  
  if (originalUrl) {
    if (originalUrl.startsWith('/api')) {
      req.url = originalUrl;
    } else if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  return (app as any)(req, res);
}
