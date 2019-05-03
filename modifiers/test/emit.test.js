import { StorageEngine } from 'storage-engine';
import { describe, it } from 'mocha';
import { emit } from '../index.js';
import assume from 'assume';

describe('(emit)', function () {
  let storage;

  /**
   * Adds a promise API on the storage.once api so we can intercept the data.
   *
   * @param {String} key The key to listen for.
   * @param {Function} fn
   * @public
   */
  function once(key, fn) {
    return new Promise(function (resolve, reject) {
      storage.once(key, function (args) {
        resolve(args);
      });

      fn();
    });
  }

  beforeEach(function () {
    storage = new StorageEngine();

    storage.use('*', emit, {
      key: true,
      operation: true
    });
  });

  afterEach(function () {
    storage.destroy();
  });

  it('is a function', function () {
    assume(emit).is.a('function');
  });

  describe('#getItem', function () {
    it('emits the `key` event with the correct values', async function () {
      await storage.api('setItem', 'foo', 'bar');

      const { key, value, method } = await once('foo', async function () {
        await storage.getItem('foo');
      });

      assume(key).equals('foo');
      assume(value).equals('bar');
      assume(method).equals('getItem');
    });
  });

  describe('#setItem', function () {
    it('emits the `key` event with the correct values', async function () {
      const { key, value, method } = await once('hello', async function () {
        await storage.setItem('hello', 'world');
      });

      assume(key).equals('hello');
      assume(value).equals('world');
      assume(method).equals('setItem');
    });
  });

  describe('#removeItem', function () {
    it('emits the `key` event with the correct values', async function () {
      const { key, value, method } = await once('hello', async function () {
        await storage.removeItem('hello');
      });

      assume(key).equals('hello');
      assume(value).is.a('undefined');
      assume(method).equals('removeItem');
    });
  });

  describe('#clear', function () {
    it('emits the `clear` event with the correct values', async function () {
      const { key, value, method } = await once('clear', async function () {
        await storage.clear();
      });

      assume(key).is.a('undefined');
      assume(value).is.a('undefined');
      assume(method).equals('clear');
    });
  });

  describe('#getAllKeys', function () {
    it('emits the `getAllKeys` event with the correct values', async function () {
      const { key, value, method } = await once('getAllKeys', async function () {
        await storage.getAllKeys();
      });

      assume(key).is.a('undefined');
      assume(value).is.a('undefined');
      assume(method).equals('getAllKeys');
    });
  })

  describe('#flushGetRequests', function () {
    it('emits the `flushGetRequests` event with the correct values', async function () {
      const { key, value, method } = await once('flushGetRequests', async function () {
        await storage.flushGetRequests();
      });

      assume(key).is.a('undefined');
      assume(value).is.a('undefined');
      assume(method).equals('flushGetRequests');
    });
  });
});
