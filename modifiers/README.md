# storage-modifiers

This is curated set of modifiers that can be used with the `storage-engine`
library.

## Installation

This package is released in the public npm registery and should be used
inconjuction with the `storage-engine` library:

```sh
npm install --save storage-modifiers
npm install --save storage-engine
```

## Modifiers

The following modifiers are available in this package:

- [json](#json) Automatically JSON encode / decode payloads.
- [emit](#emit) Emit events when keys are modified.
- [expire](#expire) Expire data.
- [encrypt](#encrypt) Encrypt the contents of your AsyncStorage

### json

```js
import { json } from 'storage-modifiers';
import storage from 'storage-engine';

storage.use('*', json);
```

### emit

Allows you to emit an event every time when a given key is accessed, this allows
you for example to track changes to values.

```js
import { expire } from 'storage-modifiers';
import storage from 'storage-engine';

storage.use('*', expire, {
  key: true,
  operation: true
});

storage.on('key', function ({ method, key, value }) {
  console.log(`${method} accessed "key" which now has value:`, value);
});

storage.on('setItem', function ({ method, key, value }) {
  console.log('what is up from `setItem` is a called on key:', key);
});

await storage.setItem('key', 'value');

//
// console output:
//
// - setItem accessed "key" which is now has value: "value"
// - what is up from `setItem` is called on key: "key"
//
```

The `emit` plugin understands the following options:

- `key` Emit the events with the key as event name.
- `operation` Emit the operation as event name.

### expire

Allows you to automatically expire keys and remove it from your AsyncStorage.

```js
import { expire } from 'storage-modifiers';
import storage from 'storage-engine';

storage.use('key, another, foo*', expire, {
  duration: '10 minutes'
});

await storage.setItem('key', 'data'); // expires in 10 minutes
```

The `expire` plugin understands the following options:

- `duration` The TTL of the values that get stored in these keys.

### encrypt

Provides an additional layer of security for AsyncStorage by encrypting the
values using `crypto-js`. This ensures that when the AsyncStorage is flushed
to disk, the contents will still be encoded.

```js
import { encrypt } from 'storage-modifiers';
import storage from 'storage-engine';

storage.use('secure*', encrypt, {
  secret: 'your secret here',
  encryption: 'SHA3'
});
```

The `encrypt` plugin understands the following options:

- `secret`, **required**, The secret key/passcode to use to encode/decode contents.
- `encryption`, **required**, The encryption algorithm to use. Can be any of the
  supported encryption libraries; https://github.com/brix/crypto-js#list-of-modules
  Please note that casing is important here `sha3` is invalid, while `SHA3` is
  accepted.

## License

(MIT)[LICENSE]
