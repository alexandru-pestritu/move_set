import fetch, { RequestInit, Response } from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from '../config';

export async function proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (config.proxyUrl) {
    const agent = new HttpsProxyAgent(config.proxyUrl);
    options.agent = agent;
  }

  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options.headers,
    },
  });
}
