/*
  TODO: 
    - add units to results
    - missing weather data
    - fix return value isValidMonicaInput
*/

$(function () {

var meta = {}
  , tree = {}
  , project = {}
  , results = { data: {}, units: {} }
  , weather = { 
      fileName: ''
    , data: {
          tmin: []
        , tmax: []
        , tavg: []
        , globrad: []
        , wind: []
        , sunhours: []
        , relhumid: []
      }
    , header: []
    , unit: [] 
  }
  , resultFileURL = null
  , db = null
  , spinner = new Spinner();
  ;

spinner.spin($('#main-container')[0]); 

/* load meta files and make tree */
function init() {

  $.ajax({
    url: 'meta.json/meta.site.json',
    dataType: 'json'
  }).done(function (site) {

    $.ajax({
      url: 'meta.json/meta.crop.json',
      dataType: 'json'
    }).done(function (crop) {

      $.ajax({
        url: 'meta.json/meta.sim.json',
        dataType: 'json'
      }).done(function (sim) {

        meta = { site: site, crop: crop, sim: sim };
        project = newProject();
        makeTree(project);
        spinner.stop();
        
      }).fail(function () {
        console.log('loading meta.json failed');
      });
      
    }).fail(function () {
      console.log('loading meta.json failed');
    });
    
  }).fail(function () {
    console.log('loading meta.json failed');
  });

}

/* load monica.sqlite */
var req = new XMLHttpRequest();
req.open('GET', 'dist/monica.sqlite', true);
req.responseType = "arraybuffer";
req.onload = function (evt) {
  var arrayBuffer = req.response;
  if (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    db = new SQL.Database(byteArray);

    /* tests */
    // var cropId = 1;
    // var qry =  "SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    //   FROM yield_parts \
    //   WHERE crop_id = " + cropId;
    //   console.log(qry);
    // console.log(db.exec("SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    //   FROM yield_parts \
    //   WHERE crop_id = " + cropId));
    // // var res2 = db.exec("SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    // //   FROM yield_partss \
    // //   WHERE crop_id = " + cropId);
    // // console.log(res2);
    // var res3 = db.exec("SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    //   FROM yield_parts \
    //   WHERE crop_id = 999");
    // console.log(res3.length);

    /* call init if db has been loaded */
    init();
  }
};
req.send(null);

var MONICA = new Worker('dist/monica-amalgamation.min.js');
MONICA.onmessage = function (evt) {

  if (evt.data.hasOwnProperty('progress')) {

    if (evt.data.progress != null) {
    /* store progress at each MONICA timestep */ 
    var result = evt.data.progress;
    for (var prop in result) {
      if (result.hasOwnProperty(prop)) {
        /* store units, only once */
        if (results.units[prop] === undefined)
          results.units[prop] = result[prop].unit;
        if (!results.data[prop]) /* init array */
          results.data[prop] = [result[prop].value];
        else
          results.data[prop].push(result[prop].value)
      }
    }

    /* display results if simulation is done */
    } else {

      var html = ''
        , csv = ''
        , data = results.data
        , units = results.units
        , units_csv = ''
        ;

      /* create result csv file URL */

      /* blob needs to be released */
      window.URL.revokeObjectURL(resultFileURL);

      /* write header */
      for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
          csv += prop + ';';
          units_csv += units[prop].replace(/;/, '|') + ';';
        }
      }
      
      csv += '\n' + units_csv + '\n';

      /* write data */
      for (var d = 0, ds = data.date.length; d < ds; d++) {
        for (var prop in data) {
          if (data.hasOwnProperty(prop)) {
            csv += data[prop][d] + ';';
          }
        }
        csv += '\n';
      }

      /* set file name as date and replace whitespace */
      var dateTimeStr = new Date().toDateString().replace(/\s/g, '-') + '-' + new Date().toTimeString().replace(/\s/g, '-');
      resultFileURL = window.URL.createObjectURL(new Blob([csv], { type : 'text/csv' }));
      /* may not work in safari */
      $('#result-save-a').attr({
        href: resultFileURL,
        download: 'MONICA-' + dateTimeStr + '.csv'
      });


      /* set result dialog html */
      $('#result-select').html('');
      html += '<select multiple class="form-control" name="result-params" size=20">';
      for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
          html += '<option value="'+prop+'">'+prop+'</option>';
        }
      }
      html + '</select>';

      $('#result-select').append(html);
      $('select[name="result-params"]').change(function () {

        var params = $(this).val()
          , data = results.data
          ;

        var flotData = [];
        for (var p = 0, ps = params.length; p < ps; p++) {
          var values = data[params[p]];
          flotData[p] = { label: params[p] + ' ' + results.units[params[p]], data: [] };
          for (var d = 0, ds = values.length; d < ds; d++)
            flotData[p].data.push([d, values[d]]);
        }

        $.plot("#flot-result", flotData);


      });

      /* select a few params */ 
      $('select[name="result-params"]')
        .val(['OrganBiomassRoot', 'OrganBiomassLeaf', 'OrganBiomassShoot', 'OrganBiomassFruit'])
        .trigger('change');

    }     

  } else {

    var msg = evt.data;
    if (msg.hasOwnProperty('info'))
      $('#result-msg').prepend('<span class="monica-info">' + msg.info + '</span><br>');
    else if (msg.hasOwnProperty('warn'))
      $('#result-msg').prepend('<span class="monica-warn">' + msg.warn + '</span><br>');
    else if (msg.hasOwnProperty('error'))
      $('#result-msg').prepend('<span class="monica-error">' + msg.error + '</span><br>');
    else if (msg.hasOwnProperty('debug'))
      $('#result-msg').prepend('<span class="monica-debug">' + msg.debug + '</span><br>');
    else
      console.log(msg);
  
  }

};

