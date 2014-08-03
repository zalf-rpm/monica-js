
(function () {

/*
  TODO: 
    meta {unit, default value, value}, bessere Kriterien was ein Parameter Objekt ist.
    - escape text from db
*/

var meta = {};
var project = {};
var results = {};
var weather = { 
  fileName: '',
  data: {
    tmin: [],
    tmax: [],
    tavg: [],
    globrad: [],
    wind: [],
    sunhours: [],
    relhumid: []
  },
  header: [],
  unit: [] 
};
/* blob needs to be released for each run */
var result_file_url = null;

var monicaWorker = new Worker('dist/monica-amalgamation.min.js');
monicaWorker.onmessage = function (event) {

    if (event.data.hasOwnProperty('progress')) {

      var result = event.data.progress;
      for (var prop in result) {
        if (result.hasOwnProperty(prop)) {
          if (!results[prop]) /* init array */
            results[prop] = [result[prop]];
          else
            results[prop].push(result[prop])
        }
      }


      if (event.data.progress === null) { /* we are done */
        $('#result-select').html('');
        var html = '';
        // html += '<p>File: '+weather.fileName+'</p>';

        html += ''// '<label for="result-params">Parameter</label>'
              + '<select multiple class="form-control" name="result-params" size=20">';
        for (var prop in results) {
          if (results.hasOwnProperty(prop)) {
            html += '<option value="'+prop+'">'+prop+'</option>';
          }
        }
        html + '</select>';

        $('#result-select').append(html);
        // $('select[name="result-params"]').selectpicker('val', null);
        $('select[name="result-params"]').change(function () {

          var params = $(this).val();
          var unit = '?';

          var flot_data = [];
          for (var p = 0, ps = params.length; p < ps; p++) {
            var values = results[params[p]];
            flot_data[p] = { label: params[p] + ' [' + unit + ']', data: [] };
            for (var d = 0, ds = values.length; d < ds; d++)
              flot_data[p].data.push([d, values[d]]);
          }

          $.plot("#flot-result", flot_data);


        });       
      }     

    } else {
      var msg = event.data;
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

// setTimeout(function () {
//   worker.postMessage({ sql: "SELECT * FROM crop" });
// }, 5000);

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

/*
  geht so nicht, da jsTree keine Referenz auf project Objekt erlaubt (alles Kopien)

  1. jedem data object in einem tree node ein meta object zuweisen, das Informationen 
  über den Type enthält (property Name, type (array, object oder parameter))
  2. tree.get_json() parsen 
*/
function serializeProject() {

  var json = {};

  addObject(null, project, json);
  // console.log(project);

  function isParameter(obj) {

    return ( 
      obj.hasOwnProperty('min') ||
      obj.hasOwnProperty('max') ||
      obj.hasOwnProperty('value') ||
      obj.hasOwnProperty('desc')
    );

  }

  function addObject(name, data, parent) {

    if (Array.isArray(parent)) {
      if (typeof data === 'object') {
        if (Array.isArray(data)) {
          var len = parent.push([]);
          addObject(null, data[len - 1], parent[len - 1]);
        } else {
          var len = parent.push({});
          addObject(null, data, parent[len - 1]);
        }
      }
    } else if (typeof parent === 'object') {
      if (isParameter(data)) {
        parent[name] = data.value;
      } else {
        if (Array.isArray(data)) {
          parent[name] = [];
          data.forEach(function (e) {
            addObject(null, e, parent[name]);
          });
        } else {
          if (name)
            parent[name] = {};
          for (var prop in data) {
            if (data.hasOwnProperty(prop))
              addObject(prop, data[prop], name ? parent[name] : parent);
          }
        }
      }
    }

  }

  return json;

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

function projectFromTree(tree_json) {

  // console.log(tree_json);

  var tree_root = tree_json[0];
  var project_json = {};


  addChildren(tree_root.children, project_json);

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

  // console.log(project_json);

  return project_json;


  // addObject(null, project, json);
  // console.log(project);

  // function isParameter(obj) {

  //   return ( 
  //     obj.hasOwnProperty('min') ||
  //     obj.hasOwnProperty('max') ||
  //     obj.hasOwnProperty('value') ||
  //     obj.hasOwnProperty('desc')
  //   );

  // }

  // function addObject(name, data, parent) {

  //   if (Array.isArray(parent)) {
  //     if (typeof data === 'object') {
  //       if (Array.isArray(data)) {
  //         var len = parent.push([]);
  //         addObject(null, data[len - 1], parent[len - 1]);
  //       } else {
  //         var len = parent.push({});
  //         addObject(null, data, parent[len - 1]);
  //       }
  //     }
  //   } else if (typeof parent === 'object') {
  //     if (isParameter(data)) {
  //       parent[name] = data.value;
  //     } else {
  //       if (Array.isArray(data)) {
  //         parent[name] = [];
  //         data.forEach(function (e) {
  //           addObject(null, e, parent[name]);
  //         });
  //       } else {
  //         if (name)
  //           parent[name] = {};
  //         for (var prop in data) {
  //           if (data.hasOwnProperty(prop))
  //             addObject(prop, data[prop], name ? parent[name] : parent);
  //         }
  //       }
  //     }
  //   }

  // }

  // return json;

}

$(function () {

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

        // console.log(obj.enum);
        // obj.enum = monica.data[obj.db.table].rows.reduce(function (a, b) {
        //   return a.concat([b[obj.db.columns[0]]]);
        // }, []).sort();
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
          // console.log(i);
          // console.log(input[i]);
          // console.log(item);
          makeChildren(i.toString(), /* make copy of item */ JSON.parse(JSON.stringify(item)), child, true, input[i]);
        };
      } else {
        makeChildren('0', item, child, true);
      }
      //}
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
        //makeChildren(prop, obj, parent);
      }
    }
  }

  var tree = {};

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

    tree.on('select_node.jstree', function (e, data) {

      // console.log(data.instance.get_json(data.node));
      // console.log(data.node.data);
      var form_header_text = data.node.text;
      var parent = data.instance.get_node(data.instance.get_parent(data.node));
      while (parent.id != '#') {
        form_header_text = parent.text + '&nbsp;&#47;&nbsp;' + form_header_text;
        parent = data.instance.get_node(data.instance.get_parent(parent));
      }
      $('#form-header-text').html(form_header_text);


      // if (data.node.data && data.node.data.meta && (data.node.data.meta.parentIsArray || data.node.data.meta.isArray)) {
      //   var parent = data.instance.get_node(data.instance.get_parent(data.node));
      //   $('#form-header-text').html(parent.text + ': ' + data.node.text);
      //   $('#btn-add-array-item').css('visibility', 'visible');
      // } else {
      //   $('#form-header-text').html(data.node.text);
      //   $('#btn-add-array-item').css('visibility', 'hidden');
      // }
      

      if (data.node.data.meta.isArray || data.node.data.meta.parentIsArray) {
       $('#array-btn-group').css('visibility', 'visible'); 
      } else {
       $('#array-btn-group').css('visibility', 'hidden');
      }

      if (data.node.data.meta.parentIsArray) {
       $('#delete-item-btn').prop('disabled', false);
       $('#up-item-btn').prop('disabled', false); 
      } else {
       $('#delete-item-btn').prop('disabled', true); 
       $('#up-item-btn').prop('disabled', true); 
      }


      /* if data empty clear form */
      var propCount = 0;
      for (var prop in data.node.data) {
        if (data.node.data.hasOwnProperty(prop) && prop != 'meta')
          propCount++;
      }
      if (propCount === 0 && data.node.data.meta.prop != 'weather') {
        $('#form-left').html('');
        $('#form-right').html('');
        return;
      }

      /* make form */
      $('#form-left').html('');
      $('#form-right').html('');
      
      if (data.node.data.meta.prop === 'weather') {

        $('#form-right').html('<a href="weather/weather_example.csv">Download weather example file</a>');
        
        if (weather.data.tmin.length > 0) { /* todo: tmin ?*/
          var html = '';
          // html += '<p>File: '+weather.fileName+'</p>';

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

        return;

      }

      var obj = data.node.data;
      var count = 0, i = 0;
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (prop != 'meta')
          count++;
        }
      }

      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (prop === 'meta')
            continue;

          var item = obj[prop];
          var label = prop;
          if (label.length > 3)
            label = label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, function(str){ return str.toUpperCase(); })

          var desc = item.desc;
          if (item.min != null && item.max != null)
            desc += '. ' + '{ min: ' + item.min + ', max: ' + item.max + ' }';

          var value = '';
          if (item.value != undefined)
            value = item.value;

          var unit = item.unit;
          if (prop === 'date')
            unit = 'date'; // TODO: how to change date format in bootstrap

          var type = 'text';
          if (item.min != null && item.max != null)
            type = 'number';
          if (prop === 'date' || unit === 'date')
            type = 'date';
          if (unit === 'bool')
            type = 'checkbox';

          var formType = 'input';

          var html = ''
          if (!item.enum && unit != 'bool') {
            html += '<div class="form-group">'
                  + ' <label for="'+prop+'">'+label+'</label>'
                  + '   <div class="input-group">'
                  + '     <input class="form-control" type="'+type+'" value="'+value+'" name="'+prop+'" title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top"></input>'
                  + '     <span class="input-group-addon">'+unit+'</span>'
                  + '   </div>'
                  + '</div>';
          } else if (unit === 'bool') {
            html += '<div class="form-group">'
                  + ' <label>'
                  + '     <input type="'+type+'" '+(value ? 'checked' : '')+' name="'+prop+'" title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top"></input>&nbsp;&nbsp;'+label+'</label>'
                  + '</div>';
          } else {
            var selectedHasBeenSet = false;
            formType = 'select';
            html += '<div class="form-group">'
                  + ' <label for="'+prop+'">'+label+'</label>'
                  + '   <select class="form-control" name="'+prop+'" title="'+prop+'" data-content="'+desc+'" data-toggle="popover" data-placement="top">';
            item.enum.forEach(function (e, i) {
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
                    if (typeof e[prop] === 'string' && e[prop].trim().length > 0) /* TODO: hide numbers? In most cases it is the database id */
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

          if (i > count * 0.5 && count > 6)
            $('#form-right').append(html);
          else
            $('#form-left').append(html);

          if (formType === 'select') {

            // $('select[name="'+prop+'"]').selectpicker();
            
            // if (item.enum && item.enum.indexOf(value) >= 0)
            //   $('select[name="'+prop+'"]').selectpicker('val', value);
            // else
            //   $('select[name="'+prop+'"]').selectpicker('val', null);

          }


          $(formType+'[name="'+prop+'"]').change(function () {

            var item = obj[$(this).prop('name')];
            // console.log(item);

            // if (item.enum)
              // console.log($('select[name="' + $(this).prop('name') + '"] option:selected').val());
            // if (item.unit === 'bool')
              //console.log($(this).prop('checked'));

            if (item.min != null && Number($(this).val()) < item.min) 
              $(this).val(item.min); 
            if (item.max != null && Number($(this).val()) > item.max) 
              $(this).val(item.max);

            if (item.unit === 'bool')
              item.value = $(this).prop('checked')
            else if (item.min != null)
              item.value = Number($(this).val());
            else
              item.value = $(this).val();

            /* if item has db and column > 1 make an object */
            if (item.hasOwnProperty('db') && item.db.columns.length > 1) {
              var option = $("option:selected", this);
              console.log(option);
              item.value = {};
              item.db.columns.forEach(function (e) {
                item.value[e] = option.data('monica-' + e);
              })
              /* TODO: hack to set tree display text ... */
              item.text = $(this).val();
            }


            if (data.node.data.meta && data.node.data.meta.parentIsArray == true) {
              var count = 0;
              for (var prop in obj) {
                if (count > 0) break;
                if (obj.hasOwnProperty(prop)) {
                  if (prop != 'meta')
                    count++;
                  if (obj[prop] === item) {
                    data.node.text = (typeof item.value === 'string' ? item.value : item.text);
                    $('#tree').jstree().redraw_node(data.node, false, false);
                    var form_header_text = data.node.text;
                    var parent = data.instance.get_node(data.instance.get_parent(data.node));
                    while (parent.id != '#') {
                      form_header_text = parent.text + '&nbsp;&#47;&nbsp;' + form_header_text;
                      parent = data.instance.get_node(data.instance.get_parent(parent));
                    }
                    $('#form-header-text').html(form_header_text);
                  }
                }
              }
            }

          });



          $('input, select').popover({
            trigger: 'hover'
          })
          
          i++;

        }
      }

    });
  }

  $('#new-project-btn').on('click', function () {

    $('#form-header-text').html('');
    $('#btn-add-array-item').css('visibility', 'hidden');
    $('#form-left').html('');
    $('#form-right').html('');

    $('#tree').jstree("destroy").empty();
    project = newProject();
    makeTree(project);

  });

  $('#load-project-btn').on('click', function () {

  });

  $('#save-project-btn').on('click', function () {
    //console.log(serializeProject());
    var tree_json = $(tree).jstree().get_json();
    var obj = projectFromTree(tree_json);
    window.open("data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2)));
   
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
      /* copy data */
      // var data = JSON.parse(JSON.stringify(node_selected.data));
      // /* reset value */
      // for (var prop in data) {
      //   if (data.hasOwnProperty(prop) && prop != 'meta')
      //     data[prop].value = null;
      // }

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


  $('#project-files-load-btn').click(function (evt) {

    $("#project-files-load-btn").filestyle('clear');

  });  


  $('#project-files-load-btn').change(function (evt) {
    
    var files = evt.target.files;

    if (files.length < 1)
      return;

    var input = { sim: null, site: null, crop: null };

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
      var name = file.name.toLowerCase();
      /* accept files that do match naming conventions (i.e. xx.sim.json, xx.site.json, xx.crop.json but not meta.) */
      if (name.indexOf('meta.') === -1 && 
        (name.indexOf('.sim.json') >= 0 || name.indexOf('.site.json') >= 0 || name.indexOf('.crop.json') >= 0 || name.indexOf('.monica.json') >= 0)) {

        var reader = new FileReader();
        reader.onload = function (name) {

          return (function (evt) {
            var obj = readMonicaInputFile(evt.target.result, name);
            var ok = isValidMonicaInput(obj, name);
            counter++;
            // console.log(obj);
            if (name.indexOf('.sim.json') >= 0 && ok)
              input.sim = obj;
            else if (name.indexOf('.site.json') >= 0 && ok)
              input.site = obj;
            else if (name.indexOf('.crop.json') >= 0 && ok)
              input.crop = obj;
            else if (name.indexOf('.monica.json') >= 0  && ok) {
              input.sim = obj.sim;
              input.site = obj.site;
              input.crop = obj.crop;
            }

            if (counter === noFiles) {
              $('#form-header-text').html('');
              $('#btn-add-array-item').css('visibility', 'hidden');
              $('#form-left').html('');
              $('#form-right').html('');

              $('#tree').jstree("destroy").empty();
              project = newProject();
              makeTree(project, input);
            }
          });

        }(name);

        reader.readAsText(file);        
      }
    };

    
  });



  $('#run-monica-btn').on('click', function () {

    var tree_json = $(tree).jstree().get_json();
    var config = projectFromTree(tree_json);
    config.debug = $('#debug-btn').hasClass('active');
    config.weather = weather.data;

    console.log(config);
    /* reset results */
    results = {};

    monicaWorker.postMessage({ run: config });
    $('#result-msg').html('');
    $('#result-modal').modal('show');

  });

  $('#result-save-a').on('click', function () {

    window.URL.revokeObjectURL(result_file_url);

    /* geht nicht mit sehr großen Datein */
    var csv = '';

    /* write header */
    for (var prop in results) {
      if (results.hasOwnProperty(prop))
        csv += prop + ';';
    }

    csv += '\n';

    /* write data */
    for (var d = 0, ds = results.date.length; d < ds; d++) {
      for (var prop in results) {
        if (results.hasOwnProperty(prop)) {
          csv += results[prop][d] + ';';
        }
      }
      csv += '\n';
    }

    var dateTimeStr = new Date().toDateString().replace(/\s/g, '-') + '-' + new Date().toTimeString().replace(/\s/g, '-');
    result_file_url = window.URL.createObjectURL(new Blob([csv], { type : 'text/csv' }));
    /* may not work in safari */
    $(this).attr("href", result_file_url);
    /* set file name as date and replace whitespace */
    $(this).attr("download", 'MONICA-' + dateTimeStr + '.csv');
    /* save to clear URL now? */

  });


  var db = null;
  var req = new XMLHttpRequest();
  req.open('GET', 'dist/monica.sqlite', true);
  req.responseType = "arraybuffer";
  req.onload = function (oEvent) {
    var arrayBuffer = req.response;
    if (arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      db = new SQL.Database(byteArray);

      /* some test */
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
      init();
    }
  };
  req.send(null);    

});

}());