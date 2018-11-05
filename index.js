import { AsyncStorage } from 'react-native';
import EventEmitter from 'eventemitter3';

/**
 * Wrap the AsyncStorage API in an EventEmitter so all methods and API's can
 * get called.
 *
 * @class
 * @public
 */
class StorageEngine extends EventEmitter {
  constructor() {
    super();

    Object.keys(AsyncStorage)
    //
    // Ignore everything that is not a function.
    //
    .filter((key) => typeof AsyncStorage[key] === 'function')

    //
    // Re-Introduce each method as a proxy method that will call an event.
    //
    .forEach((operation) => {
      this[operation] = async function proxy(name, ...args) {
        const result = await AsyncStorage[operation](name, ...args);

        //
        // multi{Get|Set|Remove} based commands require additional processing
        // as they follow a really weird array based pattern.
        //
        switch (operation) {
          case 'clear':
          case 'getAllKeys':
          case 'flushGetRequests':
            this.emit(operation, ...args, result);
          break;

          case 'multiGet':
            name.forEach((key, index) => {
              this.emit(key, 'getItem', ((result || [])[index] || [])[1]);
            });
          break;

          case 'multiSet':
            name.forEach((key, index) => {
              this.emit(key[0], 'setItem', key[1], (result || [])[index]);
            });
          break;

          case 'multiRemove':
            name.forEach((key, index) => {
              this.emit(key, 'removeItem', (result || [])[index]);
            });
          break;

          case 'multiMerge':
            name.forEach((key, index) => {
              this.emit(key[0], 'mergeItem', key[1], (result || [])[index]);
            });
          break;

          //
          // Catch all for "normal" operations such as `getItem`, `setItem`.
          //
          default:
            this.emit(name, operation, ...args, result);
          break;
        }

        return result;
      };

      //
      // Ensure that we get meaningful names in our stack trace by setting it
      // to the correct name instead of `wrapper`.
      //
      this[operation].displayName = operation;
    });
  }
}

const storage = new StorageEngine();

export {
  storage as default,
  StorageEngine
}
