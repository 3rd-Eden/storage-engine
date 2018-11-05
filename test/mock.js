const EventEmitter = require('eventemitter3');
const key = require.resolve('react-native');

//
// Create a polyfill for AsyncStorage.
//
const AsyncStorage = new EventEmitter();
AsyncStorage.map = new Map();

AsyncStorage.getItem = async (name) => {
  if (!AsyncStorage.map.has(name)) return null;

  return AsyncStorage.map.get(name);
};

AsyncStorage.setItem = async (name, value) => {
  return AsyncStorage.map.set(name, value);
};

AsyncStorage.removeItem = async (name) => {
  return AsyncStorage.map.delete(name);
};

AsyncStorage.clear = async () => {
  return AsyncStorage.map.clear();
};

//
// Poison the require cache to inject a mocked version of this dependency.
//
require.cache[key] = {
  id: key,
  filename: key,
  loaded: true,
  exports: { AsyncStorage }
};
