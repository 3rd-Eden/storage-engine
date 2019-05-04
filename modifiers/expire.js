import { encode, decode } from './json';
import Timers from 'tick-tock';

/**
 * Automatically expire keys based on a given expiration.
 *
 * @param {Object} API The plugin API.
 * @public
 */
async function expire({ before, after, options, engine, enabled, destroy }) {
  const { duration } = options;
  const timers = new Timers();

  if (!duration) throw new Error('The expire plugin requires the `duration` option to be set');

  /**
   * Schedule a removal of a key.
   *
   * @param {String} key The key that needs to have removal scheduled.
   * @param {Number} time Time till removal.
   * @public
   */
  function schedule(key, time) {
    timers.clear(key).setTimeout(key, () => {
      try { engine.removeItem(key); }
      catch (e) {}
    }, time);
  }

  /**
   * When a new item is stored, we want to store additional data like the
   * the TTL of the data. This allows us intercept the value later and
   * assert if the value is expired or not.
   *
   * @param {Object} data Key, Value, Method used.
   * @returns {Object} pre-processed value.
   * @public
   */
  function set({ key, value }) {
    schedule(key, duration);

    return {
      ttl: Date.now() + duration,
      value
    };
  }

  /**
   * Assert that the fetched key is not yet expired. If it's expired we
   * need to transform the value to `null` as indication of expiree.
   *
   * If the value is not expired we need to clean up the datastructure so
   * it no longer includes our additional data.
   *
   * @param {Object} data Key, Value, Method used.
   * @returns {Object} post processed value.
   * @public
   */
  function get({ value }) {
    if (value.ttl >= Date.now()) return { value: null };
    return { value: value.value };
  }

  before({
    setItem: set,
    mergeItem: set,
    multiSet: set,
    multiMerge: set
  });

  after({
    getItem: get,
    multiGet: get
  });

  //
  // Register a destroy function to ensure that our timers are cleaned up.
  //
  destroy(function destroyExpire() {
    timers.destroy();
  });

  //
  // It's out first time loading, again, so we need to double check if there
  // are any keys that need to be expired so we can clean up our async storage.
  //
  let keys = [];

  try { keys = await engine.getAllKeys(); }
  catch (e) { /* We don't care about failure */ }

  keys.filter((key) => {
    return enabled(key);
  }).forEach(async (key) => {
    let value;

    try { value = await engine.api('getItem', key); }
    catch (e) { return; /* Bail out on failure */ };

    const timeLeft = value.ttl - Date.now();

    //
    // Now that we've read out the existing file without any modifications
    // we need to check if we should remove the old items from the AsyncStorage
    // so we can clean up the datastore.
    //
    // When do have some time left, we need to schedule a new removal request.
    //
    if (timeLeft > 0) schedule(key, timeLeft);
    else {
      try { await engine.api('removeItem', key); }
      catch (e) {}
    }
  });
}

export {
  expire as default,
  expire
}
