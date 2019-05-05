/**
 * Automatically expire keys based on a given expiration.
 *
 * @param {Object} API The plugin API.
 * @public
 */
function emitter({ before, after, options, engine, enabled }) {
  const { operation, key } = { ...emitter.defaults, ...options };

  //
  // We want to support different styles of emitting, in some cases it might
  // be more useful to get notified about
  //
  if (operation) after(function emitOperation(args) {
    args.method && this.emit(args.method, args);
  });

  if (key) after(function emitKey(args) {
    args.key && this.emit(args.key, args);
  });
}

/**
 * Default configuration values.
 *
 * @type {Object}
 * @public
 */
emitter.defaults = {
  operation: false,         // Emit the operation as event.
  key: true                 // Emit the key as event.
};

export {
  emitter as default,
  emitter
}
