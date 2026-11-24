import { chromium, type FullConfig } from '@playwright/test';

// Refuse an old system Chrome or executable override before any test page loads.
export default async function verifyBrowserSecurity(config: FullConfig) {
  const minimum = [156, 0, 8078, process.platform === 'darwin' ? 74 : 73];
  for (const project of config.projects) {
    if ((project.use.browserName ?? 'chromium') !== 'chromium') continue;
    if (project.use.launchOptions?.chromiumSandbox !== true)
      throw new Error('Chromium sandbox must be enabled for browser tests.');
    const browser = await chromium.launch({
      ...project.use.launchOptions,
      channel: project.use.channel ?? 'chrome',
      headless: true,
      chromiumSandbox: true,
    });
    try {
      const version = browser.version();
      const actual = version.split('.').map(Number);
      const firstDifference = actual.findIndex((value, index) => value !== minimum[index]);
      if (
        !/^\d+\.\d+\.\d+\.\d+$/.test(version) ||
        (firstDifference !== -1 && actual[firstDifference] < minimum[firstDifference])
      )
        throw new Error(`Browser update required: use Chrome ${minimum.join('.')} or newer.`);
    } finally {
      await browser.close();
    }
  }
}
