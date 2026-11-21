import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixedWindowLimiter, isAccessRequired, validDrugNames, verifyApiAccess } from './apiSecurity';

const strong = 'a-fresh-operator-token-that-is-long-enough';
test('production fails closed without operator token', () => {
  assert.equal(isAccessRequired(undefined, 'production'), true);
  assert.equal(verifyApiAccess(undefined, undefined, 'production'), false);
  assert.equal(verifyApiAccess('anything', 'weak', 'production'), false);
});
test('development without token stays available for local testing', () => {
  assert.equal(isAccessRequired(undefined, 'development'), false);
  assert.equal(verifyApiAccess(undefined, undefined, 'development'), true);
});
test('configured secrets require an exact, sufficiently long token', () => {
  assert.equal(verifyApiAccess(strong, strong, 'production'), true);
  assert.equal(verifyApiAccess(strong + 'x', strong, 'production'), false);
  assert.equal(verifyApiAccess('', strong, 'production'), false);
});
test('rate limiting blocks repeated calls and resets after the window', () => {
  let now = 0;
  const limiter = createFixedWindowLimiter(2, 1000, () => now);
  assert.equal(limiter.allow('ip1'), true);
  assert.equal(limiter.allow('ip1'), true);
  assert.equal(limiter.allow('ip1'), false);
  assert.equal(limiter.allow('ip2'), true);
  now = 1001;
  assert.equal(limiter.allow('ip1'), true);
});
test('drug name arrays reject excess and malformed prompt inputs', () => {
  assert.equal(validDrugNames(['Metformin','Losartan'],2),true);
  assert.equal(validDrugNames(['Losartan'],2),false);
  assert.equal(validDrugNames(['x\ny'],0),false);
  assert.equal(validDrugNames(Array.from({length:41},()=> 'A'),0),false);
});
