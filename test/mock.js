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
  if (typeof value !== 'string') throw new Error('AsyncStorage requires strings to be stored');
  return AsyncStorage.map.set(name, value);
};

AsyncStorage.multiSet = async (nameValues) => {
  nameValues.forEach(element => {
    if (typeof element[1] !== 'string') throw new Error('AsyncStorage requires strings to be stored');
    AsyncStorage.map.set(element[0], element[1]);
  });
  return nameValues;
};

AsyncStorage.multiGet = async (names) => {
  var result = [];
  names.forEach(name => {
    const value = AsyncStorage.map.get(name);
    result.push([name, value]);
  });
  return result;
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
