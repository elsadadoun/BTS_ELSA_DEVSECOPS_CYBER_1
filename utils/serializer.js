const serialize = require('serialize-javascript');

function safeSerialize(obj) {
  return serialize(obj);
}

module.exports = { safeSerialize };
