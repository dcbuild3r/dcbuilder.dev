import { test, expect, spyOn } from 'bun:test';
import { chromium, type Browser, type FullConfig } from '@playwright/test';
import verifyBrowserSecurity from './browser-security-setup';

const config = {
  projects: [
    {
      use: { browserName: 'chromium', channel: 'chrome', launchOptions: { chromiumSandbox: true } },
    },
  ],
} as FullConfig;

test('rejects obsolete browser versions and closes the browser before tests load content', async () => {
  for (const version of [
    '145.0.7632.6',
    '149.0.7827.55',
    '156.0.8078.4',
    '156.0.8078.72',
    'unknown',
  ]) {
    let closed = false;
    const browser = {
      version: () => version,
      close: async () => {
        closed = true;
      },
    } as unknown as Browser;
    const launch = spyOn(chromium, 'launch').mockResolvedValue(browser);
    try {
      await expect(verifyBrowserSecurity(config)).rejects.toThrow('Browser update required');
      expect(closed).toBe(true);
    } finally {
      launch.mockRestore();
    }
  }
});

test('allows fixed and newer versions with sandboxing enabled', async () => {
  for (const version of ['156.0.8078.74', '156.0.8078.80', '157.0.0.0']) {
    const browser = { version: () => version, close: async () => {} } as unknown as Browser;
    const launch = spyOn(chromium, 'launch').mockResolvedValue(browser);
    try {
      await verifyBrowserSecurity(config);
      expect(launch.mock.calls[0]?.[0]?.chromiumSandbox).toBe(true);
    } finally {
      launch.mockRestore();
    }
  }
});

test('refuses a configuration that disables the Chromium sandbox', async () => {
  const unsafe = {
    projects: [{ use: { browserName: 'chromium', launchOptions: { chromiumSandbox: false } } }],
  } as FullConfig;
  await expect(verifyBrowserSecurity(unsafe)).rejects.toThrow('sandbox must be enabled');
});
