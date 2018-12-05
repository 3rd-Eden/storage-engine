import storage, { StorageEngine } from '../';
import assume from 'assume';

describe('storage-engine', function () {
  it('exposes the StorageEngine class', function () {
    assume(StorageEngine).is.a('function');
  });

  it('exposes a `storage` instance', function () {
    assume(storage).is.instanceOf(StorageEngine);
  });

  it('has a correct displayName', function () {
    assume(storage.getItem.displayName).equals('getItem');
  });

  describe('#{get|set}Item', function () {
    it('stores and fetches values', async function () {
      await storage.setItem('foo', 'bar');

      assume(await storage.getItem('foo')).equals('bar');
    });

    it('emits <key> when a new value is get', function (next) {
      storage.once('foo', function (method, value) {
        assume(method).equals('getItem');
        assume(value).equals('bar');

        next();
      });

      storage.getItem('foo');
    });

    it('emits <key> when a new value is set', function (next) {
      storage.once('pew', function (method, value) {
        assume(method).equals('setItem');
        assume(value).equals('waddup');

        next();
      });

      storage.setItem('pew', 'waddup');
    });

    it('stores and fetches no value', async function () {
      await storage.setItem('noValue');
      assume(await storage.getItem('noValue')).equals(undefined);
    });

    it('emits <key> when a no value is get', function (next) {
      storage.once('noValue', function (method, value) {
        assume(method).equals('getItem');
        assume(value).equals(undefined);

        next();
      });

      storage.getItem('noValue');
    });

    it('emits <key> when a no value is set', function (next) {
      storage.once('newNoValue', function (method, value) {
        assume(method).equals('setItem');
        assume(value).equals(undefined);

        next();
      });

      storage.setItem('newNoValue', undefined);
    });

    it('stores and fetches objects', async function () {
      await storage.setItem('object', { object: 'object' });
      assume(await storage.getItem('object')).deep.equals({ object: 'object' });
    });

    it('emits <key> when a new object is get', function (next) {
      storage.once('object', function (method, value) {
        assume(method).equals('getItem');
        assume(value).deep.equals({ object: 'object' });

        next();
      });

      storage.getItem('object');
    });

    it('emits <key> when a new value is set', function (next) {
      storage.once('newObject', function (method, value) {
        assume(method).equals('setItem');
        assume(value).deep.equals({ newObject: 'newObject' });

        next();
      });

      storage.setItem('newObject', { newObject: 'newObject' });
    });
  });

  describe('#{multiGet|multiSet}Item', function () {
    it('stores and fetches multiple values', async function () {
      await storage.multiSet([['key1', 'value1'], ['key2', 'value2']]);

      assume(await storage.multiGet(['key1', 'key2'])).deep.equals([['key1', 'value1'], ['key2', 'value2']]);
    })

    it('stores and fetches multiple objects', async function () {
      await storage.multiSet([['key1', { object1: 'object1' }], ['key2', { object2: 'object2' }]]);

      assume(await storage.multiGet(['key1', 'key2'])).deep.equals([['key1', { object1: 'object1' }], ['key2', { object2: 'object2' }]]);
    })
  });

  describe('#clear', function () {
    it('removes all keys', async function () {
      assume(await storage.getItem('foo')).equals('bar');

      await storage.clear();
      assume(await storage.getItem('foo')).equals(null);
    });

    it('emits a `clear` event', function (next) {
      storage.once('clear', function () {
        next();
      });

      storage.clear();
    });
  });
});
