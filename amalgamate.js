var fs = require('fs')
  , filename = 'monica-amalgamation.js'
  , files = [
        'debug'
      , 'global'
      , 'parameters'
      , 'workstep'
      , 'productionprocess'
      , 'climate'
      , 'crop'
      , 'cropgrowth'
      , 'environment'
      , 'model'
      , 'monica'
      , 'soillayer'
      , 'soilcolumn'
      , 'soilorganic'
      , 'soilfrost'
      , 'soilsnow'
      , 'soilmoisture'
      , 'soiltransport'
      , 'soiltemperature'
      , 'configuration'
      , 'export'
    ]
  ;

/* wrap everything in function */
fs.writeFileSync('./dist/' + filename, 'var monica = monica || {};\n(function () {\n\n');

/* append data (monica.sqlite) */
eval(fs.readFileSync('./src/db.js', { encoding: 'utf8' }));
var data = db('./src/');
fs.appendFileSync('./dist/' + filename, 'var data = ' + JSON.stringify(data, null, 1) + ';\n');

/* append JSON config files */
var config = {
    sim: JSON.parse(fs.readFileSync('./project.json/default.sim.json', { encoding: 'utf8' }))
  , site: JSON.parse(fs.readFileSync('./project.json/default.site.json', { encoding: 'utf8' }))
  , crop: JSON.parse(fs.readFileSync('./project.json/default.crop.json', { encoding: 'utf8' }))
};
fs.appendFileSync('./dist/' + filename, 'var config = ' + JSON.stringify(config, null, 1) + ';\n');

/* append MONICA JS files */
for (var f = 0; f < files.length; f++) {
  var file = fs.readFileSync('./src/' + files[f] + '.js', { encoding: 'utf8' });
  fs.appendFileSync('./dist/' + filename, file  + '\n\n');
}

/* append execution of wrapper function */
fs.appendFileSync('./dist/' + filename, '\n}());\n');


