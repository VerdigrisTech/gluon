'use strict';

const process = require('process');

module.exports = {
  listenAddr: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8888
};