/* return obj if ok otherwise null */
function readMonicaInputFile(json, name) {

  // console.log(name);
  var obj = JSON.parse(json);
  if (obj === undefined || obj === null) {
    /* TODO: give feedback e.g. bootstrap alert */
    console.log('JSON parse error in ' + name);
    return null;
  }

  return obj;

}

/* validate input with meta */
function isValidMonicaInput(obj, name) {

  function validate(obj, meta, path, objParent, prop_) {

    var ok = true;
    // console.log(obj);
    // console.log(meta);
    // console.log(path);

    if (objIsParameter(meta)) {
      
      /* check for special db case */
      if (meta.hasOwnProperty('db')) {
        
        if (meta.db.columns.length > 1) {
        /* if true obj should be an object */
          if (typeof obj === 'object' && obj != null) {
            /* obj properties should at least contain keys but we just warn */
            if (meta.db.hasOwnProperty('keys')) {
              meta.db.columns.forEach(function (col) {
                if (obj[col] === undefined || obj[col] === null) {
                  // ok = false;
                  console.log('expected value for ' + path + '.' + col);                
                  console.log('adding ' + col + ' with default value');
                  obj[col] = null;                
                }
              });
            }

          } else {
            // ok = false;
            console.log('expected ' + path + ' to be an object');
            console.log('adding ' + meta.db.columns.join(', ') + ' with default value');
            objParent[prop_] = {}; /* nee a parent and prop_ here in case a value is primitive there is not ref. to parent */
            meta.db.columns.forEach(function (col) {
              objParent[prop_][col] = null;
            });
          }

        } else {
          /* if there is only one column in db.columns the value of obj has a primitive type */
          if (typeof obj === 'object' && obj != null) {
            // ok = false;
            console.log('expected ' + path + ' not to be an object');
            console.log('reseting ' + path + ' to null');
            obj = null;
          }
        }
      
      } else {
        if (meta.hasOwnProperty('enum')) {
          if (meta.enum.indexOf(obj) < 0) {
            // ok = false;
            console.log('expected ' + path + ' to be part of predefined enum');  
          }
        } else {
          /* obj should not be an object */
          if (typeof obj === 'object' && obj != null) {
            // ok = false;
            console.log('expected ' + path + ' not to be an object');
            console.log('reseting ' + path + ' to null');
            obj = null;  
          } else if (meta.unit === 'bool' && (typeof obj != 'boolean' || obj === null)) {
            // ok = false;
            console.log('expected boolean value in ' + path);
            console.log('reseting ' + path + ' to default');
            obj = meta.hasOwnProperty('default') ? meta.default : null;
          } else if (meta.unit === 'date' && (typeof obj != 'string' || obj === null)) {
            /* TODO: check ISO format */
            // ok = false;
            console.log('expected date string value in ' + path);
            console.log('reseting ' + path + ' to default');
            obj = meta.hasOwnProperty('default') ? meta.default : null;
          } else if (((meta.hasOwnProperty('min') && typeof meta['min'] === 'number') ||
             (meta.hasOwnProperty('max') && typeof meta['max'] === 'number')) && (typeof obj != 'number' || obj === null)) {
            // ok = false;
            console.log('expected number value in ' + path);
            console.log('reseting ' + path + ' to default');
            obj = meta.hasOwnProperty('default') ? meta.default : null;
          }
        }
      } 

    } else {

      for (var prop in meta) {
        if (meta.hasOwnProperty(prop)) {

          /* does obj have this property defined in meta? */
          if (!obj.hasOwnProperty(prop)) {
            console.log('missing property ' + prop + ' in ' + path);
            console.log('adding ' + prop + ' with default value');
            if (objIsParameter(meta[prop])) {
              if (meta[prop].hasOwnProperty('db') && meta[prop].db.columns.length > 1)
                obj[prop] = {};
              else
                obj[prop] = meta.hasOwnProperty('default') ? meta.default : null;
            } else if (Array.isArray(meta[prop])) {
              obj[prop] = [];
            } else if (typeof meta[prop] === 'object') {
              obj[prop] = {};
            }
            validate(obj[prop], meta[prop], path + '.' + prop, obj, prop);
          } else {

            /* does the prop type match defined in meta? */
            if (Array.isArray(meta[prop])) {

              if (!Array.isArray(obj[prop])) {
                console.log('expected ' + path + '.' + prop + ' to be an array');
                console.log('set ' + path + '.' + prop + ' to be an empty array');
                obj[prop] = [];             
              } else { /* we have an array. empty arrays are ok */
                for (var i = 0, is = obj[prop].length; i < is; i++) {
                  validate(obj[prop][i], meta[prop][0], path + '.' + prop + '[' + i + ']', obj[prop], prop);
                }
              }

            } else if (typeof meta[prop] === 'object') {
              validate(obj[prop], meta[prop], path + '.' + prop, obj, prop);
            } else {
              /* something wrong with meta. we have only arrays & objects in meta */
              console.log('unexpected non-objects in meta');
              ok = false;
            }
          }
        }
      }

    }

    return ok;
  }

  if (name.indexOf('.sim.json') >= 0)
    return validate(obj, meta.sim, 'sim');
  else if (name.indexOf('.site.json') >= 0)
    return validate(obj, meta.site, 'site');
  else if (name.indexOf('.crop.json') >= 0)
    return validate(obj, meta.crop, 'crop');
  else if (name.indexOf('.monica.json') >= 0)
    return validate(obj, meta, '');
  else
    return false;

}

