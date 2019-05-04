import { StorageEngine } from '../index.js';
import { json } from '../modifiers';
import assume from 'assume';

describe('storage-engine', function () {
  let storage;

  beforeEach(function () {
    storage = new StorageEngine();
    storage.use('*', json);
  });

  describe('#{get|set}Item', function () {
    it('stores and fetches values', async function () {
      await storage.setItem('foo', 'bar');

      assume(await storage.getItem('foo')).equals('bar');
    });

    it('can store falsey values', async function () {
      const key = 'falseyValue';
      await storage.setItem(key, false);
      assume(await storage.getItem(key)).equals(false);

      await storage.setItem(key, '');
      assume(await storage.getItem(key)).equals('');

      await storage.setItem(key, null);
      assume(await storage.getItem(key)).equals(null);
    });

    it('throws on trying to set undefined', async function () {
      try {
        await storage.setItem('undefined-value', undefined);
      } catch (e) {
        return;
      }

      throw new Error('It should have thrown');
    });


    it('stores and fetches objects', async function () {
      await storage.setItem('object', { object: 'object' });
      assume(await storage.getItem('object')).deep.equals({ object: 'object' });
    });
  });

  describe('#{multiGet|multiSet}Item', function () {
    it('stores and fetches multiple values', async function () {
      await storage.multiSet([['key1', 'value1'], ['key2', 'value2']]);

      assume(await storage.multiGet(['key1', 'key2'])).deep.equals([['key1', 'value1'], ['key2', 'value2']]);
    });

    it('stores and fetches multiple objects', async function () {
      await storage.multiSet([['key1', { object1: 'object1' }], ['key2', { object2: 'object2' }]]);

      assume(await storage.multiGet(['key1', 'key2'])).deep.equals([['key1', { object1: 'object1' }], ['key2', { object2: 'object2' }]]);
    });

    it('stores and fetches multiple falsey values', async function () {
      await storage.multiSet([['key1', ''], ['key2', false], ['key3', null]]);

      assume(await storage.multiGet(['key1', 'key2', 'key3'])).deep.equals([
        ['key1', ''],
        ['key2', false],
        ['key3', null]
      ]);
    });

    it('throws on trying to set undefined', async function () {
      try {
        await storage.multiSet([['key1', ''], ['key2', undefined], ['key3', null]]);
      } catch (e) {
        return;
      }

      throw new Error('It should have thrown');
    });
  });

  describe('#clear', function () {
    it('removes all keys', async function () {
      assume(await storage.getItem('foo')).equals('bar');

      await storage.clear();
      assume(await storage.getItem('foo')).equals(null);
    });
  });
});
