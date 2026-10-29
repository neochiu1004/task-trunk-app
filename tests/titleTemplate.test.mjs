import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findTitleAutoTemplate, TITLE_AUTO_TEMPLATE_KEYWORD } from '../src/js/utils.js';

const templates = [
  { id: 'a', label: '一般飲品', productName: '飲品券' },
  { id: 'b', label: '85度C飲品', productName: '85度C 35元飲品券' },
  { id: 'c', label: '預設範本', productName: '其他票券' },
];

test('關鍵字固定為 85度C', () => {
  assert.equal(TITLE_AUTO_TEMPLATE_KEYWORD, '85度C');
});

test('有設預設範本時優先用預設', () => {
  assert.equal(findTitleAutoTemplate(templates, 'c')?.id, 'c');
});

test('預設 id 失效時退回名稱含關鍵字的範本', () => {
  assert.equal(findTitleAutoTemplate(templates, 'missing')?.id, 'b');
});

test('沒設預設時用名稱含關鍵字的範本', () => {
  assert.equal(findTitleAutoTemplate(templates, '')?.id, 'b');
});

test('都沒有時回傳 null', () => {
  assert.equal(findTitleAutoTemplate([{ id: 'x', label: '無關', productName: '無關' }], ''), null);
  assert.equal(findTitleAutoTemplate([], ''), null);
  assert.equal(findTitleAutoTemplate(undefined, ''), null);
});
