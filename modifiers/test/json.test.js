import { StorageEngine } from 'storage-engine';
import { describe, it } from 'mocha';
import { json } from '../index.js';
import assume from 'assume';

describe('(json)', function () {
  let storage;

  beforeEach(function () {
    storage = new StorageEngine();

    storage.use('*', json);
  });

  afterEach(function () {
    storage.destroy();
    storage.clear();
  });

  it('allows storing and reading of JSON values', async function () {
    await storage.setItem('foo', {
      json: 'blob',
      more: true
    });

    const data = await storage.getItem('foo');

    assume(data).is.a('object');
    assume(data.json).equals('blob');
    assume(data.more).is.true();
  });

  it('allows merging of JSON values', async function () {
    await storage.setItem('another', {
      key: 'value'
    });

    await storage.mergeItem('another', {
      added: 'merged'
    });

    const data = await storage.getItem('another');

    assume(data).is.a('object');
    assume(data.key).equals('value');
    assume(data.added).equals('merged');
  });

  it('allows multiGet/Set of JSON values', async function () {
    await storage.multiSet([
      { key: 'hello', value: {
        json: 'data'
      }},
      { key: 'another', value: {
        data: 'yep'
      }}
    ]);

    const [hello, another] = await storage.multiGet(['hello', 'another']);

    assume(hello).is.a('object');
    assume(hello.key).equals('hello');
    assume(hello.value).is.a('object');
    assume(hello.value.json).equals('data');

    assume(another).is.a('object');
    assume(another.key).equals('another');
    assume(another.value).is.a('object');
    assume(another.value.data).equals('yep');
  });
});