function newProject() {

  return JSON.parse(JSON.stringify(meta));

}

function readWeatherFile(weather_csv) {

  var rows = weather_csv.split('\n');

  /* clear data */
  weather.data = {
    year: [],
    day: [],
    tmin: [],
    tmax: [],
    tavg: [],
    globrad: [],
    wind: [],
    sunhours: [],
    relhumid: [],
    precip: []
  };

  weather.header = rows[0].split(';');
  weather.unit = rows[1].split(';');

  for (var r = 2 /* skip first two rows*/, rs = rows.length; r < rs; r++) {

    var row = rows[r].split(';');
    if (row.length != weather.header.length)
      continue;

    weather.data.year.push(row[weather.header.indexOf('year')]);
    weather.data.day.push(row[weather.header.indexOf('day')]);

    var tavg = row[weather.header.indexOf('tavg')];
    if (Number(tavg) != -999 && !isNaN(tavg))
      weather.data.tavg.push(Number(tavg));
    else
      weather.data.tavg.push(-999);
    var tmax = row[weather.header.indexOf('tmax')];
    if (Number(tmax) != -999 && !isNaN(tmax))
      weather.data.tmax.push(Number(tmax));
    else
      weather.data.tmax.push(-999);
    var tmin = row[weather.header.indexOf('tmin')];
    if (Number(tmin) != -999 && !isNaN(tmin))
      weather.data.tmin.push(Number(tmin));
    else
      weather.data.tmin.push(-999);
    var globrad = row[weather.header.indexOf('globrad')];
    if (Number(globrad) != -999 && !isNaN(globrad))
      weather.data.globrad.push(Number(globrad));
    else
      weather.data.globrad.push(-999);
    var wind = row[weather.header.indexOf('wind')];
    if (Number(wind) != -999 && !isNaN(wind))
      weather.data.wind.push(Number(wind));
    else
      weather.data.wind.push(-999);
    var sunhours = row[weather.header.indexOf('sunhours')];
    if (Number(sunhours) != -999 && !isNaN(sunhours))
      weather.data.sunhours.push(Number(sunhours));
    else
      weather.data.sunhours.push(-999);
    var relhumid = row[weather.header.indexOf('relhumid')];
    if (Number(relhumid) != -999 && !isNaN(relhumid))
      weather.data.relhumid.push(Number(relhumid));
    else
      weather.data.relhumid.push(-999);
    var precip = row[weather.header.indexOf('precip')];
    if (Number(precip) != -999 && !isNaN(precip))
      weather.data.precip.push(Number(precip));
    else
      weather.data.precip.push(-999);

  }

  if (weather.data.sunhours[0] === -999)
    weather.data.sunhours = [];

  // console.log(weather);

}

/* guess if an object in meta file is a parameter */
function objIsParameter(obj) {

  /* most obvious cases */
  if (typeof obj != 'object' || Array.isArray(obj))
    return false;

  /* desc is always required but not sufficient */
  if (obj.hasOwnProperty('desc')) {

    if (obj.hasOwnProperty('unit'))
      return true;

    if (obj.hasOwnProperty('min') || obj.hasOwnProperty('max'))
      return true;

    if (obj.hasOwnProperty('db') || obj.hasOwnProperty('enum'))
      return true;

    return false;
  }

   return false;
}

/* compare two objects (only values not properties) */
function objEqObj(obj1, obj2) {

  for (var prop in obj1) {
    if (obj1.hasOwnProperty(prop)) {
      if (obj1[prop] !== obj2[prop])
        return false;
    }
  }
  
  return true;

};

