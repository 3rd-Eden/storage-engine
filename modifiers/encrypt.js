import crypto from 'crypto-js';

/**
 * Custom encoder for cypto-js to ensure that the salt and iv are stored
 * with the resulting cyphertext.
 *
 * @type {Object}
 * @public
 */
const format = {
  /**
   * Transforms the cyphertext and all it's required information in a JSON
   * blob so we can decode it later.
   *
   * @returns {String} JSON encoded.
   * @public
   */
  stringify: function stringify(props) {
    const data = {
      ct: props.ciphertext.toString(crypto.enc.Base64)
    };

    //
    // It could be that iv is an empty string, in that case we just
    // want to completely remove from the object, so set it to undefined.
    //
    if (props.iv) data.iv = props.iv.toString() || undefined;
    if (props.salt) data.s = props.salt.toString();

    //
    // The reason that we prefix the payload is prevent a built-in JSON
    // decoder from decrypting the payload. So for example if you run
    // the `json` modifier before the `encrypt`, it would already decode
    // the payload to a object, while we would have needed it as an string
    // in order to properly decode it.
    //
    return '@'+JSON.stringify(data);
  },

  /**
   * Parse the JSON blob that we've stored.
   *
   * @param {String} str The JSON encoded cypher text.
   * @returns {String} Decoded string.
   * @public
   */
  parse: function parse(str) {
    const data = JSON.parse(str.slice(1));
    const params = crypto.lib.CipherParams.create({
      ciphertext: crypto.enc.Base64.parse(data.ct)
    });

    if (data.iv) params.iv = crypto.enc.Hex.parse(data.iv);
    if (data.s) params.salt = crypto.enc.Hex.parse(data.s);

    return params;
  }
};

/**
 * Encrypts all the in/output of AsyncStorage using the configured `secret`
 * and `encryption`.
 *
 * @param {Object} API The plugin API methods.
 * @public
 */
function encrypter({ before, after, options }) {
  const { secret, encryption } = options;

  if (!secret) {
    throw new Error('The encryption plugin requires the `secret` option to be set');
  }

  if (!encryption) {
    throw new Error('The encrypter plugin requires the `encryption` option to be set');
  }

  if (!crypto[encryption]) {
    throw new Error(`The encryption plugin was configured with an unknown encryption: ${encryption}`);
  }

  before({
    setItem: function encrypt({ value }) {
      if (!value) return;

      const encrypted = crypto[encryption].encrypt(value, secret, { format });
      const data = encrypted.toString();

      return {
        value: data
      };
    }
  }, {
    //
    // We need to be the last that touches the data to ensure that every
    // other plugin has time to modify the payload if needed. Reducing our
    // order to the lowest possible mains that other plugins will have priority
    // over our modification.
    //
    order: 0
  });

  after({
    getItem: function decrypt({ value }) {
      if (!value) return;

      const decrypted = crypto[encryption].decrypt(value, secret, { format });
      const data = decrypted.toString(crypto.enc.Utf8);

      return {
        value: data
      };
    }
  }, {
    //
    // We want to be the absolute first when it comes data retrieval, the
    // data is still encrypted to useless to any other plugin at this point.
    //
    // So we need to decrypt it, make it useful, so others can modify if needed.
    // With 100 being the default, a value of 111 should place us above all
    // other defaults.
    //
    order: 111
  });
}

export {
  encrypter as default,
  encrypter
}
