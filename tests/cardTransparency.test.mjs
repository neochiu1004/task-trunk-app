import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { GLASS_CARD_OPACITY } from '../src/js/utils.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Extract the first CSS rule block for a selector, e.g. ".ticket-card { ... }".
// Comments are stripped so prose mentioning a property does not count.
function cssBlock(css, selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `selector ${selector} not found`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open, close).replace(/\/\*[\s\S]*?\*\//g, '');
}

test('v1.6.2 預設不透明度維持 0.73（真透明，不觸發新遷移）', () => {
  assert.equal(GLASS_CARD_OPACITY, 0.73);
});

test('JS 版 .ticket-card 不含任何 backdrop-filter（去毛玻璃）', () => {
  const css = read('src/css/main.css');
  const block = cssBlock(css, '.ticket-card');
  assert.ok(!block.includes('backdrop-filter'), '.ticket-card 不應有 backdrop-filter');
  assert.ok(!css.includes('blur(14px) saturate(1.45)'), 'v1.6.1 毛玻璃組合應完全移除');
});

test('JS 版卡片背景 alpha 直接由 cardOpacity 決定（hexToRgba）', () => {
  const page = read('src/js/pages/ticketsPage.js');
  const matches = page.match(/hexToRgba\(cardBgColor, cardOpacity\)/g) || [];
  assert.equal(matches.length, 2, '兩處卡片樣式都應以 cardOpacity 作為背景 alpha');
  assert.ok(!page.includes('backdrop-filter'), 'ticketsPage.js 不應再注入任何 backdrop-filter');
});

test('JS 版核銷殼維持不透明白底', () => {
  const page = read('src/js/pages/ticketsPage.js');
  assert.ok(page.includes('id="redeem-shell" class="w-full h-full rounded-none border-0 bg-white'));
});

test('React .glass-card--translucent 不含 backdrop-filter 且背景 alpha 為 0.73', () => {
  const css = read('src/index.css');
  const block = cssBlock(css, '.glass-card--translucent');
  assert.ok(!block.includes('backdrop-filter'), '.glass-card--translucent 不應有 backdrop-filter');
  assert.ok(block.includes('hsl(var(--wabi-surface) / 0.73)'), '背景應為 0.73 alpha');
});

test('React TicketCard 背景層改用背景色 alpha（withAlpha），不用元素 opacity / backdrop blur', () => {
  const card = read('src/components/ticket/TicketCard.tsx');
  assert.ok(!card.includes('backdrop-blur-[10px]'), '背景層不應有 backdrop-blur');
  assert.ok(!card.includes('opacity: cardBgOpacity'), '背景層不應再用元素 opacity');
  const matches = card.match(/withAlpha\(cardBgColor/g) || [];
  assert.equal(matches.length, 2, '一般卡與精簡卡背景層都應以 withAlpha 套背景 alpha');
});
