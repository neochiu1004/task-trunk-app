import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseExpiryText, formatExpiryText } from '../src/js/utils.js';

test('parseExpiryText 接受斜線格式並補零', () => {
  assert.equal(parseExpiryText('2027/02/01'), '2027/02/01');
  assert.equal(parseExpiryText('2027/2/1'), '2027/02/01');
});

test('parseExpiryText 接受破折號與點號格式', () => {
  assert.equal(parseExpiryText('2027-02-01'), '2027/02/01');
  assert.equal(parseExpiryText('2027.2.1'), '2027/02/01');
});

test('parseExpiryText 接受 8 碼緊縮格式', () => {
  assert.equal(parseExpiryText('20270201'), '2027/02/01');
});

test('parseExpiryText 擋下不存在的日期', () => {
  assert.equal(parseExpiryText('2027/02/30'), null);
  assert.equal(parseExpiryText('2027/13/01'), null);
  assert.equal(parseExpiryText('2027/00/10'), null);
  assert.equal(parseExpiryText('2027/01/00'), null);
});

test('parseExpiryText 閏年檢查', () => {
  assert.equal(parseExpiryText('2028/02/29'), '2028/02/29');
  assert.equal(parseExpiryText('2027/02/29'), null);
});

test('parseExpiryText 擋下非日期輸入', () => {
  assert.equal(parseExpiryText(''), null);
  assert.equal(parseExpiryText('abc'), null);
  assert.equal(parseExpiryText('02/01/2027'), null);
  assert.equal(parseExpiryText(null), null);
  assert.equal(parseExpiryText(undefined), null);
});

test('formatExpiryText 正規化或回空字串', () => {
  assert.equal(formatExpiryText('2026-12-31'), '2026/12/31');
  assert.equal(formatExpiryText('2026/12/31'), '2026/12/31');
  assert.equal(formatExpiryText(''), '');
  assert.equal(formatExpiryText('garbage'), '');
});
