import { expire, emit, json, encrypt } from '../index.js';
import assume from 'assume';

describe('storage-modifiers', function () {
  it('exposes the `json` modifier', function () {
    assume(json).is.a('function');
  });

  it('exposes the `emit` modifier', function () {
    assume(emit).is.a('function');
  });

  it('exposes the `expire` modifier', function () {
    assume(expire).is.a('asyncfunction');
  });

  it('exposes the `encrypt` modifier', function () {
    assume(encrypt).is.a('function');
  });
});
