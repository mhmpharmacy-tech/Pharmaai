import test from 'node:test';
import assert from 'node:assert/strict';
import { ImageInputError, validateImageInput } from './imageInput';

const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/c1sAAAAASUVORK5CYII=';

test('accept valid PNG base64 and its matching declared MIME', () => {
  const value = validateImageInput(`data:image/png;base64,${onePixelPng}`, 'image/png');
  assert.equal(value.mimeType, 'image/png');
  assert.ok(value.byteLength > 20);
});

test('reject MIME confusion, untrusted inputs and malformed data', () => {
  assert.throws(() => validateImageInput(onePixelPng,'image/jpeg'), ImageInputError);
  assert.throws(() => validateImageInput(`data:image/png;base64,${onePixelPng}`,'image/jpeg'), ImageInputError);
  assert.throws(() => validateImageInput('data:text/html;base64,Zm9v','text/html'), ImageInputError);
  assert.throws(() => validateImageInput('%%%%','image/png'), ImageInputError);
  assert.throws(() => validateImageInput(null,'image/png'), ImageInputError);
});

test('reject payload larger than seven megabytes', () => {
  const tooBig = Buffer.alloc(7 * 1024 * 1024 + 1, 1).toString('base64');
  assert.throws(() => validateImageInput(tooBig, 'image/png'), ImageInputError);
});
