import { test } from 'node:test';
import assert from 'node:assert/strict';

import { matchTagKeywordRules, normalizeTagKeywordRules } from '../src/js/utils.js';

const rules = [{ tag: '7-11', keywords: ['7-11', 'eleven'] }];

test('關鍵字命中：名稱含 eleven 帶入固定標籤 7-11', () => {
  assert.deepEqual(matchTagKeywordRules('Eleven 超商禮券 50 元', rules), ['7-11']);
});

test('關鍵字命中：名稱含 7-11（固定標籤本身）也命中', () => {
  assert.deepEqual(matchTagKeywordRules('7-11 商品卡', rules), ['7-11']);
});

test('不分大小寫：ELEVEN 全大寫也命中', () => {
  assert.deepEqual(matchTagKeywordRules('ELEVEN 禮券', rules), ['7-11']);
});

test('未命中回傳空陣列；空名稱不比對', () => {
  assert.deepEqual(matchTagKeywordRules('全家禮券', rules), []);
  assert.deepEqual(matchTagKeywordRules('', rules), []);
  assert.deepEqual(matchTagKeywordRules('eleven 禮券', []), []);
});

test('多條規則依序回傳、不重複', () => {
  const multi = [
    { tag: '7-11', keywords: ['eleven'] },
    { tag: '超商', keywords: ['eleven', '超商'] },
  ];
  assert.deepEqual(matchTagKeywordRules('eleven 超商券', multi), ['7-11', '超商']);
});

test('正規化：字串關鍵字以逗號拆分、去空白去重、丟棄空標籤與重複標籤', () => {
  assert.deepEqual(
    normalizeTagKeywordRules([
      { tag: ' 7-11 ', keywords: 'eleven, 7-Eleven, eleven' },
      { tag: '', keywords: ['x'] },
      { tag: '7-11', keywords: ['dup'] },
      null,
    ]),
    [{ tag: '7-11', keywords: ['eleven', '7-Eleven'] }],
  );
  assert.deepEqual(normalizeTagKeywordRules(undefined), []);
});
