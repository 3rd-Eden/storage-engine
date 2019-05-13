import AsyncStorage from './compatibility';
import EventEmitter from 'eventemitter3';
import enabled from 'enabled';

/**
 * All available API methods on which our modifier could be called.
 *
 * @type {Array}
 * @public
 */
const APIMethods = Object.keys(AsyncStorage).filter((key) => {
  return typeof AsyncStorage[key] === 'function';
});

/**
 * Registers a new key modifier for a given Map().
 *
 * @param {Map} map The map in which the modifier needs to be stored.
 * @param {String} pattern Pattern that matches the keys where the modifier should trigger.
 * @param {Function|Object} modifiers Object with callbacks or all single callback.
 * @param {StorageEngine} self Context to bind the modifiers on.
 * @private
 */
function register(map, { pattern, modifiers, context, options }) {
  if (typeof modifiers === 'function') {
    modifiers = APIMethods.reduce((memo, key) => {
      memo[key] = modifiers;
      return memo;
    }, {});
  }

  const { order = 100 } = options;

  Object.keys(modifiers).forEach((method) => {
    const previous = map.get(method) || [];
    const modifier = modifiers[method];

    map.set(method, previous.concat({
      pattern,
      order,

      /**
       * Wrap our given modifier function so we can transform it in our
       * desired function signature where the modifiers receive the data
       * as first argument, and optional options as second argument.
       *
       * @param {Object} args The data for the modifier.
       * @returns {Mixed} Result.
       * @private
       */
      modifier: async function wrapper(args) {
        return await modifier.call(context, args, options);
      }
    }).sort((a, b) => b.order - a.order));
  });

  return context;
}

/**
 * Run the modifiers over the given dataset.
 *
 * @param {Map} map Dataset that contains the modifiers.
 * @param {Object} data The data that is passed around between modifers.
 * @returns {Object} Data.
 */
async function run(map, data) {
  const modifiers = map.get(data.method) || [];

  let result = data;

  for (let i = 0; i < modifiers.length; i++) {
    const { pattern, modifier } = modifiers[i];
    if (!enabled(result.key, pattern)) continue;

    const changed = await modifier(result);

    if (changed) result = {
      ...result,
      ...changed
    };
  }

  return result;
}

/**
 * AsyncStorage has their weird concept of multi(x) methods which follow
 * really weird API, so we need to attempt to normalize them so it fits
 * the more natural plugin API that we've created. It will add a bit more
 * overhead, but at least you won't lose your sanity.
 *
 * @param {Map} map Dataset that contains the modifiers.
 * @param {Object} data The data that is passed around between modifers.
 * @public
 */
async function multi(map, { method, key, value}) {
  const dataset = Array.isArray(value) ? value : key;
  const result = [];

  for (let i = 0; i < dataset.length; i++) {
    const data = dataset[i];
    const pair = typeof data === 'object';

    if (!pair) {
      result.push(await run(map, { method, key: data, value: undefined }));
      continue;
    }

    result.push(
      await run(map, { method, key: data.key || data[0], value: data.value || data[1] })
    );
  }

  return {
    method,
    value: result
  };
}

/**
 * Our enhanced StorageEngine.
 *
 * @param {Map} map Dataset that contains the modifiers.
 * @param {Object} data The data that is passed around between modifers.
 * @returns {Object} Data.
 */
class StorageEngine extends EventEmitter {
  constructor() {
    super();

    this.plugins = new Map(); // Storage for plugins.
    this.post = new Map();    // Storage for before hooks.
    this.pre = new Map();     // Storage for after hooks.
    this.kill = [];           // Methods that need to be called upon destroy.

    //
    // We want to re-define our public API methods so we can automate
    // some of the pre/post processing to reduce duplicate code.
    //
    APIMethods.forEach((method) => {
      this.redefine(method);
    });
  }

  /**
   * Gives access to the AsyncStorage API method without them being affected
   * by any modification that this library, or plugin does.
   *
   * @param {String} method AsyncStorage method to call.
   * @param {...args} args Rest arguments that are supplied to the engine.
   * @returns {Mixed} Everything.
   * @public
   */
  async api(method, ...args) {
    return await AsyncStorage[method](...args);
  }

  /**
   * Redefine the API methods so we can enhance them with our pre and post
   * processing.
   *
   * @param {String} method The method that needs to be redefined.
   * @public
   */
  redefine(method) {
    const fn = this[method];

    this[method] = async function proxy(key, value) {
      const multiple = Array.isArray(key);

      const data = { key, value, method };

      const pre = await (multiple ? multi : run)(this.pre, data) || {};

      const api = { ...pre, ...(await fn.call(this, pre) || {}) };

      const post = await (multiple ? multi : run)(this.post, api) || {};

      return post.value;
    }.bind(this);

    //
    // Reset the displayName so we have the correct function name show up
    // in stacktraces instead of `proxy`.
    //
    this[method].displayName = method;
  }

  /**
   * Registers a modifier for a given pattern before the API method is
   * called. This allows you to modify the key, or even intercept the
   * request completely and hand it off to something else.
   *
   * @param {String} pattern Pattern that they key should match.
   * @param {Object|Function} modifiers methodname->fn map, or one function for all.
   * @returns {StorageEngine} Self, for chaining purposes.
   * @public
   */
  before(pattern, modifiers, options = {}) {
    return register(this.pre, {
      context: this,
      modifiers,
      options,
      pattern
    });
  }