/* create MONICA JSON from jstree data */
function projectFromTree(treeJSON) {

  // console.log(treeJSON);

  var tree_root = treeJSON[0];
  var projectJSON = {};

  addChildren(tree_root.children, projectJSON);

  function addChildren(children_tree, parent_project) {

    for (var i = 0, is = children_tree.length; i < is; i++) {

      var child_tree = children_tree[i];

      // console.log(child_tree.data.meta);
      // console.log(parent_project);

      if (child_tree.data.meta.isArray) {
        parent_project[child_tree.data.meta.prop] = [];
        addChildren(child_tree.children, parent_project[child_tree.data.meta.prop]);
      } else {
        if (Array.isArray(parent_project)) {
          var len = parent_project.push({});
          for (var prop in child_tree.data) {
            if (child_tree.data.hasOwnProperty(prop) && prop != 'meta') {
              parent_project[len - 1][prop] = (
                child_tree.data[prop].value != undefined ? child_tree.data[prop].value : null
              );
            }
          }
        addChildren(child_tree.children, parent_project[len - 1]);
        } else {
          parent_project[child_tree.data.meta.prop] = {};
          for (var prop in child_tree.data) {
            if (child_tree.data.hasOwnProperty(prop) && prop != 'meta') {
              parent_project[child_tree.data.meta.prop][prop] = (
                child_tree.data[prop].value != undefined ? child_tree.data[prop].value : null
              );
            }
          }              
          addChildren(child_tree.children, parent_project[child_tree.data.meta.prop]);
        }
      }
    }

  }

  // console.log(projectJSON);

  return projectJSON;

}

