const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { safeSerialize } = require('../utils/serializer');

const safeTemplate = _.template('<p>Hello <%- name %></p>');

router.post('/render', (req, res) => {
  const name = req.body.name || 'alice';
  const html = safeTemplate({ name }); // name échappé
  res.send(html);
});

router.post('/serialize', (req, res) => {
  const payload = req.body;
  const s = safeSerialize(payload);
  res.send({ serialized: s });
});

module.exports = router;

// test
