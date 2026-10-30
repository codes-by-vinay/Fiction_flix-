import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCredentials} from '../src/validation.js';

test('normalizes email and accepts a valid password', () => {
  assert.deepEqual(validateCredentials({email: '  Reader@Example.com ', password: 'story-pass-1'}), {
    email: 'reader@example.com',
    password: 'story-pass-1',
  });
});

test('rejects malformed email addresses', () => {
  assert.equal(validateCredentials({email: 'not-an-email', password: 'story-pass-1'}).error, 'Enter a valid email address.');
});

test('rejects passwords shorter than eight characters', () => {
  assert.equal(validateCredentials({email: 'reader@example.com', password: 'short'}).error, 'Password must contain at least 8 characters.');
});

test('rejects passwords longer than bcrypt input limit', () => {
  assert.equal(validateCredentials({email: 'reader@example.com', password: 'é'.repeat(37)}).error, 'Password must not exceed 72 UTF-8 bytes.');
});