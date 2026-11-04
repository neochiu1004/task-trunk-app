import { test} from 'node:test';
import assert from 'node:assert/strict';

import { ticketImageGenerationMode} from '../src/js/utils.js';

test('借用範本圖 → borrowed', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: true, hasOriginalImage: true, serial: 'E1', productName: '85度C 飲品'}),
'borrowed',
);
});

test('無原圖、品名含 85度C、有序號 → keyword', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: false, hasOriginalImage: false, serial: 'E1', productName: '85度C 35元飲品券'}),
'keyword',
);
assert.equal(
ticketImageGenerationMode({ borrowed: false, hasOriginalImage: false, serial: 'E1', productName: '85度C 50元飲品（好禮即享券）'}),
'keyword',
);
});

test('無原圖但品名無關鍵字 → null', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: false, hasOriginalImage: false, serial: 'E1', productName: '天仁茗茶券'}),
null,
);
});

test('有自己的原圖 → null（不覆蓋使用者截圖）', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: false, hasOriginalImage: true, serial: 'E1', productName: '85度C 飲品'}),
null,
);
});

test('沒有序號 → null', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: true, hasOriginalImage: true, serial: '', productName: '85度C 飲品'}),
null,
);
assert.equal(
ticketImageGenerationMode({ borrowed: false, hasOriginalImage: false, serial: '', productName: '85度C 飲品'}),
null,
);
});

test('批量生成票券編輯 → null（走自己的重產路徑）', () => {
assert.equal(
ticketImageGenerationMode({ borrowed: true, hasOriginalImage: true, serial: 'E1', productName: '85度C 飲品', isBatchEditing: true}),
null,
);
});
