const AsyncStorage = require('asyncstorageapi');
const poison = require('require-poisoning');

//
// Poison the require cache to inject a mocked version of this dependency.
//
poison('react-native', {
  exports: { AsyncStorage }
});
