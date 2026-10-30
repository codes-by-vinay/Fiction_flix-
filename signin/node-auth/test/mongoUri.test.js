import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeMongoUri} from '../src/mongoUri.js';

test('encodes reserved characters in MongoDB credentials', () => {
  assert.equal(
    normalizeMongoUri('mongodb+srv://reader:pa@ss:word@cluster.example.mongodb.net/fictionflix'),
    'mongodb+srv://reader:pa%40ss%3Aword@cluster.example.mongodb.net/fictionflix',
  );
});

test('preserves already encoded credentials', () => {
  const uri = 'mongodb+srv://reader:pa%40ss@cluster.example.mongodb.net/fictionflix';
  assert.equal(normalizeMongoUri(uri), uri);
});

test('leaves MongoDB URIs without credentials unchanged', () => {
  const uri = 'mongodb://127.0.0.1:27017/fictionflix_auth';
  assert.equal(normalizeMongoUri(uri), uri);
});
