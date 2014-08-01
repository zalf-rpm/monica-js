var fs = require('fs')
  , uglify = require("uglify-js")
  , files = [
        'global'
      , 'debug'
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
fs.writeFileSync('./dist/monica-amalgamation.js', 'var monica = monica || {};\n(function () {\n\n');
fs.writeFileSync('./dist/monica-amalgamation.min.js', 'var monica = monica || {};\n(function () {\n\n');

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
fs.appendFileSync('./dist/monica-amalgamation.js', 'var example_config = ' + JSON.stringify(example_config, null, 1) + ';\n');
fs.appendFileSync('./dist/monica-amalgamation.min.js', 'var example_config = ' + JSON.stringify(example_config, null, 1) + ';\n');

/* append MONICA JS files */
for (var f = 0; f < files.length; f++) {

  if (files[f] === 'export') /* do not compress export.js */
    fs.appendFileSync('./dist/monica-amalgamation.min.js', fs.readFileSync('./src/' + files[f] + '.js', { encoding: 'utf8' }));
  else
    fs.appendFileSync('./dist/monica-amalgamation.min.js', uglify.minify('./src/' + files[f] + '.js').code + '\n\n');

  fs.appendFileSync('./dist/monica-amalgamation.js', fs.readFileSync('./src/' + files[f] + '.js', { encoding: 'utf8' }) + '\n\n');
}

/* append execution of wrapper function */
fs.appendFileSync('./dist/monica-amalgamation.js', '\n}());\n');
fs.appendFileSync('./dist/monica-amalgamation.min.js', '\n}());\n');


