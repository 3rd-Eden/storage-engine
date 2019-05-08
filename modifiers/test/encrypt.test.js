import { StorageEngine } from 'storage-engine';
import { describe, it } from 'mocha';
import { encrypt, json } from '../index.js';
import assume from 'assume';

describe('(encrypt)', function () {
  let storage;

  beforeEach(function () {
    storage = new StorageEngine();

    storage.use('*', json);
    storage.use('*', encrypt, {
      secret: 'this is my secret password',
      encryption: 'RC4'
    });
  });

  afterEach(function () {
    storage.destroy();
    storage.clear();
  });

  it('should not die on non existing values', async function () {
    const value = await storage.getItem('what');

    assume(value).is.a('null');
  });

  it('encrypts the content when a value is stored', async function () {
    await storage.setItem('secret key', 'secret value');

    const value = await storage.api('getItem', 'secret key');

    assume(value).is.a('string');
    assume(value).does.not.equal('secret value');

    assume(value.charAt(0)).equals('@');
    const parsed = JSON.parse(value.slice(1));

    assume(parsed).is.a('object');
    assume(parsed.ct).is.a('string');
    assume(parsed.s).is.a('string');
  });

  it('can decode an encoded value', async function () {
    const old = '@{"ct":"lEy9TW+b8Oga4H8G","iv":"","s":"667571159a624dab"}';
    await storage.api('setItem', 'secret', old);

    const value = await storage.getItem('secret');
    assume(value).equals('secret value');
  });

  it('generates different values', async function () {
    await storage.setItem('one', 'hello world');
    await storage.setItem('two', 'hello world');

    const one = await storage.api('getItem', 'one');
    const two = await storage.api('getItem', 'two');

    assume(one).is.a('string');
    assume(two).is.a('string');
    assume(one).does.not.equals(two);
  });

  it('can decrypt the value that was just stored', async function () {
    const payload = JSON.stringify({
      this: 'is an example payload',
      data: {
        value: 100
      }
    });

    await storage.setItem('what', payload);
    const value = await storage.getItem('what');

    assume(value).equals(payload);
  });
});