  /**
   * Registers a modifier for a given pattern after the API method is
   * called. This allows you to modify the value, or even intercept the
   * request completely and hand it off to something else.
   *
   * @param {String} pattern Pattern that they key should match.
   * @param {Object|Function} modifiers methodname->fn map, or one function for all.
   * @returns {StorageEngine} Self, for chaining purposes.
   * @public
   */
  after(pattern, modifiers, options = {}) {
    return register(this.post, {
      context: this,
      modifiers,
      options,
      pattern
    });
  }

  /**
   * Register a new plugin.
   *
   * @param {String} pattern The key pattern the plugin should trigger on.
   * @param {Function} plugin The plugin function.
   * @param {Object} options Plugin options.
   * @public
   */
  use(pattern, plugin, options = {}) {
    const before = this.before.bind(this, pattern);
    const after = this.after.bind(this, pattern);
    const engine = this;

    plugin({
      /**
       * Registers a clean up function from the plugin that needs to be
       * called when the storage engine is destroyed.
       *
       * @param {Function} fn Function to execute upon clean-up.
       * @public
       */
      destroy: function destroy(fn) {
        engine.kill.push(fn);
      },

      /**
       * Check if a given key is enabled by the pattern.
       *
       * @param {String} key Key to check if enabled.
       * @returns {Boolean} Indication of the key is enabled.
       * @public
       */
      enabled: function isEnabled(key) {
        return enabled(key, pattern);
      },

      before,       // Pre-bound before hook.
      after,        // Pre-bound after hook.
      pattern,      // The pattern/keys to trigger on.
      options,      // Options for the plugin.
      engine        // Reference to our storage instance.
    });

    return this;
  }

  /**
   * Destroy the created storage instance.
   *
   * @returns {Mixed} What ever the kill() functions return.
   * @public
   */
  async destroy() {
    const kill = this.kill.slice(0);

    this.kill.lenght = 0;
    this.plugins.clear();
    this.post.clear();
    this.pre.clear();

    return await Promise.all(
      kill.map(fn => fn())
    );
  }

  /**
   * Get an item from AsyncStorage.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to retrieve.
   * @returns {Mixed} Data or no data, that's the question.
   * @public
   */
  async getItem({ key, value, method }) {
    if (typeof value === 'undefined') {
      value = await this.api(method, key);
    }

    return { key, value };
  }

  /**
   * Store data for a given key in AsyncStorage.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to store.
   * @param {Mixed} value The value that needs to be assigned to the key.
   * @returns {Mixed} Data or no data, that's the question.
   * @public
   */
  async setItem({ key, value, method }) {
    if (typeof value !== 'undefined') {
      await this.api(method, key, value.toString());
    } else {
      throw new Error(`Unable to store undefined value for key(${key})`);
    }

    return { key, value };
  }

  /**
   * Removes the key from the AsyncStorage.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to remove.
   * @returns {Mixed} Data or no data, that's the question.
   * @public
   */
  async removeItem({ key, value, method }) {
    await this.api(method, key);
    return { key, value };
  }

  /**
   * Merge a given item.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to store.
   * @param {Mixed} value The value that needs to be assigned to the key.
   * @public
   */
  async mergeItem({ key, value, method }) {
    if (typeof value !== 'undefined') {
      await this.api(method, key, value);
    }

    return { key, value };
  }

  /**
   * Clear, all the things.
   *
   * @note This is enhanced using the redefine method.
   * @public
   */
  async clear({ method }) {
    await this.api(method);
  }

  /**
   * Merge a given item.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to store.
   * @param {Mixed} value The value that needs to be assigned to the key.
   * @public
   */
  async multiGet({ value, method }) {
    if (!value !== 'undefined') {
      value = await this.api(method, value.map(pair => pair.key));
    }

    return { value };
  }

  /**
   * Set multiple items at once.
   *
   * @note This is enhanced using the redefine method.
   * @param {Array} key/value Array of key/value pairs that need to be stored.
   * @public
   */
  async multiSet({ value, method }) {
    await this.api(method, value.map(pair => [ pair.key, pair.value ]));
  }

  /**
   * Merge multiple items at once.
   *
   * @note This is enhanced using the redefine method.
   * @param {Array} key/value The key of the item we want to store.
   * @public
   */
  async multiMerge({ value, method }) {
    await this.api(method, value.map(pair => [ pair.key, pair.value ]));
  }

  /**
   * Remove multiple items.
   *
   * @note This is enhanced using the redefine method.
   * @param {Array} key The key of the item we want to remove.
   * @public
   */
  async multiRemove({ value, method }) {
    await this.api(method, value.map(pair => pair.key));
  }

  /**
   * Merge a given item.
   *
   * @note This is enhanced using the redefine method.
   * @param {String} key The key of the item we want to store.
   * @param {Mixed} value The value that needs to be assigned to the key.
   * @public
   */
  async getAllKeys({ method }) {
    const keys = await this.api(method);

    return { value: keys };
  }

  /**
   * Flush the batche requests API method.
   *
   * @public
   */
  async flushGetRequests({ method }) {
    await this.api(method);
  }
}

//
// We want to expose pre-initialized storage instance as default so our
// main API functions exactly as the AsyncStorage API, ready to go.
//
const storage = new StorageEngine();
export {
  storage as default,
  StorageEngine,
  register,
  multi,
  run
}
