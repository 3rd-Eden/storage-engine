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