/* create jstree from meta (and project file input) */
function makeChildren(prop, obj, parent, parentIsArray, input) {

  /* if the obj is a parameter description add it to data (to create forms) */
  if (objIsParameter(obj)) {

    parent.data[prop] = obj;

    /* set inital value if value not set and default value exists */
    if (input)
      parent.data[prop].value = input;
    else if (!obj.hasOwnProperty('value') && obj.hasOwnProperty('default'))
      parent.data[prop].value = obj.default;

    /* if obj has a db object create enum property and load enum values from db */
    if (obj.hasOwnProperty('db') && obj.db.table.length > 0 && obj.db.columns.length > 0) {

      /* make it lower case otherwise we might get a mess */
      obj.db.table = obj.db.table.toLowerCase();
      obj.db.columns.forEach(function (e, i, a) {
        a[i] = e.toLowerCase();
      });
      // console.log(obj.db.columns);
      if (obj.db.hasOwnProperty('keys')) {
        obj.db.keys.forEach(function (e, i, a) {
          a[i] = e.toLowerCase();
        });
      }

      var qry = 'SELECT ' + obj.db.columns.join(', ') + ' FROM ' + obj.db.table;
      // console.log(qry);
      /* get one row to check data types (we are looking for the first sting) and create order by clause */
      var res = db.exec(qry + ' LIMIT 1');
      var orderBy = '';
      var colIdxOfOrderBy = res[0].values[0].indexOf(res[0].values[0].filter(function (e) {
        return (typeof e === 'string');
      })[0 /* get first element */]);
      
      if (colIdxOfOrderBy < 0)
        colIdxOfOrderBy = 0;

      /* rerun query with oder by clause */
      res = db.exec(qry + ' ORDER BY ' + obj.db.columns[colIdxOfOrderBy] + ' COLLATE NOCASE ASC');

      // console.log(res);
      if (obj.db.columns.length > 1) {
         /* if there is more than one column we add objects as enum values */
        obj.enum = res[0].values.reduce(function (a, b) {
          var row = {};
          /* make objects with column names as properties and asign value from db */
          b.forEach(function (c, i) {

            /* remove escaped quotes from sql.js */
            if (typeof c === 'string')
              c = c.replace(/\\"/g, "'");
            
            row[res[0].columns[i].toLowerCase()] = c; 
          });
          return a.concat(row);
        },[]);
      } else {
         /* we don't make objects if there is only one column i.e. we just add the list of values */
        obj.enum = res[0].values.reduce(function (a, b) {

            /* remove escaped quotes from sql.js */
            if (typeof b[0] === 'string')
              b[0] = b[0].replace(/\\"/g, "'");

          return a.concat([b[0]]);
        },[]);          
      }
    }

    return;
  }

  if (Array.isArray(obj)) {

    // console.log(obj);

    /* get first element from array as proto obj */
    var item = obj[0];

    /* create parent for array items */
    var child = {
      text: prop,
      state : {
        opened: false,
        selected: false
      },
      children: [],
      data: { meta: { 
          parentIsArray: parentIsArray,
          isArray: true,
          prop: prop,
          item: item
        } 
      },
      type: 'folder'
    };

    parent.children.push(child);

    //for (var j in item) {
      //if (item.hasOwnProperty(j))
    if (input) {
      for (var i = 0, is = input.length; i < is; i++) {
        makeChildren(i.toString(), /* make copy of item */ JSON.parse(JSON.stringify(item)), child, true, input[i]);
      }
    } else {
      makeChildren('0', item, child, true);
    }

  } else if (typeof obj === 'object') {
    /* ignore all objects that describe parameters (they have a unit and min, max properties)*/
    if (!objIsParameter(obj)) {
      var child = {
        text: prop,
        state : {
          opened: false,
          selected: false
        },
        children: [],
        data: { meta: { 
            parentIsArray: parentIsArray,
            isArray: false,
            prop: prop
          } 
        },
        type: 'file'
      };
      parent.children.push(child)
      for (var j in obj) {
        if (obj.hasOwnProperty(j))
          makeChildren(j, obj[j], child, false, (input ? input[j] : null));
      }
    } else {
      // ???
      //makeChildren(prop, obj, parent);
    }
  }
}

makeTree = function (rootObj, input /* { site: site, crop: crop, sim: sim } */) {

  var treeData = { 
    core: {
      check_callback: true,
      data: []
    },
    types: {
      default: {
        icon: "glyphicon glyphicon-folder-close grey"
      },
      folder: {
        icon: "glyphicon glyphicon-folder-open grey"
      },
      file: {
        icon: "glyphicon glyphicon-file grey"
      }
    },
    plugins: [/*"contextmenu", "dnd", "search", "state", "wholerow"*/, "types", "state"] 
  };

  treeData.core.data.push({
    text: 'Project',
    state : {
      opened: true,
      selected: false
    },
    children: [],
      data: { meta: { 
          parentIsArray: false,
          isArray: false,
          prop: 'project'
        } 
      },
    type: 'folder'     
  });

  if (rootObj.site) {
    
    treeData.core.data[0].children.push({
      text: 'Site',
      state : {
        opened: true,
        selected: false
      },
      children: [],
      data: { meta: { 
          parentIsArray: false,
          isArray: Array.isArray(rootObj.site),
          prop: 'site',
          item: Array.isArray(rootObj.site) ? rootObj.site[0] : rootObj.site
        } 
      },
      type: Array.isArray(rootObj.site) ? 'folder' : 'file'      
    });

    if (Array.isArray(rootObj.site)) {
      makeChildren('0', rootObj.site[0],  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], true, (input && input.site ? input.site[0] : null));
    } else {
      for (var prop in rootObj.site) {
        if (rootObj.site.hasOwnProperty(prop)) {
          var obj = rootObj.site[prop];
          if (typeof obj === 'object')
            makeChildren(prop, obj,  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], false, (input && input.site ? input.site[prop] : null));
        }
      }
    }
    
  }

  if (rootObj.crop) {
    
    treeData.core.data[0].children.push({
      text: 'Rotation',
      state : {
        opened: true,
        selected: false
      },
      children: [],
      data: { meta: { 
          parentIsArray: false,
          isArray: Array.isArray(rootObj.crop),
          prop: 'crop',
          item: Array.isArray(rootObj.crop) ? rootObj.crop[0] : rootObj.crop
        } 
      },
      type: Array.isArray(rootObj.crop) ? 'folder' : 'file'      
    });

    if (Array.isArray(rootObj.crop)) {
      makeChildren('0', rootObj.crop[0],  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], true, (input && input.crop ? input.crop[0] : null));
    } else {
      for (var prop in rootObj.crop) {
        if (rootObj.crop.hasOwnProperty(prop)) {
          var obj = rootObj.crop[prop];
          if (typeof obj === 'object')
            makeChildren(prop, obj,  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], false, (input && input.crop ? input.crop[prop] : null));
        }
      }
    }
    
  }

  if (rootObj.sim) {
    
    treeData.core.data[0].children.push({
      text: 'Simulation',
      state : {
        opened: true,
        selected: false
      },
      children: [],
      data: { meta: { 
          parentIsArray: false,
          isArray: Array.isArray(rootObj.sim),
          prop: 'sim',
          item: Array.isArray(rootObj.sim) ? rootObj.sim[0] : rootObj.sim
        } 
      },
      type: Array.isArray(rootObj.sim) ? 'folder' : 'file'    
    });

    if (Array.isArray(rootObj.sim)) {
      makeChildren('0', rootObj.sim[0],  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], true, (input && input.sim ? input.sim[0] : null));
    } else {
      for (var prop in rootObj.sim) {
        if (rootObj.sim.hasOwnProperty(prop)) {
          var obj = rootObj.sim[prop];
          if (typeof obj === 'object')
            makeChildren(prop, obj,  treeData.core.data[0].children[treeData.core.data[0].children.length - 1], false, (input && input.sim ? input.sim[prop] : null));
        }
      }
    }

  }

  treeData.core.data[0].children.push({
    text: 'Weather',
    state : {
      opened: true,
      selected: false
    },
    children: [],
    data: { 
      meta: { 
        parentIsArray: false,
        isArray: false,
        prop: 'weather'
      },
      fileName: '' 
    },
    type: 'file'      
  });

  // console.log(treeData);

  tree = $('#tree').jstree(treeData);

  /* make input form on tree node selection */
  tree.on('select_node.jstree', function (evt, data) {

    var treeInstance = data.instance
      , node = data.node
      , params = node.data /* parameter data & meta data stored in each node */
      ;

    /* breadcrumb */
    var crumb = node.text;
    var parent = treeInstance.get_node(treeInstance.get_parent(node));
    while (parent.id != '#') {
      crumb = parent.text + '&nbsp;&#47;&nbsp;' + crumb;
      parent = treeInstance.get_node(treeInstance.get_parent(parent));
    }
    $('#form-header-text').html(crumb);
    
    /* hide or show array edit buttons */
    $('#array-btn-group').css('visibility', (params.meta.isArray || params.meta.parentIsArray ? 'visible' : 'hidden')); 

    /* enable or disable up/delete buttons */
    $('#delete-item-btn, #up-item-btn').prop('disabled', (params.meta.parentIsArray ? false : true));

    /* clear form */
    $('#form-left').html('');
    $('#form-right').html('');

    /* check if params defines any parameter */
    var propCount = 0;
    for (var prop in params) {
      if (params.hasOwnProperty(prop) && prop != 'meta')
        propCount++;
    }

    /* create weather form */
    if (params.meta.prop === 'weather') {

      /* since tmin is required in any case we use it to check if there is any weather data at all */
      if (weather.data.tmin.length > 0) {

        var html = '';
        html += '<div class="form-group">'
              + ' <label for="weather-params">Parameter</label>'
              + '   <select class="form-control" name="weather-params">';
        weather.header.forEach(function (e) {
          if (e != 'year' && e != 'day')
            html += '<option value="'+e+'">'+e+'</option>';
        });
        html += '   </select>'
             + '</div>'
             +  '<div id="weather-flot" style="height:200px"></div>';

        $('#form-left').append(html);
        $('select[name="weather-params"]').selectpicker('val', null);
        $('select[name="weather-params"]').change(function () {

          var param = $(this).val();
          var unit = weather.unit[weather.header.indexOf(param)];

          var flot_data = [];
          for (var d = 0, ds = weather.data[param].length; d < ds; d++)
            flot_data.push([d, weather.data[param][d]]);

          $.plot("#weather-flot", [{label: param + ' [' + unit + ']', data: flot_data }]);

        });
      }

    } else if (propCount > 0) { /* create parameter input form */

      var propIdx = 0;
      for (var prop in params) {
        if (params.hasOwnProperty(prop)) {
          if (prop === 'meta' || params[prop].advanced) /* hide if advanced === true */
            continue;

          var html = ''
            , param = params[prop]
            , label = prop
            , value = param.hasOwnProperty('value') ? param.value : ''
            , unit = param.hasOwnProperty('unit') ? param.unit : ''
            , inputType = 'text'
            , formType = 'input'
            , min = param.hasOwnProperty('min') && unit != 'bool' ? (param.min === null ? -Infinity : param.min) : null
            , max = param.hasOwnProperty('max') && unit != 'bool' ? (param.max === null ? Infinity : param.max) : null
            , desc = param.desc
            , isEnum = param.hasOwnProperty('enum')
            ;

          /* create a readable label from camel cased parameter names */
          if (label.length > 3)
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function(str){ return str.toUpperCase(); });

          if (param.min != null && param.max != null)
            desc += '. ' + '{ min: ' + param.min + ', max: ' + param.max + ' }';

          if (param.min != null && param.max != null && unit != 'bool')
            inputType = 'number';
          else if (unit === 'date')
            inputType = 'date';
          else if (unit === 'bool')
            inputType = 'checkbox';

          if (!isEnum && unit != 'bool') {
            html += '<div class="form-group">'
                  + ' <label for="'+prop+'">'+label+'</label>'
                  + '   <div class="input-group">'
                  + '     <input class="form-control" type="'+inputType+'" value="'+value+'" name="'+prop+'" title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top"></input>'
                  + '     <span class="input-group-addon">'+unit+'</span>'
                  + '   </div>'
                  + '</div>';
          } else if (unit === 'bool') {
            html += '<div class="form-group">'
                  + ' <label title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top">'
                  + '     <input type="'+inputType+'" '+(value ? 'checked' : '')+' name="'+prop+'"></input>&nbsp;&nbsp;'+label+'</label>'
                  + '</div>';
          } else {
            var selectedHasBeenSet = false;
            formType = 'select';
            html += '<div class="form-group">'
                  + ' <label for="'+prop+'">'+label+'</label>'
                  + '   <select class="form-control" name="'+prop+'" title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top">';
            param.enum.forEach(function (e, i) {
              var selected = '';
              /* data from db are objects if we have more than one column */
              if (typeof e === 'object') {
                if (objEqObj(e, value) && !selectedHasBeenSet) {
                  selected = 'selected';
                  selectedHasBeenSet = true;
                }
                
                /* add an empty value first */
                if (i === 0) {
                  var data = '';
                  var texts = [];
                  for (var prop in e) {
                    if (e.hasOwnProperty(prop)) {
                      data += ' data-monica-' + prop + '="" ';
                    }
                  }
                  html += '<option ' + data + ' value=""'+selected+'></option>';
                }

                var data = '';
                var text = '';

                for (var prop in e) {
                  if (e.hasOwnProperty(prop)) {
                    data += ' data-monica-' + prop + '="' + e[prop] + '" ';
                    if (typeof e[prop] === 'string' && e[prop].trim().length > 0)
                      text += (text.length === 0 ? e[prop] : (', ' + e[prop]));
                  }
                }
                html += '<option ' + data + ' value="'+ text +'" '+selected+'>'+text+'</option>';
              } else {
                if (e === value)
                  selected = 'selected';
                /* add an empty value first  */
                if (i === 0) html += '<option value=""'+selected+'></option>';
                html += '<option value="'+e+'"'+selected+'>'+e+'</option>';
              }

            });
            html += '   </select>'
                  + '</div>';
          }

          if (propIdx > propCount * 0.5 && propCount > 6)
            $('#form-right').append(html);
          else
            $('#form-left').append(html);

          /* remove selectpicker for now: does not work with desc. pop-ups */
          // if (formType === 'select') {
          //   $('select[name="'+prop+'"]').selectpicker();
          //   if (param.enum && item.enum.indexOf(value) >= 0)
          //     $('select[name="'+prop+'"]').selectpicker('val', value);
          //   else
          //     $('select[name="'+prop+'"]').selectpicker('val', null);
          // }

          (function(p, name) {

            $(formType+'[name="'+name+'"]').change(function () {

              var value = $(this).val()
                , param = p
                , type = $(this).attr('type')
                ;

              /* if param has db and column > 1 make an object */
              if (param.hasOwnProperty('db') && param.db.columns.length > 1) {
                var option = $("option:selected", this);
                param.value = {};
                param.db.columns.forEach(function (column) {
                  param.value[column] = option.data('monica-' + column);
                })
              } else {
                if (type === 'number') {
                  if (value === '') {
                    param.value = null;
                  } else {
                    if (Number(value) < param.min) 
                      $(this).val(param.min); 
                    else if (Number(value) > param.max) 
                      $(this).val(param.max);
                    param.value = Number($(this).val());
                    value = $(this).val();
                  }
                } else if (param.unit === 'bool') {
                  param.value = $(this).prop('checked')
                } else {
                  param.value = (value === '' ? null : value);
                }
              }

              // console.log('param.value ' + param.value);

              if (params.meta && params.meta.parentIsArray == true) {
                var count = 0;
                for (var prop in params) {
                  if (count > 0) break;
                  if (params.hasOwnProperty(prop)) {
                    if (prop != 'meta')
                      count++;
                    /* set node display text to text of the first item in form */
                    if (params[prop] === param) {
                      node.text = (typeof param.value === 'string' ? param.value : value);
                      $('#tree').jstree().redraw_node(node, false, false);
                      /* update breadcrumb */
                      var crumb = node.text;
                      var parent = treeInstance.get_node(treeInstance.get_parent(node));
                      while (parent.id != '#') {
                        crumb = parent.text + '&nbsp;&#47;&nbsp;' + crumb;
                        parent = treeInstance.get_node(treeInstance.get_parent(parent));
                      }
                      $('#form-header-text').html(crumb);
                    }
                  }
                }
              }

            });

          }(param, prop));

          /* bind popover to display desc. text */
          $('input, select, label').popover({
            trigger: 'hover'
          });
          
          propIdx++;

        }
      }
    }

  }); /* tree.on('select_node.jstree') */
} /* makeTree */


