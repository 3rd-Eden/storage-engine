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

    if (props.iv) data.iv = props.iv.toString();
    if (props.salt) data.s = props.salt.toString();

    return JSON.stringify(data);
  },

  /**
   * Parse the JSON blob that we've stored.
   *
   * @param {String} str The JSON encoded cypher text.
   * @returns {String} Decoded string.
   * @public
   */
  parse: function parse(str) {
    const data = JSON.parse(str);
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
      const encrypted = crypto[encryption].encrypt(value, secret, { format });

      return {
        value: encrypted.toString()
      };
    }
  });

  after({
    getItem: function decrypt({ value }) {
      const decrypted = crypto[encryption].decrypt(value, secret, { format });
      const og = decrypted.toString(crypto.enc.Utf8);

      return {
        value: og
      };
    }
  });
}

export {
  encrypter as default,
  encrypter
}
