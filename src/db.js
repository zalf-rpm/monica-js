/* load data form JSON storage (converted monica.sqlite partly to JSON) */

var db = function (path) {

  var path = path || './';

  var fs = require('fs')
    , data = {
          met: null
        , capillary_rise_rate: null
        , residue_table: null
        , crop2ods_dependent_param: null
        , crop: null
        , mineral_fertilisers: null
        , soil_aggregation_values: null
        , cutting_parts: null
        , soil_characteristic_data: null
        , dev_stage: null
        , organic_fertilisers: null
        , user_parameter: null
        , organ: null
        , yield_parts: null
      }
    ;

  var load = function (what) {
    data[what] = JSON.parse(fs.readFileSync(path + 'db/' + what + '.json', { encoding: 'utf8' }));
  };

  for (var prop in data) {
    if (data.hasOwnProperty(prop))
        load(prop);
  }

  return data;

};