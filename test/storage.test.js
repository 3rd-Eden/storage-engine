import engine, { StorageEngine } from '../index.js';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('StorageEngine', function () {
  let storage;

  beforeEach(function () {
    storage = new StorageEngine();
  });

  afterEach(async function () {
    await storage.clear();
    storage.destroy();
  });

  it('exposes a pre-configured storage instance', function () {
    assume(engine).is.instanceOf(StorageEngine);
  });

  describe('#use (plugin engine)', function () {
    it('is a function', function () {
      assume(storage.use).is.a('function');
    });

    it('calls the supplied plugin with a plugin API', function () {
      storage.use('example*', function myPlugin(api) {
        assume(api).is.a('object');

        assume(api.destroy).is.a('function');
        assume(api.enabled).is.a('function');
        assume(api.before).is.a('function');
        assume(api.after).is.a('function');

        assume(api.pattern).equals('example*');
        assume(api.engine).equals(storage);

        assume(api.options).is.a('object');
        assume(api.options.prop).equals('here');
      }, {
        prop: 'here'
      });
    });

    describe('#destroy', function () {
      it('stores a new function that gets called when storage is destroyed', async function () {
        let called = false;

        storage.use('more*', function myPlugin({ destroy }) {
          destroy(function () {
            called = true;
          });
        });

        await storage.destroy();
        assume(called).is.true();
      });
    });

    describe('#enabled', function () {
      it('checks if a given key is enabled by the pattern', function () {
        storage.use('enable*', function myPlugin({ enabled }) {
          assume(enabled('enabled-key')).is.true();
          assume(enabled('enabled')).is.true();
          assume(enabled('nope')).is.false();
          assume(enabled('bar')).is.false();
        });

        storage.use('*', function anotherPlugin({ enabled }) {
          assume(enabled('enabled-key')).is.true();
          assume(enabled('enabled')).is.true();
          assume(enabled('nope')).is.true();
          assume(enabled('bar')).is.true();
        });
      });
    });
  });

  describe('#before', function () {
    it('is a function', function () {
      assume(storage.before).is.a('function');
    });

    it('registers a function that is called before the API is called', async function () {
      let called = false;

      storage.before('key*', {
        getItem: function ({ key }) {
          called = true;

          assume(key).equals('key-here-please');
          return { key: 'intercept' };
        }
      });

      await storage.api('setItem', 'intercept', 'different value');
      const value = await storage.getItem('key-here-please');

      assume(called).is.true();
      assume(value).is.a('string');
      assume(value).equals('different value');
    });

    it('can intercept values before it reaches the storage api', async function () {
      let called = false;
      await storage.api('setItem', 'example-key', 'should not read this value');

      storage.before('example*', {
        getItem: function ({ key }) {
          called = true;

          assume(key).equals('example-key');
          return { value: 'this value got intercepted' }
        }
      });

      const value = await storage.getItem('example-key');

      assume(called).is.true();
      assume(value).is.a('string');
      assume(value).equals('this value got intercepted');
    });
  });

  describe('#after', function () {
    it('is a function', function () {
      assume(storage.after).is.a('function');
    });

    it('can post process the received values', async function () {
      await storage.api('setItem', 'after-data', 'hello mom');
      let called = false;

      storage.after('after*', {
        getItem: function ({ key, value }) {
          called = true;

          assume(key).equals('after-data');
          assume(value).equals('hello mom');

          return { value: 'this is different now' };
        }
      });

      const value = await storage.getItem('after-data');

      assume(called).is.true();
      assume(value).is.a('string');
      assume(value).equals('this is different now');
    });
  });

  describe('#api', function () {
    it('is an async function', function () {
      assume(storage.api).is.a('asyncfunction');
    });

    it('calls the original AsyncStorage API without modifications', async function () {
      storage.use('*', function ({ after }) {
        after({
          getItem: () => {
            return {
              value: 'I override the value'
            }
          }
        });
      });

      const result = await storage.api('getItem', 'foo');
      assume(result).is.a('null');
    });
  });

  describe('AsyncStorage API\'s', function () {
    describe('#getItem', function () {
      it('returns the stored data', async function () {
        await storage.api('setItem', 'key', 'value');

        const existing = await storage.getItem('key');
        const nonexisting = await storage.getItem('08a0d8fa098fa0f8');

        assume(existing).equals('value');
        assume(nonexisting).is.a('null');
      });
    });

    describe('#setItem', function () {
      it('stores values', async function () {
        await storage.setItem('hello', 'world');

        const value = await storage.getItem('hello');
        assume(value).equals('world');
      });

      it('calls `toString` on the stored value', async function () {
        const fake = {
          toString() {
            return 'foo bar';
          }
        };

        await storage.setItem('another', fake);
        const value = await storage.getItem('another');

        assume(value).equals('foo bar');
      });

      it('does not allow setting of `undefined` values', async function () {
        try { await storage.setItem('this should throw', undefined); }
        catch (e) { return; }

        throw new Error('This test should have failed');
      });
    });

    describe('#removeItem', function () {
      it('remove the value', async function () {
        await storage.setItem('i', 'should exist');

        const exists = await storage.getItem('i');
        assume(exists).equals('should exist');

        await storage.removeItem('i');
        const nonexisting = await storage.getItem('i');

        assume(nonexisting).is.a('null');
      });
    });

    describe('#multiGet', function () {
      it('retrieves multiple values', async function () {
        await storage.setItem('foo', 'this is a value');
        await storage.setItem('bar', 'another value');

        const values = await storage.multiGet(['foo', 'bar']);

        assume(values).is.a('array');
        assume(values).is.length(2);

        assume(values[0].key).equals('foo');
        assume(values[0].value).equals('this is a value');

        assume(values[1].key).equals('bar');
        assume(values[1].value).equals('another value');
      });

      it('can pre-process using `before`', async function () {
        await storage.setItem('foo', 'this is a value');
        await storage.setItem('bar', 'another value');

        storage.before('*', {
          multiGet: function ({ key }) {
            return { key: 'bar' }
          }
        });

        const result = await storage.multiGet(['foo']);

        assume(result).is.a('array');
        assume(result).is.length(1);

        //
        // It's expected to fetch a different value, as we've transformed the
        // key to `bar` in our `before` hook.
        //
        assume(result[0].key).equals('bar');
        assume(result[0].value).equals('another value');
      });

      it('can post-process using `after`', async function () {
        await storage.setItem('foo', 'this is a value');

        storage.after('*', {
          multiGet: function ({ key, value }) {
            assume(key).equals('foo');
            assume(value).equals('this is a value');

            return { value: 'lulz' }
          }
        });

        const values = await storage.multiGet(['foo']);

        assume(values).is.a('array');
        assume(values[0].key).equals('foo');
        assume(values[0].value).equals('lulz');
      });
    });
  });
});