/* jquery event bindings */
$('#new-project-btn').on('click', function () {

  $('#form-header-text').html('');
  $('#btn-add-array-item').css('visibility', 'hidden');
  $('#form-left').html('');
  $('#form-right').html('');

  $('#tree').jstree("destroy").empty();
  project = newProject();
  makeTree(project);

});

$('#save-project-btn').on('click', function () {

  var obj = projectFromTree($(tree).jstree().get_json());

  $('#download-project-a', '#download-modal').attr({
    href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2)),
    download: "project.monica.json"
  });

  $('#download-site-a', '#download-modal').attr({
    href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj.site, null, 2)),
    download: "project.site.json"
  });

  $('#download-crop-a', '#download-modal').attr({
    href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj.crop, null, 2)),
    download: "project.crop.json"
  });

  $('#download-sim-a', '#download-modal').attr({
    href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj.sim, null, 2)),
    download: "project.sim.json"
  });

  $('#download-modal').modal('show');

});

$('#add-item-btn').on('click', function () {
  
  var node_selected = $('#tree').jstree().get_node($('#tree').jstree().get_selected());

  if (node_selected.data.meta.parentIsArray || node_selected.data.meta.isArray) {

    if (node_selected.data.meta.parentIsArray)
      var node_array = $('#tree').jstree().get_node($('#tree').jstree().get_parent(node_selected));
    else
      var node_array = node_selected;

    var data = JSON.parse(JSON.stringify(node_array.data.meta.item));
    data.meta = { 
      parentIsArray: true,
      isArray: Array.isArray(node_array.data.meta.item),
      prop: '',
      item: null
    };

    var node_new =  {
      text: node_array.children.length,
      state : {
        opened: true,
        selected: true
      },
      children: [],
      data: data,
      type: node_selected.type      
    };

    makeChildren(
      node_array.children.length, 
      JSON.parse(JSON.stringify(node_array.data.meta.item)) /* copy */, 
      node_new, 
      true
    );

    // console.log(node_new);

    $('#tree').jstree().create_node(node_array, node_new.children[0], 'last', function () {
      $('#tree').jstree().select_node($('#tree').jstree().get_node(node_array.children[node_array.children.length - 1]));
      $('#tree').jstree().deselect_node(node_selected, true);
    }); /* TODO why children[0]?? */

  }

});

