var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';

if (ENVIRONMENT_IS_NODE) {

  var fs = require('fs');
  var sql = require('./sql.js');
  var filebuffer = fs.readFileSync('./monica.sqlite');
  var db = new sql.Database(filebuffer);
  exports.Configuration = Configuration;
  exports.config = example_config;
  exports.db = db;

} else if (ENVIRONMENT_IS_WORKER) {

  importScripts('./sql.js');
  var req = new XMLHttpRequest();
  req.open('GET', './monica.sqlite', true);
  req.responseType = "arraybuffer";
  req.onload = function (oEvent) {
    var arrayBuffer = req.response;
    if (arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      var db = new SQL.Database(byteArray);  
      monica.db = db;
    }
  };
  req.send(null);

  monica.Configuration = Configuration;
  monica.config = example_config;
  var fs = null;

  onmessage = function (evt) {
    if (evt.data.hasOwnProperty('sql')) {
      postMessage(monica.db.exec(evt.data.sql));
    } else if (evt.data.hasOwnProperty('config')) {
      var config = evt.data.config;
      var cfg = new Configuration(config.weather);
      postMessage(cfg.run(config.sim. config.site, config.crop));
    } else {
      postMessage(null);
    }
  };

} else {

  /* we expect that window.SQL is available */
  var req = new XMLHttpRequest();
  req.open('GET', './monica.sqlite', true);
  req.responseType = "arraybuffer";
  req.onload = function (oEvent) {
    var arrayBuffer = req.response;
    if (arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      var db = new SQL.Database(byteArray);  
      monica.db = db;
    }
  };
  req.send(null);

  monica.Configuration = Configuration;
  monica.config = example_config;
  var fs = null;

}
