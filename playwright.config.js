import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:30000,expect:{timeout:10000},fullyParallel:false,forbidOnly:!!process.env.CI,retries:0,workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:8766/clinic-voice-notes/',trace:'off',screenshot:'off',video:'off',acceptDownloads:true},
 projects:[{name:'chromium-mobile',use:{...devices['Pixel 7'],browserName:'chromium'}},{name:'webkit-mobile',use:{...devices['iPhone 13'],browserName:'webkit'}}],
 webServer:{command:'node scripts/serve-static.js --serve',url:'http://127.0.0.1:8766/clinic-voice-notes/',reuseExistingServer:false,timeout:15000}
});