$('#delete-item-btn').on('click', function () {
  
  var node_selected = $('#tree').jstree().get_node($('#tree').jstree().get_selected());
  $('#tree').jstree().select_node($('#tree').jstree().get_parent(node_selected));
  $('#tree').jstree().delete_node(node_selected);

});

$('#up-item-btn').on('click', function () {
  
  var node_selected = $('#tree').jstree().get_node($('#tree').jstree().get_selected());
  var node_parent = $('#tree').jstree().get_node($('#tree').jstree().get_parent(node_selected));
  var node_index = node_parent.children.indexOf(node_selected.id);

  if (node_index > 0)
    $('#tree').jstree().move_node(node_selected, node_parent, node_index - 1);
});

$('#down-item-btn').on('click', function () {

  /* does not work why ???? */
  
  var node_selected = $('#tree').jstree().get_node($('#tree').jstree().get_selected());
  var node_parent = $('#tree').jstree().get_node($('#tree').jstree().get_parent(node_selected));
  var node_index = node_parent.children.indexOf(node_selected.id);

  // console.log(node_index);
  // console.log(node_parent.children.length);

  if (node_index < node_parent.children.length - 1)
    $('#tree').jstree().move_node(node_selected, node_parent, node_index + 1/*, function () { console.log(arguments); }*/);
});

