var fs = require('fs')
  , monica = require('../dist/monica-amalgamation.js')
  , sim = monica.config.sim
  , site = monica.config.site
  , crop = monica.config.crop
  , data = monica.data
  , outPath = './.out'
  ;

// console.log(JSON.stringify(sim, null, 2));
// console.log(JSON.stringify(site, null, 2));
// console.log(JSON.stringify(crop, null, 2));

var cfg = new monica.Configuration(outPath);
cfg.run(sim, site, crop);

