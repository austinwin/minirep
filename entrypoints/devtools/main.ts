import { browser } from '#imports';

const devtoolsApi =
  browser?.devtools ?? (globalThis as typeof globalThis & { chrome?: any }).chrome?.devtools;

if (!devtoolsApi?.panels?.create) {
  console.warn('DevTools panels API unavailable; minirep panel not registered.');
} else {
  try {
    devtoolsApi.panels.create('minirep', 'icon/16.png', 'panel.html');
  } catch (error) {
    console.error('Failed to create minirep DevTools panel:', error);
  }
}
