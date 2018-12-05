# storage-engine

Storage Engine is an abstraction on the `AsyncStorage` API of React-Native, as
stated in their documentation:

> It is recommended that you use an abstraction on top of AsyncStorage instead
> of AsyncStorage directly for anything more than light usage since it operates
> globally.

So there you go, an abstraction that aims to make working with the `AsyncStorage`
API a bit more developer friendly. The major selling point of this module is
the fact that it infuses the `EventEmitter` pattern with the `AsyncStorage` API
which will allow you to listen to any modification that you make to the storage
(while using this module).

## Installation

This project is released in the public npm registry and can be installed using:

```
npm install --save storage-engine
```

Please note that this module is designed for `react-native` and therefor has
a peerDependency upon it.

## Usage

The `StorageEngine` will emit an event with the name of the key as event name.
This allows you to subscribe to any operation that might affect the key.

```js
import StorageEngine from 'storage-engine';

const storage = new StorageEmitter();

//
// Subscribe to changes to the `foobar` key.
//
storage.on('foobar', (action, ...args) => {
  if (action === 'setItem') {
    console.log('foobar has been updated to', ...args);
  }
});

await storage.setItem('foobar', 'what is going on');
```

The following API methods are available:

- [getItem](#getItem)
- [setItem](#setItem)
- [removeItem](#removeItem)
- [mergeItem](#mergeItem)
- [clear](#clear)
- [flushGetRequests](#flushgetrequests)
- [getAllKeys](#getallkeys)
- [multiGet](#multiget)
- [multiSet](#multiset)
- [multiMerge](#multimerge)
- [multiRemove](#multiremove)
- [on](#on)
- [off](#off)
- [listeners](#listeners)

### getItem

- Execution: **async**
- Emits: `<key>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#getitem

Retrieve the item from async Storage. It accepts the following arguments:

- `name` (string), Name of the key that needs to be retrieved.

If no value is found, `null` will be returned instead.

```js
const name = await storage.getItem('name');
console.log(name); // what ever value was stored.
```

### setItem

- Execution: **async**
- Emits: `<key>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#setitem

Store the item from async Storage. It accepts the following arguments:

- `name` (string), Name of the key that needs to be retrieved.
- `value` (Object), Value that needs to be stored.

```js
await storage.setItem('name', 'value');

const name = await storage.getItem('name');
console.log(name); // value
```

```js
await storage.setItem('name', { object: 'value' });

const name = await storage.getItem('name');
console.log(name); // { object: 'value' }
```

### removeItem

- Execution: **async**
- Emits: `<key>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#removeitem

Removes the item from async Storage. It accepts the following arguments:

- `name` (string), Name of the key that needs to be removed.

```js
await storage.removeItem('name');

const name = await storage.getItem('name');
console.log(name); // null
```

### mergeItem

- Execution: **async**
- Emits: `<key>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#mergeitem

It merges the given value with the previous stored value. It accepts the following arguments:

- `name` (string), Name of the key that needs to be removed.
- `value`, (string), Value that needs to be merged.

```js
await storage.setItem('name', '{"bar":"baz"}');
await storage.mergeItem('name', '{"foo":"bar"}');

const name = await storage.getItem('name'); // { bar: baz, foo: bar }
```

### clear

- Execution: **async**
- Emits: `<methodName>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#clear

Removes **all items** from async Storage.

```js
await storage.clear();
```

### flushGetRequests

- Execution: **async**
- Emits: `<methodName>` as event name.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#flushgetrequests

Flushes any pending requests using a single batch call to get the data.

```js
await storage.flushGetRequests();
```

### multiGet

- Execution: **async**
- Emits: `<key>` as event name for each key.
- Docs: https://facebook.github.io/react-native/docs/asyncstorage#flushgetrequests

## license

[MIT](LICENSE)