$('#weather-file-load-btn').click(function (evt) {

  $("#weather-file-load-btn").filestyle('clear');

});


$('#weather-file-load-btn').change(function (evt) {
  
  var files = evt.target.files;
  if (files.length < 1)
    return;

  var reader = new FileReader();

  reader.onload = function (evt) {
    readWeatherFile(evt.target.result);
  };

  reader.readAsText(files[0]);
  
});

$('#project-files-load-btn').click(function (evt) {

  $("#project-files-load-btn").filestyle('clear');

});  


$('#project-files-load-btn').change(function (evt) {
  
  var files = evt.target.files;

  if (files.length < 1)
    return;

  var input = { sim: null, site: null, crop: null };

  /* TODO: async */
  var counter = 0;
  var noFiles = 0;
  for (var f = 0, fs = files.length; f < fs; f++) {
    var file = files[f];
    var name = file.name.toLowerCase();
    if (name.indexOf('meta.') === -1 && 
      (name.indexOf('.sim.json') >= 0 || name.indexOf('.site.json') >= 0 || name.indexOf('.crop.json') >= 0 || name.indexOf('.monica.json') >= 0))
      noFiles++;
  }

  for (var f = 0, fs = files.length; f < fs; f++) {
    var file = files[f];
    var fileName = file.name.toLowerCase();
    /* accept files that do match naming conventions (i.e. xx.sim.json, xx.site.json, xx.crop.json but not meta.) */
    if (fileName.indexOf('meta.') === -1 && 
      (fileName.indexOf('.sim.json') >= 0 || fileName.indexOf('.site.json') >= 0 || fileName.indexOf('.crop.json') >= 0 || fileName.indexOf('.monica.json') >= 0)) {

      var reader = new FileReader();
      /* make closure to provide fileName param */
      reader.onload = function (fileName) {

        return (function (evt) {
          var obj = readMonicaInputFile(evt.target.result, fileName);
          var ok = isValidMonicaInput(obj, fileName);
          counter++;
          // console.log(obj);
          if (fileName.indexOf('.sim.json') >= 0 && ok)
            input.sim = obj;
          else if (fileName.indexOf('.site.json') >= 0 && ok)
            input.site = obj;
          else if (fileName.indexOf('.crop.json') >= 0 && ok)
            input.crop = obj;
          else if (fileName.indexOf('.monica.json') >= 0  && ok) {
            input.sim = obj.sim;
            input.site = obj.site;
            input.crop = obj.crop;
          }

          /* all files have been loaded */
          if (counter === noFiles) {

            /* if any object is null we use the tree data (this way we can combine files from dif. projects) */
            if (input.sim === null || input.site === null || input.crop === null) {
              var treeJSON = $(tree).jstree().get_json();
              var currentProject = projectFromTree(treeJSON);
              if (input.sim === null)
                input.sim = currentProject.sim;
              if (input.site === null)
                input.site = currentProject.site;
              if (input.crop === null)
                input.crop = currentProject.crop;
            }

            $('#form-header-text').html('');
            $('#btn-add-array-item').css('visibility', 'hidden');
            $('#form-left').html('');
            $('#form-right').html('');

            $('#tree').jstree("destroy").empty();
            project = newProject();
            makeTree(project, input);
          }
        });

      }(fileName);

      reader.readAsText(file);        
    }
  };

});

$('#run-monica-btn').on('click', function () {

  var treeJSON = $(tree).jstree().get_json();
  var config = projectFromTree(treeJSON);
  config.debug = $('#debug-btn').hasClass('active');
  config.weather = weather.data;

  console.log(config);
  /* reset results */
  results = { data: {}, units: {} };

  MONICA.postMessage({ run: config });
  $('#result-msg').html('');
  $('#result-modal').modal('show');

});

$('#question-btn').on('click', function () {

  $('#question-modal').modal('show');

});

}); /* jquery */
