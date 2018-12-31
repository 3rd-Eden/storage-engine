const key = require.resolve('react-native');
const AsyncStorage = require('asyncstorageapi');

//
// Poison the require cache to inject a mocked version of this dependency.
//
require.cache[key] = {
  id: key,
  filename: key,
  loaded: true,
  exports: { AsyncStorage }
};
