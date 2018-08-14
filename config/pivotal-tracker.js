'use strict';

const process = require('process');

module.exports = {
  apiToken: process.env.PIVOTAL_TRACKER_API_TOKEN,
  apiEndpoint: process.env.PIVOTAL_TRACKER_API_ENDPOINT || 'https://www.pivotaltracker.com/services/v5'
};
