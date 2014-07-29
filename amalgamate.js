var fs = require('fs')
  , filename = 'monica-amalgamation.js'
  , files = [
        'debug'
      , 'global'
      , 'tools'
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

/* we now use monica.sqlite with emscripten sqlite port */
/* append data (monica.sqlite) */
// eval(fs.readFileSync('./src/db.js', { encoding: 'utf8' }));
// var data = db('./src/');
// fs.appendFileSync('./dist/' + filename, 'var data = ' + JSON.stringify(data, null, 1) + ';\n');

/* append JSON example config files */
var example_config = {
    sim: JSON.parse(fs.readFileSync('./project.json/example.sim.json', { encoding: 'utf8' }))
  , site: JSON.parse(fs.readFileSync('./project.json/example.site.json', { encoding: 'utf8' }))
  , crop: JSON.parse(fs.readFileSync('./project.json/example.crop.json', { encoding: 'utf8' }))
};
fs.appendFileSync('./dist/' + filename, 'var example_config = ' + JSON.stringify(example_config, null, 1) + ';\n');

/* append MONICA JS files */
for (var f = 0; f < files.length; f++) {
  var file = fs.readFileSync('./src/' + files[f] + '.js', { encoding: 'utf8' });
  fs.appendFileSync('./dist/' + filename, file  + '\n\n');
}

/* append execution of wrapper function */
fs.appendFileSync('./dist/' + filename, '\n}());\n');


