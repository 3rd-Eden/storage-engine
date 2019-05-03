/**
 * Decode the stored value.
 *
 * @param {Object} args The args.
 * @returns {Object} args.
 * @public
 */
function decode(args) {
  if (!args.json) {
    args.value = JSON.parse(args.value);
    args.json = true;
  }

  return args;
}

/**
 * Decode the stored value.
 *
 * @param {Object} args The args.
 * @returns {Object} args.
 * @public
 */
function encode(args) {
  if (!args.json) {
    args.value = JSON.stringify(args.value);
    args.json = true;
  }

  return args;
}

/**
 * The JSON encode/decode plugin.
 *
 * @param {Object} API The plugin API.
 * @public
 */
function json({ before, after }) {
  before({
    setItem: encode
  });

  after({
    getItem: decode
  });
}

export {
  json as default,
  encode,
  decode,
  json
}
