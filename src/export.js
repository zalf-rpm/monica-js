var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';

if (ENVIRONMENT_IS_NODE) {
  exports.Configuration = Configuration;
  exports.config = config;
  exports.data = data;
  var fs = require('fs');
} else {
  monica.Configuration = Configuration;
  monica.config = config;
  monica.data = data;
  var fs = null;
}