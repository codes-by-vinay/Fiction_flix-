import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAuthInput} from './authValidation.js';

test('rejects malformed email addresses and email values over 254 characters', () => {
  assert.equal(validateAuthInput('not-an-email', 'story-pass-1', 'login').field, 'email');
  assert.equal(validateAuthInput(`${'a'.repeat(245)}@example.com`, 'story-pass-1', 'login').field, 'email');
});

test('allows symbols and spaces in valid sign-up passwords', () => {
  assert.equal(validateAuthInput('reader@example.com', 'My-Strong!Pass1', 'signup', 'Reader'), null);
  assert.equal(validateAuthInput('reader@example.com', 'pass word1', 'signup', 'Reader'), null);
});

test('enforces the sign-up password length limits', () => {
  assert.equal(validateAuthInput('reader@example.com', 'short1!', 'signup', 'Reader').field, 'password');
  assert.equal(
    validateAuthInput('reader@example.com', 'x'.repeat(129), 'signup', 'Reader').message,
    'Password 8 से 128 characters के बीच होना चाहिए।',
  );
  assert.equal(validateAuthInput('reader@example.com', 'storypass1', 'signup', 'Reader'), null);
});

test('allows existing login passwords with symbols while enforcing backend length limits', () => {
  assert.equal(validateAuthInput('reader@example.com', 'special-pass!', 'login'), null);
  assert.equal(validateAuthInput('reader@example.com', 'short', 'login').field, 'password');
  assert.equal(validateAuthInput('reader@example.com', 'x'.repeat(129), 'login').field, 'password');
});

test('validates sign-up names before submission', () => {
  assert.equal(validateAuthInput('reader@example.com', 'storypass1', 'signup', '  ').field, 'name');
  assert.equal(validateAuthInput('reader@example.com', 'storypass1', 'signup', 'R'.repeat(81)).field, 'name');
});
