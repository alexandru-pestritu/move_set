import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { proxyFetch } from '../utils/proxy';
import { config } from '../config';

export interface ScrapedExercise {
  name: string;
  gifUrl: string;
  primaryMuscle: string;
  equipment: string;
  musclesWorked: { name: string; percentage: number }[];
}

export async function scrapeExercise(url: string): Promise<ScrapedExercise> {
  if (!url.includes('fitnessprogramer.com/exercise/')) {
    throw new Error('Invalid URL. Must be a fitnessprogramer.com exercise page.');
  }

  const response = await proxyFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exercise page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const name = $('h1.page_title').text().trim();
  if (!name) {
    throw new Error('Could not extract exercise name from page.');
  }

  const gifUrl = $('meta[property="og:image"]').attr('content') || '';
  if (!gifUrl) {
    throw new Error('Could not extract exercise GIF URL from page.');
  }

  const primaryMuscle = $('.spec_group.muscle_groups .group-content ul li span')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  const equipment = $('.spec_group.equipments .group-content ul li span')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');

  const musclesWorked: { name: string; percentage: number }[] = [];
  $('.vc_progress_bar .vc_single_bar').each((_, el) => {
    const label = $(el).find('.vc_label').text().trim();
    const pct = parseInt($(el).find('.vc_bar').attr('data-percentage-value') || '0', 10);
    if (label) {
      musclesWorked.push({ name: label, percentage: pct });
    }
  });

  return { name, gifUrl, primaryMuscle, equipment, musclesWorked };
}

export async function downloadGif(gifUrl: string, exerciseId: number): Promise<string> {
  const response = await proxyFetch(gifUrl);
  if (!response.ok) {
    throw new Error(`Failed to download GIF: ${response.status}`);
  }

  const buffer = await response.buffer();
  const filename = `${exerciseId}.gif`;
  const filepath = path.join(config.gifDir, filename);

  fs.writeFileSync(filepath, buffer);
  return filename;
}
