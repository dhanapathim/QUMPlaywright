import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import extract from 'extract-zip';
import { request, test } from '@playwright/test';

export default async () => {
  dotenv.config();

  // Optional: log that it's loaded
  console.log('✅ Environment variables loaded.');
  // const api = await request.newContext();

  // const response = await api.get('https://qum-ui-dhanapathi-marepalli2-27051fa7b46b13b436eca25994c7063ad0.gitlab.io/dist.zip');
  // const buffer = await response.body();

  // const zipPath = './reports/dist.zip';
  // fs.writeFileSync(zipPath, buffer);

  // await extract(zipPath, { dir: '/Users/sandhyaranikande/PycharmProjects/cision-ssm/reports/unzipped' });

};
