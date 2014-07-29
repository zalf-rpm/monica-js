var fs = require('fs')
  , monica = require('../dist/monica-amalgamation.js')
  /* example JSON config files */
  , sim = monica.config.sim
  , site = monica.config.site
  , crop = monica.config.crop
  , db = monica.db
  , outPath = './.out'
  ;

/* test database */
// console.log(monica.db.exec(
//  "SELECT crop_id, permanent_crop_id \
//   FROM view_crop"
// ));

console.log(JSON.stringify(sim, null, 2));
console.log(JSON.stringify(site, null, 2));
console.log(JSON.stringify(crop, null, 2));

/* read weather csv file */
var weather_csv = fs.readFileSync('./weather.csv', { encoding: 'utf-8' });
var weather_rows = weather_csv.split('\n');
var weather_header = weather_rows[0].split(';');
var weather_unit = weather_rows[1].split(';');

var weather = {
  tmin: [],
  tmax: [],
  tavg: [],
  globrad: [],
  wind: [],
  sunhours: [],
  relhumid: [],
  precip: []
};

for (var r = 2 /* skip first two rows*/, rs = weather_rows.length; r < rs; r++) {

  var row = weather_rows[r].split(';');
  if (row.length != weather_header.length)
    continue;

  var tavg = row[weather_header.indexOf('tavg')];
  if (Number(tavg) != -999 && !isNaN(tavg))
    weather.tavg.push(Number(tavg));
  else
    weather.tavg.push(-999);

  var tmax = row[weather_header.indexOf('tmax')];
  if (Number(tmax) != -999 && !isNaN(tmax))
    weather.tmax.push(Number(tmax));
  else
    weather.tmax.push(-999);

  var tmin = row[weather_header.indexOf('tmin')];
  if (Number(tmin) != -999 && !isNaN(tmin))
    weather.tmin.push(Number(tmin));
  else
    weather.tmin.push(-999);

  var globrad = row[weather_header.indexOf('globrad')];
  if (Number(globrad) != -999 && !isNaN(globrad))
    weather.globrad.push(Number(globrad));
  else
    weather.globrad.push(-999);

  var wind = row[weather_header.indexOf('wind')];
  if (Number(wind) != -999 && !isNaN(wind))
    weather.wind.push(Number(wind));
  else
    weather.wind.push(-999);

  /* currently not implemented */
  // var sunhours = row[weather_header.indexOf('sunhours')];
  // if (Number(sunhours) != -999 && !isNaN(sunhours))
  //   weather.sunhours.push(Number(sunhours));
  // else
  //   weather.sunhours.push(-999);

  var relhumid = row[weather_header.indexOf('relhumid')];
  if (Number(relhumid) != -999 && !isNaN(relhumid))
    weather.relhumid.push(Number(relhumid));
  else
    weather.relhumid.push(-999);

  var precip = row[weather_header.indexOf('precip')];
  if (Number(precip) != -999 && !isNaN(precip))
    weather.precip.push(Number(precip));
  else
    weather.precip.push(-999);

}

/* skip all if first value is not valid */
if (weather.sunhours[0] === -999)
  weather.sunhours = [];

// console.log(weather.precip);
var debug = false;
var cfg = new monica.Configuration(outPath, weather, debug);
cfg.run(sim, site, crop);

