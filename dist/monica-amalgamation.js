var monica = monica || {};
(function () {

var example_config = {
 "sim": {
  "time": {
   "startDate": "1991-01-01",
   "endDate": "1992-12-31"
  },
  "switch": {
   "useSecondaryYieldOn": false,
   "nitrogenResponseOn": true,
   "waterDeficitResponseOn": true,
   "emergenceMoistureControlOn": false,
   "emergenceFloodingControlOn": false
  },
  "init": {
   "percentageFC": 1,
   "soilNitrate": 0.001,
   "soilAmmonium": 0.0001
  }
 },
 "site": {
  "latitude": 52.2,
  "slope": 0,
  "heightNN": 38,
  "atmosphericCO2": 380,
  "windSpeedHeight": 2.5,
  "leachingDepth": 1.5,
  "NDeposition": 20,
  "groundwaterDepthMin": 5,
  "groundwaterDepthMax": 5,
  "groundwaterDepthMinMonth": "April",
  "horizons": [
   {
    "thickness": 0.2,
    "Corg": 0.05,
    "textureClass": "Ls2",
    "sand": 0.15,
    "clay": 0.24,
    "sceleton": 0.02,
    "poreVolume": 0.45,
    "fieldCapacity": 0.33,
    "permanentWiltingPoint": 0.2,
    "pH": 6.9,
    "CN": 10,
    "bulkDensity": 1400
   },
   {
    "thickness": 0.5,
    "Corg": 0.05,
    "textureClass": "Ls2",
    "sand": 0.15,
    "clay": 0.24,
    "sceleton": 0.02,
    "poreVolume": 0.45,
    "fieldCapacity": 0.33,
    "permanentWiltingPoint": 0.2,
    "pH": 6.9,
    "CN": 10,
    "bulkDensity": 1400
   },
   {
    "thickness": 2,
    "Corg": 0.05,
    "textureClass": "Ls2",
    "sand": 0.15,
    "clay": 0.24,
    "sceleton": 0.02,
    "poreVolume": 0.45,
    "fieldCapacity": 0.33,
    "permanentWiltingPoint": 0.2,
    "pH": 6.9,
    "CN": 10,
    "bulkDensity": 1400
   }
  ]
 },
 "crop": {
  "crops": [
   {
    "name": {
     "id": 3,
     "name": "winter rye",
     "gen_type": ""
    },
    "sowingDate": "1991-10-01",
    "rowWidth": 5,
    "plantSpace": 5,
    "plantDryWeight": 225,
    "percNTRansplant": 0.07,
    "finalHarvestDate": "1992-08-01",
    "residuesRemoval": 0.85,
    "tillageOperations": [
     {
      "date": "1991-09-01",
      "method": "Plough",
      "depth": 30
     }
    ],
    "irrigations": [
     {
      "date": "1992-06-01",
      "method": "Sprinkler",
      "eventType": "Fixed",
      "threshold": 0.2,
      "area": 1,
      "amount": 5,
      "NConc": 0
     }
    ],
    "organicFertilisers": [
     {
      "date": "1992-05-01",
      "method": "Fixed",
      "type": {
       "id": 3,
       "om_type": "cattle slurry"
      },
      "amount": 30
     }
    ],
    "mineralFertilisers": [
     {
      "date": "1992-04-01",
      "method": "Fixed",
      "type": {
       "id": 1,
       "name": "Ammonium Nitrate"
      },
      "amount": 40,
      "min": 0,
      "max": 0,
      "delayInDays": 0
     }
    ]
   }
  ]
 }
};
/* math, constants and helper functions */

Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

// Get Day of Year
Date.prototype.dayOfYear = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if(mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function'
  , ENVIRONMENT_IS_WEB = typeof window === 'object'
  , ENVIRONMENT_IS_WORKER = typeof importScripts === 'function'
  ;

var DEBUG = false
  , VERBOSE = true 
  ;

var MSG = {
    INFO: 0
  , WARN: 1
  , ERROR: 2
  , DEBUG: 3
};  

var UNDEFINED = -9999.9
  , UNDEFINED_INT = -9999
  ;

var ROOT = 0
  , LEAF = 1
  , SHOOT = 2
  , STORAGE_ORGAN = 3
  ;

var abs    = Math.abs
  , acos   = Math.acos
  , asin   = Math.asin
  , atan   = Math.atan
  , ceil   = Math.ceil
  , cos    = Math.cos
  , exp    = Math.exp
  , floor  = Math.floor
  , int    = function (x) {
      return x | 0;
    }
  , log    = Math.log
  , log10  = function (x) { 
      return Math.log(x) / Math.LN10; 
    }
  , max    = Math.max
  , min    = Math.min
  , pow    = Math.pow
  , round  = Math.round
  , fixed  = function (n, x) { 
      return x.toFixed(n);
    }
  , roundN = function (n, x) { 
      return parseFloat(x.toFixed(n));
    }
  , sin    = Math.sin
  , sqrt   = Math.sqrt
  , tan    = Math.tan
  , PI     = Math.PI
  ;


// var Eva2_Nutzung = {
//   NUTZUNG_UNDEFINED: 0,
//   NUTZUNG_GANZPFLANZE: 1,
//   NUTZUNG_KORN: 2,
//   NUTZUNG_GRUENDUENGUNG: 7,
//   NUTZUNG_CCM: 8
// };  

var ResultId = [
  //! primary yield for the crop (e.g. the actual fruit)
  'primaryYield',
  //! secondary yield for the crop (e.g. leafs and other stuff useable)
  'secondaryYield',
  //! sum of applied fertilizer for that crop during growth period
  'sumFertiliser',
  //! sum of used irrigation water for the crop during growth period
  'sumIrrigation',
  //! sum of N turnover
  'sumMineralisation',
  //! the monthly average of the average corg content in the first 10 cm soil
  'avg10cmMonthlyAvgCorg',
  //! the monthly average of the average corg content in the first 30 cm soil
  'avg30cmMonthlyAvgCorg',
  //! the monthly average of the summed up water content in the first 90 cm soil
  'mean90cmMonthlyAvgWaterContent',
  //! at some day in the year the sum of the N content in the first 90cm soil
  'sum90cmYearlyNatDay',
  //! the monthly summed up amount of ground water recharge
  'monthlySumGroundWaterRecharge',
  //! the monthly sum of N leaching
  'monthlySumNLeaching',
  //! height of crop at harvesting date
  'cropHeight',
  //! sum of NO3 content in the first 90cm soil at a 'special', hardcoded date
  'sum90cmYearlyNO3AtDay',
  //! sum of NH4 content in the first 90cm soil at a 'special', hardcoded date
  'sum90cmYearlyNH4AtDay',
  //! value of maximal snow depth during simulation duration
  'maxSnowDepth',
  //! sum of snow depth for every day
  'sumSnowDepth',
  //! sum of frost depth
  'sumFrostDepth',
  //! Average soil temperature in the first 30cm soil at 'special', hardcoded date
  'avg30cmSoilTemperature',
  //! Sum of soil temperature in the first 30cm soil at 'special', hardcoded date
  'sum30cmSoilTemperature',
  //! Average soilmoisture content in first 30cm soil at 'special', hardcoded date
  'avg0_30cmSoilMoisture',
  //! Average soilmoisture content in 30-60cm soil at 'special', hardcoded date
  'avg30_60cmSoilMoisture',
  //! Average soilmoisture content in 60-90cm soil at 'special', hardcoded date
  'avg60_90cmSoilMoisture',
  //! water flux at bottom layer of soil at 'special', hardcoded date
  'waterFluxAtLowerBoundary',
  //! capillary rise in first 30 cm soil at special date
  'avg0_30cmCapillaryRise',
  //! capillary rise in 30-60 cm soil at special date
  'avg30_60cmCapillaryRise',
  //! capillary rise in 60-90cm cm soil at special date
  'avg60_90cmCapillaryRise',
  //! percolation ratein first 30 cm soil at special date
  'avg0_30cmPercolationRate',
  //! percolation ratein 30-60 cm soil at special date
  'avg30_60cmPercolationRate',
  //! percolation rate in 60-90cm cm soil at special date
  'avg60_90cmPercolationRate',
  //! sum of surface run off volumes during hole simulation duration
  'sumSurfaceRunOff',
  //! Evapotranspiration amount at a special date
  'evapotranspiration',
  //! Transpiration amount at a special date
  'transpiration',
  //! Evaporation amount at a special date
  'evaporation',
  //! N content in biomass after harvest
  'biomassNContent',
  //! N content in above ground biomass after harvest
  'aboveBiomassNContent',
  //! sum of total N uptake of plant
  'sumTotalNUptake',
  //! sum of CO2 evolution rate in first 30 cm soil at special date
  'sum30cmSMB_CO2EvolutionRate',
  //! volatilised NH3 at a special date
  'NH3Volatilised',
  //! sum of all volatilised NH3
  'sumNH3Volatilised',
  //! sum of denitrification rate in first 30cm at a special date
  'sum30cmActDenitrificationRate',
  //! leaching N at boundary at special date
  'leachingNAtBoundary',
  //! leaching N accumulated for a year
  'yearlySumNLeaching',
  //! Groundwater recharge accumulated for a year
  'yearlySumGroundWaterRecharge',
  //! Evapotranspiration in time of crop cultivation
  'sumETaPerCrop',
  'cropname',
  'primaryYieldTM',
  'secondaryYieldTM',
  'monthlySurfaceRunoff',
  'monthlyPrecip',
  'monthlyETa',
  'monthlySoilMoistureL0',
  'monthlySoilMoistureL1',
  'monthlySoilMoistureL2',
  'monthlySoilMoistureL3',
  'monthlySoilMoistureL4',
  'monthlySoilMoistureL5',
  'monthlySoilMoistureL6',
  'monthlySoilMoistureL7',
  'monthlySoilMoistureL8',
  'monthlySoilMoistureL9',
  'monthlySoilMoistureL10',
  'monthlySoilMoistureL11',
  'monthlySoilMoistureL12',
  'monthlySoilMoistureL13',
  'monthlySoilMoistureL14',
  'monthlySoilMoistureL15',
  'monthlySoilMoistureL16',
  'monthlySoilMoistureL17',
  'monthlySoilMoistureL18',
  'daysWithCrop',
  'NStress',
  'WaterStress',
  'HeatStress',
  'OxygenStress',
  'dev_stage'
];

var perCropResults = [
  'primaryYield',
  'secondaryYield',
  'primaryYieldTM',
  'secondaryYieldTM',
  'sumIrrigation',
  'biomassNContent',
  'aboveBiomassNContent',
  'daysWithCrop',
  'sumTotalNUptake',
  'cropHeight',
  'sumETaPerCrop',
  'cropname',
  'id',
  'NStress',
  'WaterStress',
  'HeatStress',
  'OxygenStress',
];


/**
 * @brief Definition of organic constants
 */
var organicConstants = {
    po_UreaMolecularWeight: 0.06006 //[kg mol-1]
  , po_Urea_to_N: 0.46667 //Converts 1 kg urea to 1 kg N
  , po_NH3MolecularWeight: 0.01401 //[kg mol-1]
  , po_NH4MolecularWeight: 0.01401 //[kg mol-1]
  , po_H2OIonConcentration: 1.0
  , po_pKaHNO2: 3.29 // [] pKa value for nitrous acid
  , po_pKaNH3: 6.5 // [] pKa value for ammonium
  , po_SOM_to_C: 0.57 //: 0.58, // [] converts soil organic matter to carbon
  , po_AOM_to_C: 0.45 // [] converts added organic matter to carbon
};

var Climate = {
    tmin: 0
  , tmax: 1
  , tavg: 2
  , globrad: 3
  , wind: 4
  , precip: 5
  , sunhours: 6
  , relhumid: 7
};

// TODO: do not change JS types. Instead create own type.

Date.prototype.isValid = function () { 
  return (this.toDateString() !== 'Invalid Date'); 
};

//Date.prototype.isLeapYear = function () {
//  return (ceil((new Date(this.getFullYear() + 1, 0, 1) - new Date(this.getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000)) === 366);
//};

/* log function */
var logger = function (type, msg) {

  if (ENVIRONMENT_IS_WORKER) {

    if (!(type === MSG.INFO && !VERBOSE)) {

      switch(type) {
        case MSG.INFO:
          postMessage({ info: msg });
          break;
        case MSG.WARN:
          postMessage({ warn: msg });
          break;
        case MSG.ERROR:
          postMessage({ error: msg });
          break;
        case MSG.DEBUG:
          postMessage({ debug: msg });
          break;
        default:
          postMessage({ msg: msg });
      }

    }

  } else {

    if (!(type === MSG.INFO && !VERBOSE)) {

      switch(type) {
        case MSG.INFO:
          console.log('info: ' + msg);
          break;
        case MSG.WARN:
          console.log('warn: ' + msg);
          break;
        case MSG.ERROR:
          console.log('error: ' + msg);
          break;
        case MSG.DEBUG:
          console.log('debug: ' + msg);
          break;
        default:
          console.log(msg);
      }

    }

  }

};



/* JS debugging */

var debugArgs = function (arguments_, funcName) {

  // TODO: recursive

  if (!DEBUG) return; 

  var args = Array.prototype.slice.call(arguments_)
    , funcName = funcName || ''
    , isInvalid = function (x) {
        if (x instanceof Function)
          return false;
        if (typeof x === 'object') 
          return (x === null || x === undefined);
        if (typeof x === 'string' || x === 'boolean')
          return (x === null || x === undefined);
        return (isNaN(x) || x === null || x === undefined || x === Infinity);
      }
    , doLog = function (x) {
        logger(MSG.DEBUG, 'args: ' + JSON.stringify(x, null, 2));
      }
    ;

  for (var i = 0, is = args.length; i < is; i++) {
    var arg = args[i];
    if (arg && typeof arg === 'object') {
      if (Array.isArray(arg)) {
        arg.forEach(function (e) {
          if (e && typeof e === 'object') {
            if (isTypedArray(e)) {
              for (var i = 0, is = arg.length; i < is; i++) {
                if (isInvalid(arg[i])) {
                  doLog(arg);
                  throw arg;
                }
              }
            } else if (Array.isArray(e)) {
              e.forEach(function (e2) {
                if (isInvalid(e2)) {
                  doLog(e);
                  throw e2;
                }
              });
            } else {
              for (var prop in e) {
                if (e.hasOwnProperty(prop)) {
                  if (isInvalid(e[prop])) {
                    doLog(e);
                    throw prop;
                  }
                }
              }
            }
          } else {
            if (isInvalid(e)) {
              doLog(arg);
              throw e;
            }
          }
        });
      } else if (isTypedArray(arg)) {
        for (var i = 0, is = arg.length; i < is; i++) {
          if (isInvalid(arg[i])) {
            doLog(arg);
            throw arg;
          }
        }
      } else {
        for (var prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            if (isInvalid(arg[prop])) {
              doLog(arg);
              throw arg;
            }
          }
        }
      }
    } else { 
      if (isInvalid(arg)) {
        doLog(args);
        throw arg;
      }
    }
  }

};

var isTypedArray = function (x) {
  return (
    x instanceof Int8Array ||
    x instanceof Uint8Array || 
    x instanceof Uint8ClampedArray || 
    x instanceof Int16Array ||
    x instanceof Uint16Array || 
    x instanceof Int32Array ||
    x instanceof Uint32Array ||
    x instanceof Float64Array || 
    x instanceof Float64Array
  );
}

var debug = function () {

  if (!DEBUG) return;

  // check if it is an arguments object
  if (
    typeof arguments[0] === 'object' &&
    arguments[0].length != undefined && 
    !Array.isArray(arguments[0]) &&
    !isTypedArray(arguments[0])
  ) return debugArgs(arguments[0]);

  if (arguments.length === 2) {
    if (typeof arguments[1] === 'string')
      logger(MSG.DEBUG, arguments[1] + ' = ' + ((typeof arguments[0] === 'object') ? JSON.stringify(arguments[0], null, 1) : arguments[0]));
    if (typeof arguments[0] === 'string')
      logger(MSG.DEBUG, arguments[0] + ' = ' + ((typeof arguments[1] === 'object') ? JSON.stringify(arguments[1], null, 1) : arguments[1]));
  } else if (typeof arguments[0] === 'string') {
    logger(MSG.DEBUG, arguments[0]);
  } else {
    logger(MSG.DEBUG, arguments[0]);
  }

};

var Tools = {

    texture2KA5: function (sand, clay) {

      var textureClass = ''
        , silt = 100 - (sand * 100 + clay * 100)
        ;

      if ((sand + clay + silt) != 100)
        throw '(sand + clay + silt) != 100: ' + (sand + clay + silt);

      if (clay <= 5) {

        if (silt <= 10)
          textureClass = 'Ss';
        else if (silt <= 25)
          textureClass = 'Su2';
        else if (silt <= 40)
          textureClass = 'Su3';
        else if (silt <= 50)
          textureClass = 'Su4';
        else if (silt <= 80)
          textureClass = 'Us';
        else
          textureClass = 'Uu';

      } else if (clay <= 8) {
        
        if (silt <= 10)
          textureClass = 'St2';
        else if (silt <= 25)
          textureClass = 'Sl2';
        else if (silt <= 40)
          textureClass = 'Su3';
        else if (silt <= 50)
          textureClass = 'Su4';
        else if (silt <= 80)
          textureClass = 'Us';
        else
          textureClass = 'Uu';

      } else if (clay <= 12) {
        
        if (silt <= 10)
          textureClass = 'St2';
        else if (silt <= 40)
          textureClass = 'Sl3';
        else if (silt <= 50)
          textureClass = 'Slu';
        else if (silt <= 65)
          textureClass = 'Uls';
        else
          textureClass = 'Ut2';
      
      } else if (clay <= 17) {
        
        if (silt <= 10)
          textureClass = 'St2';
        else if (silt <= 40)
          textureClass = 'Sl4';
        else if (silt <= 50)
          textureClass = 'Slu';
        else if (silt <= 65)
          textureClass = 'Uls';
        else
          textureClass = 'Ut3';
      
      } else if (clay <= 25) {

        if (silt <= 15)
          textureClass = 'St3';
        else if (silt <= 30)
          textureClass = 'Ls4';
        else if (silt <= 40)
          textureClass = 'Ls3';
        else if (silt <= 50)
          textureClass = 'Ls2';
        else if (silt <= 65)
          textureClass = 'Lu';
        else
          textureClass = 'Ut4';
      
      } else if (clay <= 30) {

        if (silt <= 15)
          textureClass = 'Ts4';
        else if (silt <= 30)
          textureClass = 'Lts';
        else if (silt <= 50)
          textureClass = 'Lt2';
        else if (silt <= 65)
          textureClass = 'Lu';
        else
          textureClass = 'Tu4';

      } else if (clay <= 35) {

        if (silt <= 15)
          textureClass = 'Ts4';
        else if (silt <= 30)
          textureClass = 'Lts';
        else if (silt <= 50)
          textureClass = 'Lt2';
        else if (silt <= 65)
          textureClass = 'Tu3';
        else
          textureClass = 'Tu4';    
      
      } else if (clay <= 45) {

        if (silt <= 15)
          textureClass = 'Ts3';
        else if (silt <= 30)
          textureClass = 'Lts';
        else if (silt <= 50)
          textureClass = 'Lt3';
        else
          textureClass = 'Tu3';

      } else if (clay <= 65) {
        
        if (silt <= 15)
          textureClass = 'Ts2';
        else if (silt <= 30)
          textureClass = 'Tl';
        else
          textureClass = 'Tu2';

      } else {
        textureClass = 'Tt'
      }

      return textureClass;
    }

  , KA52sand: function (soilTextureClass) {
      
      var x = 0.0;

      if(soilTextureClass == "fS")
        x = 0.84;
      else if(soilTextureClass == "fSms")
        x = 0.86;
      else if(soilTextureClass == "fSgs")
        x = 0.88;
      else if(soilTextureClass == "gS")
        x = 0.93;
      else if(soilTextureClass == "mSgs")
        x = 0.96;
      else if(soilTextureClass == "mSfs")
        x = 0.93;
      else if(soilTextureClass == "mS")
        x = 0.96;
      else if(soilTextureClass == "Ss")
        x = 0.93;
      else if(soilTextureClass == "Sl2")
        x = 0.76;
      else if(soilTextureClass == "Sl3")
        x = 0.65;
      else if(soilTextureClass == "Sl4")
        x = 0.60;
      else if(soilTextureClass == "Slu")
        x = 0.43;
      else if(soilTextureClass == "St2")
        x = 0.84;
      else if(soilTextureClass == "St3")
        x = 0.71;
      else if(soilTextureClass == "Su2")
        x = 0.80;
      else if(soilTextureClass == "Su3")
        x = 0.63;
      else if(soilTextureClass == "Su4")
        x = 0.56;
      else if(soilTextureClass == "Ls2")
        x = 0.34;
      else if(soilTextureClass == "Ls3")
        x = 0.44;
      else if(soilTextureClass == "Ls4")
        x = 0.56;
      else if(soilTextureClass == "Lt2")
        x = 0.30;
      else if(soilTextureClass == "Lt3")
        x = 0.20;
      else if(soilTextureClass == "LtS")
        x = 0.42;
      else if(soilTextureClass == "Lu")
        x = 0.19;
      else if(soilTextureClass == "Uu")
        x = 0.10;
      else if(soilTextureClass == "Uls")
        x = 0.30;
      else if(soilTextureClass == "Us")
        x = 0.31;
      else if(soilTextureClass == "Ut2")
        x = 0.13;
      else if(soilTextureClass == "Ut3")
        x = 0.11;
      else if(soilTextureClass == "Ut4")
        x = 0.09;
      else if(soilTextureClass == "Utl")
        x = 0.19;
      else if(soilTextureClass == "Tt")
        x = 0.17;
      else if(soilTextureClass == "Tl")
        x = 0.17;
      else if(soilTextureClass == "Tu2")
        x = 0.12;
      else if(soilTextureClass == "Tu3")
        x = 0.10;
      else if(soilTextureClass == "Ts3")
        x = 0.52;
      else if(soilTextureClass == "Ts2")
        x = 0.37;
      else if(soilTextureClass == "Ts4")
        x = 0.62;
      else if(soilTextureClass == "Tu4")
        x = 0.05;
      else if(soilTextureClass == "L")
        x = 0.35;
      else if(soilTextureClass == "S")
        x = 0.93;
      else if(soilTextureClass == "U")
        x = 0.10;
      else if(soilTextureClass == "T")
        x = 0.17;
      else if(soilTextureClass == "HZ1")
        x = 0.30;
      else if(soilTextureClass == "HZ2")
        x = 0.30;
      else if(soilTextureClass == "HZ3")
        x = 0.30;
      else if(soilTextureClass == "Hh")
        x = 0.15;
      else if(soilTextureClass == "Hn")
        x = 0.15;
      else
        x = 0.66;

      return x;
    }

  , KA52clay: function (soilTextureClass) {
      
      var x = 0.0;

      if(soilTextureClass == "fS")
        x = 0.02;
      else if(soilTextureClass == "fSms")
        x = 0.02;
      else if(soilTextureClass == "fSgs")
        x = 0.02;
      else if(soilTextureClass == "gS")
        x = 0.02;
      else if(soilTextureClass == "mSgs")
        x = 0.02;
      else if(soilTextureClass == "mSfs")
        x = 0.02;
      else if(soilTextureClass == "mS")
        x = 0.02;
      else if(soilTextureClass == "Ss")
        x = 0.02;
      else if(soilTextureClass == "Sl2")
        x = 0.06;
      else if(soilTextureClass == "Sl3")
        x = 0.10;
      else if(soilTextureClass == "Sl4")
        x = 0.14;
      else if(soilTextureClass == "Slu")
        x = 0.12;
      else if(soilTextureClass == "St2")
        x = 0.11;
      else if(soilTextureClass == "St3")
        x = 0.21;
      else if(soilTextureClass == "Su2")
        x = 0.02;
      else if(soilTextureClass == "Su3")
        x = 0.04;
      else if(soilTextureClass == "Su4")
        x = 0.04;
      else if(soilTextureClass == "Ls2")
        x = 0.21;
      else if(soilTextureClass == "Ls3")
        x = 0.21;
      else if(soilTextureClass == "Ls4")
        x = 0.21;
      else if(soilTextureClass == "Lt2")
        x = 0.30;
      else if(soilTextureClass == "Lt3")
        x = 0.40;
      else if(soilTextureClass == "Lts")
        x = 0.35;
      else if(soilTextureClass == "Lu")
        x = 0.23;
      else if(soilTextureClass == "Uu")
        x = 0.04;
      else if(soilTextureClass == "Uls")
        x = 0.12;
      else if(soilTextureClass == "Us")
        x = 0.04;
      else if(soilTextureClass == "Ut2")
        x = 0.10;
      else if(soilTextureClass == "Ut3")
        x = 0.14;
      else if(soilTextureClass == "Ut4")
        x = 0.21;
      else if(soilTextureClass == "Utl")
        x = 0.23;
      else if(soilTextureClass == "Tt")
        x = 0.82;
      else if(soilTextureClass == "Tl")
        x = 0.55;
      else if(soilTextureClass == "Tu2")
        x = 0.55;
      else if(soilTextureClass == "Tu3")
        x = 0.37;
      else if(soilTextureClass == "Ts3")
        x = 0.40;
      else if(soilTextureClass == "Ts2")
        x = 0.55;
      else if(soilTextureClass == "Ts4")
        x = 0.30;
      else if(soilTextureClass == "Tu4")
        x = 0.30;
      else if(soilTextureClass == "L")
        x = 0.31;
      else if(soilTextureClass == "S")
        x = 0.02;
      else if(soilTextureClass == "U")
        x = 0.04;
      else if(soilTextureClass == "T")
        x = 0.82;
      else if(soilTextureClass == "HZ1")
        x = 0.15;
      else if(soilTextureClass == "HZ2")
        x = 0.15;
      else if(soilTextureClass == "HZ3")
        x = 0.15;
      else if(soilTextureClass == "Hh")
        x = 0.1;
      else if(soilTextureClass == "Hn")
        x = 0.1;

      return x;
    }

    /* 
      Bodenkundliche Kartieranleitung (2005) S.125 

      Estimate raw density ("Trockenrohdichte") from "effektive Lagerungsdichte"
    */

  , ld_eff2trd: function (ldEff, clay) {
      
      var x = 0.0;

      switch (ldEff)
      {
      case 1:
        x = 1.3;
        break;
      case 2:
        x = 1.5;
        break;
      case 3:
        x = 1.7;
        break;
      case 4:
        x = 1.9;
        break;
      case 5:
        x = 2.1;
        break;
      default: // JS!
        x = 1.7;      
      }

      return x - (0.9 * clay);
    }
  ,  
    texture2lambda: function (sand, clay) {
      return (2.0 * (sand * sand * 0.575)) + (clay * 0.1) + ((1.0 - sand - clay) * 0.35);
    }
  , sunshine2globalRadiation: function (yd, sonn, lat, asMJpm2pd) {
      var pi=4.0*atan(1.0);
      var dec=-23.4*cos(2*pi*(yd+10)/365);
      var sinld=sin(dec*pi/180)*sin(lat*pi/180);
      var cosld=cos(dec*pi/180)*cos(lat*pi/180);
      var dl=12*(pi+2*asin(sinld/cosld))/pi;
      var dle=12*(pi+2*asin((-sin(8*pi/180)+sinld)/cosld))/pi;
      var rdn=3600*(sinld*dl+24/pi*cosld*sqrt(1.0-(sinld/cosld)*(sinld/cosld)));
      var drc=1300*rdn*exp(-0.14/(rdn/(dl*3600)));
      var dro=0.2*drc;
      var dtga=sonn/dle*drc+(1-sonn/dle)*dro;
      var t = dtga/10000.0;
      //convert J/cm²/d to MJ/m²/d
      //1cm²=1/(100*100)m², 1J = 1/1000000MJ
      //-> (t * 100.0 * 100.0) / 1000000.0 -> t / 100
      return asMJpm2pd ? t/100.0 : t;
    }
};


/*
  Changes:
    - vs_SoilBulkDensity: wenn nicht in json, dann aus rawdensity schätzen.

*/


var YieldComponent = function (oid, yp, ydm) {
  
  var yc = (arguments[0] instanceof YieldComponent) ? arguments[0] : null;

  this.organId = (yc) ? yc.organId : oid;
  this.yieldPercentage = (yc) ? yc.yieldPercentage : yp;
  this.yieldDryMatter = (yc) ? yc.yieldDryMatter : ydm;
  
};


var NMinCropParameters = function (samplingDepth, nTarget, nTarget30) {

  this.samplingDepth = samplingDepth || 0;
  this.nTarget = nTarget || 0;
  this.nTarget30 = nTarget30 || 0;

  this.toString = function () {
    return "samplingDepth: " + this.samplingDepth + " nTarget: " + this.nTarget + " nTarget40: " + this.nTarget30;
  };

};


var NMinUserParameters = function (min, max, delayInDays) {

  this.min = min || 0;
  this.max = max || 0;
  this.delayInDays = delayInDays || 0;

  this.toString = function () {
    return "min: " + min + " max: " + max + " delay: " + delayInDays + " days";
  };

};


var IrrigationParameters = function (n, s) {
  
  this.nitrateConcentration = n || 0;
  this.sulfateConcentration = s || 0;

  this.toString = function () {
    return "nitrateConcentration: " + this.nitrateConcentration + " sulfateConcentration: " + this.sulfateConcentration;
  };

};


var AutomaticIrrigationParameters = function (a, t, n, s) {
  
  this.amount = a || 17; 
  this.threshold = t || 0.35;
  this.nitrateConcentration = n || 0;
  this.sulfateConcentration = s || 0;

  this.toString = function () {
    return "amount: " + this.amount + " threshold: " + this.threshold + " " + this.prototype.toString();
  };

};

AutomaticIrrigationParameters.prototype = new IrrigationParameters();


var ResidueParameters = function () {
  this.vo_AOM_DryMatterContent = 0.289;
  this.vo_AOM_NH4Content = 0.007;
  this.vo_AOM_NO3Content = 0.0;
  this.vo_AOM_CarbamidContent = 0.0;
  this.vo_AOM_SlowDecCoeffStandard = 2.0e-4;
  this.vo_AOM_FastDecCoeffStandard = 2.0e-3;
  this.vo_PartAOM_to_AOM_Slow = 0.72;
  this.vo_PartAOM_to_AOM_Fast = 0.18;
  this.vo_CN_Ratio_AOM_Slow = 100.0;
  this.vo_CN_Ratio_AOM_Fast = 7.3;
  this.vo_PartAOM_Slow_to_SMB_Slow = 0.0;
  this.vo_PartAOM_Slow_to_SMB_Fast = 1.0;
};


var AOM_Properties = function () {
  this.vo_AOM_Slow = 0.0;  /**< C content in slowly decomposing added organic matter pool [kgC m-3] */
  this.vo_AOM_Fast = 0.0; /**< C content in rapidly decomposing added organic matter pool [kgC m-3] */
  this.vo_AOM_SlowDecRate = 0.0; /**< Rate for slow AOM transformation that will be calculated. */
  this.vo_AOM_FastDecRate = 0.0; /**< Rate for fast AOM transformation that will be calculated. */
  this.vo_AOM_SlowDecCoeff = 0.0; /**< Is dependent on environment */
  this.vo_AOM_FastDecCoeff = 0.0; /**< Is dependent on environment */
  this.vo_AOM_SlowDecCoeffStandard = 1.0; /**< Decomposition rate coefficient for slow AOM pool at standard conditions */
  this.vo_AOM_FastDecCoeffStandard = 1.0; /**< Decomposition rate coefficient for fast AOM pool at standard conditions */
  this.vo_PartAOM_Slow_to_SMB_Slow = 0.0; /**< Partial transformation from AOM to SMB (soil microbiological biomass) for slow AOMs. */
  this.vo_PartAOM_Slow_to_SMB_Fast = 0.0; /**< Partial transformation from AOM to SMB (soil microbiological biomass) for fast AOMs.*/
  this.vo_CN_Ratio_AOM_Slow = 1.0; /**< Used for calculation N-value if only C-value is known. Usually a constant value.*/
  this.vo_CN_Ratio_AOM_Fast = 1.0; /**< C-N-Ratio is dependent on the nutritional condition of the plant. */
  this.vo_DaysAfterApplication = 0; /**< Fertilization parameter */  
  this.vo_AOM_DryMatterContent = 0.0; /**< Fertilization parameter */
  this.vo_AOM_NH4Content = 0.0; /**< Fertilization parameter */
  this.vo_AOM_SlowDelta = 0.0; /**< Difference of AOM slow between to timesteps */
  this.vo_AOM_FastDelta = 0.0; /**< Difference of AOM slow between to timesteps */
  this.incorporation = false;  /**< True if organic fertilizer is added with a subsequent incorporation. */
};


var CropParameters = function () {

  this.pc_NumberOfDevelopmentalStages = 0; 
  this.pc_CropName; /**< Name */
  this.pc_NumberOfOrgans = 0; 
  this.pc_CarboxylationPathway; 
  this.pc_DefaultRadiationUseEfficiency;
  this.pc_FixingN;
  this.pc_InitialKcFactor; 
  this.pc_LuxuryNCoeff; 
  this.pc_MaxAssimilationRate;
  this.pc_MaxCropDiameter;
  this.pc_MaxCropHeight;
  this.pc_CropHeightP1; 
  this.pc_CropHeightP2; 
  this.pc_StageAtMaxHeight;
  this.pc_StageAtMaxDiameter; 
  this.pc_MinimumNConcentration; 
  this.pc_MinimumTemperatureForAssimilation; 
  this.pc_NConcentrationAbovegroundBiomass; 
  this.pc_NConcentrationB0; 
  this.pc_NConcentrationPN; 
  this.pc_NConcentrationRoot; 
  this.pc_ResidueNRatio; 
  this.pc_DevelopmentAccelerationByNitrogenStress; 

  this.pc_AssimilatePartitioningCoeff = [];
  this.pc_OrganSenescenceRate = [];

  this.pc_BaseDaylength = [];
  this.pc_BaseTemperature = [];
  this.pc_OptimumTemperature = [];
  this.pc_DaylengthRequirement = [];
  this.pc_DroughtStressThreshold = [];
  this.pc_OrganMaintenanceRespiration = [];
  this.pc_OrganGrowthRespiration = [];
  this.pc_SpecificLeafArea = [];
  this.pc_StageMaxRootNConcentration = [];
  this.pc_StageKcFactor = [];
  this.pc_StageTemperatureSum = [];
  this.pc_VernalisationRequirement = [];
  this.pc_InitialOrganBiomass = [];
  this.pc_CriticalOxygenContent = [];

  this.pc_CropSpecificMaxRootingDepth;
  this.pc_AbovegroundOrgan = [];
  this.pc_StorageOrgan = [];

  this.pc_SamplingDepth;
  this.pc_TargetNSamplingDepth;
  this.pc_TargetN30;
  this.pc_HeatSumIrrigationStart;
  this.pc_HeatSumIrrigationEnd;
  this.pc_MaxNUptakeParam;
  this.pc_RootDistributionParam;
  this.pc_PlantDensity;
  this.pc_RootGrowthLag;
  this.pc_MinimumTemperatureRootGrowth;
  this.pc_InitialRootingDepth;
  this.pc_RootPenetrationRate;
  this.pc_RootFormFactor;
  this.pc_SpecificRootLength;
  this.pc_StageAfterCut;
  this.pc_CriticalTemperatureHeatStress;
  this.pc_LimitingTemperatureHeatStress;
  this.pc_BeginSensitivePhaseHeatStress;
  this.pc_EndSensitivePhaseHeatStress;
  this.pc_CuttingDelayDays;
  this.pc_FieldConditionModifier;
  this.pc_DroughtImpactOnFertilityFactor;

  this.organIdsForPrimaryYield = [];
  this.organIdsForSecondaryYield = [];
  this.organIdsForCutting = [];

  // test jv kg DM ha-1
  // this.maxRootDM = 0;

  this.resizeStageOrganVectors = function () {
    var is = this.pc_NumberOfDevelopmentalStages - this.pc_AssimilatePartitioningCoeff.length;
    for (var i = 0; i < is; i++) {
      var a = new Array(this.pc_NumberOfOrgans);
      this.pc_AssimilatePartitioningCoeff.push(a);
    } 
    var is = this.pc_NumberOfDevelopmentalStages - this.pc_OrganSenescenceRate.length;
    for (var i = 0; i < is; i++) {
      var a = new Array(this.pc_NumberOfOrgans);
      this.pc_OrganSenescenceRate.push(a);
    }
  };

  /**
   * @brief Returns a string of information about crop parameters.
   *
   * Generates a string that contains all relevant crop parameter information.
   *
   * @return String of crop information.
   */
  this.toString = function () {

    var s = '', endl = '\n';

    s += "pc_CropName:\t" + this.pc_CropName + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_NumberOfDevelopmentalStages:\t" + this.pc_NumberOfDevelopmentalStages + endl;
    s += "pc_NumberOfOrgans:\t\t\t\t" + this.pc_NumberOfOrgans + endl;
    
    s += "------------------------------------------------" + endl;

    // assimilate partitioning coefficient matrix
    s += "pc_AssimilatePartitioningCoeff:\t" + endl;
    for (var i = 0; i < this.pc_AssimilatePartitioningCoeff.length; i++)   {
      for (var j = 0; j < this.pc_AssimilatePartitioningCoeff[i].length; j++) {
        s += this.pc_AssimilatePartitioningCoeff[i][j] + " ";
      }
      s += endl;
    }
    s += "------------------------------------------------" + endl;

    s += "pc_CarboxylationPathway:\t\t\t\t" + this.pc_CarboxylationPathway + endl;
    s += "pc_MaxAssimilationRate:\t\t\t\t\t" + this.pc_MaxAssimilationRate + endl;
    s += "pc_MinimumTemperatureForAssimilation:\t" + this.pc_MinimumTemperatureForAssimilation + endl;
    s += "pc_CropSpecificMaxRootingDepth:\t\t\t" + this.pc_CropSpecificMaxRootingDepth + endl;
    s += "pc_InitialKcFactor:\t\t\t\t\t\t" + this.pc_InitialKcFactor + endl;
    s += "pc_MaxCropDiameter:\t\t\t\t\t\t" + this.pc_MaxCropDiameter + endl;
    s += "pc_StageAtMaxDiameter:\t\t\t\t\t" + this.pc_StageAtMaxDiameter + endl;
    s += "pc_PlantDensity:\t\t\t\t\t\t" + this.pc_PlantDensity + endl;
    s += "pc_DefaultRadiationUseEfficiency:\t\t" + this.pc_DefaultRadiationUseEfficiency + endl;
    s += "pc_StageAfterCut:\t\t\t\t\t\t" + this.pc_StageAfterCut + endl;
    s += "pc_CuttingDelayDays:\t\t\t\t\t" + this.pc_CuttingDelayDays + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_RootDistributionParam:\t\t\t" + this.pc_RootDistributionParam + endl;
    s += "pc_RootGrowthLag:\t\t\t\t\t" + this.pc_RootGrowthLag + endl;
    s += "pc_MinimumTemperatureRootGrowth:\t" + this.pc_MinimumTemperatureRootGrowth + endl;
    s += "pc_InitialRootingDepth:\t\t\t\t" + this.pc_InitialRootingDepth + endl;
    s += "pc_RootPenetrationRate:\t\t\t\t" + this.pc_RootPenetrationRate + endl;
    s += "pc_RootFormFactor:\t\t\t\t\t" + this.pc_RootFormFactor + endl;
    s += "pc_SpecificRootLength:\t\t\t\t" + this.pc_SpecificRootLength + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_MaxCropHeight:\t\t" + this.pc_MaxCropHeight + endl;
    s += "pc_CropHeightP1:\t\t" + this.pc_CropHeightP1 + endl;
    s += "pc_CropHeightP2:\t\t" + this.pc_CropHeightP2 + endl;
    s += "pc_StageAtMaxHeight:\t" + this.pc_StageAtMaxHeight + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_FixingN:\t\t\t\t\t" + this.pc_FixingN + endl;
    s += "pc_MinimumNConcentration:\t" + this.pc_MinimumNConcentration + endl;
    s += "pc_LuxuryNCoeff:\t\t\t" + this.pc_LuxuryNCoeff + endl;
    s += "pc_NConcentrationB0:\t\t" + this.pc_NConcentrationB0 + endl;
    s += "pc_NConcentrationPN:\t\t" + this.pc_NConcentrationPN + endl;
    s += "pc_NConcentrationRoot:\t\t" + this.pc_NConcentrationRoot + endl;
    s += "pc_ResidueNRatio:\t\t\t" + this.pc_ResidueNRatio + endl;
    s += "pc_MaxNUptakeParam:\t\t\t" + this.pc_MaxNUptakeParam + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_DevelopmentAccelerationByNitrogenStress:\t" + this.pc_DevelopmentAccelerationByNitrogenStress + endl;
    s += "pc_NConcentrationAbovegroundBiomass:\t\t" + this.pc_NConcentrationAbovegroundBiomass + endl;
    s += "pc_DroughtImpactOnFertilityFactor:\t\t\t" + this.pc_DroughtImpactOnFertilityFactor + endl;

    s += "------------------------------------------------" + endl;

    s += "pc_SamplingDepth:\t\t\t\t\t" + this.pc_SamplingDepth + endl;
    s += "pc_TargetNSamplingDepth:\t\t\t" + this.pc_TargetNSamplingDepth + endl;
    s += "pc_TargetN30:\t\t\t\t\t\t" + this.pc_TargetN30 + endl;
    s += "pc_HeatSumIrrigationStart:\t\t\t" + this.pc_HeatSumIrrigationStart + endl;
    s += "pc_HeatSumIrrigationEnd:\t\t\t" + this.pc_HeatSumIrrigationEnd + endl;
    s += "pc_CriticalTemperatureHeatStress:\t" + this.pc_CriticalTemperatureHeatStress + endl;
    s += "pc_LimitingTemperatureHeatStress:\t" + this.pc_LimitingTemperatureHeatStress + endl;
    s += "pc_BeginSensitivePhaseHeatStress:\t" + this.pc_BeginSensitivePhaseHeatStress + endl;
    s += "pc_EndSensitivePhaseHeatStress:\t\t" + this.pc_EndSensitivePhaseHeatStress + endl;

    //s + endl;
    s += "------------------------------------------------" + endl;
    // above-ground organ
    s += "pc_AbovegroundOrgan:" + endl;
    for (var i = 0; i < this.pc_AbovegroundOrgan.length; i++) 
      s += (this.pc_AbovegroundOrgan[i] == 1) + " ";

    s += endl;
    s += endl;

    // initial organic biomass
    s  += "pc_InitialOrganBiomass:" + endl;
    for (var i = 0; i < this.pc_InitialOrganBiomass.length; i++)
      s += this.pc_InitialOrganBiomass[i] + " ";

    s += endl;
    s += endl;

    // organ maintenance respiration rate
    s += "pc_OrganMaintenanceRespiration:" + endl;
    for (var i = 0; i < this.pc_OrganMaintenanceRespiration.length; i++)
      s += this.pc_OrganMaintenanceRespiration[i] + " ";

    s += endl;
    s += endl;

    // organ growth respiration rate
    s  += "pc_OrganGrowthRespiration:" + endl;
    for (var i = 0; i < this.pc_OrganGrowthRespiration.length; i++)
      s += this.pc_OrganGrowthRespiration[i] + " ";

    s += endl;
    s += endl;

    // organ senescence rate
    s += "pc_OrganSenescenceRate:" + endl;
    for (var i = 0; i < this.pc_OrganSenescenceRate.length; i++) {
      for (var j = 0; j < this.pc_OrganSenescenceRate[i].length; j++) {
        s += this.pc_OrganSenescenceRate[i][j] + " ";    
      }
      s += endl;
   }

    s += "------------------------------------------------" + endl;
    //s + endl;  
    //s + endl;  

    // stage temperature sum
    s += "pc_StageTemperatureSum:" + endl;
    for (var i = 0; i < this.pc_StageTemperatureSum.length; i++)
      s += this.pc_StageTemperatureSum[i] + " ";

    s += endl;
    s += endl;  

    // Base day length
    s += "pc_BaseDaylength: " + endl;
    for (var i = 0; i < this.pc_BaseDaylength.length; i++)
      s += this.pc_BaseDaylength[i] + " ";

    s += endl;
    s += endl;  

    // base temperature
    s += "pc_BaseTemperature: " + endl;
    for (var i = 0; i < this.pc_BaseTemperature.length; i++)
      s += this.pc_BaseTemperature[i] + " ";

    s += endl;
    s += endl;  

    // optimum temperature
    s += "pc_OptimumTemperature: " + endl;
    for (var i = 0; i < this.pc_OptimumTemperature.length; i++)
      s += this.pc_OptimumTemperature[i] + " ";

    s += endl;
    s += endl;  

    // day length requirement
    s += "pc_DaylengthRequirement: " + endl;
    for (var i = 0; i < this.pc_DaylengthRequirement.length; i++)
      s += this.pc_DaylengthRequirement[i] + " ";

    s += endl;
    s += endl;  

    // specific leaf area
    s += "pc_SpecificLeafArea:" + endl;
    for (var i = 0; i < this.pc_SpecificLeafArea.length; i++)
      s += this.pc_SpecificLeafArea[i] + " ";

    s += endl;
    s += endl;  

    // stage max root n content
    s += "pc_StageMaxRootNConcentration:" + endl;
    for (var i = 0; i < this.pc_StageMaxRootNConcentration.length; i++)
      s += this.pc_StageMaxRootNConcentration[i] + " ";

    s += endl;
    s += endl;  

    // stage kc factor
    s += "pc_StageKcFactor:" + endl;
    for (var i = 0; i < this.pc_StageKcFactor.length; i++)
      s += this.pc_StageKcFactor[i] + " ";

    s += endl;
    s += endl;  

    // drought stress treshold
    s += "pc_DroughtStressThreshold:" + endl;
    for (var i = 0; i < this.pc_DroughtStressThreshold.length; i++)
      s += this.pc_DroughtStressThreshold[i] + " ";

    s += endl;
    s += endl;  

    // vernalisation requirement
    s += "pc_VernalisationRequirement:" + endl;
    for (var i = 0; i < this.pc_VernalisationRequirement.length; i++)
      s += this.pc_VernalisationRequirement[i] + " ";

    s += endl;
    s += endl;  

    // critical oxygen content
    s += "pc_CriticalOxygenContent:" + endl;
    for (var i = 0; i < this.pc_CriticalOxygenContent.length; i++)
      s += this.pc_CriticalOxygenContent[i] + " ";

    s += endl;

    return s;
  };


};


var GeneralParameters = function (
  _ps_LayerThickness,
  ps_ProfileDepth, 
  ps_MaximumMineralisationDepth,
  pc_NitrogenResponseOn,
  pc_WaterDeficitResponseOn,
  pc_EmergenceFloodingControlOn,
  pc_EmergenceMoistureControlOn
) {

  this._ps_LayerThickness = _ps_LayerThickness || 0.1,
  this.ps_ProfileDepth = ps_ProfileDepth || 2.0,
  this.ps_LayerThickness  = new Float64Array(int(this.ps_ProfileDepth / this._ps_LayerThickness)),
  this.ps_MaxMineralisationDepth = ps_MaximumMineralisationDepth || 0.4,
  this.pc_NitrogenResponseOn = pc_NitrogenResponseOn || true,
  this.pc_WaterDeficitResponseOn = pc_WaterDeficitResponseOn || true,
  this.pc_EmergenceFloodingControlOn = pc_EmergenceFloodingControlOn || true,
  this.pc_EmergenceMoistureControlOn = pc_EmergenceMoistureControlOn || true;

  for (var i = 0; i < this.ps_LayerThickness.length; i++)
    this.ps_LayerThickness[i] = this._ps_LayerThickness;

  this.ps_NumberOfLayers = function () { 
    return this.ps_LayerThickness.length;
  };

};


var SiteParameters = function () {
    
  this.vs_Latitude = 60.0;
  this.vs_Slope = 0.01;
  this.vs_HeightNN = 50.0;
  this.vs_GroundwaterDepth = 70.0;
  this.vs_Soil_CN_Ratio = 10.0;
  this.vs_DrainageCoeff = 1.0;
  this.vq_NDeposition = 30.0;
  this.vs_MaxEffectiveRootingDepth = 2.0;

};


var SoilParameters = function () {

  this.vs_SoilSandContent = 0.4;
  this.vs_SoilClayContent = 0.05;
  this.vs_SoilpH = 6.9;
  this.vs_SoilStoneContent = -1; // JS! add initialization
  this.vs_Lambda = -1; // JS! add initialization
  this.vs_FieldCapacity = -1; // JS! add initialization
  this.vs_Saturation = -1; // JS! add initialization
  this.vs_PermanentWiltingPoint = -1; // JS! add initialization
  this.vs_SoilTexture = ''; // JS! add initialization
  this.vs_SoilAmmonium = -1;
  this.vs_SoilNitrate = -1;

  this._vs_SoilRawDensity = -1;
  this._vs_SoilBulkDensity = -1;
  this._vs_SoilOrganicCarbon = -1;
  this._vs_SoilOrganicMatter = -1;

  this.isValid = function () {

    var is_valid = true;

    if (this.vs_FieldCapacity <= 0) {
        logger(MSG.WARN, "SoilParameters::Error: No field capacity defined in database for " + this.vs_SoilTexture + " , RawDensity: "+ this._vs_SoilRawDensity);
        is_valid = false;
    }
    if (this.vs_Saturation <= 0) {
        logger(MSG.WARN, "SoilParameters::Error: No saturation defined in database for " + this.vs_SoilTexture + " , RawDensity: " + this._vs_SoilRawDensity);
        is_valid = false;
    }
    if (this.vs_PermanentWiltingPoint <= 0) {
        logger(MSG.WARN, "SoilParameters::Error: No saturation defined in database for " + this.vs_SoilTexture + " , RawDensity: " + this._vs_SoilRawDensity);
        is_valid = false;
    }

    if (this.vs_SoilSandContent<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid soil sand content: "+ this.vs_SoilSandContent);
        is_valid = false;
    }

    if (this.vs_SoilClayContent<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid soil clay content: "+ this.vs_SoilClayContent);
        is_valid = false;
    }

    if (this.vs_SoilpH<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid soil ph value: "+ this.vs_SoilpH);
        is_valid = false;
    }

    if (this.vs_SoilStoneContent<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid soil stone content: "+ this.vs_SoilStoneContent);
        is_valid = false;
    }

    if (this.vs_Saturation<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid value for saturation: "+ this.vs_Saturation);
        is_valid = false;
    }

    if (this.vs_PermanentWiltingPoint<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid value for permanent wilting point: "+ this.vs_PermanentWiltingPoint);
        is_valid = false;
    }
/*
    if (this._vs_SoilRawDensity<0) {
        logger(MSG.WARN, "SoilParameters::Error: Invalid soil raw density: "+ this._vs_SoilRawDensity);
        is_valid = false;
    }
*/
    return is_valid;
  };

  /**
   * @brief Returns raw density of soil
   * @return raw density of soil
   */
  this.vs_SoilRawDensity = function () {
    // conversion from g cm-3 in kg m-3
    return this._vs_SoilRawDensity * 1000;
  };

  /**
   * @brief Sets soil raw density
   * @param srd New soil rad density
   */
  this.set_vs_SoilRawDensity = function (srd) {
    this._vs_SoilRawDensity = srd;
  };

  /**
   * @brief Returns soil organic carbon.
   * @return soil organic carbon
   */
  this.vs_SoilOrganicCarbon = function () {
    if (this._vs_SoilOrganicMatter < 0)
      return this._vs_SoilOrganicCarbon;

    return this._vs_SoilOrganicMatter * organicConstants.po_SOM_to_C;
  };

  /**
   * @brief Setter of soil organic carbon.
   * @param soc New soil organic carbon
   */
  this.set_vs_SoilOrganicCarbon = function (soc) {
    this._vs_SoilOrganicCarbon = soc;
  };

  /**
   * @brief Getter for soil organic matter.
   * @return Soil organic matter
   */
  this.vs_SoilOrganicMatter = function () {
    if (this._vs_SoilOrganicCarbon < 0)
      return this._vs_SoilOrganicMatter;
    return this._vs_SoilOrganicCarbon / organicConstants.po_SOM_to_C;
  };

  /**
   * @brief Setter for soil organic matter.
   * @param som New soil organic matter
   */
  this.set_vs_SoilOrganicMatter = function (som) {
    this._vs_SoilOrganicMatter = som;
  };

  /**
   * @brief Getter for silt content
   * @return silt content
   */
  this.vs_SoilSiltContent = function () {
    if ((this.vs_SoilSandContent - 0.001) < 0 && (this.vs_SoilClayContent - 0.001) < 0)
      return 0;

    return 1 - this.vs_SoilSandContent - this.s_SoilClayContent;
  };

  /**
   * @brief Getter for soil bulk density.
   * @return bulk density [kg m-3]
   */
  this.vs_SoilBulkDensity = function () {
    if (this._vs_SoilRawDensity < 0)
      return this._vs_SoilBulkDensity;

    return (this._vs_SoilRawDensity + (0.009 * 100 * this.vs_SoilClayContent)) * 1000;
    //return _vs_SoilBulkDensity * 1000;
  };

  /**
   * @brief Setter for soil bulk density.
   * @param soilBulkDensity [g cm-3]
   */
  this.set_vs_SoilBulkDensity = function (sbd) {
    this._vs_SoilBulkDensity = sbd;
  };

  /**
   * @brief Returns lambda from soil texture
   *
   * @param lambda
   *
   * @return
   */
  this.texture2lambda = function (sand, clay) {
    return Tools.texture2lambda(sand, clay);
  };

  /**
   * @brief Serializes soil parameters into a string.
   * @return String of soil parameters
   */
  this.toString = function () {
    var s = '', endl = '\n';
    s += "vs_Soilph: " + vs_SoilpH + endl
      + "vs_SoilOrganicCarbon: " + vs_SoilOrganicCarbon() + endl
      + "vs_SoilOrganicMatter: " + vs_SoilOrganicMatter() + endl
      + "vs_SoilRawDensity: " + vs_SoilRawDensity() + endl
      + "vs_SoilBulkDensity: " + vs_SoilBulkDensity() + endl
      + "vs_SoilSandContent: " + vs_SoilSandContent + endl
      + "vs_SoilClayContent: " + vs_SoilClayContent + endl
      + "vs_SoilSiltContent: " + vs_SoilSiltContent() + endl
      + "vs_SoilStoneContent: " + vs_SoilStoneContent
      + endl;

    return s;
  }

};


var MineralFertiliserParameters = function (name, carbamid, no3, nh4) {

  var name = name,
      vo_Carbamid = carbamid,
      vo_NH4 = nh4,
      vo_NO3 = no3;

  return {
    /**
     * @brief Returns name of fertiliser.
     * @return Name
     */
    getName: function () { 
      return name; 
    },
    /**
     * @brief Returns carbamid part in percentage of fertiliser.
     * @return Carbamid in percent
     */
    getCarbamid: function () { 
      return vo_Carbamid; 
    },
    /**
     * @brief Returns ammonium part of fertliser.
     * @return Ammonium in percent
     */
    getNH4: function () { 
      return vo_NH4; 
    },
    /**
     * @brief Returns nitrat part of fertiliser
     * @return Nitrat in percent
     */
    getNO3: function () { 
      return vo_NO3; 
    },
    /**
     * @brief Sets name of fertiliser
     * @param name
     */
    setName: function (_name) { 
      name = name_; 
    },
    /**
     * Sets carbamid part of fertilisers
     * @param vo_Carbamid percent
     */
    setCarbamid: function (_vo_Carbamid) {
      vo_Carbamid = _vo_Carbamid;
    },
    /**
     * @brief Sets nitrat part of fertiliser.
     * @param vo_NH4
     */
    setNH4: function (_vo_NH4) { 
      vo_NH4 = _vo_NH4; 
    },
    /**
     * @brief Sets nitrat part of fertiliser.
     * @param vo_NO3
     */
    setNO3: function (_vo_NO3) { 
      vo_NO3 = _vo_NO3; 
    }
  };

};


var OrganicMatterParameters = function (omp) {

  this.name = "";
  this.vo_AOM_DryMatterContent = omp ? omp.vo_AOM_DryMatterContent : 0.0;
  this.vo_AOM_NH4Content = omp ? omp.vo_AOM_NH4Content : 0.0;
  this.vo_AOM_NO3Content = omp ? omp.vo_AOM_NO3Content : 0.0;
  this.vo_AOM_CarbamidContent = omp ? omp.vo_AOM_CarbamidContent : 0.0;
  this.vo_AOM_SlowDecCoeffStandard = omp ? omp.vo_AOM_SlowDecCoeffStandard : 0.0;
  this.vo_AOM_FastDecCoeffStandard = omp ? omp.vo_AOM_FastDecCoeffStandard : 0.0;
  this.vo_PartAOM_to_AOM_Slow = omp ? omp.vo_PartAOM_to_AOM_Slow : 0.0;
  this.vo_PartAOM_to_AOM_Fast = omp ? omp.vo_PartAOM_to_AOM_Fast : 0.0;
  this.vo_CN_Ratio_AOM_Slow = omp ? omp.vo_CN_Ratio_AOM_Slow : 0.0;
  this.vo_CN_Ratio_AOM_Fast = omp ? omp.vo_CN_Ratio_AOM_Fast : 0.0;
  this.vo_PartAOM_Slow_to_SMB_Slow = omp ? omp.vo_PartAOM_Slow_to_SMB_Slow : 0.0;
  this.vo_PartAOM_Slow_to_SMB_Fast = omp ? omp.vo_PartAOM_Slow_to_SMB_Fast : 0.0;
  this.vo_NConcentration = 0.0;

  this.toString = function () {
    var s = '', endl = '\n';
    s += "Name: " + this.name + endl
      + "vo_NConcentration: " + this.vo_NConcentration + endl
      + "vo_DryMatter: " + this.vo_AOM_DryMatterContent + endl
      + "vo_NH4: " + this.vo_AOM_NH4Content + endl
      + "vo_NO3: " + this.vo_AOM_NO3Content + endl
      + "vo_NH2: " + this.vo_AOM_CarbamidContent + endl
      + "vo_kSlow: " + this.vo_AOM_SlowDecCoeffStandard + endl
      + "vo_kFast: " + this.vo_AOM_FastDecCoeffStandard + endl
      + "vo_PartSlow: " + this.vo_PartAOM_to_AOM_Slow + endl
      + "vo_PartFast: " + this.vo_PartAOM_to_AOM_Fast + endl
      + "vo_CNSlow: " + this.vo_CN_Ratio_AOM_Slow + endl
      + "vo_CNFast: " + this.vo_CN_Ratio_AOM_Fast + endl
      + "vo_SMBSlow: " + this.vo_PartAOM_Slow_to_SMB_Slow + endl
      + "vo_SMBFast: " + this.vo_PartAOM_Slow_to_SMB_Fast + endl;
    return s;
  };

};

/**
 * Class that holds information of crop defined by user.
 * @author Xenia Specka
 */
var UserCropParameters = function () {

  this.pc_ReferenceMaxAssimilationRate;
  this.pc_ReferenceLeafAreaIndex;
  this.pc_MaintenanceRespirationParameter1;
  this.pc_MaintenanceRespirationParameter2;
  this.pc_MinimumNConcentrationRoot;
  this.pc_MinimumAvailableN;
  this.pc_ReferenceAlbedo;
  this.pc_StomataConductanceAlpha;
  this.pc_SaturationBeta;
  this.pc_GrowthRespirationRedux;
  this.pc_MaxCropNDemand;
  this.pc_GrowthRespirationParameter1;
  this.pc_GrowthRespirationParameter2;
  this.pc_Tortuosity;

};


/**
 * Class that holds information about user defined environment parameters.
 * @author Xenia Specka
 */
var UserEnvironmentParameters = function () {
  this.p_UseNMinMineralFertilisingMethod;
  this.p_UseSecondaryYields;

  this.p_LayerThickness;
  this.p_Albedo;
  this.p_AthmosphericCO2;
  this.p_WindSpeedHeight;
  this.p_LeachingDepth;
  this.p_timeStep;
  this.p_MaxGroundwaterDepth = 20;
  this.p_MinGroundwaterDepth = 20;

  this.p_NumberOfLayers;
  this.p_StartPVIndex;
  this.p_JulianDayAutomaticFertilising;
  this.p_MinGroundwaterDepthMonth;
};

var UserInitialValues = function () {

  this.p_initPercentageFC = 0.8;    // Initial soil moisture content in percent field capacity
  this.p_initSoilNitrate = 0.0001;     // Initial soil nitrate content [kg NO3-N m-3]
  this.p_initSoilAmmonium = 0.0001;    // Initial soil ammonium content [kg NH4-N m-3]

};


/**
 * Class that holds information about user defined soil moisture parameters.
 * @author Xenia Specka
 */
var UserSoilMoistureParameters = function () {

  this.pm_CriticalMoistureDepth;
  this.pm_SaturatedHydraulicConductivity;
  this.pm_SurfaceRoughness;
  this.pm_GroundwaterDischarge;
  this.pm_HydraulicConductivityRedux;
  this.pm_SnowAccumulationTresholdTemperature;
  this.pm_KcFactor;
  this.pm_TemperatureLimitForLiquidWater;
  this.pm_CorrectionSnow;
  this.pm_CorrectionRain;
  this.pm_SnowMaxAdditionalDensity;
  this.pm_NewSnowDensityMin;
  this.pm_SnowRetentionCapacityMin;
  this.pm_RefreezeParameter1;
  this.pm_RefreezeParameter2;
  this.pm_RefreezeTemperature;
  this.pm_SnowMeltTemperature;
  this.pm_SnowPacking;
  this.pm_SnowRetentionCapacityMax;
  this.pm_EvaporationZeta;
  this.pm_XSACriticalSoilMoisture;
  this.pm_MaximumEvaporationImpactDepth;
  this.pm_MaxPercolationRate;
  this.pm_MoistureInitValue;

};


/**
 * Class that holds information about user defined soil temperature parameters.
 * @author Xenia Specka
 */
var UserSoilTemperatureParameters = function () {

  this.pt_NTau;
  this.pt_InitialSurfaceTemperature;
  this.pt_BaseTemperature;
  this.pt_QuartzRawDensity;
  this.pt_DensityAir;
  this.pt_DensityWater;
  this.pt_DensityHumus;
  this.pt_SpecificHeatCapacityAir;
  this.pt_SpecificHeatCapacityQuartz;
  this.pt_SpecificHeatCapacityWater;
  this.pt_SpecificHeatCapacityHumus;
  this.pt_SoilAlbedo;
  // according to sensitivity tests, soil moisture has minor
  // influence to the temperature and thus can be set as constant
  // by xenia
  this.pt_SoilMoisture = 0.25;

};


/**
 * Class that holds information about user defined soil transport parameters.
 * @author Xenia Specka
 */
var UserSoilTransportParameters = function () {

  this.pq_AD;
  this.pq_DiffusionCoefficientStandard;
  this.pq_NDeposition;

};


/**
 * Class that holds information about user-defined soil organic parameters.
 * @author Claas Nendel
 */
var UserSoilOrganicParameters = function () {

  this.po_SOM_FastDecCoeffStandard; //1.40e-4 [d-1], from DAISY manual 1.4e-4
  this.po_SMB_SlowMaintRateStandard; //1.00e-3 [d-1], from DAISY manual original 1.8e-3
  this.po_SMB_FastMaintRateStandard; //1.00e-2 [d-1], from DAISY manual
  this.po_SMB_SlowDeathRateStandard; //1.00e-3 [d-1], from DAISY manual
  this.po_SMB_FastDeathRateStandard; //1.00e-2 [d-1], from DAISY manual
  this.po_SMB_UtilizationEfficiency; //0.60 [], from DAISY manual 0.6
  this.po_SOM_SlowUtilizationEfficiency; //0.40 [], from DAISY manual 0.4
  this.po_SOM_FastUtilizationEfficiency; //0.50 [], from DAISY manual 0.5
  this.po_AOM_SlowUtilizationEfficiency; //0.40 [], from DAISY manual original 0.13
  this.po_AOM_FastUtilizationEfficiency; //0.10 [], from DAISY manual original 0.69
  this.po_AOM_FastMaxC_to_N; // 1000.0
  this.po_PartSOM_Fast_to_SOM_Slow; //0.30) [], Bruun et al. 2003
  this.po_PartSMB_Slow_to_SOM_Fast; //0.60) [], from DAISY manual
  this.po_PartSMB_Fast_to_SOM_Fast; //0.60 [], from DAISY manual
  this.po_PartSOM_to_SMB_Slow; //0.0150 [], optimised
  this.po_PartSOM_to_SMB_Fast; //0.0002 [], optimised
  this.po_CN_Ratio_SMB; //6.70 [], from DAISY manual
  this.po_LimitClayEffect; //0.25 [kg kg-1], from DAISY manual
  this.po_AmmoniaOxidationRateCoeffStandard; //1.0e-1[d-1], from DAISY manual
  this.po_NitriteOxidationRateCoeffStandard; //9.0e-1[d-1], fudged by Florian Stange
  this.po_TransportRateCoeff; //0.1 [d-1], from DAISY manual
  this.po_SpecAnaerobDenitrification; //0.1 //[g gas-N g CO2-C-1]
  this.po_ImmobilisationRateCoeffNO3; //0.5 //[d-1]
  this.po_ImmobilisationRateCoeffNH4; //0.5 //[d-1]
  this.po_Denit1; //0.2 Denitrification parameter
  this.po_Denit2; //0.8 Denitrification parameter
  this.po_Denit3; //0.9 Denitrification parameter
  this.po_HydrolysisKM; //0.00334 from Tabatabai 1973
  this.po_ActivationEnergy; //41000.0 from Gould et al. 1973
  this.po_HydrolysisP1; //4.259e-12 from Sadeghi et al. 1988
  this.po_HydrolysisP2; //1.408e-12 from Sadeghi et al. 1988
  this.po_AtmosphericResistance; //0.0025 [s m-1], from Sadeghi et al. 1988
  this.po_N2OProductionRate; //0.5 [d-1]
  this.po_Inhibitor_NH3; //1.0 [kg N m-3] NH3-induced inhibitor for nitrite oxidation

};


/**
   * Data structure that holds information about capillary rise rates.
 */
var CapillaryRiseRates = function () {

  //std::map<std::string, std::map<int, double> > 
  this.cap_rates_map = {};

  /**
     * Adds a capillary rise rate to data structure.
     */
  this.addRate = function (bodart, distance, value) {
    //        std::cout << "Add cap rate: " << bodart << "\tdist: " << distance << "\tvalue: " << value << std::endl;
    //cap_rates_map.insert(std::pair<std::string,std::map<int,double> >(bodart,std::pair<int,double>(distance,value)));
    if (this.cap_rates_map[bodart] === undefined)
      this.cap_rates_map[bodart] = {};
    this.cap_rates_map[bodart][distance] = value;
  };

  /**
     * Returns capillary rise rate for given soil type and distance to ground water.
     */
  this.getRate = function (bodart, distance) {

    var map = getMap(bodart);
    var size = 0;

    for (var prop in map) {
      if (map.hasOwnProperty(prop))
        size++;
    }    

    if (size <= 0 )
      logger(MSG.WARN, "No capillary rise rates in data structure available.");

    return (this.cap_rates_map[bodart][distance] === undefined) ? 0.0 : this.cap_rates_map[bodart][distance];

  };


  this.getMap = function (bodart) {
    return this.cap_rates_map[bodart];
  };

  /**
     * Returns number of elements of internal map data structure.
     */
  this.size = function () { 
    var size = 0;

    for (var prop in this.cap_rates_map) {
      if (this.cap_rates_map.hasOwnProperty(prop))
        size++;
    } 

    return size;
  };

};

var RPSCDRes = function (initialized) {

  this.sat = 0;
  this.fc = 0;
  this.pwp = 0;
  this.initialized = (initialized === undefined) ? false : initialized;

};

var CentralParameterProvider = function () {

  this.userCropParameters = new UserCropParameters();
  this.userEnvironmentParameters = new UserEnvironmentParameters();
  this.userSoilMoistureParameters = new UserSoilMoistureParameters();
  this.userSoilTemperatureParameters = new UserSoilTemperatureParameters();
  this.userSoilTransportParameters = new UserSoilTransportParameters();
  this.userSoilOrganicParameters = new UserSoilOrganicParameters();
  // this.sensitivityAnalysisParameters = new SensitivityAnalysisParameters();
  this.capillaryRiseRates = null;
  this.userInitValues = new UserInitialValues();
  
};


/*
  Changes
    - Cutting.apply() 
      prim. yield auskommentiert, p.yield immer 0.00, da organId 0 ????
      store results
    - var Cutting = function ()
      + cropResult
*/

var WorkStep = function (date) {

  this._date = date;

  this.date = function () { 
    return this._date; 
  };

  this.setDate = function (date) {
    this._date = date; 
  };

  //! do whatever the workstep has to do
  this.apply = function (model) {};

  this.clone = function () {};

  this.toString = function () {
    return "date: " + this.date().toString();
  };

};


var Seed = function (date, crop) {

  WorkStep.call(this, date);

  this._date = date;
  this._crop = crop;

  this.setDate = function (date) {
    this._date = date;
    this._crop.setSeedAndHarvestDate(this.date(), this._crop.harvestDate());
  };

  this.apply = function (model) {
    logger(MSG.INFO, "seeding crop: " + this._crop.name() + " at: " + this.date().toString());
    model.seedCrop(this._crop);
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

  this.toString = function () {
    return "seeding at: " + this.date().toString() + " crop: " + this._crop.toString();
  };

};

Seed.prototype = Object.create(WorkStep);
Seed.prototype.constructor = Seed;


var Harvest = function (at, crop, cropResult) {

  WorkStep.call(this, at);
  
  this._date = at;
  this._crop = crop;
  this._cropResult = cropResult;

  this.setDate = function (date) {
    this._date = date;
    this._crop.setSeedAndHarvestDate(this._crop.seedDate(), this.date());
  };

  this.apply = function (model) {
  
    if (model.cropGrowth()) {

      logger(MSG.INFO, "harvesting crop: " + this._crop.name() + " at: " + this.date().toString());

      if (model.currentCrop() == this._crop) {

        if (model.cropGrowth()) {
          this._crop.setHarvestYields(
            model.cropGrowth().get_FreshPrimaryCropYield() /
            100.0, model.cropGrowth().get_FreshSecondaryCropYield() / 100.0
          );
          this._crop.setHarvestYieldsTM(
            model.cropGrowth().get_PrimaryCropYield() / 100.0,
            model.cropGrowth().get_SecondaryCropYield() / 100.0
          );
          this._crop.setYieldNContent(
            model.cropGrowth().get_PrimaryYieldNContent(),
            model.cropGrowth().get_SecondaryYieldNContent()
          );
          this._crop.setSumTotalNUptake(model.cropGrowth().get_SumTotalNUptake());
          this._crop.setCropHeight(model.cropGrowth().get_CropHeight());
          this._crop.setAccumulatedETa(model.cropGrowth().get_AccumulatedETa());
        }

        //store results for this crop
        this._cropResult['id'] = this._crop.id();
        this._cropResult['name'] = this._crop.name();
        this._cropResult['primaryYield'] = roundN(2, this._crop.primaryYield());
        this._cropResult['secondaryYield'] = roundN(2, this._crop.secondaryYield());
        this._cropResult['primaryYieldTM'] = roundN(2, this._crop.primaryYieldTM());
        this._cropResult['secondaryYieldTM'] = roundN(2, this._crop.secondaryYieldTM());
        this._cropResult['sumIrrigation'] = roundN(2, this._crop.appliedIrrigationWater());
        this._cropResult['biomassNContent'] = roundN(2, this._crop.primaryYieldN());
        this._cropResult['aboveBiomassNContent'] = roundN(2, this._crop.aboveGroundBiomasseN());
        this._cropResult['daysWithCrop'] = roundN(2, model.daysWithCrop());
        this._cropResult['sumTotalNUptake'] = roundN(2, this._crop.sumTotalNUptake());
        this._cropResult['cropHeight'] = roundN(2, this._crop.cropHeight());
        this._cropResult['sumETaPerCrop'] = roundN(2, this._crop.get_AccumulatedETa());
        this._cropResult['NStress'] = roundN(2, model.getAccumulatedNStress());
        this._cropResult['WaterStress'] = roundN(2, model.getAccumulatedWaterStress());
        this._cropResult['HeatStress'] = roundN(2, model.getAccumulatedHeatStress());
        this._cropResult['OxygenStress'] = roundN(2, model.getAccumulatedOxygenStress());
        this._cropResult['sumFertiliser'] = roundN(2, model.sumFertiliser());

        model.harvestCurrentCrop();

      } else {
          logger(MSG.INFO, "Crop: " + model.currentCrop().toString()
            + " to be harvested isn't actual crop of this Harvesting action: "
            + this._crop.toString());
      }
    }
  
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

  this.toString = function () {
    return "harvesting at: " + this.date().toString() + " crop: " + this._crop.toString();
  };

};

Harvest.prototype = Object.create(WorkStep);
Harvest.prototype.constructor = Harvest;

var Cutting = function (at, crop, cropResult) {

  WorkStep.call(this, at);
  
  this._date = at;
  this._crop = crop;
  this._cropResult = cropResult;

  this.apply = function (model) {
  
    logger(MSG.INFO, "Cutting crop: " + this._crop.name() + " at: " + this.date().toString());
    if (model.currentCrop() == this._crop) {
      // if (model.cropGrowth()) {
        // this._crop.setHarvestYields(
        //   model.cropGrowth().get_FreshPrimaryCropYield() /
        //   100.0, model.cropGrowth().get_FreshSecondaryCropYield() / 100.0
        // );
        // this._crop.setHarvestYieldsTM(
        //   model.cropGrowth().get_PrimaryCropYield() / 100.0,
        //   model.cropGrowth().get_SecondaryCropYield() / 100.0
        // );
        // this._crop.addCuttingYieldDM(model.cropGrowth().get_PrimaryCropYield() / 100.0);
      // }
      // this._crop.setYieldNContent(
      //   model.cropGrowth().get_PrimaryYieldNContent(),
      //   model.cropGrowth().get_SecondaryYieldNContent()
      // );
      // this._crop.setSumTotalNUptake(model.cropGrowth().get_SumTotalNUptake());
      // this._crop.setCropHeight(model.cropGrowth().get_CropHeight());

      var cut = {
          id: this._crop.id()
        , name: this._crop.name()
        , date: this._date
        , primaryYieldTM: model.cropGrowth().get_PrimaryCropYield() / 100.0
      };

      if (fs) {
        var str = '';
        str += this._date.getFullYear() + ';' + round(cut.primaryYieldTM) + '\n';
        fs.appendFileSync('./out/cutting_yields.csv', str, { encoding: 'utf8' });

      }
      //store results for this crop
      if (!this._cropResult.cuts)
        this._cropResult.cuts = [];
      this._cropResult.cuts.push(cut);

      if (model.cropGrowth())
          model.cropGrowth().applyCutting();
    }
  
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

  this.toString = function () {
    return "Cutting at: " + this.date().toString() + " crop: " + this._crop.toString();
  };
};

Cutting.prototype = Object.create(WorkStep);
Cutting.prototype.constructor = Cutting;


var MineralFertiliserApplication = function (at, partition, amount) {

  WorkStep.call(this, at);

  this._date = at;
  this._partition = partition;
  this._amount = amount;

  this.apply = function (model) {
    model.applyMineralFertiliser(this._partition, this._amount);
  };

  this.partition = function () {
    return this._partition;
  };

  this.amount = function () { 
    return this._amount; 
  };

  this.toString = function () {
    return "applying mineral fertiliser at: " + this._date.toString() + " amount: " + this._amount + " partition: "
        + this.partition().toString();
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

};

MineralFertiliserApplication.prototype = Object.create(WorkStep);
MineralFertiliserApplication.prototype.constructor = MineralFertiliserApplication;


var OrganicFertiliserApplication = function (at, parameters, amount, incorp) {

  WorkStep.call(this, at);

  this._date = at;
  this._parameters = parameters;
  this._amount = amount;
  this._incrop = (incorp === undefined) ? true : incorp;

  this.apply = function (model) {
    model.applyOrganicFertiliser(this._parameters, this._amount, this._incrop);
  };

  this.parameters = function () {
    return this._parameters;
  };

  this.amount = function () { 
    return this._amount; 
  };

  this.incorporation = function () { 
    return this._incorporation; 
  };

  this.toString = function () {
    return (
      "applying organic fertiliser at: " + this.date().toString() + " amount: " + 
      this.amount() + "\tN percentage: " + this._parameters().vo_NConcentration + "\tN amount: " + 
      this.amount() * this._parameters().vo_NConcentration
    );
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

};

OrganicFertiliserApplication.prototype = Object.create(WorkStep);
OrganicFertiliserApplication.prototype.constructor = OrganicFertiliserApplication;


var TillageApplication = function (at, depth) {

  WorkStep.call(this, at);

  this._date = at;
  this._depth = depth;

  this.apply = function (model) {
    model.applyTillage(this._depth);
  };

  this.toString = function () {
    return "applying tillage at: " + this.date().toString() + " depth: " + this.depth();
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

};

TillageApplication.prototype = Object.create(WorkStep);
TillageApplication.prototype.constructor = TillageApplication;


var IrrigationApplication = function (at, amount, parameters) {

  WorkStep.call(this, at);

  this._date = at;
  this._amount = amount;
  this._parameters = parameters;

  this.apply = function (model) {
    model.applyIrrigation(this.amount(), this.nitrateConcentration());
  };

  this.amount = function () { 
    return this._amount; 
  };

  this.nitrateConcentration = function () { 
    return this._parameters.nitrateConcentration; 
  };

  this.sulfateConcentration = function () { 
    return this._parameters.sulfateConcentration; 
  };

  this.toString = function () {
    return "applying irrigation at: " + this.date().toString() + " amount: " + this.amount() + " nitrateConcentration: "
      + this.nitrateConcentration() + " sulfateConcentration: " + this.sulfateConcentration();
  };

  this.clone = function () {
    return JSON.parse(JSON.stringify(this)); 
  };

};

IrrigationApplication.prototype = Object.create(WorkStep);
IrrigationApplication.prototype.constructor = IrrigationApplication;

/*

  Changes:
    - var getWorkstep = function (date)

*/

var ProductionProcess = function (name, crop) {

var that = this
  , _name = name
  , _crop = crop
  , _worksteps = []
  , _cropResult = []
  ;
  
  _worksteps.equal_range = function (date) {
  var ws = [];
  this.forEach(function (w, i) {
    if (w.date().setHours(0,0,0,0) === date.setHours(0,0,0,0)) 
      ws.push(w)
  });
  return ws;
};

_worksteps.upper_bound = function (date) {
  for (var i = 0, is = this.length; i < is; i++) {
    if (this[i].date().setHours(0,0,0,0) > date.setHours(0,0,0,0))
      return this[i];
  }
  return null;
};

debug("ProductionProcess: " + name);
//_cropResult.id = _crop.id();

var addApplication = function (app) {

  _worksteps.push(app);
  _worksteps.sort(function (a_, b_) {
    var a = a_.date()
      , b = b_.date()
      ;
    return (a < b) ? -1 : ((a > b) ? 1 : 0);
  });

};

if ((crop.seedDate().setHours(0,0,0,0) != new Date(1951, 0, 1).setHours(0,0,0,0)) && (crop.seedDate().setHours(0,0,0,0) != new Date(0,0,0).setHours(0,0,0,0)))
  addApplication(new Seed(crop.seedDate(), crop));
if ((crop.harvestDate().setHours(0,0,0,0) != new Date(1951, 0, 1).setHours(0,0,0,0)) && (crop.harvestDate().setHours(0,0,0,0) != new Date(0,0,0).setHours(0,0,0,0)))
{
  addApplication(new Harvest(crop.harvestDate(), crop , _cropResult));
}


var cuttingDates = crop.getCuttingDates();
var size = cuttingDates.length;

for (var i=0; i<size; i++) {
  debug("Add cutting date: " + Date(cuttingDates[i].toString()));
  //    if (i<size-1) {
  addApplication(new Cutting(Date(cuttingDates.at(i)), crop));
  //    } else {
  //      addApplication(Harvest(crop.harvestDate(), crop, _cropResult));
  //    }
}

/**
 * @brief Copy constructor
 * @param new_pp
 */
/*
ProductionProcess::ProductionProcess(const ProductionProcess& other)
{
  _name = other._name;
  _crop = CropPtr(new Crop(*(other._crop.get())));
  _cropResult = PVResultPtr(new PVResult(*(other._cropResult.get())));

  _worksteps = other._worksteps;
}
*/

var deepCloneAndClearWorksteps = function () {
  // TODO:
  // ProductionProcess clone(name(), CropPtr(new Crop(*(crop().get()))));
  // clone._cropResult = PVResultPtr(new PVResult(*(_cropResult.get())));
  // return clone;
};

var apply = function (date, model) {
  var p = _worksteps.equal_range(date);
  p.forEach(function (ws) {
    ws.apply(model);
  });
};

var nextDate = function (date) {
  var p = _worksteps.upper_bound(date);
  return !p ? new Date(Infinity) : p.date();
};

var getWorkstep = function (date) {
  var ws_ = null;
  _worksteps.forEach(function (ws) {
    if (ws.date().setHours(0, 0, 0, 0) === date.setHours(0, 0, 0, 0))
      ws_ = ws;
  });
  return ws_;
};

var start = function () {
  if (_worksteps.length === 0)
    return new Date(Infinity);
  return _worksteps[0].date();
};

var end = function () {
  if (_worksteps.length === 0)
    return new Date(Infinity);
  return _worksteps[_worksteps.length - 1];
};

var toString = function () {
  var s = "";
  s += "name: " + _name + " start: " + start().toString()
      + " end: " + end().toString() + "\n";
  s += "worksteps:" + "\n";
  var p = _worksteps.equal_range(date);
  p.forEach(function (ws) {
    s += "at: " + ws.date().toString()
        + " what: " + ws.toString() + "\n";
  });
  return s;
};


return {
  getWorkstep: getWorkstep,
  deepCloneAndClearWorksteps: deepCloneAndClearWorksteps,
  addApplication: addApplication,
  apply: apply,
  nextDate: nextDate,
  name: function () { 
    return _name; 
  },
  crop: function () { 
    return _crop; 
  },
  isFallow: function () { 
    return !_crop.isValid();  
  },
  //! when does the PV start
  start: start,
  //! when does the whole PV end
  end: end,
  getWorksteps:function () { 
    return _worksteps; 
  },
  clearWorksteps: function () { 
    _worksteps = []; 
  },
  toString: toString,
  // cropResult() const { return *(_cropResult.get()); }
  // cropResultPtr() const { return _cropResult; }
  //the custom id is used to keep a potentially usage defined
  //mapping to entity from another domain,
  //e.g. the an Carbiocial CropActivity which is ProductionProcess was based on
  setCustomId: function (cid) { 
    _customId = cid; 
  },
  // customId: function () { 
  //   return _customId; 
  // }
  cropResult: function () { 
    return _cropResult; 
  }
};

};



var DataAccessor = function (startDate, endDate) {

  this._startDate = startDate;
  this._endDate = endDate;
  this._data = [];
  this._fromStep = 0;
  this._numberOfSteps;

  //! offsets to actual available climate data enum numbers
  this._acd2dataIndex = [];

  this.isValid = function () { 
    return this.noOfStepsPossible() > 0; 
  };

  this.dataForTimestep = function (acd, stepNo) {
    var cacheIndex = this._acd2dataIndex[acd];
    return (cacheIndex < 0 || cacheIndex === undefined) ? 0.0 : this._data[cacheIndex][this._fromStep + stepNo];
  };

  this.dataAsVector = function (acd) {
    var cacheIndex = this._acd2dataIndex[acd];
    return (cacheIndex < 0 || cacheIndex === undefined) ? [] : this._data[cacheIndex].slice(this._fromStep, this._fromStep + this.noOfStepsPossible()); 
  };

  this.cloneForRange = function (fromStep, numberOfSteps) {};

  this.noOfStepsPossible = function () { 
    return this._numberOfSteps; 
  };

  this.startDate = function () { 
    return this._startDate; 
  };

  this.endDate = function () { 
    return this._endDate; 
  };

  this.julianDayForStep = function (stepNo) {
    var newDate = new Date(this._startDate.getFullYear(), this._startDate.getMonth(), this._startDate.getDate() + stepNo);
    return ceil((newDate - new Date(newDate.getFullYear(), 0, 1)) / 86400000) + 1;
  };

  this.addClimateData = function (acd, data) {
    /* TODO: in monica gucken was das zu bedeuten hat */
    if(!this._data.length > 0 && this._numberOfSteps === data.length)
      logger(MSG.WARN, "this._numberOfSteps === data.length");

    this._data.push(data);
    this._acd2dataIndex[acd] = this._data.length - 1;
    this._numberOfSteps = (this._data.length === 0) ? 0 : data.length;
  };

  this.addOrReplaceClimateData = function (acd, data) {};

  this.hasAvailableClimateData = function (acd) {
    return this._acd2dataIndex[acd] >= 0;
  };

};

/*
  Changes
    - add cuttingYields()
*/

var Crop = function (id, name) {

  var crop = (arguments[0] instanceof Crop) ?  arguments[0] : null
    , _accumulatedETa = 0.0
    , _appliedAmountIrrigation = crop ? crop._appliedAmountIrrigation : 0
    , _cropHeight = crop ? crop._cropHeight : 0.0
    , _cropParams = crop ? crop._cropParams : null
    , _crossCropAdaptionFactor = crop ? crop._crossCropAdaptionFactor : 1 
    , _cuttingDates = []
    , _harvestDate = crop ? crop._harvestDate : new Date(Infinity)
    , _id = crop ? crop._id : id
    , _name  = crop ? crop._name : name
    , _primaryYield = crop ? crop._primaryYield : 0
    , _primaryYieldN = crop ? crop._primaryYieldN : 0
    , _primaryYieldTM = crop ? crop._primaryYieldTM : 0
    , _residueParams = crop ? crop._residueParams : null
    , _secondaryYield = crop ? crop._secondaryYield : 0
    , _secondaryYieldN = crop ? crop._secondaryYieldN : 0
    , _secondaryYieldTM = crop ? crop._secondaryYieldTM : 0
    , _seedDate = crop ? crop._seedDate : new Date(Infinity)
    , _sumTotalNUptake = crop ? crop._sumTotalNUptake : 0
    , _cuttingYieldsDM = []
    , _useNMinMethod = false
    , _nMinFertiliserPartition = {}
    , _useAutomaticIrrigation = false
    , _autoIrrigationParams = {}
    ;

  // eva2_typeUsage = new_crop.eva2_typeUsage;

  return {

    id: function () { 
      return _id; 
    },
    name: function () { 
      return _name; 
    },
    isValid: function () { 
      return _id > -1; 
    },
    cropParameters: function () { 
      return _cropParams; 
    },
    setCropParameters: function (cps) { 
      _cropParams = cps; 
    },
    residueParameters: function () {
      return _residueParams;
    },
    setResidueParameters: function (rps) {
      _residueParams = rps;
    },
    seedDate: function () { 
      return _seedDate; 
    },
    harvestDate: function () { 
      return _harvestDate; 
    },
    getCuttingDates: function () { 
      return _cuttingDates; 
    },
    setSeedAndHarvestDate: function (sd, hd) {
      _seedDate = sd;
      _harvestDate = hd;
    },
    addCuttingDate: function (cd) { 
      _cuttingDates.push(cd); 
    },
    toString: toString,
    setHarvestYields: function (primaryYield, secondaryYield) {
      _primaryYield += primaryYield;
      _secondaryYield += secondaryYield;
    },
    setHarvestYieldsTM: function (primaryYieldTM, secondaryYieldTM) {
      _primaryYieldTM += primaryYieldTM;
      _secondaryYieldTM += secondaryYieldTM;
    },
    addCuttingYieldDM: function (yield) {
      _cuttingYieldsDM.push(yield);
    },
    getCuttingYieldsDM: function () {
      return _cuttingYieldsDM;
    },
    setYieldNContent: function (primaryYieldN, secondaryYieldN) {
      _primaryYieldN += primaryYieldN;
      _secondaryYieldN += secondaryYieldN;
    },
    addAppliedIrrigationWater: function (amount) { 
     _appliedAmountIrrigation += amount; 
    },
    setSumTotalNUptake: function (sum) { 
     _sumTotalNUptake = sum; 
    },
    setCropHeight: function (height) { 
      _cropHeight = height; 
    },
    setAccumulatedETa: function (eta) { 
     _accumulatedETa = eta; 
    },
    appliedIrrigationWater: function () { 
      return _appliedAmountIrrigation; 
    },
    sumTotalNUptake: function () { 
      return _sumTotalNUptake; 
    },
    primaryYield: function () { 
      return _primaryYield * _crossCropAdaptionFactor; 
    },
    secondaryYield: function () { 
      return _secondaryYield * _crossCropAdaptionFactor; 
    },
    primaryYieldTM: function () { 
      return _primaryYieldTM * _crossCropAdaptionFactor; 
    },
    secondaryYieldTM: function () { 
      return _secondaryYieldTM * _crossCropAdaptionFactor; 
    },
    primaryYieldN: function () { 
      return _primaryYieldN; 
    },
    aboveGroundBiomasseN: function () { 
      return _primaryYieldN + _secondaryYieldN; 
    },
    secondaryYieldN: function () { 
      return _secondaryYieldN; 
    },
    cropHeight: function () { 
      return _cropHeight; 
    },
    useNMinMethod: function() {
      return _useNMinMethod;
    },
    setUseNMinMethod: function(use){
      _useNMinMethod = use;
    },
    nMinFertiliserPartition: function() {
      return _nMinFertiliserPartition;
    },
    setNMinFertiliserPartition: function(fp){
      _nMinFertiliserPartition = fp;
    },
    nMinUserParams: function() {
      return _nMinUserParams;
    },
    setNMinUserParams: function(up){
      _nMinUserParams = up;
    },
    useAutomaticIrrigation: function() {
      return _useAutomaticIrrigation;
    },
    setUseAutomaticIrrigation: function(use){
      _useAutomaticIrrigation = use;
    },
    autoIrrigationParams: function() {
      return _autoIrrigationParams;
    },
    setAutoIrrigationParams: function(aips){
      _autoIrrigationParams = aips;
    },
    reset: function () {
      _primaryYield = _secondaryYield = _appliedAmountIrrigation = 0;
      _primaryYieldN = _secondaryYieldN = _accumulatedETa = 0.0;
      _primaryYieldTM = _secondaryYield = 0.0;
    },
    get_AccumulatedETa: function ()  {
      return _accumulatedETa;
    },
    writeCropParameters: function (outPath) {
      if (outPath != null && !!fs)
        fs.writeFileSync(outPath + '/crop_parameters_' + _name + '.txt', _cropParams.toString(), { encoding: 'utf8' });
    }
  };

};


/*
  JS Changes:
    - applyCutting(): reset LAI
    - get_PrimaryCropYield(): bestimme yield auch nach cutting
    - get_FreshPrimaryCropYield(): bestimme yield auch nach cutting
*/

var CropGrowth = function (sc, gps, cps, stps, cpp) {

  if (DEBUG) debug(arguments); // JS!

  var soilColumn = sc
    , generalParams = gps
    , cropParams = cps
    , centralParameterProvider = cpp
    , vs_NumberOfLayers  = sc.vs_NumberOfLayers() 
    , vs_Latitude  = stps.vs_Latitude
    ;

  var vc_AbovegroundBiomass = 0.0 
    , vc_AbovegroundBiomassOld = 0.0 
    , pc_AbovegroundOrgan = cropParams.pc_AbovegroundOrgan 
    , vc_ActualTranspiration = 0.0 
    , pc_AssimilatePartitioningCoeff = cropParams.pc_AssimilatePartitioningCoeff
    , vc_Assimilates = 0.0 
    , vc_AssimilationRate = 0.0 
    , vc_AstronomicDayLenght = 0.0
    , pc_BaseDaylength = cropParams.pc_BaseDaylength
    , pc_BaseTemperature = cropParams.pc_BaseTemperature
    , pc_BeginSensitivePhaseHeatStress = cropParams.pc_BeginSensitivePhaseHeatStress
    , vc_BelowgroundBiomass = 0.0 
    , vc_BelowgroundBiomassOld = 0.0 
    , pc_CO2Method = 3 
    , pc_CarboxylationPathway = cropParams.pc_CarboxylationPathway 
    , vc_ClearDayRadiation = 0.0 
    , vc_CriticalNConcentration = 0.0 
    , pc_CriticalOxygenContent = cropParams.pc_CriticalOxygenContent 
    , pc_CriticalTemperatureHeatStress = cropParams.pc_CriticalTemperatureHeatStress 
    , vc_CropDiameter = 0.0 
    , vc_CropHeatRedux = 1.0 
    , vc_CropHeight = 0.0 
    , pc_CropHeightP1 = cropParams.pc_CropHeightP1 
    , pc_CropHeightP2 = cropParams.pc_CropHeightP2 
    , vc_CropNDemand = 0.0 
    , vc_CropNRedux = 1.0 
    , pc_CropName = cropParams.pc_CropName 
    , pc_CropSpecificMaxRootingDepth = cropParams.pc_CropSpecificMaxRootingDepth 
    , vc_CurrentTemperatureSum = new Float64Array(cropParams.pc_NumberOfDevelopmentalStages) 
    , vc_CurrentTotalTemperatureSum = 0.0 
    , vc_CurrentTotalTemperatureSumRoot = 0.0 
    , vc_DaylengthFactor = 0.0 
    , pc_DaylengthRequirement = cropParams.pc_DaylengthRequirement 
    , vc_DaysAfterBeginFlowering = 0 
    , vc_Declination = 0.0
    , pc_DefaultRadiationUseEfficiency = cropParams.pc_DefaultRadiationUseEfficiency
    , vm_DepthGroundwaterTable = 0
    , pc_DevelopmentAccelerationByNitrogenStress = cropParams.pc_DevelopmentAccelerationByNitrogenStress
    , vc_DevelopmentalStage = 0
    , vc_DroughtImpactOnFertility = 1.0
    , pc_DroughtImpactOnFertilityFactor = cropParams.pc_DroughtImpactOnFertilityFactor
    , pc_DroughtStressThreshold = cropParams.pc_DroughtStressThreshold
    , vc_EffectiveDayLength = 0.0
    , pc_EmergenceFloodingControlOn = generalParams.pc_EmergenceFloodingControlOn
    , pc_EmergenceMoistureControlOn = generalParams.pc_EmergenceMoistureControlOn
    , pc_EndSensitivePhaseHeatStress = cropParams.pc_EndSensitivePhaseHeatStress
    , vc_ErrorStatus = false
    , vc_EvaporatedFromIntercept = 0.0
    , vc_ExtraterrestrialRadiation = 0.0
    , vc_FinalDevelopmentalStage = 0
    , vc_FixedN = 0
    , pc_FixingN = cropParams.pc_FixingN
    , vo_FreshSoilOrganicMatter = new Float64Array(vs_NumberOfLayers)
    , vc_GlobalRadiation = 0.0
    , vc_GreenAreaIndex = 0.0
    , vc_GrossAssimilates = 0.0
    , vc_GrossPhotosynthesis = 0.0
    , vc_GrossPhotosynthesisReference_mol = 0.0
    , vc_GrossPhotosynthesis_mol = 0.0
    , vc_GrossPrimaryProduction = 0.0
    , vc_GrowthRespirationAS = 0.0
    , vs_HeightNN = stps.vs_HeightNN
    , pc_InitialKcFactor = cropParams.pc_InitialKcFactor
    , pc_InitialOrganBiomass = cropParams.pc_InitialOrganBiomass
    , pc_InitialRootingDepth = cropParams.pc_InitialRootingDepth
    , vc_InterceptionStorage = 0.0
    , vc_KcFactor = 0.6
    , vc_LeafAreaIndex = 0.0
    , pc_LimitingTemperatureHeatStress = cropParams.pc_LimitingTemperatureHeatStress
    , pc_LuxuryNCoeff = cropParams.pc_LuxuryNCoeff
    , vc_MaintenanceRespirationAS = 0.0
    , pc_MaxAssimilationRate = cropParams.pc_MaxAssimilationRate
    , pc_MaxCropDiameter = cropParams.pc_MaxCropDiameter
    , pc_MaxCropHeight = cropParams.pc_MaxCropHeight
    , vs_MaxEffectiveRootingDepth = stps.vs_MaxEffectiveRootingDepth
    , vc_MaxNUptake = 0.0
    , pc_MaxNUptakeParam = cropParams.pc_MaxNUptakeParam
    , vc_MaxRootingDepth = 0.0
    , pc_MinimumNConcentration = cropParams.pc_MinimumNConcentration
    , pc_MinimumTemperatureForAssimilation = cropParams.pc_MinimumTemperatureForAssimilation
    , pc_MinimumTemperatureRootGrowth = cropParams.pc_MinimumTemperatureRootGrowth
    , pc_NConcentrationAbovegroundBiomass = cropParams.pc_NConcentrationAbovegroundBiomass
    , vc_NConcentrationAbovegroundBiomass = 0.0
    , vc_NConcentrationAbovegroundBiomassOld = 0.0
    , pc_NConcentrationB0 = cropParams.pc_NConcentrationB0
    , pc_NConcentrationPN = cropParams.pc_NConcentrationPN
    , pc_NConcentrationRoot = cropParams.pc_NConcentrationRoot
    , vc_NConcentrationRoot = 0.0
    , vc_NConcentrationRootOld = 0.0
    , vc_NContentDeficit = 0.0
    , vc_NUptakeFromLayer = new Float64Array(vs_NumberOfLayers)
    , vc_NetMaintenanceRespiration = 0.0
    , vc_NetPhotosynthesis = 0.0
    , vc_NetPrecipitation = 0.0
    , vc_NetPrimaryProduction = 0.0
    , pc_NitrogenResponseOn = generalParams.pc_NitrogenResponseOn
    , pc_NumberOfDevelopmentalStages = cropParams.pc_NumberOfDevelopmentalStages
    , pc_NumberOfOrgans = cropParams.pc_NumberOfOrgans
    , pc_OptimumTemperature = cropParams.pc_OptimumTemperature
    , vc_OrganBiomass = new Float64Array(cropParams.pc_NumberOfOrgans)
    , vc_OrganDeadBiomass = new Float64Array(cropParams.pc_NumberOfOrgans)
    , vc_OrganGreenBiomass = new Float64Array(cropParams.pc_NumberOfOrgans)
    , vc_OrganGrowthIncrement = new Float64Array(cropParams.pc_NumberOfOrgans)
    , pc_OrganGrowthRespiration = cropParams.pc_OrganGrowthRespiration
    , pc_OrganMaintenanceRespiration = cropParams.pc_OrganMaintenanceRespiration
    , vc_OrganSenescenceIncrement = new Float64Array(cropParams.pc_NumberOfOrgans)
    , pc_OrganSenescenceRate = cropParams.pc_OrganSenescenceRate
    , vc_OvercastDayRadiation = 0.0
    , vc_OxygenDeficit = 0.0
    , vc_PhotActRadiationMean = 0.0
    , vc_PhotoperiodicDaylength = 0.0
    , pc_PlantDensity = cropParams.pc_PlantDensity
    , vc_PotentialTranspiration = 0.0
    , vc_ReferenceEvapotranspiration = 0.0
    , vc_RelativeTotalDevelopment = 0.0
    , vc_RemainingEvapotranspiration = 0.0
    , vc_ReserveAssimilatePool = 0.0
    , pc_ResidueNRatio = cropParams.pc_ResidueNRatio
    , vc_Respiration = 0.0
    , vc_RootBiomass = 0.0
    , vc_RootBiomassOld = 0.0
    , vc_RootDensity = new Float64Array(vs_NumberOfLayers)
    , vc_RootDiameter = new Float64Array(vs_NumberOfLayers)
    , pc_RootDistributionParam = cropParams.pc_RootDistributionParam
    , vc_RootEffectivity = new Float64Array(vs_NumberOfLayers)
    , pc_RootFormFactor = cropParams.pc_RootFormFactor
    , pc_RootGrowthLag = cropParams.pc_RootGrowthLag
    , pc_RootPenetrationRate = cropParams.pc_RootPenetrationRate
    , vc_RootingDepth = 0
    , vc_RootingDepth_m = 0.0
    , vc_RootingZone = 0
    , vm_SaturationDeficit = 0.0
    , vc_SoilCoverage = 0.0
    , vs_SoilMineralNContent = new Float64Array(vs_NumberOfLayers)
    , vc_SoilSpecificMaxRootingDepth = 0.0
    , vs_SoilSpecificMaxRootingDepth = 0.0
    , pc_SpecificLeafArea = cropParams.pc_SpecificLeafArea
    , pc_SpecificRootLength = cropParams.pc_SpecificRootLength
    , pc_StageAtMaxDiameter = cropParams.pc_StageAtMaxDiameter
    , pc_StageAtMaxHeight = cropParams.pc_StageAtMaxHeight
    , pc_StageKcFactor = cropParams.pc_StageKcFactor
    , pc_StageMaxRootNConcentration = cropParams.pc_StageMaxRootNConcentration
    , pc_StageTemperatureSum = cropParams.pc_StageTemperatureSum
    , vc_StomataResistance = 0.0
    , pc_StorageOrgan = cropParams.pc_StorageOrgan
    , vc_StorageOrgan = 4
    , vc_SumTotalNUptake = 0.0
    , vc_TargetNConcentration = 0.0
    , vc_TimeStep = 1.0
    , vc_TimeUnderAnoxia = 0
    , vs_Tortuosity = 0.0
    , vc_TotalBiomass = 0.0
    , vc_TotalBiomassNContent = 0.0
    , vc_TotalCropHeatImpact = 0.0
    , vc_TotalNUptake = 0.0
    , vc_TotalRespired = 0.0
    , vc_TotalRootLength = 0.0
    , vc_TotalTemperatureSum = 0.0
    , vc_Transpiration = new Float64Array(vs_NumberOfLayers)
    , vc_TranspirationDeficit = 1.0
    , vc_TranspirationRedux = new Float64Array(vs_NumberOfLayers)
    , vc_VernalisationDays = 0.0
    , vc_VernalisationFactor = 0.0
    , pc_VernalisationRequirement = cropParams.pc_VernalisationRequirement
    , pc_WaterDeficitResponseOn = generalParams.pc_WaterDeficitResponseOn
    , vc_accumulatedETa = 0.0
    , cutting_delay_days = 0
    , dyingOut = false
    ;

    // , vc_CropWaterUptake = new Array() // JS! unused

  // for (var i = 0; i < cropParams.pc_NumberOfDevelopmentalStages; i++) 
  //   vc_CurrentTemperatureSum[i] = 0.0;

  for (var i = 0; i < vs_NumberOfLayers; i++) {
    // vc_NUptakeFromLayer[i] = 0.0;
    // vc_RootDensity[i] = 0.0;
    // vc_RootDiameter[i] = 0.0;
    // vc_RootEffectivity[i] = 0.0;
    // vs_SoilMineralNContent[i] = 0.0
    // vc_Transpiration[i] = 0.0;
    vc_TranspirationRedux[i] = 1.0;
  }

  // for (var i = 0; i < pc_NumberOfOrgans; i++) {
  //   vc_OrganBiomass[i] = 0.0;
  //   vc_OrganDeadBiomass[i] = 0.0;
  //   vc_OrganGreenBiomass[i] = 0.0;
  //   vc_OrganGrowthIncrement[i] = 0.0;
  //   vc_OrganSenescenceIncrement[i] = 0.0;
  // }

  // Initialising the crop
  vs_Tortuosity = centralParameterProvider.userCropParameters.pc_Tortuosity;

  // Determining the total temperature sum of all developmental stages after
  // emergence (that's why i_Stage starts with 1) until before senescence
  for (var i_Stage = 1; i_Stage < pc_NumberOfDevelopmentalStages - 1; i_Stage++)
     vc_TotalTemperatureSum += pc_StageTemperatureSum[i_Stage];

  vc_FinalDevelopmentalStage = pc_NumberOfDevelopmentalStages - 1;

  // Determining the initial crop organ's biomass
  for (var i_Organ = 0; i_Organ < pc_NumberOfOrgans; i_Organ++) {

    vc_OrganBiomass[i_Organ] = pc_InitialOrganBiomass[i_Organ]; // [kg ha-1]

    if (pc_AbovegroundOrgan[i_Organ] == 1)
      vc_AbovegroundBiomass += pc_InitialOrganBiomass[i_Organ]; // [kg ha-1]

    vc_TotalBiomass += pc_InitialOrganBiomass[i_Organ]; // [kg ha-1]

    // Define storage organ
    if (pc_StorageOrgan[i_Organ] == 1)
      vc_StorageOrgan = i_Organ;

    // Define storage organ
    if (pc_StorageOrgan[i_Organ] == 1)
        vc_StorageOrgan = i_Organ;

  } // for

  vc_RootBiomass = pc_InitialOrganBiomass[0]; // [kg ha-1]

  // Initialisisng the leaf area index
  vc_LeafAreaIndex = vc_OrganBiomass[1] * pc_SpecificLeafArea[vc_DevelopmentalStage]; // [ha ha-1]

  if (vc_LeafAreaIndex <= 0.0)
    vc_LeafAreaIndex = 0.001;

  // Initialising the root
  vc_RootBiomass = vc_OrganBiomass[0];

  /** @todo Christian: Umrechnung korrekt wenn Biomasse in [kg m-2]? */
  vc_TotalRootLength = (vc_RootBiomass * 100000.0 * 100.0 / 7.0) / (0.015 * 0.015 * PI);

  vc_TotalBiomassNContent = (vc_AbovegroundBiomass * pc_NConcentrationAbovegroundBiomass)
      + (vc_RootBiomass * pc_NConcentrationRoot);
  vc_NConcentrationAbovegroundBiomass = pc_NConcentrationAbovegroundBiomass;
  vc_NConcentrationRoot = pc_NConcentrationRoot;

  // Initialising the initial maximum rooting depth
  var vc_SandContent = soilColumn[0].vs_SoilSandContent; // [kg kg-1]
  var vc_BulkDensity = soilColumn[0].vs_SoilBulkDensity(); // [kg m-3]
  if (vc_SandContent < 0.55) vc_SandContent = 0.55;
  if (vs_SoilSpecificMaxRootingDepth > 0.0) {
    vc_SoilSpecificMaxRootingDepth  = vs_SoilSpecificMaxRootingDepth;
  } else {
    vc_SoilSpecificMaxRootingDepth = vc_SandContent * ((1.1 - vc_SandContent)
             / 0.275) * (1.4 / (vc_BulkDensity / 1000.0)
             + (vc_BulkDensity * vc_BulkDensity / 40000000.0)); // [m]
  }

  vc_MaxRootingDepth = (vc_SoilSpecificMaxRootingDepth + (pc_CropSpecificMaxRootingDepth * 2.0)) / 3.0; //[m]
  debug('vc_SoilSpecificMaxRootingDepth', vc_SoilSpecificMaxRootingDepth);
  debug('pc_CropSpecificMaxRootingDepth', pc_CropSpecificMaxRootingDepth);

  // change organs for yield components in case of eva2 simulation
  // if type of usage is defined
  //   debug() << "EVA2 Nutzungsart " << eva2_usage << "\t" << pc_CropName.c_str() << endl;
  //   if (eva2_usage == NUTZUNG_GANZPFLANZE) {
  //       debug() << "Ganzpflanze" << endl;
  //       std::vector<YieldComponent> prim = cropParams.organIdsForPrimaryYield;
  //       std::vector<YieldComponent> sec = cropParams.organIdsForSecondaryYield;

  //       BOOST_FOREACH(YieldComponent yc, prim){
  //         eva2_primaryYieldComponents.push_back(yc);
  //       }
  // //      vector<YieldComponent>::iterator it = prim.begin();
  // //      for (it; it!=prim.end(); it++) {
  // //          YieldComponent y = *it;
  // //          eva2_primaryYieldComponents.push_back(y);
  // //      }

  //       BOOST_FOREACH(YieldComponent yc, sec){
  //          eva2_primaryYieldComponents.push_back(yc);
  //       }
  // //      it = sec.begin();
  // //      for (it; it!=sec.end(); it++) {
  // //          YieldComponent y = *it;
  // //          eva2_primaryYieldComponents.push_back(y);
  // //      }
  //       eva2_secondaryYieldComponents.clear();
  //   }

  //   if (eva2_usage == NUTZUNG_GRUENDUENGUNG) {
  //       // if gruenduengung, put all organs that are in primary yield components
  //       // into secondary yield component, because the secondary yield stays on
  //       // the farm
  //       debug() << "Gründüngung" << endl;
  //       std::vector<YieldComponent> prim = cropParams.organIdsForPrimaryYield;

  //       for (vector<YieldComponent>::iterator it = prim.begin(); it!=prim.end(); it++) {
  //           YieldComponent y = *it;
  //           eva2_secondaryYieldComponents.push_back(y);
  //       }
  //   }


  var calculateCropGrowthStep = function (
    vw_MeanAirTemperature, 
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vw_GlobalRadiation,
    vw_SunshineHours,
    vs_JulianDay,
    vw_RelativeHumidity,
    vw_WindSpeed,
    vw_WindSpeedHeight,
    vw_AtmosphericCO2Concentration,
    vw_GrossPrecipitation
  ) {

    debug("vw_AtmosphericCO2Concentration", vw_AtmosphericCO2Concentration);

    if (DEBUG) debug(arguments);

    if (cutting_delay_days>0) {
        cutting_delay_days--;
    }

    fc_Radiation(vs_JulianDay, vs_Latitude, vw_GlobalRadiation, vw_SunshineHours);

    vc_OxygenDeficit = fc_OxygenDeficiency(pc_CriticalOxygenContent[vc_DevelopmentalStage]);

    fc_CropDevelopmentalStage(
      vw_MeanAirTemperature,
      pc_BaseTemperature,
      pc_OptimumTemperature,
      pc_StageTemperatureSum,
      vc_TimeStep,
      soilColumn[0].get_Vs_SoilMoisture_m3(),
      soilColumn[0].get_FieldCapacity(),
      soilColumn[0].get_PermanentWiltingPoint(),
      pc_NumberOfDevelopmentalStages,
      vc_VernalisationFactor,
      vc_DaylengthFactor,
      vc_CropNRedux
    );  

    vc_DaylengthFactor =
      fc_DaylengthFactor(
      pc_DaylengthRequirement[vc_DevelopmentalStage],
      vc_EffectiveDayLength,
      vc_PhotoperiodicDaylength,
      pc_BaseDaylength[vc_DevelopmentalStage]
    );

    // C++: returns pair<double, double> 
    var fc_VernalisationResult =
      fc_VernalisationFactor(
      vw_MeanAirTemperature,
      vc_TimeStep,
      pc_VernalisationRequirement[vc_DevelopmentalStage],
      vc_VernalisationDays
    );    

    vc_VernalisationFactor = fc_VernalisationResult[0];
    vc_VernalisationDays = fc_VernalisationResult[1];

    vc_RelativeTotalDevelopment = vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSum;

    if (vc_DevelopmentalStage == 0) {
      vc_KcFactor = 0.4; /** @todo Claas: muss hier etwas Genaueres hin, siehe FAO? */
    } else {
      vc_KcFactor = 
        fc_KcFactor(
          vc_DevelopmentalStage,
          pc_StageTemperatureSum[vc_DevelopmentalStage],
          vc_CurrentTemperatureSum[vc_DevelopmentalStage],
          pc_InitialKcFactor,
          pc_StageKcFactor[vc_DevelopmentalStage],
          pc_StageKcFactor[vc_DevelopmentalStage - 1]
        );
    }

    if (vc_DevelopmentalStage > 0) {

      fc_CropSize(pc_MaxCropHeight,
        pc_MaxCropDiameter,
        pc_StageAtMaxHeight,
        pc_StageAtMaxDiameter,
        pc_StageTemperatureSum,
        vc_CurrentTotalTemperatureSum,
        pc_CropHeightP1,
        pc_CropHeightP2
      );

      fc_CropGreenArea(
        vc_OrganGrowthIncrement[1],
        vc_OrganSenescenceIncrement[1],
        vc_CropHeight,
        vc_CropDiameter,
        pc_SpecificLeafArea[vc_DevelopmentalStage - 1],
        pc_SpecificLeafArea[vc_DevelopmentalStage],
        pc_SpecificLeafArea[1],
        pc_StageTemperatureSum[vc_DevelopmentalStage],
        vc_CurrentTemperatureSum[vc_DevelopmentalStage],
        pc_PlantDensity,
        vc_TimeStep
      );

      vc_SoilCoverage = fc_SoilCoverage(vc_LeafAreaIndex);

      fc_CropPhotosynthesis(
        vw_MeanAirTemperature,
        vw_MaxAirTemperature,
        vw_MinAirTemperature,
        vc_GlobalRadiation,
        vw_AtmosphericCO2Concentration,
        vs_Latitude,
        vc_LeafAreaIndex,
        pc_DefaultRadiationUseEfficiency,
        pc_MaxAssimilationRate,
        pc_MinimumTemperatureForAssimilation,
        vc_AstronomicDayLenght,
        vc_Declination,
        vc_ClearDayRadiation,
        vc_EffectiveDayLength,
        vc_OvercastDayRadiation
      );

      fc_HeatStressImpact(
        vw_MaxAirTemperature,
        vw_MinAirTemperature,
        vc_CurrentTotalTemperatureSum
      );

      fc_DroughtImpactOnFertility(vc_TranspirationDeficit);

      fc_CropNitrogen();

      fc_CropDryMatter(
        vs_NumberOfLayers,
        soilColumn.vs_LayerThickness(),
        vc_DevelopmentalStage,
        vc_Assimilates,
      /*vc_NetMaintenanceRespiration,*/   // hermes o. agrosim
      /*pc_CropSpecificMaxRootingDepth,*/ // JS! unused
      /*vs_SoilSpecificMaxRootingDepth,*/ // JS! unused
        vw_MeanAirTemperature
      );

      vc_ReferenceEvapotranspiration = 
        fc_ReferenceEvapotranspiration(
          vs_HeightNN,
          vw_MaxAirTemperature,
          vw_MinAirTemperature,
          vw_RelativeHumidity,
          vw_MeanAirTemperature,
          vw_WindSpeed,
          vw_WindSpeedHeight,
          vc_GlobalRadiation,
          vw_AtmosphericCO2Concentration,
          vc_GrossPhotosynthesisReference_mol
        );

      fc_CropWaterUptake(
        vs_NumberOfLayers,
        soilColumn.vs_LayerThickness(),
        vc_SoilCoverage,
        vc_RootingZone, // JS! int TODO crop.h vc_RootingDepth?
        soilColumn.vm_GroundwaterTable, // JS! int
        vc_ReferenceEvapotranspiration,
        vw_GrossPrecipitation,
        vc_CurrentTotalTemperatureSum,
        vc_TotalTemperatureSum
      );

      fc_CropNUptake(
        vs_NumberOfLayers,
        soilColumn.vs_LayerThickness(),
        vc_RootingZone, // JS! int TODO crop.h vc_RootingDepth?
        soilColumn.vm_GroundwaterTable, // JS! int
        vc_CurrentTotalTemperatureSum,
        vc_TotalTemperatureSum
      );

      vc_GrossPrimaryProduction = fc_GrossPrimaryProduction(vc_GrossAssimilates);

      vc_NetPrimaryProduction = fc_NetPrimaryProduction(vc_GrossPrimaryProduction, vc_TotalRespired);
    }

  };

  var fc_Radiation = function (
    vs_JulianDay,
    vs_Latitude,
    vw_GlobalRadiation,
    vw_SunshineHours
  ) {


    var vc_DeclinationSinus = 0.0; // old SINLD
    var vc_DeclinationCosinus = 0.0; // old COSLD

    // Calculation of declination - old DEC
    vc_Declination = -23.4 * cos(2.0 * PI * ((vs_JulianDay + 10.0) / 365.0));

    vc_DeclinationSinus = sin(vc_Declination * PI / 180.0) * sin(vs_Latitude * PI / 180.0);
    vc_DeclinationCosinus = cos(vc_Declination * PI / 180.0) * cos(vs_Latitude * PI / 180.0);

    // Calculation of the atmospheric day lenght - old DL
    vc_AstronomicDayLenght = 12.0 * (PI + 2.0 * asin(vc_DeclinationSinus / vc_DeclinationCosinus)) / PI;


    // Calculation of the effective day length - old DLE

    var EDLHelper = (-sin(8.0 * PI / 180.0) + vc_DeclinationSinus) / vc_DeclinationCosinus;

    if ((EDLHelper < -1.0) || (EDLHelper > 1.0))
    {
        vc_EffectiveDayLength = 0.01;
    } else {
        vc_EffectiveDayLength = 12.0 * (PI + 2.0 * asin(EDLHelper)) / PI;
    }

    // old DLP
    vc_PhotoperiodicDaylength = 12.0 * (PI + 2.0 * asin((-sin(-6.0 * PI / 180.0) + vc_DeclinationSinus)
        / vc_DeclinationCosinus)) / PI;

    // Calculation of the mean photosynthetically active radiation [J m-2] - old RDN
    vc_PhotActRadiationMean = 3600.0 * (vc_DeclinationSinus * vc_AstronomicDayLenght + 24.0 / PI * vc_DeclinationCosinus
        * sqrt(1.0 - ((vc_DeclinationSinus / vc_DeclinationCosinus) * (vc_DeclinationSinus / vc_DeclinationCosinus))));

    // Calculation of radiation on a clear day [J m-2] - old DRC
    vc_ClearDayRadiation = 0.5 * 1300.0 * vc_PhotActRadiationMean * exp(-0.14 / (vc_PhotActRadiationMean
        / (vc_AstronomicDayLenght * 3600.0)));

    // Calculation of radiation on an overcast day [J m-2] - old DRO
    vc_OvercastDayRadiation = 0.2 * vc_ClearDayRadiation;

    // Calculation of extraterrestrial radiation - old EXT
    var pc_SolarConstant = 0.082; //[MJ m-2 d-1] Note: Here is the difference to HERMES, which calculates in [J cm-2 d-1]!
    var SC = 24.0 * 60.0 / PI * pc_SolarConstant *(1.0 + 0.033 * cos(2.0 * PI * vs_JulianDay / 365.0));
    var vc_SunsetSolarAngle = acos(-tan(vs_Latitude * PI / 180.0) * tan(vc_Declination * PI / 180.0));
    vc_ExtraterrestrialRadiation = SC * (vc_SunsetSolarAngle * vc_DeclinationSinus + vc_DeclinationCosinus * sin(vc_SunsetSolarAngle)); // [MJ m-2]

    if (vw_GlobalRadiation > 0.0)
      vc_GlobalRadiation = vw_GlobalRadiation;
    else
      vc_GlobalRadiation = vc_ExtraterrestrialRadiation * (0.19 + 0.55 * vw_SunshineHours / vc_AstronomicDayLenght);
  };
      
  var fc_DaylengthFactor = function (
  d_DaylengthRequirement,
  _vc_EffectiveDayLength, /* JS! overwrites public var */ 
  _vc_PhotoperiodicDaylength, /* JS! overwrites public var */ 
  d_BaseDaylength
  ) {

    if (DEBUG) debug(arguments);

    if (d_DaylengthRequirement > 0.0) {

      // ************ Long-day plants **************
      // * Development acceleration by day length. *
      // *  (Day lenght requirement is positive.)  *
      // *******************************************

      vc_DaylengthFactor = (vc_PhotoperiodicDaylength - d_BaseDaylength) /
        (d_DaylengthRequirement - d_BaseDaylength);

    } else if (d_DaylengthRequirement < 0.0) {

      // ************* Short-day plants **************
      // * Development acceleration by night lenght. *
      // *  (Day lenght requirement is negative and  *
      // *      represents critical day length.)     *
      // *********************************************

      var vc_CriticalDayLenght = -d_DaylengthRequirement;
      var vc_MaximumDayLength = -d_BaseDaylength;
      
      if (vc_EffectiveDayLength <= vc_CriticalDayLenght)
        vc_DaylengthFactor = 1.0;
      else
        vc_DaylengthFactor = (vc_EffectiveDayLength - vc_MaximumDayLength) / (vc_CriticalDayLenght - vc_MaximumDayLength);

    } else vc_DaylengthFactor = 1.0;

    if (vc_DaylengthFactor > 1.0) vc_DaylengthFactor = 1.0;

    if (vc_DaylengthFactor < 0.0) vc_DaylengthFactor = 0.0;

    return vc_DaylengthFactor;
  };

  /*std::pair<double, double>*/    
  var fc_VernalisationFactor = function (
    vw_MeanAirTemperature, 
    vc_TimeStep,
    d_VernalisationRequirement,
    d_VernalisationDays
  ) {

    if (DEBUG) debug(arguments);

    var vc_EffectiveVernalisation;

    if (d_VernalisationRequirement == 0.0) {
      vc_VernalisationFactor = 1.0;
    } else {
      if ((vw_MeanAirTemperature > -4.0) && (vw_MeanAirTemperature <= 0.0))
        vc_EffectiveVernalisation = (vw_MeanAirTemperature + 4.0) / 4.0;
      else if ((vw_MeanAirTemperature > 0.0) && (vw_MeanAirTemperature <= 3.0))
        vc_EffectiveVernalisation = 1.0;
      else if ((vw_MeanAirTemperature > 3.0) && (vw_MeanAirTemperature <= 7.0))
        vc_EffectiveVernalisation = 1.0 - (0.2 * (vw_MeanAirTemperature - 3.0) / 4.0);
      else if ((vw_MeanAirTemperature > 7.0) && (vw_MeanAirTemperature <= 9.0))
        vc_EffectiveVernalisation = 0.8 - (0.4 * (vw_MeanAirTemperature - 7.0) / 2.0);
      else if ((vw_MeanAirTemperature > 9.0) && (vw_MeanAirTemperature <= 18.0))
        vc_EffectiveVernalisation = 0.4 - (0.4 * (vw_MeanAirTemperature - 9.0) / 9.0);
      else if ((vw_MeanAirTemperature <= -4.0) || (vw_MeanAirTemperature > 18.0))
        vc_EffectiveVernalisation = 0.0;
      else
        vc_EffectiveVernalisation = 1.0;
      
      // old VERNTAGE
      d_VernalisationDays += vc_EffectiveVernalisation * vc_TimeStep;

      // old VERSCHWELL
      var vc_VernalisationThreshold = min(d_VernalisationRequirement, 9.0) - 1.0;

      if (vc_VernalisationThreshold >= 1) {
        vc_VernalisationFactor = (d_VernalisationDays - vc_VernalisationThreshold) / (d_VernalisationRequirement - vc_VernalisationThreshold);
        if (vc_VernalisationFactor < 0)
          vc_VernalisationFactor = 0.0;
      } else {
        vc_VernalisationFactor = 1.0;
      }
    }

    return [
      vc_VernalisationFactor, 
      d_VernalisationDays
    ];
  };

  var fc_OxygenDeficiency = function (
    d_CriticalOxygenContent, 
    vc_AirFilledPoreVolume, 
    vc_MaxOxygenDeficit
  ) {

    if (DEBUG) debug(arguments);

    var vc_AirFilledPoreVolume = vc_AirFilledPoreVolume || 0.0;
    var vc_MaxOxygenDeficit = vc_MaxOxygenDeficit || 0.0;

    // Reduktion bei Luftmangel Stauwasser berücksichtigen!!!!
    vc_AirFilledPoreVolume = ((soilColumn[0].get_Saturation() + soilColumn[1].get_Saturation()
        + soilColumn[2].get_Saturation()) - (soilColumn[0].get_Vs_SoilMoisture_m3() + soilColumn[1].get_Vs_SoilMoisture_m3()
        + soilColumn[2].get_Vs_SoilMoisture_m3())) / 3.0;
    if (vc_AirFilledPoreVolume < d_CriticalOxygenContent) {
      vc_TimeUnderAnoxia += int(vc_TimeStep);
      if (vc_TimeUnderAnoxia > 4)
        vc_TimeUnderAnoxia = 4;
      if (vc_AirFilledPoreVolume < 0.0)
        vc_AirFilledPoreVolume = 0.0;
      vc_MaxOxygenDeficit = vc_AirFilledPoreVolume / d_CriticalOxygenContent;
      // JS! c++ : double (int / int) -> js int(double / double) !! took hours to debug!
      vc_OxygenDeficit = 1.0 - int(vc_TimeUnderAnoxia / 4) * (1.0 - vc_MaxOxygenDeficit);
    } else {
      vc_TimeUnderAnoxia = 0;
      vc_OxygenDeficit = 1.0;
    }
    if (vc_OxygenDeficit > 1.0)
      vc_OxygenDeficit = 1.0;

    return vc_OxygenDeficit;
  };

  var fc_CropDevelopmentalStage = function (
    vw_MeanAirTemperature,
    pc_BaseTemperature,
    pc_OptimumTemperature,
    pc_StageTemperatureSum,
    vc_TimeStep,
    d_SoilMoisture_m3,
    d_FieldCapacity,
    d_PermanentWiltingPoint,
    pc_NumberOfDevelopmentalStages,
    vc_VernalisationFactor,
    vc_DaylengthFactor,
    vc_CropNRedux
  ) {

    if (DEBUG) debug(arguments);

    var vc_CapillaryWater;
    var vc_DevelopmentAccelerationByNitrogenStress = 0.0; // old NPROG
    var vc_DevelopmentAccelerationByWaterStress = 0.0; // old WPROG
    var vc_DevelopmentAccelerationByStress = 0.0; // old DEVPROG
    var vc_SoilTemperature = soilColumn[0].get_Vs_SoilTemperature();

    if (vc_DevelopmentalStage == 0) {

      if (vc_SoilTemperature > pc_BaseTemperature[vc_DevelopmentalStage]) {

        vc_CapillaryWater = d_FieldCapacity - d_PermanentWiltingPoint;

        /** @todo Claas: Schränkt trockener Boden das Aufsummieren der Wärmeeinheiten ein, oder
         sollte nicht eher nur der Wechsel in das Stadium 1 davon abhängen? --> Christian */

        if (pc_EmergenceMoistureControlOn == true && pc_EmergenceFloodingControlOn == true) {

          if (d_SoilMoisture_m3 > ((0.2 * vc_CapillaryWater) + d_PermanentWiltingPoint)
            && (soilColumn.vs_SurfaceWaterStorage < 0.001)) {
          // Germination only if soil water content in top layer exceeds
          // 20% of capillary water, but is not beyond field capacity and
          // if no water is stored on the soil surface.

            vc_CurrentTemperatureSum[vc_DevelopmentalStage] += (vc_SoilTemperature
              - pc_BaseTemperature[vc_DevelopmentalStage]) * vc_TimeStep;

            if (vc_CurrentTemperatureSum[vc_DevelopmentalStage] >= pc_StageTemperatureSum[vc_DevelopmentalStage]) {
              vc_DevelopmentalStage++;
            }
          }
        } else if (pc_EmergenceMoistureControlOn == true && pc_EmergenceFloodingControlOn == false) {

          if (d_SoilMoisture_m3 > ((0.2 * vc_CapillaryWater) + d_PermanentWiltingPoint)) {
          // Germination only if soil water content in top layer exceeds
          // 20% of capillary water, but is not beyond field capacity.

            vc_CurrentTemperatureSum[vc_DevelopmentalStage] += (vc_SoilTemperature
              - pc_BaseTemperature[vc_DevelopmentalStage]) * vc_TimeStep;

            if (vc_CurrentTemperatureSum[vc_DevelopmentalStage] >= pc_StageTemperatureSum[vc_DevelopmentalStage]) {
              vc_DevelopmentalStage++;

            }
          }
        } else if (pc_EmergenceMoistureControlOn == false && pc_EmergenceFloodingControlOn == true) {

          if (soilColumn.vs_SurfaceWaterStorage < 0.001) {
            // Germination only if no water is stored on the soil surface.

            vc_CurrentTemperatureSum[vc_DevelopmentalStage] += (vc_SoilTemperature
              - pc_BaseTemperature[vc_DevelopmentalStage]) * vc_TimeStep;

            if (vc_CurrentTemperatureSum[vc_DevelopmentalStage] >= pc_StageTemperatureSum[vc_DevelopmentalStage]) {
              vc_DevelopmentalStage++;
            }
          }

        } else {
          vc_CurrentTemperatureSum[vc_DevelopmentalStage] += (vc_SoilTemperature
                - pc_BaseTemperature[vc_DevelopmentalStage]) * vc_TimeStep;

          if (vc_CurrentTemperatureSum[vc_DevelopmentalStage] >= pc_StageTemperatureSum[vc_DevelopmentalStage]) {
            vc_DevelopmentalStage++;
          }
        }
      }
    } else if (vc_DevelopmentalStage > 0) {

      // Development acceleration by N deficit in crop tissue
      if ((pc_DevelopmentAccelerationByNitrogenStress == 1) &&
          (pc_AssimilatePartitioningCoeff[vc_DevelopmentalStage][vc_StorageOrgan] > 0.9)){

        vc_DevelopmentAccelerationByNitrogenStress = 1.0 + ((1.0 - vc_CropNRedux) * (1.0 - vc_CropNRedux));

      } else {

        vc_DevelopmentAccelerationByNitrogenStress = 1.0;
      }

      // Development acceleration by water deficit
      if ((vc_TranspirationDeficit < pc_DroughtStressThreshold[vc_DevelopmentalStage]) &&
          (pc_AssimilatePartitioningCoeff[vc_DevelopmentalStage][vc_StorageOrgan] > 0.9)){

        if (vc_OxygenDeficit < 1.0) {
          vc_DevelopmentAccelerationByWaterStress = 1.0;
        } else {
          vc_DevelopmentAccelerationByWaterStress = 1.0 + ((1.0 - vc_TranspirationDeficit)
          * (1.0 - vc_TranspirationDeficit));
        }

      } else {
        vc_DevelopmentAccelerationByWaterStress = 1.0;
      }

      vc_DevelopmentAccelerationByStress = max(vc_DevelopmentAccelerationByNitrogenStress,
          vc_DevelopmentAccelerationByWaterStress);

      if (vw_MeanAirTemperature > pc_BaseTemperature[vc_DevelopmentalStage]) {

        if (vw_MeanAirTemperature > pc_OptimumTemperature[vc_DevelopmentalStage]){
                  vw_MeanAirTemperature = pc_OptimumTemperature[vc_DevelopmentalStage];
        }

        vc_CurrentTemperatureSum[vc_DevelopmentalStage] += (vw_MeanAirTemperature
            - pc_BaseTemperature[vc_DevelopmentalStage]) * vc_VernalisationFactor * vc_DaylengthFactor
            * vc_DevelopmentAccelerationByStress * vc_TimeStep;

        vc_CurrentTotalTemperatureSum += (vw_MeanAirTemperature - pc_BaseTemperature[vc_DevelopmentalStage])
            * vc_VernalisationFactor * vc_DaylengthFactor * vc_DevelopmentAccelerationByStress * vc_TimeStep;

      }

      if (vc_CurrentTemperatureSum[vc_DevelopmentalStage] >= pc_StageTemperatureSum[vc_DevelopmentalStage]) {

        if (vc_DevelopmentalStage < (pc_NumberOfDevelopmentalStages - 1)) {

          vc_DevelopmentalStage++;
        }
      }

    } else {
      logger(MSG.WARN, "irregular developmental stage");
    }

  };

  // double 
  var fc_KcFactor = function (
  vc_DevelopmentalStage, 
  d_StageTemperatureSum,
  d_CurrentTemperatureSum,
  pc_InitialKcFactor,
  d_StageKcFactor,
  d_EarlierStageKcFactor
  ) {

    if (DEBUG) debug(arguments);

    var vc_KcFactor;

    var vc_RelativeDevelopment = d_CurrentTemperatureSum / d_StageTemperatureSum; // old relint

    if (vc_RelativeDevelopment > 1.0) vc_RelativeDevelopment = 1.0;

    if (vc_DevelopmentalStage == 0)
      vc_KcFactor = pc_InitialKcFactor + (d_StageKcFactor - pc_InitialKcFactor) * vc_RelativeDevelopment;
    else // Interpolating the Kc Factors
      vc_KcFactor = d_EarlierStageKcFactor + ((d_StageKcFactor - d_EarlierStageKcFactor) * vc_RelativeDevelopment);

    return vc_KcFactor;
  };

  var fc_CropSize = function (
    pc_MaxCropHeight,
    pc_MaxCropDiameter,
    pc_StageAtMaxHeight,
    pc_StageAtMaxDiameter,
    pc_StageTemperatureSum,
    vc_CurrentTotalTemperatureSum,
    pc_CropHeightP1,
    pc_CropHeightP2
  ) {

    if (DEBUG) debug(arguments);

    var vc_TotalTemperatureSumForHeight = 0.0;
    for (var i_Stage = 1; i_Stage < pc_StageAtMaxHeight + 1; i_Stage++)
      vc_TotalTemperatureSumForHeight += pc_StageTemperatureSum[i_Stage];

    var vc_TotalTemperatureSumForDiameter = 0.0;
    for (var i_Stage = 1; i_Stage < pc_StageAtMaxDiameter + 1; i_Stage++)
      vc_TotalTemperatureSumForDiameter += pc_StageTemperatureSum[i_Stage];

    var vc_RelativeTotalDevelopmentForHeight = vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSumForHeight;
    if (vc_RelativeTotalDevelopmentForHeight > 1.0)
      vc_RelativeTotalDevelopmentForHeight = 1.0;

    var vc_RelativeTotalDevelopmentForDiameter = vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSumForDiameter;
    if (vc_RelativeTotalDevelopmentForDiameter > 1.0)
      vc_RelativeTotalDevelopmentForDiameter = 1.0;

    if (vc_RelativeTotalDevelopmentForHeight > 0.0)
      vc_CropHeight = pc_MaxCropHeight / (1.0 + exp(-pc_CropHeightP1 * (vc_RelativeTotalDevelopmentForHeight- pc_CropHeightP2)));
    else 
      vc_CropHeight = 0.0;

    if (vc_RelativeTotalDevelopmentForDiameter > 0.0)
      vc_CropDiameter = pc_MaxCropDiameter * vc_RelativeTotalDevelopmentForDiameter;
    else
      vc_CropDiameter = 0.0;
  };

  var fc_CropGreenArea = function (
    d_LeafBiomassIncrement,
    d_LeafBiomassDecrement,
    vc_CropHeight,
    vc_CropDiameter,
    d_SpecificLeafAreaStart,
    d_SpecificLeafAreaEnd,
    d_SpecificLeafAreaEarly,
    d_StageTemperatureSum,
    d_CurrentTemperatureSum,
    pc_PlantDensity,
    vc_TimeStep
  ) {

    if (DEBUG) debug(arguments);

    vc_LeafAreaIndex += (
      (d_LeafBiomassIncrement * (d_SpecificLeafAreaStart + (d_CurrentTemperatureSum /
      d_StageTemperatureSum * (d_SpecificLeafAreaEnd - d_SpecificLeafAreaStart))) * vc_TimeStep) -
      (d_LeafBiomassDecrement * d_SpecificLeafAreaEarly * vc_TimeStep)
    ); // [ha ha-1]

    if (vc_LeafAreaIndex <= 0.0)
      vc_LeafAreaIndex = 0.001;

    vc_GreenAreaIndex = vc_LeafAreaIndex + (vc_CropHeight * PI * vc_CropDiameter * pc_PlantDensity); // [m2 m-2]
    };

    // double 
    var fc_SoilCoverage = function (vc_LeafAreaIndex) {

    vc_SoilCoverage = 1.0 - (exp(-0.5 * vc_LeafAreaIndex));

    return vc_SoilCoverage;

  };

  var fc_CropPhotosynthesis = function (
    vw_MeanAirTemperature,
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vc_GlobalRadiation,
    vw_AtmosphericCO2Concentration,
    vs_Latitude,
    vc_LeafAreaIndex,
    pc_DefaultRadiationUseEfficiency,
    pc_MaxAssimilationRate,
    pc_MinimumTemperatureForAssimilation,
    vc_AstronomicDayLenght,
    vc_Declination,
    vc_ClearDayRadiation,
    vc_EffectiveDayLength,
    vc_OvercastDayRadiation
  ) {

    if (DEBUG) debug(arguments);

    var vc_CO2CompensationPoint = 0.0; // old COcomp
    var vc_CO2CompensationPointReference = 0.0;
    var vc_RadiationUseEfficiency = 0.0; // old EFF
    var vc_RadiationUseEfficiencyReference = 0.0;
    var KTvmax = 0.0; // old KTvmax
    var KTkc = 0.0; // old KTkc
    var KTko = 0.0; // old KTko
    var vc_AmaxFactor = 0.0; // old fakamax
    var vc_AmaxFactorReference = 0.0;
    var vc_Vcmax = 0.0; // old vcmax
    var vc_VcmaxReference = 0.0;
    var Mkc = 0.0; // old Mkc
    var Mko = 0.0; // old Mko
    var Oi = 0.0; // old Oi
    var Ci = 0.0; // old Ci
    var vc_AssimilationRateReference = 0.0;
    var vc_HoffmannK1 = 0.0; // old KCo1
    var vc_HoffmannC0 = 0.0; // old coco
    var vc_HoffmannKCO2 = 0.0; // old KCO2
    var vc_NetRadiationUseEfficiency = 0.0; // old EFFE;
    var vc_NetRadiationUseEfficiencyReference = 0.0;
    var SSLAE = 0.0; // old SSLAE;
    var X = 0.0; // old X;
    var XReference = 0.0;
    var PHCH1 = 0.0; // old PHCH1;
    var PHCH1Reference = 0.0;
    var Y = 0.0; // old Y;
    var YReference = 0.0;
    var PHCH2 = 0.0; // old PHCH2;
    var PHCH2Reference = 0.0;
    var PHCH = 0.0; // old PHCH;
    var PHCHReference = 0.0;
    var PHC3 = 0.0; // old PHC3;
    var PHC3Reference = 0.0;
    var PHC4 = 0.0; // old PHC4;
    var PHC4Reference = 0.0;
    var PHCL = 0.0; // old PHCL;
    var PHCLReference = 0.0;
    var Z = 0.0; // old Z;
    var PHOH1 = 0.0; // old PHOH1;
    var PHOH = 0.0; // old PHOH;
    var PHO3 = 0.0; // old PHO3;
    var PHO3Reference = 0.0;
    var PHOL = 0.0; // old PHOL;
    var PHOLReference = 0.0;
    var vc_ClearDayCO2AssimilationReference = 0.0;
    var vc_OvercastDayCO2AssimilationReference = 0.0;
    var vc_ClearDayCO2Assimilation = 0.0; // old DGAC;
    var vc_OvercastDayCO2Assimilation = 0.0; // old DGAO;
    //var vc_GrossAssimilates = 0.0;
    var vc_GrossCO2Assimilation = 0.0; // old DTGA;
    var vc_GrossCO2AssimilationReference = 0.0; // used for ET0 calculation
    var vc_OvercastSkyTimeFraction = 0.0; // old FOV;
    var vc_MaintenanceTemperatureDependency = 0.0; // old TEFF
    var vc_MaintenanceRespiration = 0.0; // old MAINTS
    var vc_DroughtStressThreshold = 0.0; // old VSWELL;
    var vc_PhotoTemperature = 0.0;
    var vc_NightTemperature = 0.0;
    var vc_PhotoMaintenanceRespiration = 0.0;
    var vc_DarkMaintenanceRespiration = 0.0;
    var vc_PhotoGrowthRespiration = 0.0;
    var vc_DarkGrowthRespiration = 0.0;

    var user_crops = centralParameterProvider.userCropParameters;
    var pc_ReferenceLeafAreaIndex = user_crops.pc_ReferenceLeafAreaIndex;
    var pc_ReferenceMaxAssimilationRate = user_crops.pc_ReferenceMaxAssimilationRate;
    var pc_MaintenanceRespirationParameter_1 = user_crops.pc_MaintenanceRespirationParameter1;
    var pc_MaintenanceRespirationParameter_2 = user_crops.pc_MaintenanceRespirationParameter2;

    var pc_GrowthRespirationParameter_1 = user_crops.pc_GrowthRespirationParameter1;
    var pc_GrowthRespirationParameter_2 = user_crops.pc_GrowthRespirationParameter2;
    var pc_CanopyReflectionCoeff = user_crops.pc_CanopyReflectionCoefficient; // old REFLC;

    // Calculation of CO2 impact on crop growth
    if (pc_CO2Method == 3) {

      //////////////////////////////////////////////////////////////////////////
      // Method 3:
      // Long, S.P. 1991. Modification of the response of photosynthetic
      // productivity to rising temperature by atmospheric CO2
      // concentrations - Has its importance been underestimated. Plant
      // Cell Environ. 14(8): 729-739.
      // and
      // Mitchell, R.A.C., D.W. Lawlor, V.J. Mitchell, C.L. Gibbard, E.M.
      // White, and J.R. Porter. 1995. Effects of elevated CO2
      // concentration and increased temperature on winter-wheat - Test
      // of ARCWHEAT1 simulation model. Plant Cell Environ. 18(7):736-748.
      //////////////////////////////////////////////////////////////////////////

      KTvmax = exp(68800.0 * ((vw_MeanAirTemperature + 273.0) - 298.0)
          / (298.0 * (vw_MeanAirTemperature + 273.0) * 8.314)) * pow(((vw_MeanAirTemperature + 273.0) / 298.0), 0.5);

      KTkc = exp(65800.0 * ((vw_MeanAirTemperature + 273.0) - 298.0) / (298.0 * (vw_MeanAirTemperature + 273.0) * 8.314))
          * pow(((vw_MeanAirTemperature + 273.0) / 298.0), 0.5);

      KTko = exp(1400.0 * ((vw_MeanAirTemperature + 273.0) - 298.0) / (298.0 * (vw_MeanAirTemperature + 273.0) * 8.314))
          * pow(((vw_MeanAirTemperature + 273.0) / 298.0), 0.5);

      // Berechnung des Transformationsfaktors fr pflanzenspez. AMAX bei 25 grad
      vc_AmaxFactor = pc_MaxAssimilationRate / 34.668;
      vc_AmaxFactorReference = pc_ReferenceMaxAssimilationRate / 34.668;
      vc_Vcmax = 98.0 * vc_AmaxFactor * KTvmax;
      vc_VcmaxReference = 98.0 * vc_AmaxFactorReference * KTvmax;

      Mkc = 460.0 * KTkc; //[µmol mol-1]
      Mko = 330.0 * KTko; //[mmol mol-1]

      Oi = 210.0 + (0.047 - 0.0013087 * vw_MeanAirTemperature + 0.000025603 * (vw_MeanAirTemperature
          * vw_MeanAirTemperature) - 0.00000021441 * (vw_MeanAirTemperature * vw_MeanAirTemperature
          * vw_MeanAirTemperature)) / 0.026934;

      Ci = vw_AtmosphericCO2Concentration * 0.7 * (1.674 - 0.061294 * vw_MeanAirTemperature + 0.0011688
          * (vw_MeanAirTemperature * vw_MeanAirTemperature) - 0.0000088741 * (vw_MeanAirTemperature
          * vw_MeanAirTemperature * vw_MeanAirTemperature)) / 0.73547;

      vc_CO2CompensationPoint = 0.5 * 0.21 * vc_Vcmax * Oi / (vc_Vcmax * Mko);
      vc_CO2CompensationPointReference = 0.5 * 0.21 * vc_VcmaxReference * Oi / (vc_VcmaxReference * Mko);

      vc_RadiationUseEfficiency = min((0.77 / 2.1 * (Ci - vc_CO2CompensationPoint) / (4.5 * Ci + 10.5
          * vc_CO2CompensationPoint) * 8.3769), 0.5);
      vc_RadiationUseEfficiencyReference = min((0.77 / 2.1 * (Ci - vc_CO2CompensationPointReference) / (4.5 * Ci + 10.5
          * vc_CO2CompensationPointReference) * 8.3769), 0.5);

    } else {
      vc_RadiationUseEfficiency = pc_DefaultRadiationUseEfficiency;
      vc_RadiationUseEfficiencyReference = pc_DefaultRadiationUseEfficiency;
    }

    if (pc_CarboxylationPathway == 1) {

      if (pc_CO2Method == 2) {

        //////////////////////////////////////////////////////////////////////////
        // Method 2:
        // Hoffmann, F. 1995. Fagus, a model for growth and development of
        // beech. Ecol. Mod. 83 (3):327-348.
        //////////////////////////////////////////////////////////////////////////

        if (vw_MeanAirTemperature < pc_MinimumTemperatureForAssimilation) {
          vc_AssimilationRate = 0.0;
          vc_AssimilationRateReference = 0.0;
        } else if (vw_MeanAirTemperature < 10.0) {
          vc_AssimilationRate = pc_MaxAssimilationRate * vw_MeanAirTemperature / 10.0 * 0.4;
          vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * vw_MeanAirTemperature / 10.0 * 0.4;
        } else if (vw_MeanAirTemperature < 15.0) {
          vc_AssimilationRate = pc_MaxAssimilationRate * (0.4 + (vw_MeanAirTemperature - 10.0) / 5.0 * 0.5);
          vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.4 + (vw_MeanAirTemperature - 10.0) / 5.0
              * 0.5);
        } else if (vw_MeanAirTemperature < 25.0) {
          vc_AssimilationRate = pc_MaxAssimilationRate * (0.9 + (vw_MeanAirTemperature - 15.0) / 10.0 * 0.1);
          vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.9 + (vw_MeanAirTemperature - 15.0) / 10.0
              * 0.1);
        } else if (vw_MeanAirTemperature < 35.0) {
          vc_AssimilationRate = pc_MaxAssimilationRate * (1.0 - (vw_MeanAirTemperature - 25.0) / 10.0);
          vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (1.0 - (vw_MeanAirTemperature - 25.0) / 10.0);
        } else {
          vc_AssimilationRate = 0.0;
          vc_AssimilationRateReference = 0.0;
        }


        /** @FOR_PARAM */
        vc_HoffmannK1 = 220.0 + 0.158 * (vc_GlobalRadiation * 86400.0 / 1000000.0);

        // PAR [MJ m-2], Hoffmann's model requires [W m-2] ->
        // conversion of [MJ m-2] to [W m-2]

        vc_HoffmannC0 = 80.0 - 0.036 * (vc_GlobalRadiation * 86400.0 / 1000000.0);


        vc_HoffmannKCO2 = ((vw_AtmosphericCO2Concentration - vc_HoffmannC0) / (vc_HoffmannK1
            + vw_AtmosphericCO2Concentration - vc_HoffmannC0)) / ((350.0 - vc_HoffmannC0) / (vc_HoffmannK1 + 350.0
            - vc_HoffmannC0));

        vc_AssimilationRate = vc_AssimilationRate * vc_HoffmannKCO2;
        vc_AssimilationRateReference = vc_AssimilationRateReference * vc_HoffmannKCO2;

      } else if (pc_CO2Method == 3) {

        vc_AssimilationRate = (Ci - vc_CO2CompensationPoint) * vc_Vcmax / (Ci + Mkc * (1.0 + Oi / Mko)) * 1.656;
        vc_AssimilationRateReference = (Ci - vc_CO2CompensationPointReference) * vc_VcmaxReference / (Ci + Mkc * (1.0
            + Oi / Mko)) * 1.656;

        if (vw_MeanAirTemperature < pc_MinimumTemperatureForAssimilation) {
          vc_AssimilationRate = 0.0;
          vc_AssimilationRateReference = 0.0;
        }
      }


    } else { //if pc_CarboxylationPathway = 2
      if (vw_MeanAirTemperature < pc_MinimumTemperatureForAssimilation) {
        vc_AssimilationRate = 0;
        vc_AssimilationRateReference = 0.0;

        // Sage & Kubien (2007): The temperature response of C3 and C4 phtotsynthesis.
        // Plant, Cell and Environment 30, 1086 - 1106.

      } else if (vw_MeanAirTemperature < 9.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * vw_MeanAirTemperature / 10.0 * 0.08;
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * vw_MeanAirTemperature / 10.0 * 0.08;
      } else if (vw_MeanAirTemperature < 14.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.071 + (vw_MeanAirTemperature - 9.0) * 0.03);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.071 + (vw_MeanAirTemperature - 9.0) * 0.03);
      } else if (vw_MeanAirTemperature < 20.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.221 + (vw_MeanAirTemperature - 14.0) * 0.09);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.221 + (vw_MeanAirTemperature - 14.0) * 0.09);
      } else if (vw_MeanAirTemperature < 24.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.761 + (vw_MeanAirTemperature - 20.0) * 0.04);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.761 + (vw_MeanAirTemperature - 20.0) * 0.04);
      } else if (vw_MeanAirTemperature < 32.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.921 + (vw_MeanAirTemperature - 24.0) * 0.01);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.921 + (vw_MeanAirTemperature - 24.0) * 0.01);
      } else if (vw_MeanAirTemperature < 38.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate;
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate;
      } else if (vw_MeanAirTemperature < 42.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (1.0 - (vw_MeanAirTemperature - 38.0) * 0.01);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (1.0 - (vw_MeanAirTemperature - 38.0) * 0.01);
      } else if (vw_MeanAirTemperature < 45.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.96 - (vw_MeanAirTemperature - 42.0) * 0.04);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.96 - (vw_MeanAirTemperature - 42.0) * 0.04);
      } else if (vw_MeanAirTemperature < 54.0) {
        vc_AssimilationRate = pc_MaxAssimilationRate * (0.84 - (vw_MeanAirTemperature - 45.0) * 0.09);
        vc_AssimilationRateReference = pc_ReferenceMaxAssimilationRate * (0.84 - (vw_MeanAirTemperature - 45.0) * 0.09);
      } else {
        vc_AssimilationRate = 0;
        vc_AssimilationRateReference = 0;
      }
    }

    if (cutting_delay_days>0) {
        vc_AssimilationRate = 0.0;
        vc_AssimilationRateReference = 0.0;
    }

    if (vc_AssimilationRate < 0.1) {
      vc_AssimilationRate = 0.1;
    }

    if (vc_AssimilationRateReference < 0.1) {
      vc_AssimilationRateReference = 0.1;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Calculation of light interception in the crop
    //
    // Penning De Vries, F.W.T and H.H. van Laar (1982): Simulation of
    // plant growth and crop production. Pudoc, Wageningen, The
    // Netherlands, p. 87-97.
    ///////////////////////////////////////////////////////////////////////////

    vc_NetRadiationUseEfficiency = (1.0 - pc_CanopyReflectionCoeff) * vc_RadiationUseEfficiency;
    vc_NetRadiationUseEfficiencyReference = (1.0 - pc_CanopyReflectionCoeff) * vc_RadiationUseEfficiencyReference;

    SSLAE = sin((90.0 + vc_Declination - vs_Latitude) * PI / 180.0); // = HERMES

    X = log(1.0 + 0.45 * vc_ClearDayRadiation / (vc_EffectiveDayLength * 3600.0) * vc_NetRadiationUseEfficiency / (SSLAE
        * vc_AssimilationRate)); // = HERMES
    XReference = log(1.0 + 0.45 * vc_ClearDayRadiation / (vc_EffectiveDayLength * 3600.0)
        * vc_NetRadiationUseEfficiencyReference / (SSLAE * vc_AssimilationRateReference));

    PHCH1 = SSLAE * vc_AssimilationRate * vc_EffectiveDayLength * X / (1.0 + X); // = HERMES
    PHCH1Reference = SSLAE * vc_AssimilationRateReference * vc_EffectiveDayLength * XReference / (1.0 + XReference);

    Y = log(1.0 + 0.55 * vc_ClearDayRadiation / (vc_EffectiveDayLength * 3600.0) * vc_NetRadiationUseEfficiency / ((5.0
        - SSLAE) * vc_AssimilationRate)); // = HERMES
    YReference = log(1.0 + 0.55 * vc_ClearDayRadiation / (vc_EffectiveDayLength * 3600.0) * vc_NetRadiationUseEfficiency
        / ((5.0 - SSLAE) * vc_AssimilationRateReference));

    PHCH2 = (5.0 - SSLAE) * vc_AssimilationRate * vc_EffectiveDayLength * Y / (1.0 + Y); // = HERMES
    PHCH2Reference = (5.0 - SSLAE) * vc_AssimilationRateReference * vc_EffectiveDayLength * YReference / (1.0
        + YReference);

    PHCH = 0.95 * (PHCH1 + PHCH2) + 20.5; // = HERMES
    PHCHReference = 0.95 * (PHCH1Reference + PHCH2Reference) + 20.5;

    PHC3 = PHCH * (1.0 - exp(-0.8 * vc_LeafAreaIndex));
    PHC3Reference = PHCHReference * (1.0 - exp(-0.8 * pc_ReferenceLeafAreaIndex));

    PHC4 = vc_AstronomicDayLenght * vc_LeafAreaIndex * vc_AssimilationRate;
    PHC4Reference = vc_AstronomicDayLenght * pc_ReferenceLeafAreaIndex * vc_AssimilationRateReference;

    if (PHC3 < PHC4) {
      PHCL = PHC3 * (1.0 - exp(-PHC4 / PHC3));
    } else {
      PHCL = PHC4 * (1.0 - exp(-PHC3 / PHC4));
    }

    if (PHC3Reference < PHC4Reference) {
      PHCLReference = PHC3Reference * (1.0 - exp(-PHC4Reference / PHC3Reference));
    } else {
      PHCLReference = PHC4Reference * (1.0 - exp(-PHC3Reference / PHC4Reference));
    }

    Z = vc_OvercastDayRadiation / (vc_EffectiveDayLength * 3600.0) * vc_NetRadiationUseEfficiency / (5.0
        * vc_AssimilationRate);

    PHOH1 = 5.0 * vc_AssimilationRate * vc_EffectiveDayLength * Z / (1.0 + Z);
    PHOH = 0.9935 * PHOH1 + 1.1;
    PHO3 = PHOH * (1.0 - exp(-0.8 * vc_LeafAreaIndex));
    PHO3Reference = PHOH * (1.0 - exp(-0.8 * pc_ReferenceLeafAreaIndex));

    if (PHO3 < PHC4) {
      PHOL = PHO3 * (1.0 - exp(-PHC4 / PHO3));
    } else {
      PHOL = PHC4 * (1.0 - exp(-PHO3 / PHC4));
    }

    if (PHO3Reference < PHC4Reference) {
      PHOLReference = PHO3Reference * (1.0 - exp(-PHC4Reference / PHO3Reference));
    } else {
      PHOLReference = PHC4Reference * (1.0 - exp(-PHO3Reference / PHC4Reference));
    }

    if (vc_LeafAreaIndex < 5.0) {
      vc_ClearDayCO2Assimilation = PHCL; // [J m-2]
      vc_OvercastDayCO2Assimilation = PHOL; // [J m-2]
    } else {
      vc_ClearDayCO2Assimilation = PHCH; // [J m-2]
      vc_OvercastDayCO2Assimilation = PHOH; // [J m-2]
    }

    vc_ClearDayCO2AssimilationReference = PHCLReference;
    vc_OvercastDayCO2AssimilationReference = PHOLReference;

    // Calculation of time fraction for overcast sky situations by
    // comparing clear day radiation and measured PAR in [J m-2].
    // HERMES uses PAR as 50% of global radiation

    vc_OvercastSkyTimeFraction = (vc_ClearDayRadiation - (1000000.0 * vc_GlobalRadiation * 0.50)) / (0.8
        * vc_ClearDayRadiation); // [J m-2]

    if (vc_OvercastSkyTimeFraction > 1.0) {
      vc_OvercastSkyTimeFraction = 1.0;
    }

    if (vc_OvercastSkyTimeFraction < 0.0) {
      vc_OvercastSkyTimeFraction = 0.0;
    }

    // Calculation of gross CO2 assimilation in dependence of cloudiness
    vc_GrossCO2Assimilation = vc_OvercastSkyTimeFraction * vc_OvercastDayCO2Assimilation + (1.0
        - vc_OvercastSkyTimeFraction) * vc_ClearDayCO2Assimilation;

    vc_GrossCO2AssimilationReference = vc_OvercastSkyTimeFraction * vc_OvercastDayCO2AssimilationReference + (1.0
        - vc_OvercastSkyTimeFraction) * vc_ClearDayCO2AssimilationReference;

    if (vc_OxygenDeficit < 1.0) {

      // vc_OxygenDeficit separates drought stress (ETa/Etp) from saturation stress.
      vc_DroughtStressThreshold = 0.0;
    } else {
      vc_DroughtStressThreshold = pc_DroughtStressThreshold[vc_DevelopmentalStage];
    }

    // Gross CO2 assimilation is used for reference evapotranspiration calculation.
    // For this purpose it must not be affected by drought stress, as the grass
    // reference is defined as being always well supplied with water. Water stress
    // is acting at a later stage.

    if (vc_TranspirationDeficit < vc_DroughtStressThreshold) {
      vc_GrossCO2Assimilation = vc_GrossCO2Assimilation; // *  vc_TranspirationDeficit;
    }

    // Calculation of photosynthesis rate from [kg CO2 ha-1 d-1] to [kg CH2O ha-1 d-1]
    vc_GrossPhotosynthesis = vc_GrossCO2Assimilation * 30.0 / 44.0;

    // Calculation of photosynthesis rate from [kg CO2 ha-1 d-1]  to [mol m-2 s-1] or [cm3 cm-2 s-1]
    vc_GrossPhotosynthesis_mol = vc_GrossCO2Assimilation * 22414.0 / (10.0 * 3600.0 * 24.0 * 44.0);
    vc_GrossPhotosynthesisReference_mol = vc_GrossCO2AssimilationReference * 22414.0 / (10.0 * 3600.0 * 24.0 * 44.0);

    // Converting photosynthesis rate from [kg CO2 ha leaf-1 d-1] to [kg CH2O ha-1  d-1]
    vc_Assimilates = vc_GrossCO2Assimilation * 30.0 / 44.0;

    // reduction value for assimilate amount to simulate field conditions;
    vc_Assimilates *= cropParams.pc_FieldConditionModifier;

    if (vc_TranspirationDeficit < vc_DroughtStressThreshold) {
      vc_Assimilates = vc_Assimilates * vc_TranspirationDeficit;

    }

    vc_GrossAssimilates = vc_Assimilates;

    // ########################################################################
    // #                              AGROSIM                                 #
    // ########################################################################

    // AGROSIM night and day temperatures
    vc_PhotoTemperature = vw_MaxAirTemperature - ((vw_MaxAirTemperature - vw_MinAirTemperature) / 4.0);
    vc_NightTemperature = vw_MinAirTemperature + ((vw_MaxAirTemperature - vw_MinAirTemperature) / 4.0);

    var vc_MaintenanceRespirationSum = 0.0;
    // AGOSIM night and day maintenance and growth respiration
    for (var i_Organ = 0; i_Organ < pc_NumberOfOrgans; i_Organ++) {
      vc_MaintenanceRespirationSum += (vc_OrganBiomass[i_Organ] - vc_OrganDeadBiomass[i_Organ])
          * pc_OrganMaintenanceRespiration[i_Organ]; // [kg CH2O ha-1]
      // * vc_ActiveFraction[i_Organ]; wenn nicht schon durch acc dead matter abgedeckt
    }

    var vc_NormalisedDayLength = 2.0 - (vc_PhotoperiodicDaylength / 12.0);

    vc_PhotoMaintenanceRespiration = vc_MaintenanceRespirationSum * pow(2.0, (pc_MaintenanceRespirationParameter_1
                      * (vc_PhotoTemperature - pc_MaintenanceRespirationParameter_2))) * (2.0 - vc_NormalisedDayLength);// @todo: [g m-2] --> [kg ha-1]

    vc_DarkMaintenanceRespiration = vc_MaintenanceRespirationSum * pow(2.0, (pc_MaintenanceRespirationParameter_1
                     * (vc_NightTemperature - pc_MaintenanceRespirationParameter_2))) * vc_NormalisedDayLength; // @todo: [g m-2] --> [kg ha-1]

    vc_MaintenanceRespirationAS = vc_PhotoMaintenanceRespiration + vc_DarkMaintenanceRespiration; // [kg CH2O ha-1]


    vc_Assimilates -= vc_PhotoMaintenanceRespiration + vc_DarkMaintenanceRespiration; // [kg CH2O ha-1]
    var vc_GrowthRespirationSum = 0.0;

    for (var i_Organ = 0; i_Organ < pc_NumberOfOrgans; i_Organ++) {
      vc_GrowthRespirationSum += (vc_OrganBiomass[i_Organ] - vc_OrganDeadBiomass[i_Organ])
          * pc_OrganGrowthRespiration[i_Organ];
    }

    if (vc_Assimilates > 0.0) {
      vc_PhotoGrowthRespiration = vc_GrowthRespirationSum * pow(2.0, (pc_GrowthRespirationParameter_1
          * (vc_PhotoTemperature - pc_GrowthRespirationParameter_2))) * (2.0 - vc_NormalisedDayLength); // [kg CH2O ha-1]
      if (vc_Assimilates > vc_PhotoGrowthRespiration) {
        vc_Assimilates -= vc_PhotoGrowthRespiration;

      } else {
        vc_PhotoGrowthRespiration = vc_Assimilates; // in this case the plant will be restricted in growth!
        vc_Assimilates = 0.0;
      }
    }

    if (vc_Assimilates > 0.0) {
      vc_DarkGrowthRespiration = vc_GrowthRespirationSum * pow(2.0, (pc_GrowthRespirationParameter_1
          * (vc_PhotoTemperature - pc_GrowthRespirationParameter_2))) * vc_NormalisedDayLength; // [kg CH2O ha-1]
      if (vc_Assimilates > vc_DarkGrowthRespiration) {

        vc_Assimilates -= vc_DarkGrowthRespiration;
      } else {
        vc_DarkGrowthRespiration = vc_Assimilates; // in this case the plant will be restricted in growth!
        vc_Assimilates = 0.0;
      }

    }
    vc_GrowthRespirationAS = vc_PhotoGrowthRespiration + vc_DarkGrowthRespiration; // [kg CH2O ha-1]
    vc_TotalRespired = vc_GrossAssimilates - vc_Assimilates; // [kg CH2O ha-1]

    /** to reactivate HERMES algorithms, needs to be vc_NetPhotosynthesis
     * used instead of  vc_Assimilates in the subsequent methods */

    // #########################################################################
    // HERMES calculation of maintenance respiration in dependence of temperature

    vc_MaintenanceTemperatureDependency = pow(2.0, (0.1 * vw_MeanAirTemperature - 2.5));

    vc_MaintenanceRespiration = 0.0;

    for (var i_Organ = 0; i_Organ < pc_NumberOfOrgans; i_Organ++) {
      vc_MaintenanceRespiration += (vc_OrganBiomass[i_Organ] - vc_OrganDeadBiomass[i_Organ])
          * pc_OrganMaintenanceRespiration[i_Organ];
    }

    if (vc_GrossPhotosynthesis < (vc_MaintenanceRespiration * vc_MaintenanceTemperatureDependency)) {
      vc_NetMaintenanceRespiration = vc_GrossPhotosynthesis;
    } else {
      vc_NetMaintenanceRespiration = vc_MaintenanceRespiration * vc_MaintenanceTemperatureDependency;
    }

    if (vw_MeanAirTemperature < pc_MinimumTemperatureForAssimilation) {
      vc_GrossPhotosynthesis = vc_NetMaintenanceRespiration;
    }
    // This section is now inactive
    // #########################################################################

  };

  var fc_HeatStressImpact = function (
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vc_CurrentTotalTemperatureSum
  ) {

    // AGROSIM night and day temperatures
    var vc_PhotoTemperature = vw_MaxAirTemperature - ((vw_MaxAirTemperature - vw_MinAirTemperature) / 4.0);
    var vc_FractionOpenFlowers = 0.0;
    var vc_YesterdaysFractionOpenFlowers = 0.0;

    if ((pc_BeginSensitivePhaseHeatStress == 0.0) && (pc_EndSensitivePhaseHeatStress == 0.0)){
      vc_TotalCropHeatImpact = 1.0;
    }

    if ((vc_CurrentTotalTemperatureSum >= pc_BeginSensitivePhaseHeatStress) &&
        vc_CurrentTotalTemperatureSum < pc_EndSensitivePhaseHeatStress){

      // Crop heat redux: Challinor et al. (2005): Simulation of the impact of high
      // temperature stress on annual crop yields. Agricultural and Forest
      // Meteorology 135, 180 - 189.

      var vc_CropHeatImpact = 1.0 - ((vc_PhotoTemperature - pc_CriticalTemperatureHeatStress)
               / (pc_LimitingTemperatureHeatStress - pc_CriticalTemperatureHeatStress));

      if (vc_CropHeatImpact > 1.0)
        vc_CropHeatImpact = 1.0;

      if (vc_CropHeatImpact < 0.0)
        vc_CropHeatImpact = 0.0;

      // Fraction open flowers from Moriondo et al. (2011): Climate change impact
      // assessment: the role of climate extremes in crop yield simulation. Climatic
      // Change 104 (3-4), 679-701.

      vc_FractionOpenFlowers = 1.0 / (1.0 + ((1.0 / 0.015) - 1.0) * exp(-1.4 * vc_DaysAfterBeginFlowering));
      if (vc_DaysAfterBeginFlowering > 0){
        vc_YesterdaysFractionOpenFlowers = 1.0 / (1.0 + ((1.0 / 0.015) - 1.0) * exp(-1.4 * (vc_DaysAfterBeginFlowering - 1)));
      } else {
        vc_YesterdaysFractionOpenFlowers = 0.0;
      }

      var vc_DailyFloweringRate = vc_FractionOpenFlowers - vc_YesterdaysFractionOpenFlowers;

      // Total effect: Challinor et al. (2005): Simulation of the impact of high
      // temperature stress on annual crop yields. Agricultural and Forest
      // Meteorology 135, 180 - 189.
      vc_TotalCropHeatImpact += vc_CropHeatImpact * vc_DailyFloweringRate;

      vc_DaysAfterBeginFlowering += 1;

    }

    if (vc_CurrentTotalTemperatureSum >= pc_EndSensitivePhaseHeatStress){
      if (vc_TotalCropHeatImpact < vc_CropHeatRedux){
        vc_CropHeatRedux = vc_TotalCropHeatImpact;
      }
    }


    };

    var fc_DroughtImpactOnFertility = function (vc_TranspirationDeficit) {

    if (DEBUG) debug(arguments);

    if (vc_TranspirationDeficit < 0.0) vc_TranspirationDeficit = 0.0;

    // Fertility of the crop is reduced in cases of severe drought during bloom
    if ((vc_TranspirationDeficit < (pc_DroughtImpactOnFertilityFactor *
         pc_DroughtStressThreshold[vc_DevelopmentalStage])) &&
         (pc_AssimilatePartitioningCoeff[vc_DevelopmentalStage][vc_StorageOrgan] > 0.0)){

      var vc_TranspirationDeficitHelper = vc_TranspirationDeficit /
          (pc_DroughtImpactOnFertilityFactor * pc_DroughtStressThreshold[vc_DevelopmentalStage]);

      if (vc_OxygenDeficit < 1.0) {
        vc_DroughtImpactOnFertility = 1.0;
      } else {
        vc_DroughtImpactOnFertility = 1.0 - ((1.0 - vc_TranspirationDeficitHelper) * (1.0 - vc_TranspirationDeficitHelper));
      }

    } else {
      vc_DroughtImpactOnFertility = 1.0;
    }

  }

  var fc_CropNitrogen = function () {

    var vc_RootNRedux        = 0.0; // old REDWU
    var vc_RootNReduxHelper  = 0.0; // old WUX
    //var vc_MinimumNConcentration   = 0.0; // old MININ
    var vc_CropNReduxHelper  = 0.0; // old AUX

    vc_CriticalNConcentration = pc_NConcentrationPN *
          (1.0 + (pc_NConcentrationB0 *
          exp(-0.26 * (vc_AbovegroundBiomass + vc_BelowgroundBiomass) / 1000.0))) / 100.0;
          // [kg ha-1 -> t ha-1]

    vc_TargetNConcentration = vc_CriticalNConcentration * pc_LuxuryNCoeff;

    vc_NConcentrationAbovegroundBiomassOld = vc_NConcentrationAbovegroundBiomass;
    vc_NConcentrationRootOld = vc_NConcentrationRoot;

    if (vc_NConcentrationRoot < 0.01) {

      if (vc_NConcentrationRoot <= 0.005) {
        vc_RootNRedux = 0.0;
      }
      else {

        vc_RootNReduxHelper = (vc_NConcentrationRoot - 0.005) / 0.005;
        vc_RootNRedux = 1.0 - sqrt(1.0 - vc_RootNReduxHelper * vc_RootNReduxHelper);
      }
    }
    else {
      vc_RootNRedux = 1.0;
    }

    if (pc_FixingN == 0){
      if (vc_NConcentrationAbovegroundBiomass < vc_CriticalNConcentration) {

        if (vc_NConcentrationAbovegroundBiomass <= pc_MinimumNConcentration) {
          vc_CropNRedux = 0.0;
        } else {

          vc_CropNReduxHelper = (vc_NConcentrationAbovegroundBiomass - pc_MinimumNConcentration)
        / (vc_CriticalNConcentration - pc_MinimumNConcentration);

    //       // New Monica appraoch
         vc_CropNRedux = 1.0 - exp(pc_MinimumNConcentration - (5.0 * vc_CropNReduxHelper));

    //        // Original HERMES approach
    //        vc_CropNRedux = (1.0 - exp(1.0 + 1.0 / (vc_CropNReduxHelper - 1.0))) *
    //                    (1.0 - exp(1.0 + 1.0 / (vc_CropNReduxHelper - 1.0)));
        }
      } else {
        vc_CropNRedux = 1.0;
      }
    } else if (pc_FixingN == 1){
      if (vc_NConcentrationAbovegroundBiomass < vc_CriticalNConcentration) {
        vc_FixedN = vc_CriticalNConcentration - vc_NConcentrationAbovegroundBiomass;
        vc_NConcentrationAbovegroundBiomass = vc_CriticalNConcentration;
        vc_CropNRedux = 1.0;
      }
    } else {
      vc_CropNRedux = 1.0;
    }

    if (pc_NitrogenResponseOn == false){
      vc_CropNRedux = 1.0;
    }

  };

  var fc_CropDryMatter = function (
    vs_NumberOfLayers,
    vs_LayerThickness,
    vc_DevelopmentalStage,
    vc_Assimilates,
    /*vc_NetMaintenanceRespiration,*/   // hermes o. agrosim
    /*pc_CropSpecificMaxRootingDepth,*/ // JS! unused
    /*vs_SoilSpecificMaxRootingDepth,*/ // JS! unused
    vw_MeanAirTemperature
  ) {

    if (DEBUG) debug(arguments);

    var vc_MaxRootNConcentration                         = 0.0; // old WGM
    var vc_NConcentrationOptimum                         = 0.0; // old DTOPTN
    var vc_RootNIncrement                                = 0.0; // old WUMM
    var vc_AssimilatePartitioningCoeffOld                = 0.0;
    var vc_AssimilatePartitioningCoeff                   = 0.0;

    var user_crops = centralParameterProvider.userCropParameters;
    var pc_MaxCropNDemand = user_crops.pc_MaxCropNDemand;

    // var pc_GrowthRespirationRedux = user_crops.pc_GrowthRespirationRedux;
    // throw pc_GrowthRespirationRedux;

    // Assuming that growth respiration takes 30% of total assimilation --> 0.7 [kg ha-1]
    // vc_NetPhotosynthesis = (vc_GrossPhotosynthesis - vc_NetMaintenanceRespiration + vc_ReserveAssimilatePool) * pc_GrowthRespirationRedux; // from HERMES algorithms

    vc_NetPhotosynthesis = vc_Assimilates; // from AGROSIM algorithms
    vc_ReserveAssimilatePool = 0.0;

    vc_AbovegroundBiomassOld = vc_AbovegroundBiomass;
    vc_AbovegroundBiomass = 0.0;
    vc_BelowgroundBiomassOld = vc_BelowgroundBiomass;
    vc_BelowgroundBiomass = 0.0;
    vc_TotalBiomass = 0.0;

    //old PESUM [kg m-2 --> kg ha-1]
    vc_TotalBiomassNContent += soilColumn.vq_CropNUptake * 10000.0;
    // debug('soilColumn.vq_CropNUptake', soilColumn.vq_CropNUptake);

    // Dry matter production
    // old NRKOM
    // double assimilate_partition_shoot = 0.7;
    var assimilate_partition_leaf = 0.3;

    for (var i_Organ = 0; i_Organ < pc_NumberOfOrgans; i_Organ++) {

        vc_AssimilatePartitioningCoeffOld = pc_AssimilatePartitioningCoeff[vc_DevelopmentalStage - 1][i_Organ];
        vc_AssimilatePartitioningCoeff = pc_AssimilatePartitioningCoeff[vc_DevelopmentalStage][i_Organ];

        //Identify storage organ and reduce assimilate flux in case of heat stress
        if (pc_StorageOrgan[i_Organ] == 1){
            vc_AssimilatePartitioningCoeffOld = vc_AssimilatePartitioningCoeffOld * vc_CropHeatRedux * vc_DroughtImpactOnFertility;
            vc_AssimilatePartitioningCoeff = vc_AssimilatePartitioningCoeff * vc_CropHeatRedux * vc_DroughtImpactOnFertility;
        }


        if ((vc_CurrentTemperatureSum[vc_DevelopmentalStage] / pc_StageTemperatureSum[vc_DevelopmentalStage]) > 1) {

            // Pflanze ist ausgewachsen
            vc_OrganGrowthIncrement[i_Organ] = 0.0;
            vc_OrganSenescenceIncrement[i_Organ] = 0.0;
        } else {

            // test if there is a positive bilance of produced assimilates
            // if vc_NetPhotosynthesis is negativ, the crop needs more for
            // maintenance than for building new biomass
            if (vc_NetPhotosynthesis < 0.0) {

                // reduce biomass from leaf and shoot because of negative assimilate
                //! TODO: hard coded organ ids; must be more generalized because in database organ_ids can be mixed
                vc_OrganBiomass[i_Organ];

                if (i_Organ == LEAF) { // leaf

                    var incr = assimilate_partition_leaf * vc_NetPhotosynthesis;
                    if (abs(incr) <= vc_OrganBiomass[i_Organ]){
                      logger(MSG.INFO, "LEAF - Reducing organ biomass - default case (" + (vc_OrganBiomass[i_Organ] + vc_OrganGrowthIncrement[i_Organ]) + ")");
                      vc_OrganGrowthIncrement[i_Organ] = incr;
                    } else {
                        // temporary hack because complex algorithm produces questionable results
                        logger(MSG.INFO, "LEAF - Not enough biomass for reduction - Reducing only what is available ");
                        vc_OrganGrowthIncrement[i_Organ] = (-1) * vc_OrganBiomass[i_Organ];


    //                      debug() << "LEAF - Not enough biomass for reduction; Need to calculate new partition coefficient" << endl;
    //                      // calculate new partition coefficient to detect, how much of organ biomass
    //                      // can be reduced
    //                      assimilate_partition_leaf = abs(vc_OrganBiomass[i_Organ] / vc_NetPhotosynthesis);
    //                      assimilate_partition_shoot = 1.0 - assimilate_partition_leaf;
    //                      debug() << "LEAF - New Partition: " << assimilate_partition_leaf << endl;
    //
    //                      // reduce biomass for leaf
    //                      incr = assimilate_partition_leaf * vc_NetPhotosynthesis; // should be negative, therefor the addition
    //                      vc_OrganGrowthIncrement[i_Organ] = incr;
    //                      debug() << "LEAF - Reducing organ by " << incr << " (" << vc_OrganBiomass[i_Organ] + vc_OrganGrowthIncrement[i_Organ] << ")"<< endl;
                    }

                } else if (i_Organ == SHOOT) { // shoot
                    // JV! Why not (1 - assimilate_partition_leaf)?
                    var incr = assimilate_partition_leaf * vc_NetPhotosynthesis; // should be negative

                    if (abs(incr) <= vc_OrganBiomass[i_Organ]){
                        vc_OrganGrowthIncrement[i_Organ] = incr;
                        logger(MSG.INFO, "SHOOT - Reducing organ biomass - default case (" + (vc_OrganBiomass[i_Organ] + vc_OrganGrowthIncrement[i_Organ]) + ")");
                    } else {
                        // temporary hack because complex algorithm produces questionable results
                        logger(MSG.INFO, "SHOOT - Not enough biomass for reduction - Reducing only what is available");
                        vc_OrganGrowthIncrement[i_Organ] = (-1) * vc_OrganBiomass[i_Organ];


    //                      debug() << "SHOOT - Not enough biomass for reduction; Need to calculate new partition coefficient" << endl;
    //
    //                      assimilate_partition_shoot = abs(vc_OrganBiomass[i_Organ] / vc_NetPhotosynthesis);
    //                      assimilate_partition_leaf = 1.0 - assimilate_partition_shoot;
    //                      debug() << "SHOOT - New Partition: " << assimilate_partition_shoot << endl;
    //
    //                      incr = assimilate_partition_shoot * vc_NetPhotosynthesis;
    //                      vc_OrganGrowthIncrement[i_Organ] = incr;
    //                      debug() << "SHOOT - Reducing organ (" << vc_OrganBiomass[i_Organ] + vc_OrganGrowthIncrement[i_Organ] << ")"<< endl;
    //
    //                      // test if there is the possibility to reduce biomass of leaf
    //                      // for remaining assimilates
    //                      incr = assimilate_partition_leaf * vc_NetPhotosynthesis;
    //                      double available_leaf_biomass = vc_OrganBiomass[LEAF] + vc_OrganGrowthIncrement[LEAF];
    //                      if (incr<available_leaf_biomass) {
    //                          // leaf biomass is big enough, so reduce biomass furthermore
    //                          vc_OrganGrowthIncrement[LEAF] += incr; // should be negative, therefor the addition
    //                          debug() << "LEAF - Reducing leaf biomasse further (" << vc_OrganBiomass[LEAF] + vc_OrganGrowthIncrement[LEAF] << ")"<< endl;
    //                      } else {
    //                          // worst case - there is not enough biomass available to reduce
    //                          // maintenaince respiration requires more assimilates that can be
    //                          // provided by plant itselft
    //                          // now the plant is dying - sorry
    //                          dyingOut = true;
    //                          cout << "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! " << endl;
    //                          cout << "Oh noo - I am dying - There has not been enough biomass required by " <<
    //                              "maintenance respiration etc.\n Not long now and I am death ... " << endl;
    //                          cout << "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" << endl;
    //                      }

                    }

                } else {
                    // root or storage organ - do nothing in case of negative photosynthesis
                    vc_OrganGrowthIncrement[i_Organ] = 0.0;
                }

            } else { // if (vc_NetPhotosynthesis < 0.0) {

                vc_OrganGrowthIncrement[i_Organ] = vc_NetPhotosynthesis *
                     (vc_AssimilatePartitioningCoeffOld
                     + ((vc_AssimilatePartitioningCoeff - vc_AssimilatePartitioningCoeffOld)
                     * (vc_CurrentTemperatureSum[vc_DevelopmentalStage]
                     / pc_StageTemperatureSum[vc_DevelopmentalStage]))) * vc_CropNRedux; // [kg CH2O ha-1]
    
            }
            vc_OrganSenescenceIncrement[i_Organ] = (vc_OrganBiomass[i_Organ] - vc_OrganDeadBiomass[i_Organ]) *
                 (pc_OrganSenescenceRate[vc_DevelopmentalStage - 1][i_Organ]
                 + ((pc_OrganSenescenceRate[vc_DevelopmentalStage][i_Organ]
                 - pc_OrganSenescenceRate[vc_DevelopmentalStage - 1][i_Organ])
                 * (vc_CurrentTemperatureSum[vc_DevelopmentalStage] / pc_StageTemperatureSum[vc_DevelopmentalStage]))); // [kg CH2O ha-1]

        }

        if (i_Organ != vc_StorageOrgan) {
          // Wurzel, Sprossachse, Blatt
          vc_OrganBiomass[i_Organ] += (vc_OrganGrowthIncrement[i_Organ] * vc_TimeStep)
          - (vc_OrganSenescenceIncrement[i_Organ] * vc_TimeStep); // [kg CH2O ha-1]
          vc_OrganBiomass[vc_StorageOrgan] += 0.35 * vc_OrganSenescenceIncrement[i_Organ]; // [kg CH2O ha-1]
        } else {
            if (vc_DevelopmentalStage < pc_NumberOfDevelopmentalStages) {
                // Reallocation of asimilates to storage organ in final developmental stage

                vc_OrganBiomass[i_Organ] += (vc_OrganGrowthIncrement[i_Organ] * vc_TimeStep)
                        - (vc_OrganSenescenceIncrement[i_Organ] * vc_TimeStep)
                        + 0.3 * ((vc_OrganSenescenceIncrement[i_Organ - 1] * vc_TimeStep)
                            + (vc_OrganSenescenceIncrement[i_Organ - 2] * vc_TimeStep)
                            + vc_OrganSenescenceIncrement[i_Organ  - 3] * vc_TimeStep); // [kg CH2O ha-1]
            } else {
                vc_OrganBiomass[i_Organ] += (vc_OrganGrowthIncrement[i_Organ] * vc_TimeStep)
                        - (vc_OrganSenescenceIncrement[i_Organ] * vc_TimeStep); // [kg CH2O ha-1]
            }
        }

        vc_OrganDeadBiomass[i_Organ] += vc_OrganSenescenceIncrement[i_Organ] * vc_TimeStep; // [kg CH2O ha-1]
        vc_OrganGreenBiomass[i_Organ] = vc_OrganBiomass[i_Organ] - vc_OrganDeadBiomass[i_Organ]; // [kg CH2O ha-1]

        if ((vc_OrganGreenBiomass[i_Organ]) < 0.0) {

            vc_OrganDeadBiomass[i_Organ] = vc_OrganBiomass[i_Organ];
            vc_OrganGreenBiomass[i_Organ] = 0.0;
        }

        if (pc_AbovegroundOrgan[i_Organ] == 1) {

            vc_AbovegroundBiomass += vc_OrganBiomass[i_Organ]; // [kg CH2O ha-1]

        } else if ((pc_AbovegroundOrgan[i_Organ] == 0) && (i_Organ > 0)){

            vc_BelowgroundBiomass += vc_OrganBiomass[i_Organ]; // [kg CH2O ha-1]

        }

        vc_TotalBiomass += vc_OrganBiomass[i_Organ]; // [kg CH2O ha-1]

    }

    /** @todo N redux noch ausgeschaltet */
    vc_ReserveAssimilatePool = 0.0; //+= vc_NetPhotosynthesis * (1.0 - vc_CropNRedux);
    vc_RootBiomassOld = vc_RootBiomass;
    vc_RootBiomass = vc_OrganBiomass[0];

    if (vc_DevelopmentalStage > 0) {

      vc_MaxRootNConcentration = pc_StageMaxRootNConcentration[vc_DevelopmentalStage - 1]
         - (pc_StageMaxRootNConcentration[vc_DevelopmentalStage - 1] - pc_StageMaxRootNConcentration[vc_DevelopmentalStage])
         * vc_CurrentTemperatureSum[vc_DevelopmentalStage] / pc_StageTemperatureSum[vc_DevelopmentalStage]; //[kg kg-1]
    } else {
      vc_MaxRootNConcentration = pc_StageMaxRootNConcentration[vc_DevelopmentalStage];
    }

    vc_CropNDemand = ((vc_TargetNConcentration * vc_AbovegroundBiomass)
      + (vc_RootBiomass * vc_MaxRootNConcentration)
      + (vc_TargetNConcentration * vc_BelowgroundBiomass / pc_ResidueNRatio)
      - vc_TotalBiomassNContent) * vc_TimeStep; // [kg ha-1]

    vc_NConcentrationOptimum = ((vc_TargetNConcentration
         - (vc_TargetNConcentration - vc_CriticalNConcentration) * 0.15) * vc_AbovegroundBiomass
        + (vc_TargetNConcentration
           - (vc_TargetNConcentration - vc_CriticalNConcentration) * 0.15) * vc_BelowgroundBiomass / pc_ResidueNRatio
        + (vc_RootBiomass * vc_MaxRootNConcentration) - vc_TotalBiomassNContent) * vc_TimeStep; // [kg ha-1]


    if (vc_CropNDemand > (pc_MaxCropNDemand * vc_TimeStep)) {
      // Not more than 6kg N per day to be taken up.
      vc_CropNDemand = pc_MaxCropNDemand * vc_TimeStep;
    }

    if (vc_CropNDemand < 0) {
      vc_CropNDemand = 0.0;
    }

    if (vc_RootBiomass < vc_RootBiomassOld) {
      /** @todo: Claas: Macht die Bedingung hier Sinn? Hat sich die Wurzel wirklich zurückgebildet? */
      vc_RootNIncrement = (vc_RootBiomassOld - vc_RootBiomass) * vc_NConcentrationRoot;
    } else {
      vc_RootNIncrement = 0;
    }

    // In case of drought stress the root will grow deeper
    if ((vc_TranspirationDeficit < (0.95 * pc_DroughtStressThreshold[vc_DevelopmentalStage])) &&
        (vc_RootingDepth_m > 0.95 * vc_MaxRootingDepth) &&
        (vc_DevelopmentalStage < (pc_NumberOfDevelopmentalStages - 1))){
      vc_MaxRootingDepth += 0.005;
    }

    // in case of sensitivity analysis, this parameter would not be undefined
    // so overwrite with fix value
    // if (centralParameterProvider.sensitivityAnalysisParameters.vc_MaxRootingDepth != UNDEFINED) {
    //   vc_MaxRootingDepth = centralParameterProvider.sensitivityAnalysisParameters.vc_MaxRootingDepth;
    // }

    if (vc_MaxRootingDepth > (vs_NumberOfLayers * vs_LayerThickness)) {
      vc_MaxRootingDepth = vs_NumberOfLayers * vs_LayerThickness;
    }

    // ***************************************************************************
    // *** Taken from Pedersen et al. 2010: Modelling diverse root density     ***
    // *** dynamics and deep nitrogen uptake - a simple approach.              ***
    // *** Plant & Soil 326, 493 - 510                                         ***
    // ***************************************************************************

    // Determining temperature sum for root growth
    var pc_MaximumTemperatureRootGrowth = pc_MinimumTemperatureRootGrowth + 20.0;
    var vc_DailyTemperatureRoot = 0.0;
    if (vw_MeanAirTemperature >= pc_MaximumTemperatureRootGrowth){
      vc_DailyTemperatureRoot = pc_MaximumTemperatureRootGrowth - pc_MinimumTemperatureRootGrowth;
    } else {
      vc_DailyTemperatureRoot= vw_MeanAirTemperature - pc_MinimumTemperatureRootGrowth;
    }
    if (vc_DailyTemperatureRoot < 0.0){
      vc_DailyTemperatureRoot = 0.0;
    }
    vc_CurrentTotalTemperatureSumRoot += vc_DailyTemperatureRoot ;

    // Determining root penetration rate according to soil clay content [m °C-1 d-1]
    var vc_RootPenetrationRate = 0.0; // [m °C-1 d-1]
    if (soilColumn[vc_RootingDepth].vs_SoilClayContent <= 0.02 ){
      vc_RootPenetrationRate = 0.5 * pc_RootPenetrationRate;
    } else if (soilColumn[vc_RootingDepth].vs_SoilClayContent <= 0.08 ){
      vc_RootPenetrationRate = ((1.0 / 3.0) + (0.5 / 0.06 * soilColumn[vc_RootingDepth].vs_SoilClayContent))
               * pc_RootPenetrationRate; // [m °C-1 d-1]
    } else {
      vc_RootPenetrationRate = pc_RootPenetrationRate; // [m °C-1 d-1]
    }

    // Calculating rooting depth [m]
    if (vc_CurrentTotalTemperatureSumRoot <= pc_RootGrowthLag) {
      vc_RootingDepth_m = pc_InitialRootingDepth; // [m]
    } else {
      // corrected because oscillating rooting depth at layer boundaries with texture change
     /* vc_RootingDepth_m = pc_InitialRootingDepth
          + ((vc_CurrentTotalTemperatureSumRoot - pc_RootGrowthLag)
          * vc_RootPenetrationRate); // [m] */
          
      vc_RootingDepth_m += (vc_DailyTemperatureRoot * vc_RootPenetrationRate); // [m]

    }

    if (vc_RootingDepth_m <= pc_InitialRootingDepth){
      vc_RootingDepth_m = pc_InitialRootingDepth;
    }

    if (vc_RootingDepth_m > vc_MaxRootingDepth) {
      vc_RootingDepth_m = vc_MaxRootingDepth; // [m]
    }

    if (vc_RootingDepth_m > vs_MaxEffectiveRootingDepth) {
        vc_RootingDepth_m = vs_MaxEffectiveRootingDepth;
    }

    // Calculating rooting depth layer []
    vc_RootingDepth = int(floor(0.5 + (vc_RootingDepth_m / vs_LayerThickness))); // []

    if (vc_RootingDepth > vs_NumberOfLayers) {
      vc_RootingDepth = vs_NumberOfLayers;
    }

    vc_RootingZone = int(floor(0.5 + ((1.3 * vc_RootingDepth_m) / vs_LayerThickness))); // []

    if (vc_RootingZone > vs_NumberOfLayers){
      vc_RootingZone = vs_NumberOfLayers;
    }

    vc_TotalRootLength = vc_RootBiomass * pc_SpecificRootLength; //[m m-2]

    // Calculating a root density distribution factor []
    var vc_RootDensityFactor = new Array(vs_NumberOfLayers);
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      if (i_Layer < vc_RootingDepth){
        vc_RootDensityFactor[i_Layer] = exp(-pc_RootFormFactor * (i_Layer * vs_LayerThickness)); // []
      } else if (i_Layer < vc_RootingZone){
        vc_RootDensityFactor[i_Layer] = exp(-pc_RootFormFactor * (i_Layer * vs_LayerThickness))
          * (1.0 - int((i_Layer - vc_RootingDepth) / (vc_RootingZone - vc_RootingDepth))); // JS! int division
      } else {
        vc_RootDensityFactor[i_Layer] = 0.0; // []
      }
    }

    // Summing up all factors to scale to a relative factor between [0;1]
    var vc_RootDensityFactorSum = 0.0;
    for (var i_Layer = 0; i_Layer < vc_RootingZone; i_Layer++) {
      vc_RootDensityFactorSum += vc_RootDensityFactor[i_Layer]; // []
    }

    // Calculating root density per layer from total root length and
    // a relative root density distribution factor
    for (var i_Layer = 0; i_Layer < vc_RootingZone; i_Layer++) {
      vc_RootDensity[i_Layer] = (vc_RootDensityFactor[i_Layer] / vc_RootDensityFactorSum)
        * vc_TotalRootLength; // [m m-3]
    }

    for (var i_Layer = 0; i_Layer < vc_RootingZone; i_Layer++) {
      // Root diameter [m]
      if (pc_AbovegroundOrgan[3] == 0) {
        vc_RootDiameter[i_Layer] = 0.0001; //[m]
      } else {
        vc_RootDiameter[i_Layer] = 0.0002 - ((i_Layer + 1) * 0.00001); // [m]
      }

      // in case of sensitivity analysis, this parameter would not be undefined
      // so return fix value instead of calculating mean bulk density
      // if (centralParameterProvider.sensitivityAnalysisParameters.vc_RootDiameter != UNDEFINED) {
      //   vc_RootDiameter[i_Layer] = centralParameterProvider.sensitivityAnalysisParameters.vc_RootDiameter;
      // }

      // Default root decay - 10 %
      vo_FreshSoilOrganicMatter[i_Layer] += vc_RootNIncrement * vc_RootDensity[i_Layer]
            * 10.0 / vc_TotalRootLength;

    }

    // Limiting the maximum N-uptake to 26-13*10^-14 mol/cm W./sec
    vc_MaxNUptake = pc_MaxNUptakeParam - (vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSum); // [kg m Wurzel-1]

    if ((vc_CropNDemand / 10000.0) > (vc_TotalRootLength * vc_MaxNUptake * vc_TimeStep)) {
      vc_CropNDemand = vc_TotalRootLength * vc_MaxNUptake * vc_TimeStep; //[kg m-2]
    } else {
      vc_CropNDemand = vc_CropNDemand / 10000.0; // [kg ha-1 --> kg m-2]
    }
  };

  // double 
  var fc_ReferenceEvapotranspiration = function (
    vs_HeightNN,
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vw_RelativeHumidity,
    vw_MeanAirTemperature,
    vw_WindSpeed,
    vw_WindSpeedHeight,
    vc_GlobalRadiation,
    vw_AtmosphericCO2Concentration,
    vc_GrossPhotosynthesisReference_mol
  ) {

    if (DEBUG) debug(arguments);

    var vc_AtmosphericPressure; //[kPA]
    var vc_PsycrometerConstant; //[kPA °C-1]
    var vc_SaturatedVapourPressureMax; //[kPA]
    var vc_SaturatedVapourPressureMin; //[kPA]
    var vc_SaturatedVapourPressure; //[kPA]
    var vc_VapourPressure; //[kPA]
    var vc_SaturationDeficit; //[kPA]
    var vc_SaturatedVapourPressureSlope; //[kPA °C-1]
    var vc_WindSpeed_2m; //[m s-1]
    var vc_AerodynamicResistance; //[s m-1]
    var vc_SurfaceResistance; //[s m-1]
    var vc_ReferenceEvapotranspiration; //[mm]
    var vw_NetRadiation; //[MJ m-2]

    var user_crops = centralParameterProvider.userCropParameters;
    var pc_SaturationBeta = user_crops.pc_SaturationBeta; // Original: Yu et al. 2001; beta = 3.5
    var pc_StomataConductanceAlpha = user_crops.pc_StomataConductanceAlpha; // Original: Yu et al. 2001; alpha = 0.06
    var pc_ReferenceAlbedo = user_crops.pc_ReferenceAlbedo; // FAO Green gras reference albedo from Allen et al. (1998)

    // Calculation of atmospheric pressure
    vc_AtmosphericPressure = 101.3 * pow(((293.0 - (0.0065 * vs_HeightNN)) / 293.0), 5.26);

    // Calculation of psychrometer constant - Luchtfeuchtigkeit
    vc_PsycrometerConstant = 0.000665 * vc_AtmosphericPressure;

    // Calc. of saturated water vapour pressure at daily max temperature
    vc_SaturatedVapourPressureMax = 0.6108 * exp((17.27 * vw_MaxAirTemperature) / (237.3 + vw_MaxAirTemperature));

    // Calc. of saturated water vapour pressure at daily min temperature
    vc_SaturatedVapourPressureMin = 0.6108 * exp((17.27 * vw_MinAirTemperature) / (237.3 + vw_MinAirTemperature));

    // Calculation of the saturated water vapour pressure
    vc_SaturatedVapourPressure = (vc_SaturatedVapourPressureMax + vc_SaturatedVapourPressureMin) / 2.0;

    // Calculation of the water vapour pressure
    if (vw_RelativeHumidity <= 0.0){
      // Assuming Tdew = Tmin as suggested in FAO56 Allen et al. 1998
      vc_VapourPressure = vc_SaturatedVapourPressureMin;
    } else {
      vc_VapourPressure = vw_RelativeHumidity * vc_SaturatedVapourPressure;
    }

    // Calculation of the air saturation deficit
    vc_SaturationDeficit = vc_SaturatedVapourPressure - vc_VapourPressure;

    // Slope of saturation water vapour pressure-to-temperature relation
    vc_SaturatedVapourPressureSlope = (4098.0 * (0.6108 * exp((17.27 * vw_MeanAirTemperature) / (vw_MeanAirTemperature
        + 237.3)))) / ((vw_MeanAirTemperature + 237.3) * (vw_MeanAirTemperature + 237.3));

    // Calculation of wind speed in 2m height
    vc_WindSpeed_2m = vw_WindSpeed * (4.87 / (log(67.8 * vw_WindSpeedHeight - 5.42)));

    // Calculation of the aerodynamic resistance
    vc_AerodynamicResistance = 208.0 / vc_WindSpeed_2m;

    if (vc_GrossPhotosynthesisReference_mol <= 0.0) {
      vc_StomataResistance = 999999.9; // [s m-1]
    } else {
      vc_StomataResistance = // [s m-1]
          (vw_AtmosphericCO2Concentration * (1.0 + vc_SaturationDeficit / pc_SaturationBeta))
              / (pc_StomataConductanceAlpha * vc_GrossPhotosynthesisReference_mol);
    }

    vc_SurfaceResistance = vc_StomataResistance / 1.44;

    // vc_SurfaceResistance = vc_StomataResistance / (vc_CropHeight * vc_LeafAreaIndex);

    // vw_NetRadiation = vc_GlobalRadiation * (1.0 - pc_ReferenceAlbedo); // [MJ m-2]

    var vc_ClearSkyShortwaveRadiation = (0.75 + 0.00002 * vs_HeightNN) * vc_ExtraterrestrialRadiation;
    var vc_RelativeShortwaveRadiation = vc_GlobalRadiation / vc_ClearSkyShortwaveRadiation;
    var vc_NetShortwaveRadiation = (1.0 - pc_ReferenceAlbedo) * vc_GlobalRadiation;

    var pc_BolzmanConstant = 0.0000000049; // Bolzmann constant 4.903 * 10-9 MJ m-2 K-4 d-1
    vw_NetRadiation = vc_NetShortwaveRadiation - (pc_BolzmanConstant
      * (pow((vw_MinAirTemperature + 273.16), 4.0) + pow((vw_MaxAirTemperature
      + 273.16), 4.0)) / 2.0 * (1.35 * vc_RelativeShortwaveRadiation - 0.35)
      * (0.34 - 0.14 * sqrt(vc_VapourPressure)));

    // Calculation of reference evapotranspiration
    // Penman-Monteith-Method FAO
    vc_ReferenceEvapotranspiration = ((0.408 * vc_SaturatedVapourPressureSlope * vw_NetRadiation)
        + (vc_PsycrometerConstant * (900.0 / (vw_MeanAirTemperature + 273.0)) * vc_WindSpeed_2m * vc_SaturationDeficit))
        / (vc_SaturatedVapourPressureSlope + vc_PsycrometerConstant * (1.0 + (vc_SurfaceResistance / vc_AerodynamicResistance)));

    return vc_ReferenceEvapotranspiration;

  };

  var fc_CropWaterUptake = function (
    vs_NumberOfLayers,
    vs_LayerThickness,
    vc_SoilCoverage,
    vc_RootingZone,
    vc_GroundwaterTable,
    vc_ReferenceEvapotranspiration,
    vw_GrossPrecipitation,
    vc_CurrentTotalTemperatureSum ,
    vc_TotalTemperatureSum
  ) {

    if (DEBUG) debug(arguments);

    // JS! make sure it is an "int"
    vc_RootingZone = int(vc_RootingZone);
    vc_GroundwaterTable = int(vc_GroundwaterTable);


    var vc_PotentialTranspirationDeficit = 0.0; // [mm]
    vc_PotentialTranspiration = 0.0; // old TRAMAX [mm]
    var vc_PotentialEvapotranspiration = 0.0; // [mm]
    var vc_TranspirationReduced = 0.0; // old TDRED [mm]
    vc_ActualTranspiration = 0.0; // [mm]
    var vc_RemainingTotalRootEffectivity = 0.0; //old WEFFREST [m]
    var vc_CropWaterUptakeFromGroundwater  = 0.0; // old GAUF [mm]
    var vc_TotalRootEffectivity = 0.0; // old WEFF [m]
    var vc_ActualTranspirationDeficit = 0.0; // old TREST [mm]
    var vc_Interception = 0.0;
    vc_RemainingEvapotranspiration = 0.0;

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      vc_Transpiration[i_Layer] = 0.0; // old TP [mm]
      vc_TranspirationRedux[i_Layer] = 0.0; // old TRRED []
      vc_RootEffectivity[i_Layer] = 0.0; // old WUEFF [?]
    }

    // ################
    // # Interception #
    // ################

    var vc_InterceptionStorageOld = vc_InterceptionStorage;

    // Interception in [mm d-1];
    vc_Interception = (2.5 * vc_CropHeight * vc_SoilCoverage) - vc_InterceptionStorage;

    if (vc_Interception < 0) {
      vc_Interception = 0.0;
    }

    // If no precipitation occurs, vm_Interception = 0
    if (vw_GrossPrecipitation <= 0) {
      vc_Interception = 0.0;
    }

    // Calculating net precipitation and adding to surface water
    if (vw_GrossPrecipitation <= vc_Interception) {
      vc_Interception = vw_GrossPrecipitation;
      vc_NetPrecipitation = 0.0;
    } else {
      vc_NetPrecipitation = vw_GrossPrecipitation - vc_Interception;
    }

    // add intercepted precipitation to the virtual interception water storage
    vc_InterceptionStorage = vc_InterceptionStorageOld + vc_Interception;


    // #################
    // # Transpiration #
    // #################

    vc_PotentialEvapotranspiration = vc_ReferenceEvapotranspiration * vc_KcFactor; // [mm]

    // from HERMES:
    if (vc_PotentialEvapotranspiration > 6.5) vc_PotentialEvapotranspiration = 6.5;

    vc_RemainingEvapotranspiration = vc_PotentialEvapotranspiration; // [mm]

    // If crop holds intercepted water, first evaporation from crop surface
    if (vc_InterceptionStorage > 0.0) {
      if (vc_RemainingEvapotranspiration >= vc_InterceptionStorage) {
        vc_RemainingEvapotranspiration -= vc_InterceptionStorage;
        vc_EvaporatedFromIntercept = vc_InterceptionStorage;
        vc_InterceptionStorage = 0.0;
      } else {
        vc_InterceptionStorage -= vc_RemainingEvapotranspiration;
        vc_EvaporatedFromIntercept = vc_RemainingEvapotranspiration;
        vc_RemainingEvapotranspiration = 0.0;
      }
    } else {
      vc_EvaporatedFromIntercept = 0.0;
    }

    // if the plant has matured, no transpiration occurs!
    if (vc_DevelopmentalStage < vc_FinalDevelopmentalStage){
    //if ((vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSum) < 1.0){

      vc_PotentialTranspiration = vc_RemainingEvapotranspiration * vc_SoilCoverage; // [mm]

      for (var i_Layer = 0; i_Layer < vc_RootingZone; i_Layer++) {
        
        var vc_AvailableWater = soilColumn[i_Layer].get_FieldCapacity() - soilColumn[i_Layer].get_PermanentWiltingPoint();
        var vc_AvailableWaterPercentage = (soilColumn[i_Layer].get_Vs_SoilMoisture_m3() 
          - soilColumn[i_Layer].get_PermanentWiltingPoint()) / vc_AvailableWater;
        
        if (vc_AvailableWaterPercentage < 0.0) vc_AvailableWaterPercentage = 0.0;

        if (vc_AvailableWaterPercentage < 0.15) {
          vc_TranspirationRedux[i_Layer] = vc_AvailableWaterPercentage * 3.0; // []
          vc_RootEffectivity[i_Layer] = 0.15 + 0.45 * vc_AvailableWaterPercentage / 0.15; // []
        } else if (vc_AvailableWaterPercentage < 0.3) {
          vc_TranspirationRedux[i_Layer] = 0.45 + (0.25 * (vc_AvailableWaterPercentage - 0.15) / 0.15);
          vc_RootEffectivity[i_Layer] = 0.6 + (0.2 * (vc_AvailableWaterPercentage - 0.15) / 0.15);
        } else if (vc_AvailableWaterPercentage < 0.5) {
          vc_TranspirationRedux[i_Layer] = 0.7 + (0.275 * (vc_AvailableWaterPercentage - 0.3) / 0.2);
          vc_RootEffectivity[i_Layer] = 0.8 + (0.2 * (vc_AvailableWaterPercentage - 0.3) / 0.2);
        } else if (vc_AvailableWaterPercentage < 0.75) {
          vc_TranspirationRedux[i_Layer] = 0.975 + (0.025 * (vc_AvailableWaterPercentage - 0.5) / 0.25);
          vc_RootEffectivity[i_Layer] = 1.0;
        } else {
          vc_TranspirationRedux[i_Layer] = 1.0;
          vc_RootEffectivity[i_Layer] = 1.0;
        }

        if (vc_TranspirationRedux[i_Layer] < 0)
          vc_TranspirationRedux[i_Layer] = 0.0;
        
        if (vc_RootEffectivity[i_Layer] < 0)
          vc_RootEffectivity[i_Layer] = 0.0;
        
        if (i_Layer == vc_GroundwaterTable) { // old GRW
          vc_RootEffectivity[i_Layer] = 0.5;
        }
        
        if (i_Layer > vc_GroundwaterTable) { // old GRW
          vc_RootEffectivity[i_Layer] = 0.0;
        }

        if (((i_Layer + 1) * vs_LayerThickness) >= vs_MaxEffectiveRootingDepth) {
          vc_RootEffectivity[i_Layer] = 0.0;
        }      
        
        vc_TotalRootEffectivity += vc_RootEffectivity[i_Layer] * vc_RootDensity[i_Layer]; //[m m-3]
        vc_RemainingTotalRootEffectivity = vc_TotalRootEffectivity;
      }

      for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
        
        if (i_Layer > min(vc_RootingZone, vc_GroundwaterTable + 1)) {
          vc_Transpiration[i_Layer] = 0.0; //[mm]
        } else {
          vc_Transpiration[i_Layer] = vc_PotentialTranspiration * ((vc_RootEffectivity[i_Layer] * vc_RootDensity[i_Layer])
                   / vc_TotalRootEffectivity) * vc_OxygenDeficit;

          // [mm]
        }

      }

      for (var i_Layer = 0; i_Layer < min(vc_RootingZone, vc_GroundwaterTable + 1); i_Layer++) {

        vc_RemainingTotalRootEffectivity -= vc_RootEffectivity[i_Layer] * vc_RootDensity[i_Layer]; // [m m-3]

        if (vc_RemainingTotalRootEffectivity <= 0.0)
          vc_RemainingTotalRootEffectivity = 0.00001;
        if (((vc_Transpiration[i_Layer] / 1000.0) / vs_LayerThickness) > ((soilColumn[i_Layer].get_Vs_SoilMoisture_m3()
            - soilColumn[i_Layer].get_PermanentWiltingPoint()))) {
            vc_PotentialTranspirationDeficit = (((vc_Transpiration[i_Layer] / 1000.0) / vs_LayerThickness)
                - (soilColumn[i_Layer].get_Vs_SoilMoisture_m3() - soilColumn[i_Layer].get_PermanentWiltingPoint()))
                * vs_LayerThickness * 1000.0; // [mm]
            if (vc_PotentialTranspirationDeficit < 0.0) {
                vc_PotentialTranspirationDeficit = 0.0;
            }
            if (vc_PotentialTranspirationDeficit > vc_Transpiration[i_Layer]) {
                vc_PotentialTranspirationDeficit = vc_Transpiration[i_Layer]; //[mm]
            }
        } else {
            vc_PotentialTranspirationDeficit = 0.0;
        }

       vc_TranspirationReduced = vc_Transpiration[i_Layer] * (1.0 - vc_TranspirationRedux[i_Layer]);

        //! @todo Claas: How can we lower the groundwater table if crop water uptake is restricted in that layer?
        vc_ActualTranspirationDeficit = max(vc_TranspirationReduced, vc_PotentialTranspirationDeficit); //[mm]
        if (vc_ActualTranspirationDeficit > 0.0) {
          if (i_Layer < min(vc_RootingZone, vc_GroundwaterTable + 1)) {
            for (var i_Layer2 = i_Layer + 1; i_Layer2 < min(vc_RootingZone, vc_GroundwaterTable + 1); i_Layer2++) {
                vc_Transpiration[i_Layer2] += vc_ActualTranspirationDeficit * (vc_RootEffectivity[i_Layer2]
                   * vc_RootDensity[i_Layer2] / vc_RemainingTotalRootEffectivity);
            }
          }
        }

        vc_Transpiration[i_Layer] = vc_Transpiration[i_Layer] - vc_ActualTranspirationDeficit;
        
        if (vc_Transpiration[i_Layer] < 0.0)
          vc_Transpiration[i_Layer] = 0.0;
        
        vc_ActualTranspiration += vc_Transpiration[i_Layer];
        
        if (i_Layer == vc_GroundwaterTable) {
          vc_CropWaterUptakeFromGroundwater = (vc_Transpiration[i_Layer] / 1000.0) / vs_LayerThickness; //[m3 m-3]
        }

      }

      if (vc_PotentialTranspiration > 0) {
        vc_TranspirationDeficit = vc_ActualTranspiration / vc_PotentialTranspiration;
      } else {
        vc_TranspirationDeficit = 1.0; //[]
      }

      var vm_GroundwaterDistance = int(vc_GroundwaterTable - vc_RootingDepth); // JS! just in case ... added int()
      if (vm_GroundwaterDistance <= 1) {
        vc_TranspirationDeficit = 1.0;
      }

      if (pc_WaterDeficitResponseOn == false){
        vc_TranspirationDeficit = 1.0;
      }

    } //if
  };

  var fc_CropNUptake = function (
    vs_NumberOfLayers,
    vs_LayerThickness,
    vc_RootingZone,
    vc_GroundwaterTable,
    vc_CurrentTotalTemperatureSum ,
    vc_TotalTemperatureSum
  ) {

    if (DEBUG) debug(arguments);

    // JS! make sure it is an "int"
    vc_RootingZone = int(vc_RootingZone);
    vc_GroundwaterTable = int(vc_GroundwaterTable);


    var vc_ConvectiveNUptake = 0.0; // old TRNSUM
    var vc_DiffusiveNUptake = 0.0; // old SUMDIFF
    var vc_ConvectiveNUptakeFromLayer = []; // old MASS
    var vc_DiffusionCoeff = []; // old D
    var vc_DiffusiveNUptakeFromLayer = []; // old DIFF

    for (var i = 0; i < vs_NumberOfLayers; i++) {
      vc_ConvectiveNUptakeFromLayer[i] = 0.0;
      vc_DiffusionCoeff[i] = 0.0;
      vc_DiffusiveNUptakeFromLayer[i] = 0.0;
    }

    var vc_ConvectiveNUptake_1 = 0.0; // old MASSUM
    var vc_DiffusiveNUptake_1 = 0.0; // old DIFFSUM
    var user_crops = centralParameterProvider.userCropParameters;
    var pc_MinimumAvailableN = user_crops.pc_MinimumAvailableN; // kg m-3
    var pc_MinimumNConcentrationRoot = user_crops.pc_MinimumNConcentrationRoot;  // kg kg-1
    var pc_MaxCropNDemand = user_crops.pc_MaxCropNDemand;

    vc_TotalNUptake = 0.0;
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++){
      vc_NUptakeFromLayer[i_Layer] = 0.0;
    }

    // if the plant has matured, no N uptake occurs!
    if (vc_DevelopmentalStage < vc_FinalDevelopmentalStage){
    //if ((vc_CurrentTotalTemperatureSum / vc_TotalTemperatureSum) < 1.0){

      for (var i_Layer = 0; i_Layer < (min(vc_RootingZone, vc_GroundwaterTable)); i_Layer++) {

        vs_SoilMineralNContent[i_Layer] = soilColumn[i_Layer].vs_SoilNO3; // [kg m-3]

        // Convective N uptake per layer
        vc_ConvectiveNUptakeFromLayer[i_Layer] = (vc_Transpiration[i_Layer] / 1000.0) * //[mm --> m]
                 (vs_SoilMineralNContent[i_Layer] / // [kg m-3]
                  (soilColumn[i_Layer].get_Vs_SoilMoisture_m3())) * // old WG [m3 m-3]
                 vc_TimeStep; // -->[kg m-2]

        vc_ConvectiveNUptake += vc_ConvectiveNUptakeFromLayer[i_Layer]; // [kg m-2]

        /** @todo Claas: Woher kommt der Wert für vs_Tortuosity? */
        /** @todo Claas: Prüfen ob Umstellung auf [m] die folgenden Gleichungen beeinflusst */
        vc_DiffusionCoeff[i_Layer] = 0.000214 * (vs_Tortuosity * exp(soilColumn[i_Layer].get_Vs_SoilMoisture_m3() * 10))
             / soilColumn[i_Layer].get_Vs_SoilMoisture_m3(); //[m2 d-1]


        vc_DiffusiveNUptakeFromLayer[i_Layer] = (vc_DiffusionCoeff[i_Layer] * // [m2 d-1]
                 soilColumn[i_Layer].get_Vs_SoilMoisture_m3() * // [m3 m-3]
                 2.0 * PI * vc_RootDiameter[i_Layer] * // [m]
                 (vs_SoilMineralNContent[i_Layer] / 1000.0 / // [kg m-3]
                  soilColumn[i_Layer].get_Vs_SoilMoisture_m3() - 0.000014) * // [m3 m-3]
                 sqrt(PI * vc_RootDensity[i_Layer])) * // [m m-3]
                       vc_RootDensity[i_Layer] * 1000.0 * vc_TimeStep; // -->[kg m-2]
             
      if(vc_DiffusiveNUptakeFromLayer[i_Layer] < 0.0){
        vc_DiffusiveNUptakeFromLayer[i_Layer] = 0;
      }

        vc_DiffusiveNUptake += vc_DiffusiveNUptakeFromLayer[i_Layer]; // [kg m-2]

      }

      for (var i_Layer = 0; i_Layer < (min(vc_RootingZone, vc_GroundwaterTable)); i_Layer++) {

        if (vc_CropNDemand > 0.0) {

          if (vc_ConvectiveNUptake >= vc_CropNDemand) { // convective N uptake is sufficient
            vc_NUptakeFromLayer[i_Layer] = vc_CropNDemand * vc_ConvectiveNUptakeFromLayer[i_Layer] / vc_ConvectiveNUptake;
          
          } else { // N demand is not covered
            
            if ((vc_CropNDemand - vc_ConvectiveNUptake) < vc_DiffusiveNUptake) {
              vc_NUptakeFromLayer[i_Layer] = (
                vc_ConvectiveNUptakeFromLayer[i_Layer] + 
                (
                  (vc_CropNDemand - vc_ConvectiveNUptake) * 
                  vc_DiffusiveNUptakeFromLayer[i_Layer] / 
                  vc_DiffusiveNUptake
                )
              );
            } else {
              vc_NUptakeFromLayer[i_Layer] = vc_ConvectiveNUptakeFromLayer[i_Layer] + vc_DiffusiveNUptakeFromLayer[i_Layer];
            }

          }

          vc_ConvectiveNUptake_1 += vc_ConvectiveNUptakeFromLayer[i_Layer];
          vc_DiffusiveNUptake_1 += vc_DiffusiveNUptakeFromLayer[i_Layer];

          if (vc_NUptakeFromLayer[i_Layer] > ((vs_SoilMineralNContent[i_Layer] * vs_LayerThickness) - pc_MinimumAvailableN))
            vc_NUptakeFromLayer[i_Layer] = (vs_SoilMineralNContent[i_Layer] * vs_LayerThickness )- pc_MinimumAvailableN;

          if (vc_NUptakeFromLayer[i_Layer] > (pc_MaxCropNDemand / 10000.0 * 0.75))
            vc_NUptakeFromLayer[i_Layer] = (pc_MaxCropNDemand / 10000.0 * 0.75);

          if (vc_NUptakeFromLayer[i_Layer] < 0.0)
            vc_NUptakeFromLayer[i_Layer] = 0.0;

        } else {
          vc_NUptakeFromLayer[i_Layer] = 0.0;
        }

        vc_TotalNUptake += vc_NUptakeFromLayer[i_Layer] * 10000.0; //[kg m-2] --> [kg ha-1]

      } // for
    } // if

    vc_SumTotalNUptake += vc_TotalNUptake;

    if (vc_RootBiomass > vc_RootBiomassOld) {

      // wurzel ist gewachsen
      vc_NConcentrationRoot = ((vc_RootBiomassOld * vc_NConcentrationRoot)
          + ((vc_RootBiomass - vc_RootBiomassOld) / (vc_AbovegroundBiomass
          - vc_AbovegroundBiomassOld + vc_BelowgroundBiomass - vc_BelowgroundBiomassOld
          + vc_RootBiomass - vc_RootBiomassOld) * vc_TotalNUptake)) / vc_RootBiomass;

      vc_NConcentrationRoot = min(vc_NConcentrationRoot, pc_StageMaxRootNConcentration[vc_DevelopmentalStage]);


      if (vc_NConcentrationRoot < pc_MinimumNConcentrationRoot) {
        vc_NConcentrationRoot = pc_MinimumNConcentrationRoot;
      }
    }

    vc_NConcentrationAbovegroundBiomass = (vc_TotalBiomassNContent + vc_TotalNUptake
           - (vc_RootBiomass * vc_NConcentrationRoot))
           / (vc_AbovegroundBiomass + (vc_BelowgroundBiomass / pc_ResidueNRatio));

    if ((vc_NConcentrationAbovegroundBiomass * vc_AbovegroundBiomass) < (vc_AbovegroundBiomassOld
                 * vc_NConcentrationAbovegroundBiomassOld)) {

      vc_NConcentrationAbovegroundBiomass = vc_AbovegroundBiomassOld * vc_NConcentrationAbovegroundBiomassOld
            / vc_AbovegroundBiomass;

      vc_NConcentrationRoot = (vc_TotalBiomassNContent + vc_TotalNUptake
               - (vc_AbovegroundBiomass * vc_NConcentrationAbovegroundBiomass)
               - (vc_NConcentrationAbovegroundBiomass / pc_ResidueNRatio * vc_BelowgroundBiomass)) / vc_RootBiomass;
    }
  };

  var fc_GrossPrimaryProduction = function (vc_Assimilates) {

    var vc_GPP = 0.0;
    // Converting photosynthesis rate from [kg CH2O ha-1 d-1] back to
    // [kg C ha-1 d-1]
    vc_GPP = vc_Assimilates / 30.0 * 12.0;
    return vc_GPP;
    };

    var fc_NetPrimaryProduction = function (vc_GrossPrimaryProduction, vc_TotalRespired) {
    var vc_NPP = 0.0;
    // Convert [kg CH2O ha-1 d-1] to [kg C ha-1 d-1]
    vc_Respiration = vc_TotalRespired / 30.0 * 12.0;

    vc_NPP = vc_GrossPrimaryProduction - vc_Respiration;
    return vc_NPP;
    };

    var pc_NumberOfAbovegroundOrgans = function () {
    var count = 0;
    for (var i = 0, size = pc_AbovegroundOrgan.length; i < size; i++) {
      if (pc_AbovegroundOrgan[i]) {
        count++;
      }
    }
    return count;

  };

  var get_OrganGrowthIncrement = function (i_Organ) {
    return vc_OrganGrowthIncrement[i_Organ];
  };

  var get_Transpiration = function (i_Layer) {
    return vc_Transpiration[i_Layer];
  };

  var get_OrganBiomass = function (i_Organ) {
    return vc_OrganBiomass[i_Organ];
  };

  var get_NUptakeFromLayer = function (i_Layer) {
    return vc_NUptakeFromLayer[i_Layer];
  };

  var get_AbovegroundBiomassNContent = function () {
    return vc_AbovegroundBiomass * vc_NConcentrationAbovegroundBiomass;
  };

  var pc_NumberOfAbovegroundOrgans = function () {
    var count = 0;
    for (var i = 0, size = pc_AbovegroundOrgan.length; i < size; i++) {
      if (pc_AbovegroundOrgan[i]) {
        count++;
      }
    }
    return count;
  };

  var _cropYield = function (v, bmv) {

    if (DEBUG && v.length === 0)
      debug('organIdsForPrimaryYield', v);

    var yield = 0;
    for (var i = 0, is = v.length; i < is; i++)
      yield += bmv[v[i].organId - 1] * (v[i].yieldPercentage);
    return yield;
  };

  var _cropFreshMatterYield = function (v, bmv) {
    
    if (DEBUG && v.length === 0)
      debug('organIdsForPrimaryYield', v);

    var freshMatterYield = 0;
    for (var i = 0, is = v.length; i < is; i++)
      freshMatterYield += bmv[v[i].organId - 1] * (v[i].yieldPercentage) / (v[i].yieldDryMatter);
    return freshMatterYield;
  };

  var get_PrimaryCropYield = function () {
    // JS: yield auch nach cutting
    if (cropParams.organIdsForPrimaryYield.length === 0)
      return _cropYield(cropParams.organIdsForCutting, vc_OrganBiomass);

    return _cropYield(cropParams.organIdsForPrimaryYield, vc_OrganBiomass);
  };

  var get_SecondaryCropYield = function () {
    return _cropYield(cropParams.organIdsForSecondaryYield, vc_OrganBiomass);
  };

  var get_FreshPrimaryCropYield = function () {
    // JS: yield auch nach cutting
    if (cropParams.organIdsForPrimaryYield.length === 0)
      return _cropFreshMatterYield(cropParams.organIdsForCutting, vc_OrganBiomass);

    return _cropFreshMatterYield(cropParams.organIdsForPrimaryYield, vc_OrganBiomass);
  };

  var get_FreshSecondaryCropYield = function () {
    return _cropFreshMatterYield(cropParams.organIdsForSecondaryYield, vc_OrganBiomass);
  };

  var get_ResidueBiomass = function (useSecondaryCropYields) {
    return vc_TotalBiomass - get_OrganBiomass(0) - get_PrimaryCropYield()
      - (useSecondaryCropYields ? get_SecondaryCropYield() : 0);
  };

  var get_ResiduesNConcentration = function () {
    return (vc_TotalBiomassNContent -
         (get_OrganBiomass(0) * get_RootNConcentration())) /
         ((get_PrimaryCropYield() / pc_ResidueNRatio) +
         (vc_TotalBiomass - get_OrganBiomass(0) - get_PrimaryCropYield()));
  }

  var get_PrimaryYieldNConcentration = function () {
    return (vc_TotalBiomassNContent -
         (get_OrganBiomass(0) * get_RootNConcentration())) /
         (get_PrimaryCropYield() + (pc_ResidueNRatio *
         (vc_TotalBiomass - get_OrganBiomass(0) - get_PrimaryCropYield())));
  }

  var get_ResiduesNContent = function (useSecondaryCropYields)  {
    return (get_ResidueBiomass(useSecondaryCropYields) * get_ResiduesNConcentration());
  };

  var get_PrimaryYieldNContent = function () {
    return (get_PrimaryCropYield() * get_PrimaryYieldNConcentration());
  };

  var get_RawProteinConcentration = function () {
    // Assuming an average N concentration of raw protein of 16%
    return (get_PrimaryYieldNConcentration() * 6.25);
  };

  var get_SecondaryYieldNContent = function () {
    return (get_SecondaryCropYield() * get_ResiduesNConcentration());
  };

  var get_PotNUptake = function () {
    return vc_CropNDemand * 10000.0;
  };

  var get_AutotrophicRespiration = function () {
    return vc_TotalRespired / 30.0 * 12.0;;  // Convert [kg CH2O ha-1 d-1] to [kg C ha-1 d-1]
  };

  var get_OrganSpecificTotalRespired = function (organ) {
    // get total amount of actual biomass
    var total_biomass = totalBiomass();

    // get biomass of specific organ and calculates ratio
    var organ_percentage = get_OrganBiomass(organ) / total_biomass;
    return (get_AutotrophicRespiration() * organ_percentage);
  };

  var get_OrganSpecificNPP = function (organ) {
    // get total amount of actual biomass
    var total_biomass = totalBiomass();

    // get biomass of specific organ and calculates ratio
    var organ_percentage = get_OrganBiomass(organ) / total_biomass;

    return (get_NetPrimaryProduction() * organ_percentage);
  };

  var applyCutting = function () {

    var old_above_biomass = vc_AbovegroundBiomass;
    var removing_biomass = 0.0;

    logger(MSG.INFO, "apply cutting");

    var new_OrganBiomass = [];      //! old WORG
    for (var organ=1; organ<pc_NumberOfOrgans+1; organ++) {

        var cut_organ_count = cropParams.organIdsForCutting.length;
        var biomass = vc_OrganBiomass[organ - 1];
        logger(MSG.INFO, "old biomass: " + biomass  + "\tOrgan: " + organ);
        for (var cut_organ=0; cut_organ<cut_organ_count; cut_organ++) {

            var yc = new YieldComponent(cropParams.organIdsForCutting[cut_organ]);

            if (organ == yc.organId) {
                biomass = vc_OrganBiomass[organ - 1] * ((1-yc.yieldPercentage));
                vc_AbovegroundBiomass -= biomass;

                removing_biomass +=biomass;
            }
        }
        new_OrganBiomass.push(biomass);
        logger(MSG.INFO, "new biomass: " + biomass);
    }

    vc_TotalBiomassNContent = (removing_biomass / old_above_biomass) * vc_TotalBiomassNContent;


    vc_OrganBiomass = new Float64Array(new_OrganBiomass);

    // reset stage and temperature some after cutting
    var stage_after_cutting = cropParams.pc_StageAfterCut-1;
    for (var stage=stage_after_cutting; stage<pc_NumberOfDevelopmentalStages; stage++) {
      vc_CurrentTemperatureSum[stage] = 0.0;
    }
    vc_CurrentTotalTemperatureSum = 0.0;
    vc_DevelopmentalStage = stage_after_cutting;
    cutting_delay_days = cropParams.pc_CuttingDelayDays;
    pc_MaxAssimilationRate  = pc_MaxAssimilationRate * 0.9;

    // JS: Fehler in MONICA C++? LAI bleibt nach Schnitt unverändert
    // Reset leaf area index
    vc_LeafAreaIndex = vc_OrganBiomass[1] * pc_SpecificLeafArea[vc_DevelopmentalStage]; // [ha ha-1]  

  };

  var accumulateEvapotranspiration = function (ETa) { 
    vc_accumulatedETa += ETa;
  };

  var get_RootNConcentration = function () {
    return vc_NConcentrationRoot;
  };

  /**
  * Returns the depth of the maximum active and effective root.
  * [m]
  */
  var getEffectiveRootingDepth = function () {
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      if (vc_RootEffectivity[i_Layer] == 0.0) {
          return (i_Layer+1) / 10.0;
      } // if
    } // for
    return (vs_NumberOfLayers + 1) / 10.0;
  };

  var get_CropName = function () {
    return pc_CropName;
  };

  var get_GrossPhotosynthesisRate = function () {
    return vc_GrossPhotosynthesis_mol;
  };

  var get_GrossPhotosynthesisHaRate = function () {
    return vc_GrossPhotosynthesis;
  };

  var get_AssimilationRate = function () {
    return vc_AssimilationRate;
  };

  var get_Assimilates = function () {
    return vc_Assimilates;
  };

  var get_NetMaintenanceRespiration = function () {
    return vc_NetMaintenanceRespiration;
  };

  var get_MaintenanceRespirationAS = function () {
    return vc_MaintenanceRespirationAS;
  };

  var get_GrowthRespirationAS = function () {
    return vc_GrowthRespirationAS;
  };

  var get_VernalisationFactor = function () {
    return vc_VernalisationFactor;
  };

  var get_DaylengthFactor = function () {
    return vc_DaylengthFactor;
  };

  var get_NetPhotosynthesis = function () {
    return vc_NetPhotosynthesis;
  };

  var get_ReferenceEvapotranspiration = function () {
    return vc_ReferenceEvapotranspiration;
  };

  var get_RemainingEvapotranspiration = function () {
    return vc_RemainingEvapotranspiration;
  };

  var get_EvaporatedFromIntercept = function () {
    return vc_EvaporatedFromIntercept;
  };

  var get_NetPrecipitation = function () {
    return vc_NetPrecipitation;
  };

  var get_LeafAreaIndex = function () {
    return vc_LeafAreaIndex;
  };

  var get_CropHeight = function () {
    return vc_CropHeight;
  };

  var get_RootingDepth = function () {
    return vc_RootingDepth;
  };

  var get_SoilCoverage = function () {
    return vc_SoilCoverage;
  };

  var get_KcFactor = function () {
    return vc_KcFactor;
  };

  var get_StomataResistance = function () {
    return vc_StomataResistance;
  };

  var get_PotentialTranspiration = function () {
    return vc_PotentialTranspiration;
  };

  var get_ActualTranspiration = function () {
    return vc_ActualTranspiration;
  };

  var get_TranspirationDeficit = function () {
    return vc_TranspirationDeficit;
  };

  var get_OxygenDeficit = function () {
    return vc_OxygenDeficit;
  };

  var get_CropNRedux = function () {
    return vc_CropNRedux;
  };

  var get_HeatStressRedux = function () {
    return vc_CropHeatRedux;
  };

  var get_CurrentTemperatureSum = function () {
    return vc_CurrentTotalTemperatureSum;
  };

  var get_DevelopmentalStage = function () {
    return vc_DevelopmentalStage;
  };

  var get_RelativeTotalDevelopment = function () {
    return vc_RelativeTotalDevelopment;
  };

  var get_AbovegroundBiomass = function () {
    return vc_AbovegroundBiomass;
  };

  var get_TotalBiomassNContent = function () {
    return vc_TotalBiomassNContent;
  };

  var get_TargetNConcentration = function () {
    return vc_TargetNConcentration;
  };

  var get_CriticalNConcentration = function () {
    return vc_CriticalNConcentration;
  };

  var get_AbovegroundBiomassNConcentration = function () {
    return vc_NConcentrationAbovegroundBiomass;
  };

  var get_HeatSumIrrigationStart = function () {
    return cropParams.pc_HeatSumIrrigationStart;
  };

  var get_HeatSumIrrigationEnd = function () {
    return cropParams.pc_HeatSumIrrigationEnd
  };

  var get_SumTotalNUptake = function () {
    return vc_SumTotalNUptake;
  };

  var get_ActNUptake = function () {
    return vc_TotalNUptake;
  };

  var get_GrossPrimaryProduction = function () {
    return vc_GrossPrimaryProduction;
  };

  var get_NetPrimaryProduction = function () {
    return vc_NetPrimaryProduction;
  };

  var get_AccumulatedETa = function () {
    return vc_accumulatedETa;
  };

  var isDying = function () {
    return dyingOut;
  };

  var get_NumberOfOrgans = function () { 
    return pc_NumberOfOrgans; 
  };

  var totalBiomass = function () { 
    return vc_TotalBiomass; 
  };

  return {
      accumulateEvapotranspiration: accumulateEvapotranspiration
    , applyCutting: applyCutting
    , fc_CropDevelopmentalStage: fc_CropDevelopmentalStage
    , fc_CropDryMatter: fc_CropDryMatter
    , fc_CropGreenArea: fc_CropGreenArea
    , fc_CropNUptake: fc_CropNUptake
    , fc_CropNitrogen: fc_CropNitrogen
    , fc_CropPhotosynthesis: fc_CropPhotosynthesis
    , fc_CropSize: fc_CropSize
    , fc_CropWaterUptake: fc_CropWaterUptake
    , fc_DaylengthFactor: fc_DaylengthFactor
    , fc_DroughtImpactOnFertility: fc_DroughtImpactOnFertility
    , fc_GrossPrimaryProduction: fc_GrossPrimaryProduction
    , fc_HeatStressImpact: fc_HeatStressImpact
    , fc_KcFactor: fc_KcFactor
    , fc_NetPrimaryProduction: fc_NetPrimaryProduction
    , fc_OxygenDeficiency: fc_OxygenDeficiency
    , fc_Radiation: fc_Radiation
    , fc_ReferenceEvapotranspiration: fc_ReferenceEvapotranspiration
    , fc_SoilCoverage: fc_SoilCoverage
    , fc_VernalisationFactor: fc_VernalisationFactor
    , getEffectiveRootingDepth: getEffectiveRootingDepth
    , get_AbovegroundBiomass: get_AbovegroundBiomass
    , get_AbovegroundBiomassNConcentration: get_AbovegroundBiomassNConcentration
    , get_AbovegroundBiomassNContent: get_AbovegroundBiomassNContent
    , get_AbovegroundBiomassNContent: get_AbovegroundBiomassNContent
    , get_AccumulatedETa: get_AccumulatedETa
    , get_ActNUptake: get_ActNUptake
    , get_ActualTranspiration: get_ActualTranspiration
    , get_Assimilates: get_Assimilates
    , get_AssimilationRate: get_AssimilationRate
    , get_AutotrophicRespiration: get_AutotrophicRespiration
    , get_CriticalNConcentration: get_CriticalNConcentration
    , get_CropHeight: get_CropHeight
    , get_CropNRedux: get_CropNRedux
    , get_CropName: get_CropName
    , get_CurrentTemperatureSum: get_CurrentTemperatureSum
    , get_DaylengthFactor: get_DaylengthFactor
    , get_DevelopmentalStage: get_DevelopmentalStage
    , get_EvaporatedFromIntercept: get_EvaporatedFromIntercept
    , get_FreshPrimaryCropYield: get_FreshPrimaryCropYield
    , get_FreshSecondaryCropYield: get_FreshSecondaryCropYield
    , get_GrossPhotosynthesisHaRate: get_GrossPhotosynthesisHaRate
    , get_GrossPhotosynthesisRate: get_GrossPhotosynthesisRate
    , get_GrossPrimaryProduction: get_GrossPrimaryProduction
    , get_GrowthRespirationAS: get_GrowthRespirationAS
    , get_HeatStressRedux: get_HeatStressRedux
    , get_HeatSumIrrigationEnd: get_HeatSumIrrigationEnd
    , get_HeatSumIrrigationStart: get_HeatSumIrrigationStart
    , get_KcFactor: get_KcFactor
    , get_LeafAreaIndex: get_LeafAreaIndex
    , get_MaintenanceRespirationAS: get_MaintenanceRespirationAS
    , get_NUptakeFromLayer: get_NUptakeFromLayer
    , get_NUptakeFromLayer: get_NUptakeFromLayer
    , get_NetMaintenanceRespiration: get_NetMaintenanceRespiration
    , get_NetPhotosynthesis: get_NetPhotosynthesis
    , get_NetPrecipitation: get_NetPrecipitation
    , get_NetPrimaryProduction: get_NetPrimaryProduction
    , get_NumberOfOrgans: get_NumberOfOrgans
    , get_OrganBiomass: get_OrganBiomass
    , get_OrganBiomass: get_OrganBiomass
    , get_OrganGrowthIncrement: get_OrganGrowthIncrement
    , get_OrganGrowthIncrement: get_OrganGrowthIncrement
    , get_OrganSpecificNPP: get_OrganSpecificNPP
    , get_OrganSpecificTotalRespired: get_OrganSpecificTotalRespired
    , get_OxygenDeficit: get_OxygenDeficit
    , get_PotNUptake: get_PotNUptake
    , get_PotentialTranspiration: get_PotentialTranspiration
    , get_PrimaryCropYield: get_PrimaryCropYield
    , get_PrimaryYieldNConcentration: get_PrimaryYieldNConcentration
    , get_PrimaryYieldNContent: get_PrimaryYieldNContent
    , get_RawProteinConcentration: get_RawProteinConcentration
    , get_ReferenceEvapotranspiration: get_ReferenceEvapotranspiration
    , get_RelativeTotalDevelopment: get_RelativeTotalDevelopment
    , get_RemainingEvapotranspiration: get_RemainingEvapotranspiration
    , get_ResidueBiomass: get_ResidueBiomass
    , get_ResiduesNConcentration: get_ResiduesNConcentration
    , get_ResiduesNContent: get_ResiduesNContent
    , get_RootNConcentration: get_RootNConcentration
    , get_RootNConcentration: get_RootNConcentration
    , get_RootingDepth: get_RootingDepth
    , get_SecondaryCropYield: get_SecondaryCropYield
    , get_SecondaryYieldNContent: get_SecondaryYieldNContent
    , get_SoilCoverage: get_SoilCoverage
    , get_StomataResistance: get_StomataResistance
    , get_SumTotalNUptake: get_SumTotalNUptake
    , get_TargetNConcentration: get_TargetNConcentration
    , get_TotalBiomassNContent: get_TotalBiomassNContent
    , get_Transpiration: get_Transpiration
    , get_Transpiration: get_Transpiration
    , get_TranspirationDeficit: get_TranspirationDeficit
    , get_VernalisationFactor: get_VernalisationFactor
    , isDying: isDying
    , pc_NumberOfAbovegroundOrgans: pc_NumberOfAbovegroundOrgans
    , step: calculateCropGrowthStep
    , totalBiomass: totalBiomass
  }

};



var Environment = function (sps, cpp) {

  this.mode = "MyMode"; // JS! mode not implemented

  // copy constructor
  if (arguments[0] instanceof Environment) {
    debug("Copy constructor: Env" + "\tsoil param size: " + env.soilParams.length);
    this.env = arguments[0];
    this.customId = env.customId;
    this.soilParams = env.soilParams;
    this.noOfLayers = env.noOfLayers;
    this.layerThickness = env.layerThickness;
    //this.useNMinMineralFertilisingMethod = env.useNMinMineralFertilisingMethod;
    //this.useAutomaticIrrigation = env.useAutomaticIrrigation;
    this.useSecondaryYields = env.useSecondaryYields;

    this.windSpeedHeight = env.windSpeedHeight;
    this.atmosphericCO2 = env.atmosphericCO2;
    this.albedo = env.albedo;

    this.da = env.da;
    this.cropRotation = env.cropRotation;

    // gridPoint = env.gridPoint;

    this.site = env.site;
    this.general = env.general;
    this.organic = env.organic;

    //this.nMinFertiliserPartition = env.nMinFertiliserPartition;
    //this.nMinUserParams = env.nMinUserParams;
    //this.autoIrrigationParams = env.autoIrrigationParams;
    this.centralParameterProvider = env.centralParameterProvider;

    this.pathToOutputDir = env.pathToOutputDir;
    this.mode = env.mode;
  } else {
    this.soilParams = sps;
    this.customId = -1;
    this.centralParameterProvider = cpp;
    this.pathToOutputDir = null;

    this.user_env = this.centralParameterProvider.userEnvironmentParameters;
    this.windSpeedHeight = this.user_env.p_WindSpeedHeight;
    this.atmosphericCO2 = this.user_env.p_AthmosphericCO2;
    this.albedo = this.user_env.p_Albedo;

    this.noOfLayers = this.user_env.p_NumberOfLayers;
    this.layerThickness = this.user_env.p_LayerThickness;
    //this.useNMinMineralFertilisingMethod = this.user_env.p_UseNMinMineralFertilisingMethod;
    //this.useAutomaticIrrigation = this.user_env.p_UseAutomaticIrrigation;
    this.useSecondaryYields = this.user_env.p_UseSecondaryYields;

    this.cropRotation = null; 
  }

  /**
   * Set execution mode of Monica.
   * Disables debug outputs for some modes.
   *
   * @param mode
   */
  var setMode = function (_mode) {
    mode = _mode;
  };

  /**
   * Interface method for python wrapping. Simply returns number
   * of possible simulation steps according to avaible climate data.
   *
   * @return Number of steps
   */

  var numberOfPossibleSteps = function () {
    return da.noOfStepsPossible();
  };

  this.getMode =  function () { 
    return mode; 
  };

  this.setCropRotation = function (ff) {
    this.cropRotation = ff;
  };

};

var Model = function (env, da) {

  var that = this;

  /**
   * @brief returns value for current crop.
   * @return crop growth
   */
  // this.cropGrowth statt var, um this an SoilX. zu übergeben
  this._currentCropGrowth = null;
  this.cropGrowth = function () { return that._currentCropGrowth; };

  var _env = env
    , _soilColumn = new SoilColumn(_env.general, _env.soilParams, _env.centralParameterProvider)
    , _soilTemperature = new SoilTemperature(_soilColumn, this, _env.centralParameterProvider)
    , _soilMoisture = new SoilMoisture(_soilColumn, _env.site, this, _env.centralParameterProvider)
    , _soilOrganic = new SoilOrganic(_soilColumn, _env.general, _env.site,_env.centralParameterProvider)
    , _soilTransport = new SoilTransport(_soilColumn, _env.site, _env.centralParameterProvider)
    , _sumFertiliser = 0
    , _dailySumFertiliser = 0
    , _dailySumIrrigationWater = 0
    , _dataAccessor = da
    , _currentStepNo = 0
    , centralParameterProvider = _env.centralParameterProvider
    , p_daysWithCrop = 0
    , p_accuNStress = 0.0
    , p_accuWaterStress = 0.0
    , p_accuHeatStress = 0.0
    , p_accuOxygenStress = 0.0
    ;

  this.vw_AtmosphericCO2Concentration;
  this.vs_GroundwaterDepth;

  var _currentCrop = null;


  /**
   * @brief Simulation of crop seed.
   * @param crop to be planted
   */
  var seedCrop = function (crop) {

    debug("seedCrop");

    that._currentCropGrowth = null;
    p_daysWithCrop = 0;
    p_accuNStress = 0.0;
    p_accuWaterStress = 0.0;
    p_accuHeatStress = 0.0;
    p_accuOxygenStress = 0.0;
    var cps = null; // JS!

    _currentCrop = crop;
    if(_currentCrop.isValid()) {
      cps = _currentCrop.cropParameters();
      that._currentCropGrowth = new CropGrowth(_soilColumn, _env.general, cps, _env.site, _env.centralParameterProvider/*, crop.getEva2TypeUsage()*/);
      _soilTransport.put_Crop(that._currentCropGrowth);
      _soilColumn.put_Crop(that._currentCropGrowth);
      _soilMoisture.put_Crop(that._currentCropGrowth);
      _soilOrganic.put_Crop(that._currentCropGrowth);

      logger(MSG.INFO, "seedDate: " + _currentCrop.seedDate().toString()
          + " harvestDate: " + _currentCrop.harvestDate().toString());

      if(_currentCrop.useNMinMethod()
         && _currentCrop.seedDate().dayOfYear() <= _currentCrop.harvestDate().dayOfYear())
      {
        logger(MSG.INFO, "nMin fertilising summer crop");
        var fert_amount = applyMineralFertiliserViaNMinMethod
            (_currentCrop.nMinFertiliserPartition(),
             new NMinCropParameters(cps.pc_SamplingDepth,
                                cps.pc_TargetNSamplingDepth,
                                cps.pc_TargetN30));
        addDailySumFertiliser(fert_amount);
      }

      // if (that.writeOutputFiles()) {
          _currentCrop.writeCropParameters(_env.pathToOutputDir);
      // }
    }
  };

  /**
   * @brief Simulating harvest of crop.
   *
   * Deletes the current crop.
   */
  var harvestCurrentCrop = function () {

    //could be just a fallow, so there might be no CropGrowth object
    if(_currentCrop && _currentCrop.isValid())
    {
      //prepare to add root and crop residues to soilorganic (AOMs)
      var rootBiomass = that._currentCropGrowth.get_OrganBiomass(0);
      var rootNConcentration = that._currentCropGrowth.get_RootNConcentration();
      logger(MSG.INFO, "adding organic matter from root to soilOrganic");
      logger(MSG.INFO, "root biomass: " + rootBiomass
          + " Root N concentration: " + rootNConcentration);

      _soilOrganic.addOrganicMatter(_currentCrop.residueParameters(),
                                    rootBiomass, rootNConcentration);

      var residueBiomass =
          that._currentCropGrowth.get_ResidueBiomass(_env.useSecondaryYields);
      //!@todo Claas: das hier noch berechnen
      var residueNConcentration = that._currentCropGrowth.get_ResiduesNConcentration();
      logger(MSG.INFO, "adding organic matter from residues to soilOrganic");
      logger(MSG.INFO, "residue biomass: " + residueBiomass
          + " Residue N concentration: " + residueNConcentration);
      logger(MSG.INFO, "primary yield biomass: " + that._currentCropGrowth.get_PrimaryCropYield()
          + " Primary yield N concentration: " + that._currentCropGrowth.get_PrimaryYieldNConcentration());
      logger(MSG.INFO, "secondary yield biomass: " + that._currentCropGrowth.get_SecondaryCropYield()
          + " Secondary yield N concentration: " + that._currentCropGrowth.get_PrimaryYieldNConcentration());
      logger(MSG.INFO, "Residues N content: " + that._currentCropGrowth.get_ResiduesNContent()
          + " Primary yield N content: " + that._currentCropGrowth.get_PrimaryYieldNContent()
          + " Secondary yield N content: " + that._currentCropGrowth.get_SecondaryYieldNContent());

      _soilOrganic.addOrganicMatter(_currentCrop.residueParameters(),
                                    residueBiomass, residueNConcentration);
    }

    that._currentCropGrowth = null;
    _currentCrop = null;
    _soilTransport.remove_Crop();
    _soilColumn.remove_Crop();
    _soilMoisture.remove_Crop();
  };


  /**
   * @brief Simulating plowing or incorporating of total crop.
   *
   * Deletes the current crop.
   */
  var incorporateCurrentCrop = function () {
    //could be just a fallow, so there might be no CropGrowth object
    if(_currentCrop && _currentCrop.isValid())
    {
      //prepare to add root and crop residues to soilorganic (AOMs)
      var total_biomass = that._currentCropGrowth.totalBiomass();
      var totalNConcentration = that._currentCropGrowth.get_AbovegroundBiomassNConcentration() + that._currentCropGrowth.get_RootNConcentration();

      logger(MSG.INFO, "Adding organic matter from total biomass of crop to soilOrganic");
      logger(MSG.INFO, "Total biomass: " + total_biomass
          + " Total N concentration: " + totalNConcentration);

      _soilOrganic.addOrganicMatter(_currentCrop.residueParameters(),
                                    total_biomass, totalNConcentration);
    }

    that._currentCropGrowth = null;
    _currentCrop = null;
    _soilTransport.remove_Crop();
    _soilColumn.remove_Crop();
    _soilMoisture.remove_Crop();
  };


  /**
   * @brief Applying of fertilizer.
   *
   * @todo Nothing implemented yet.
   */
  var applyMineralFertiliser = function (partition, amount) {
    if(!_currentCrop || !_currentCrop.useNMinMethod()) {
      _soilColumn.applyMineralFertiliser(partition, amount);
      addDailySumFertiliser(amount);
    }
  };

  var applyOrganicFertiliser = function (params, amount, incorporation) {
    logger(MSG.INFO, "MONICA model: applyOrganicFertiliser:\t" + amount + "\t" + params.vo_NConcentration);
    _soilOrganic.setIncorporation(incorporation);
    _soilOrganic.addOrganicMatter(params, amount, params.vo_NConcentration);
    addDailySumFertiliser(amount * params.vo_NConcentration);
  };

  var applyMineralFertiliserViaNMinMethod = function (partition, cps) {
    // TODO: implement
    //AddFertiliserAmountsCallback x(_sumFertiliser, _dailySumFertiliser);

    var ups = _currentCrop.nMinUserParams();

    var fert_amount = _soilColumn.applyMineralFertiliserViaNMinMethod(partition, cps.samplingDepth, cps.nTarget, cps.nTarget30,
         ups.min, ups.max, ups.delayInDays);
    return fert_amount;

    //ref(_sumFertiliser) += _1);
  };

  var applyIrrigation = function (amount, nitrateConcentration /*, sulfateConcentration*/) {
    //if the production process has still some defined manual irrigation dates
    if(!_currentCrop.useAutomaticIrrigation())
    {
      _soilOrganic.addIrrigationWater(amount);
      _soilColumn.applyIrrigation(amount, nitrateConcentration);
      if(_currentCrop)
      {
        _currentCrop.addAppliedIrrigationWater(amount);
        this.addDailySumIrrigationWater(amount);
      }
    }
  };

  /**
   * Applies tillage for a given soil depth. Tillage means in MONICA,
   * that for all effected soil layer the parameters are averaged.
   * @param depth Depth in meters
   */
  var applyTillage = function (depth) {
    _soilColumn.applyTillage(depth);
  };

  /**
   * @brief Simulating the soil processes for one time step.
   * @param stepNo Number of current processed step
   */
  var generalStep = function (stepNo) {

    _currentStepNo = stepNo;
    var startDate = _dataAccessor.startDate();
    var currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + stepNo);
    var julday = _dataAccessor.julianDayForStep(stepNo);
    var year = currentDate.getFullYear();
    var leapYear = currentDate.isLeapYear();
    var tmin = _dataAccessor.dataForTimestep(Climate.tmin, stepNo);
    var tavg = _dataAccessor.dataForTimestep(Climate.tavg, stepNo);
    var tmax = _dataAccessor.dataForTimestep(Climate.tmax, stepNo);
    var precip = _dataAccessor.dataForTimestep(Climate.precip, stepNo);
    var wind = _dataAccessor.dataForTimestep(Climate.wind, stepNo);
    var globrad = _dataAccessor.dataForTimestep(Climate.globrad, stepNo);

    debug("-------- generalStep " + stepNo + " ---------");
    debug(currentDate.toLocaleDateString());

    // test if data for relhumid are available; if not, value is set to -1.0
    var relhumid = _dataAccessor.hasAvailableClimateData(Climate.relhumid) ?
         _dataAccessor.dataForTimestep(Climate.relhumid, stepNo) : -1.0;

    var user_env = centralParameterProvider.userEnvironmentParameters;
    that.vw_AtmosphericCO2Concentration = _env.atmosphericCO2 == -1 ? user_env.p_AthmosphericCO2 : _env.atmosphericCO2;

  //  cout << "that.vs_GroundwaterDepth:\t" << user_env.p_MinGroundwaterDepth << "\t" << user_env.p_MaxGroundwaterDepth << endl;
    that.vs_GroundwaterDepth = GroundwaterDepthForDate(user_env.p_MaxGroundwaterDepth,
                  user_env.p_MinGroundwaterDepth,
                  user_env.p_MinGroundwaterDepthMonth,
                  julday,
                  leapYear);

    if (stepNo<=1) {
      //    : << "Monica: tmin: " << tmin << endl;
      //    cout << "Monica: tmax: " << tmax << endl;
      //    cout << "Monica: globrad: " << globrad << endl;
      //    cout << "Monica: precip: " << precip << endl;
    }


    if (int(that.vw_AtmosphericCO2Concentration) == 0)
      that.vw_AtmosphericCO2Concentration = CO2ForDate(year, julday, leapYear);

    //  debug << "step: " << stepNo << " p: " << precip << " gr: " << globrad << endl;

    //31 + 28 + 15
    var pc_JulianDayAutomaticFertilising = user_env.p_JulianDayAutomaticFertilising;

    _soilColumn.deleteAOMPool();

    _soilColumn.applyPossibleDelayedFerilizer();
    var delayed_fert_amount = _soilColumn.applyPossibleTopDressing();
    addDailySumFertiliser(delayed_fert_amount);

    if(_currentCrop && _currentCrop.isValid() &&
       _currentCrop.useNMinMethod()
       && _currentCrop.seedDate().dayOfYear() > _currentCrop.harvestDate().dayOfYear()
      && _dataAccessor.julianDayForStep(stepNo) == pc_JulianDayAutomaticFertilising)
      {
      logger(MSG.INFO, "nMin fertilising winter crop");
      var cps = _currentCrop.cropParameters();
      var fert_amount = applyMineralFertiliserViaNMinMethod
          (_currentCrop.nMinFertiliserPartition(),
           new NMinCropParameters(cps.pc_SamplingDepth,
                              cps.pc_TargetNSamplingDepth,
                              cps.pc_TargetN30));
      addDailySumFertiliser(fert_amount);

    }

    _soilTemperature.step(tmin, tmax, globrad);
    _soilMoisture.step(that.vs_GroundwaterDepth,
                       precip, tmax, tmin,
                       (relhumid / 100.0), tavg, wind,
                       _env.windSpeedHeight,
       globrad, julday);

    _soilOrganic.step(tavg, precip, wind);
    _soilTransport.step();
  };

  /**
   * @brief Simulating crop growth for one time step.
   */
  var cropStep = function (stepNo) {
    // do nothing if there is no crop
    if(!that._currentCropGrowth)
      return;

    p_daysWithCrop++;

    var julday = _dataAccessor.julianDayForStep(stepNo);

    var tavg = _dataAccessor.dataForTimestep(Climate.tavg, stepNo);
    var tmax = _dataAccessor.dataForTimestep(Climate.tmax, stepNo);
    var tmin = _dataAccessor.dataForTimestep(Climate.tmin, stepNo);
    var globrad = _dataAccessor.dataForTimestep(Climate.globrad, stepNo);

    // test if data for sunhours are available; if not, value is set to -1.0
    var sunhours = _dataAccessor.hasAvailableClimateData(Climate.sunhours) ?
      _dataAccessor.dataForTimestep(Climate.sunhours, stepNo) : -1.0;    

    // test if data for relhumid are available; if not, value is set to -1.0
    var relhumid = _dataAccessor.hasAvailableClimateData(Climate.relhumid) ?
        _dataAccessor.dataForTimestep(Climate.relhumid, stepNo) : -1.0;

    var wind =  _dataAccessor.dataForTimestep(Climate.wind, stepNo);
    var precip =  _dataAccessor.dataForTimestep(Climate.precip, stepNo);

    var vw_WindSpeedHeight =
        centralParameterProvider.userEnvironmentParameters.p_WindSpeedHeight;

    that._currentCropGrowth.step(tavg, tmax, tmin, globrad, sunhours, julday,
                             (relhumid / 100.0), wind, vw_WindSpeedHeight,
                             that.vw_AtmosphericCO2Concentration, precip);
    if(_currentCrop.useAutomaticIrrigation())
    {
      var aips = _currentCrop.autoIrrigationParams();
      if(_soilColumn.applyIrrigationViaTrigger(aips.treshold, aips.amount,
                                               aips.nitrateConcentration))
      {
        _soilOrganic.addIrrigationWater(aips.amount);
        _currentCrop.addAppliedIrrigationWater(aips.amount);
        _dailySumIrrigationWater += aips.amount;
      }
    }

    p_accuNStress += that._currentCropGrowth.get_CropNRedux();
    p_accuWaterStress += that._currentCropGrowth.get_TranspirationDeficit();
    p_accuHeatStress += that._currentCropGrowth.get_HeatStressRedux();
    p_accuOxygenStress += that._currentCropGrowth.get_OxygenDeficit();

  };

  /**
  * @brief Returns atmospheric CO2 concentration for date [ppm]
  *
  * @param co2
  *
  * @return
  */
  var CO2ForDate = function (year, julianday, leapYear) {
    var co2;
    var decimalDate;

    if (leapYear)
      decimalDate = year + (julianday/366.0);
    else
      decimalDate = year + (julianday/365.0);

    co2 = 222.0 + exp(0.0119 * (decimalDate - 1580.0)) + 2.5 * sin((decimalDate - 0.5) / 0.1592);
    return co2;
  };

  /**
  * @brief Returns groundwater table for date [m]
  *
  * @param pm_MaxGroundwaterTable; pm_MinGroundwaterTable; pm_MaxGroundwaterTableMonth
  *
  * @return
  */
  var GroundwaterDepthForDate = function (
    maxGroundwaterDepth,
    minGroundwaterDepth,
    minGroundwaterDepthMonth,
    julianday,
    leapYear
  ) {

    // logger(MSG.INFO, "GroundwaterDepthForDate");
    // logger(MSG.INFO, arguments);
    
    var groundwaterDepth;
    var days;
    var meanGroundwaterDepth;
    var groundwaterAmplitude;

    if (leapYear)
      days = 366.0;
    else
      days = 365.0;

    meanGroundwaterDepth = (maxGroundwaterDepth + minGroundwaterDepth) / 2.0;
    groundwaterAmplitude = (maxGroundwaterDepth - minGroundwaterDepth) / 2.0;

    var sinus = sin(((julianday / days * 360.0) - 90.0 -
           (((minGroundwaterDepthMonth) * 30.0) - 15.0)) *
           3.14159265358979 / 180.0);

    groundwaterDepth = meanGroundwaterDepth + (sinus * groundwaterAmplitude);

    if (groundwaterDepth < 0.0) groundwaterDepth = 20.0;

    return groundwaterDepth;
  };

  //----------------------------------------------------------------------------

  /**
   * @brief Returns mean soil organic C.
   * @param depth_m
   */
  //Kohlenstoffgehalt 0-depth [% kg C / kg Boden]
  var avgCorg = function (depth_m) {
    var lsum = 0, sum = 0;
    var count = 0;

    for(var i = 0, nols = _env.noOfLayers; i < nols; i++)
    {
      count++;
      sum +=_soilColumn[i].vs_SoilOrganicCarbon(); //[kg C / kg Boden]
      lsum += _soilColumn[i].vs_LayerThickness;
      if(lsum >= depth_m)
        break;
    }

    return sum / (count) * 100.0;
  };

  /**
   * @brief Returns the soil moisture up to 90 cm depth
   * @return water content
   */
  //Bodenwassergehalt 0-90cm [%nFK]
  var mean90cmWaterContent = function () {
    return _soilMoisture.meanWaterContent(0.9);
  };

  var meanWaterContent = function (layer, number_of_layers) {
    return _soilMoisture.meanWaterContent(layer, number_of_layers);
  };

  /**
   * @brief Returns the N content up to given depth.
   *
   *@return N content
   *
   */
  //Boden-Nmin-Gehalt 0-90cm am 31.03. [kg N/ha]
  var sumNmin = function (depth_m) {
    var lsum = 0, sum = 0;
    var count = 0;

    for(var i = 0, nols = _env.noOfLayers; i < nols; i++)
    {
      count++;
      sum += _soilColumn[i].get_SoilNmin(); //[kg N m-3]
      lsum += _soilColumn[i].vs_LayerThickness;
      if(lsum >= depth_m)
        break;
    }

    return sum / (count) * lsum * 10000;
  }

  /**
   * Returns accumulation of soil nitrate for 90cm soil at 31.03.
   * @param depth Depth of soil
   * @return Accumulated nitrate
   */
  var sumNO3AtDay = function (depth_m) {
    var lsum = 0, sum = 0;
    var count = 0;

    for(var i = 0, nols = _env.noOfLayers; i < nols; i++)
    {
      count++;
      sum += _soilColumn[i].get_SoilNO3(); //[kg m-3]
      lsum += _soilColumn[i].vs_LayerThickness;
      if(lsum >= depth_m)
        break;
    }

    return sum;
  };

  //Grundwasserneubildung[mm Wasser]
  var groundWaterRecharge = function () {
    return _soilMoisture.get_GroundwaterRecharge();
  };

  //N-Auswaschung[kg N/ha]
  var nLeaching = function () {
    return _soilTransport.get_NLeaching();//[kg N ha-1]
  };

  /**
   * Returns sum of soiltemperature in given number of soil layers
   * @param layers Number of layers that should be added.
   * @return Soil temperature sum [°C]
   */
  var sumSoilTemperature = function (layers) {
    return _soilColumn.sumSoilTemperature(layers);
  };

  /**
   * Returns maximal snow depth during simulation
   * @return
   */
  var maxSnowDepth = function () {
    return _soilMoisture.getMaxSnowDepth();
  };

  /**
   * Returns sum of all snowdepth during whole simulation
   * @return
   */
  var accumulatedSnowDepth = function () {
    return _soilMoisture.accumulatedSnowDepth();
  };

  /**
   * Returns sum of frost depth during whole simulation.
   * @return Accumulated frost depth
   */
  var accumulatedFrostDepth = function () {
    return _soilMoisture.getAccumulatedFrostDepth();
  };

  /**
   * Returns average soil temperature of first 30cm soil.
   * @return Average soil temperature of organic layers.
   */
  var avg30cmSoilTemperature = function () {
    var nols = 3;
    var accu_temp = 0.0;
    for (var layer=0; layer<nols; layer++)
      accu_temp+=_soilColumn.soilLayer(layer).get_Vs_SoilTemperature();

    return accu_temp / nols;
  };

  /**
   * Returns average soil moisture concentration in soil in a defined layer.
   * Layer is specified by start end end of soil layer.
   *
   * @param start_layer
   * @param end_layer
   * @return Average soil moisture concentation
   */
  var avgSoilMoisture = function (start_layer, end_layer) {
    var num=0;
    var accu = 0.0;
    for (var i=start_layer; i<end_layer; i++)
    {
      accu+=_soilColumn.soilLayer(i).get_Vs_SoilMoisture_m3();
      num++;
    }
    return accu/num;
  };

  /**
   * Returns mean of capillary rise in a set of layers.
   * @param start_layer First layer to be included
   * @param end_layer Last layer, is not included;
   * @return Average capillary rise [mm]
   */
  var avgCapillaryRise = function (start_layer, end_layer) {
    var num=0;
    var accu = 0.0;
    for (var i=start_layer; i<end_layer; i++)
    {
      accu+=_soilMoisture.get_CapillaryRise(i);
      num++;
    }
    return accu/num;
  };

  /**
   * @brief Returns mean percolation rate
   * @param start_layer
   * @param end_layer
   * @return Mean percolation rate [mm]
   */
  var avgPercolationRate = function (start_layer, end_layer) {
    var num=0;
    var accu = 0.0;
    for (var i=start_layer; i<end_layer; i++)
    {
      accu+=_soilMoisture.get_PercolationRate(i);
      num++;
    }
    return accu/num;
  };

  /**
   * Returns sum of all surface run offs at this point in simulation time.
   * @return Sum of surface run off in [mm]
   */
  var sumSurfaceRunOff = function () {
    return _soilMoisture.get_SumSurfaceRunOff();
  };

  /**
   * Returns surface runoff of current day [mm].
   */
  var surfaceRunoff = function () {
    return _soilMoisture.get_SurfaceRunOff();
  };

  /**
   * Returns evapotranspiration [mm]
   * @return
   */
  var getEvapotranspiration = function () {
    if (that._currentCropGrowth!=0)
      return that._currentCropGrowth.get_RemainingEvapotranspiration();

    return 0.0;
  };

  /**
   * Returns actual transpiration
   * @return
   */
  var getTranspiration = function () {
    if (that._currentCropGrowth!=0)
      return that._currentCropGrowth.get_ActualTranspiration();

    return 0.0;
  };

  /**
   * Returns actual evaporation
   * @return
   */
  var getEvaporation = function () {
    if (that._currentCropGrowth!=0)
      return that._currentCropGrowth.get_EvaporatedFromIntercept();

    return 0.0;
  };

  var getETa = function () {
    return _soilMoisture.get_Evapotranspiration();
  };

  /**
   * Returns sum of evolution rate in first three layers.
   * @return
   */
  var get_sum30cmSMB_CO2EvolutionRate = function () {
    var sum = 0.0;
    for (var layer=0; layer<3; layer++) {
      sum+=_soilOrganic.get_SMB_CO2EvolutionRate(layer);
    }

    return sum;
  };

  /**
   * Returns volatilised NH3
   * @return
   */
  var getNH3Volatilised = function () {
    return _soilOrganic.get_NH3_Volatilised();
  };

  /**
   * Returns accumulated sum of all volatilised NH3 in simulation time.
   * @return
   */
  var getSumNH3Volatilised = function () {
  //  cout << "NH4Vol: " << _soilOrganic.get_sumNH3_Volatilised() << endl;
    return _soilOrganic.get_SumNH3_Volatilised();
  };

  /**
   * Returns sum of denitrification rate in first 30cm soil.
   * @return Denitrification rate [kg N m-3 d-1]
   */
  var getsum30cmActDenitrificationRate = function () {
    var sum=0.0;
    for (var layer=0; layer<3; layer++) {
  //    cout << "DENIT: " << _soilOrganic.get_ActDenitrificationRate(layer) << endl;
      sum+=_soilOrganic.get_ActDenitrificationRate(layer);
    }

    return sum;
  };

  var addDailySumFertiliser = function (amount) {
    _dailySumFertiliser += amount;
    _sumFertiliser += amount;
  };

  return {
      dataAccessor: function() {
        return _dataAccessor;
      },
      currentStepNo: function() {
        return _currentStepNo;
      },
      cropGrowth: this.cropGrowth,
      generalStep: generalStep,
      cropStep: cropStep,
      CO2ForDate: CO2ForDate,
      GroundwaterDepthForDate: GroundwaterDepthForDate,
      //! seed given crop
      seedCrop: seedCrop,
      //! what crop is currently seeded ?
      currentCrop: function () {
        return _currentCrop;
      },
      isCropPlanted: function () {
        return _currentCrop && _currentCrop.isValid();
      },
      //! harvest the currently seeded crop
      harvestCurrentCrop: harvestCurrentCrop,
      incorporateCurrentCrop: incorporateCurrentCrop,
      applyMineralFertiliser: applyMineralFertiliser,
      applyOrganicFertiliser: applyOrganicFertiliser,
      useNMinMineralFertilisingMethod: function () {
        return _env.useNMinMineralFertilisingMethod;
      },
      applyMineralFertiliserViaNMinMethod: applyMineralFertiliserViaNMinMethod,
      dailySumFertiliser: function () { 
        return _dailySumFertiliser; 
      },
      addDailySumFertiliser: addDailySumFertiliser,
      dailySumIrrigationWater: function () { 
        return _dailySumIrrigationWater; 
      },
      addDailySumIrrigationWater: function (amount) {
        _dailySumIrrigationWater += amount;
      },
      sumFertiliser: function () { 
        return _sumFertiliser; 
      },
      resetFertiliserCounter: function () { 
        _sumFertiliser = 0;
      },
      resetDailyCounter: function () {
        _dailySumIrrigationWater = 0.0;
        _dailySumFertiliser = 0.0;
      },
      applyIrrigation: applyIrrigation,
      applyTillage: applyTillage,
      get_AtmosphericCO2Concentration: function () {
        return that.vw_AtmosphericCO2Concentration;
      },
      get_GroundwaterDepth: function () { 
        return that.vs_GroundwaterDepth; 
      },
      writeOutputFiles: function () {
        return centralParameterProvider.writeOutputFiles;
      },
      avgCorg: avgCorg,
      mean90cmWaterContent: mean90cmWaterContent,
      meanWaterContent: meanWaterContent,
      sumNmin: sumNmin,
      groundWaterRecharge: groundWaterRecharge,
      nLeaching: nLeaching,
      sumSoilTemperature: sumSoilTemperature,
      sumNO3AtDay: sumNO3AtDay,
      maxSnowDepth: maxSnowDepth,
      accumulatedSnowDepth: accumulatedSnowDepth,
      accumulatedFrostDepth: accumulatedFrostDepth,
      avg30cmSoilTemperature: avg30cmSoilTemperature,
      avgSoilMoisture: avgSoilMoisture,
      avgCapillaryRise: avgCapillaryRise,
      avgPercolationRate: avgPercolationRate,
      sumSurfaceRunOff: sumSurfaceRunOff,
      surfaceRunoff: surfaceRunoff,
      getEvapotranspiration: getEvapotranspiration,
      getTranspiration: getTranspiration,
      getEvaporation: getEvaporation,
      get_sum30cmSMB_CO2EvolutionRate: get_sum30cmSMB_CO2EvolutionRate,
      getNH3Volatilised: getNH3Volatilised,
      getSumNH3Volatilised: getSumNH3Volatilised,
      getsum30cmActDenitrificationRate: getsum30cmActDenitrificationRate,
      getETa: getETa,
      vw_AtmosphericCO2Concentration: this.vw_AtmosphericCO2Concentration,
      vs_GroundwaterDepth: this.vs_GroundwaterDepth,
      /**
       * @brief Returns soil temperature
       * @return temperature
       */
      soilTemperature: function () { return _soilTemperature; },
      /**
       * @brief Returns soil moisture.
       * @return Moisture
       */
      soilMoisture: function () { return _soilMoisture; },

      /**
       * @brief Returns soil organic mass.
       * @return soil organic
       */
      soilOrganic: function () { return _soilOrganic; },

      /**
       * @brief Returns soil transport
       * @return soil transport
       */
      soilTransport: function () { return _soilTransport; },

      /**
       * @brief Returns soil column
       * @return soil column
       */
      soilColumn: function () { return _soilColumn; },

      soilColumnNC: function () { return _soilColumn; },

      /**
       * @brief Returns net radiation.
       * @param globrad
       * @return radiation
       */
      netRadiation: function (globrad) { return globrad * (1 - _env.albedo); },
      daysWithCrop: function () {return p_daysWithCrop; },
      getAccumulatedNStress: function () { return p_accuNStress; },
      getAccumulatedWaterStress: function () { return p_accuWaterStress; },
      getAccumulatedHeatStress: function () { return p_accuHeatStress; },
      getAccumulatedOxygenStress: function () { return p_accuOxygenStress; }
  };

};

/*
  Database queries to load parameters form monica.sqlite. Assume db object is globally available.
  Queries originally from monica-parameters.cpp.

  TODO: test
    - Monica::soilParametersFromHermesFile
    - Monica::soilCharacteristicsKA5 
    - indexOf is case sensitive but sql not, sqlite.js returns the column as it is in the db (upper or lower case)
*/

var getCropParameters = function (cropId) {

  var cps = new CropParameters();

  var res = db.exec(
   "SELECT id, name, perennial, max_assimilation_rate, \
    carboxylation_pathway, minimum_temperature_for_assimilation, \
    crop_specific_max_rooting_depth, min_n_content, \
    n_content_pn, n_content_b0, \
    n_content_above_ground_biomass, n_content_root, initial_kc_factor, \
    development_acceleration_by_nitrogen_stress, fixing_n, \
    luxury_n_coeff, max_crop_height, residue_n_ratio, \
    sampling_depth, target_n_sampling_depth, target_n30, \
    default_radiation_use_efficiency, crop_height_P1, crop_height_P2, \
    stage_at_max_height, max_stem_diameter, stage_at_max_diameter, \
    heat_sum_irrigation_start, heat_sum_irrigation_end, \
    max_N_uptake_p, root_distribution_p, plant_density, \
    root_growth_lag, min_temperature_root_growth, initial_rooting_depth, \
    root_penetration_rate, root_form_factor, specific_root_length, \
    stage_after_cut, crit_temperature_heat_stress, \
    lim_temperature_heat_stress, begin_sensitive_phase_heat_stress, \
    end_sensitive_phase_heat_stress, drought_impact_on_fertility_factor, \
    cutting_delay_days, field_condition_modifier, assimilate_reallocation \
    FROM crop \
    WHERE id = " + cropId
  );

  if (res[0].values.length != 1)
    throw 'cropId (' + cropId + ') not available in table crop'; 

  var columns = res[0].columns;
  var row = res[0].values[0]; // only one row

  cps.pc_CropName = row[columns.indexOf('name')];
  cps.pc_MaxAssimilationRate = row[columns.indexOf('max_assimilation_rate')];
  cps.pc_CarboxylationPathway = row[columns.indexOf('carboxylation_pathway')];
  cps.pc_MinimumTemperatureForAssimilation = row[columns.indexOf('minimum_temperature_for_assimilation')];
  cps.pc_CropSpecificMaxRootingDepth = row[columns.indexOf('crop_specific_max_rooting_depth')];
  cps.pc_MinimumNConcentration = row[columns.indexOf('min_n_content')];
  cps.pc_NConcentrationPN = row[columns.indexOf('n_content_pn')];
  cps.pc_NConcentrationB0 = row[columns.indexOf('n_content_b0')];
  cps.pc_NConcentrationAbovegroundBiomass = row[columns.indexOf('n_content_above_ground_biomass')];
  cps.pc_NConcentrationRoot = row[columns.indexOf('n_content_root')];
  cps.pc_InitialKcFactor = row[columns.indexOf('initial_kc_factor')];
  cps.pc_DevelopmentAccelerationByNitrogenStress = row[columns.indexOf('development_acceleration_by_nitrogen_stress')];
  cps.pc_FixingN = row[columns.indexOf('fixing_n')];
  cps.pc_LuxuryNCoeff = row[columns.indexOf('luxury_n_coeff')];
  cps.pc_MaxCropHeight = row[columns.indexOf('max_crop_height')];
  cps.pc_ResidueNRatio = row[columns.indexOf('residue_n_ratio')];
  cps.pc_SamplingDepth = row[columns.indexOf('sampling_depth')];
  cps.pc_TargetNSamplingDepth = row[columns.indexOf('target_n_sampling_depth')];
  cps.pc_TargetN30 = row[columns.indexOf('target_n30')];
  cps.pc_DefaultRadiationUseEfficiency = row[columns.indexOf('default_radiation_use_efficiency')];
  cps.pc_CropHeightP1 = row[columns.indexOf('crop_height_P1')];
  cps.pc_CropHeightP2 = row[columns.indexOf('crop_height_P2')];
  cps.pc_StageAtMaxHeight = row[columns.indexOf('stage_at_max_height')];
  cps.pc_MaxCropDiameter = row[columns.indexOf('max_stem_diameter')];
  cps.pc_StageAtMaxDiameter = row[columns.indexOf('stage_at_max_diameter')];
  cps.pc_HeatSumIrrigationStart = row[columns.indexOf('heat_sum_irrigation_start')];
  cps.pc_HeatSumIrrigationEnd = row[columns.indexOf('heat_sum_irrigation_end')];
  cps.pc_MaxNUptakeParam = row[columns.indexOf('max_N_uptake_p')];
  cps.pc_RootDistributionParam = row[columns.indexOf('root_distribution_p')];
  cps.pc_PlantDensity = row[columns.indexOf('plant_density')];
  cps.pc_RootGrowthLag = row[columns.indexOf('root_growth_lag')];
  cps.pc_MinimumTemperatureRootGrowth = row[columns.indexOf('min_temperature_root_growth')];
  cps.pc_InitialRootingDepth = row[columns.indexOf('initial_rooting_depth')];
  cps.pc_RootPenetrationRate = row[columns.indexOf('root_penetration_rate')];
  cps.pc_RootFormFactor = row[columns.indexOf('root_form_factor')];
  cps.pc_SpecificRootLength = row[columns.indexOf('specific_root_length')];
  cps.pc_StageAfterCut = row[columns.indexOf('stage_after_cut')];
  cps.pc_CriticalTemperatureHeatStress = row[columns.indexOf('crit_temperature_heat_stress')];
  cps.pc_LimitingTemperatureHeatStress = row[columns.indexOf('lim_temperature_heat_stress')];
  cps.pc_BeginSensitivePhaseHeatStress = row[columns.indexOf('begin_sensitive_phase_heat_stress')];
  cps.pc_EndSensitivePhaseHeatStress = row[columns.indexOf('end_sensitive_phase_heat_stress')];
  cps.pc_DroughtImpactOnFertilityFactor = row[columns.indexOf('drought_impact_on_fertility_factor')];
  cps.pc_CuttingDelayDays = row[columns.indexOf('cutting_delay_days')];
  cps.pc_FieldConditionModifier = row[columns.indexOf('field_condition_modifier')];


  var res = db.exec(
   "SELECT o.crop_id, o.id, o.initial_organ_biomass, \
    o.organ_maintainance_respiration, o.is_above_ground, \
    o.organ_growth_respiration, o.is_storage_organ \
    FROM organ as o inner join crop as c on c.id = o.crop_id \
    WHERE crop_id = " + cropId + " \
    ORDER BY o.crop_id, c.id"
  );

  if (res[0].values.length === 0)
    throw 'cropId (' + cropId + ') not available in table organ'; 

  var columns = res[0].columns;
  var rows = res[0].values;

  for (var r = 0, rs = rows.length; r < rs; r++) {

      var row = rows[r];

      cps.pc_NumberOfOrgans++;
      cps.pc_InitialOrganBiomass.push(row[columns.indexOf('initial_organ_biomass')]);
      cps.pc_OrganMaintenanceRespiration.push(row[columns.indexOf('organ_maintainance_respiration')]);
      cps.pc_AbovegroundOrgan.push(row[columns.indexOf('is_above_ground')] == 1); /* db value might be bool or int */
      cps.pc_OrganGrowthRespiration.push(row[columns.indexOf('organ_growth_respiration')]);
      cps.pc_StorageOrgan.push(row[columns.indexOf('is_storage_organ')] == 1); /* db value might be bool or int */

  }

  var res = db.exec(
   "SELECT id, stage_temperature_sum, \
    base_temperature, opt_temperature, vernalisation_requirement, \
    day_length_requirement, base_day_length, \
    drought_stress_threshold, critical_oxygen_content, \
    specific_leaf_area, stage_max_root_n_content, \
    stage_kc_factor \
    FROM dev_stage \
    WHERE crop_id = " + cropId + " \
    order by id"
  );

  if (res[0].values.length === 0)
    throw 'cropId (' + cropId + ') not available in table dev_stage'; 

  var columns = res[0].columns;
  var rows = res[0].values;

  for (var r = 0, rs = rows.length; r < rs; r++) {
  
    var row = rows[r];      

    cps.pc_NumberOfDevelopmentalStages++;
    cps.pc_StageTemperatureSum.push(row[columns.indexOf('stage_temperature_sum')]);
    cps.pc_BaseTemperature.push(row[columns.indexOf('base_temperature')]);
    cps.pc_OptimumTemperature.push(row[columns.indexOf('opt_temperature')]);
    cps.pc_VernalisationRequirement.push(row[columns.indexOf('vernalisation_requirement')]);
    cps.pc_DaylengthRequirement.push(row[columns.indexOf('day_length_requirement')]);
    cps.pc_BaseDaylength.push(row[columns.indexOf('base_day_length')]);
    cps.pc_DroughtStressThreshold.push(row[columns.indexOf('drought_stress_threshold')]);
    cps.pc_CriticalOxygenContent.push(row[columns.indexOf('critical_oxygen_content')]);
    cps.pc_SpecificLeafArea.push(row[columns.indexOf('specific_leaf_area')]);
    cps.pc_StageMaxRootNConcentration.push(row[columns.indexOf('stage_max_root_n_content')]);
    cps.pc_StageKcFactor.push(row[columns.indexOf('stage_kc_factor')]);

  }

  cps.resizeStageOrganVectors();

  var res = db.exec(
   "SELECT crop_id, organ_id, dev_stage_id, \
    ods_dependent_param_id, value \
    FROM crop2ods_dependent_param \
    WHERE crop_id = " + cropId + " \
    ORDER BY crop_id, ods_dependent_param_id, dev_stage_id, organ_id"
  );

  var columns = res[0].columns;
  var rows = res[0].values;

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];

    var ods_dependent_param_id = row[columns.indexOf('ods_dependent_param_id')];
    var dev_stage_id = row[columns.indexOf('dev_stage_id')];
    var organ_id = row[columns.indexOf('organ_id')];
    /* stage organ vectors */
    var sov = (ods_dependent_param_id === 1) ? cps.pc_AssimilatePartitioningCoeff : cps.pc_OrganSenescenceRate;

    sov[dev_stage_id - 1][organ_id - 1] = row[columns.indexOf('value')];

  }

  var res = db.exec(
   "SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    FROM yield_parts \
    WHERE crop_id = " + cropId
  );

  var columns = res[0].columns;
  var rows = res[0].values;

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];

    var organId = row[columns.indexOf('organ_id')];
    var percentage = row[columns.indexOf('percentage')] / 100.0;
    var yieldDryMatter = row[columns.indexOf('dry_matter')];

    if (row[columns.indexOf('is_primary')] == 1) /* db value might be bool or int */
      cps.organIdsForPrimaryYield.push(new YieldComponent(organId, percentage, yieldDryMatter));
    else
      cps.organIdsForSecondaryYield.push(new YieldComponent(organId, percentage, yieldDryMatter));

  }

  /* get cutting parts if there are some data available */
  var res = db.exec(
   "SELECT crop_id, organ_id, is_primary, percentage, dry_matter \
    FROM cutting_parts \
    WHERE crop_id = " + cropId
  );

  if (res.length > 0) {

    var columns = res[0].columns;
    var rows = res[0].values;

    for (var r = 0, rs = rows.length; r < rs; r++) {

      var row = rows[r];

      var organId = row[columns.indexOf('organ_id')];
      var percentage = row[columns.indexOf('percentage')] / 100.0;
      var yieldDryMatter = row[columns.indexOf('dry_matter')];

      // do not add cutting part organ id for sudan gras because they are already added
      if (cropId === 18)
        cps.organIdsForPrimaryYield.push(new YieldComponent(organId, percentage, yieldDryMatter));
      else
        cps.organIdsForCutting.push(new YieldComponent(organId, percentage, yieldDryMatter));

    }

  }

  return cps;
   
};


/**
 * @brief Reads mineral fertiliser parameters from monica DB
 * @param id of the fertiliser
 * @return mineral fertiliser parameters value object with values from database
 */
var getMineralFertiliserParameters = function (id) {

  var res = db.exec(
   "SELECT id, name, no3, nh4, carbamid \
    FROM mineral_fertilisers \
    WHERE id = " + id
  );

  if (res[0].values.length != 1)
    throw 'mineral fertiliser id (' + id + ') not available in table mineral_fertilisers';

  var columns = res[0].columns;
  var row = res[0].values[0]; /* one row */

  var name = row[columns.indexOf('name')];
  var carbamid = row[columns.indexOf('carbamid')];
  var no3 = row[columns.indexOf('no3')];
  var nh4 = row[columns.indexOf('nh4')];

  return new MineralFertiliserParameters(name, carbamid, no3, nh4);

};


/**
 * @brief Reads organic fertiliser parameters from monica DB
 * @param organ_fert_id ID of fertiliser
 * @return organic fertiliser parameters with values from database
 */
var getOrganicFertiliserParameters = function (id) {

  var res = db.exec(
   "SELECT om_type, dm, nh4_n, no3_n, nh2_n, k_slow, k_fast, part_s, part_f, cn_s, cn_f, smb_s, smb_f, id \
    FROM organic_fertiliser \
    WHERE id = " + id
  );

  if (res[0].values.length != 1)
    throw 'organic fertiliser id (' + id + ') not available in table organic_fertiliser';

  var columns = res[0].columns;
  var row = res[0].values[0]; /* one row */

  var omp = new OrganicMatterParameters();

  omp.name = row[columns.indexOf('om_type')];
  omp.vo_AOM_DryMatterContent = row[columns.indexOf('dm')];
  omp.vo_AOM_NH4Content = row[columns.indexOf('nh4_n')];
  omp.vo_AOM_NO3Content = row[columns.indexOf('no3_n')];
  omp.vo_AOM_CarbamidContent = row[columns.indexOf('nh2_n')];
  omp.vo_AOM_SlowDecCoeffStandard = row[columns.indexOf('k_slow')];
  omp.vo_AOM_FastDecCoeffStandard = row[columns.indexOf('k_fast')];
  omp.vo_PartAOM_to_AOM_Slow = row[columns.indexOf('part_s')];
  omp.vo_PartAOM_to_AOM_Fast = row[columns.indexOf('part_f')];
  omp.vo_CN_Ratio_AOM_Slow = row[columns.indexOf('cn_s')];
  omp.vo_CN_Ratio_AOM_Fast = row[columns.indexOf('cn_f')];
  omp.vo_PartAOM_Slow_to_SMB_Slow = row[columns.indexOf('smb_s')];
  omp.vo_PartAOM_Slow_to_SMB_Fast = row[columns.indexOf('smb_f')]; 

  return omp;

};


var getResidueParameters = function (cropId) {

  var res = db.exec(
   "SELECT residue_type, dm, nh4, no3, nh2, k_slow, k_fast, part_s, part_f, cn_s, cn_f, smb_s, smb_f, crop_id \
    FROM residue_table \
    WHERE crop_id = " + cropId
  );

  var columns = res[0].columns;
  var row = res[0].values[0]; /* one row */

  var rps = new OrganicMatterParameters();

  /* TODO: does any crop have a dataset in residue_table? */
  if (row) { 

    rps.name = row[columns.indexOf('residue_type')];
    rps.vo_AOM_DryMatterContent = row[columns.indexOf('dm')];
    rps.vo_AOM_NH4Content = row[columns.indexOf('nh4')];
    rps.vo_AOM_NO3Content = row[columns.indexOf('no3')];
    rps.vo_AOM_CarbamidContent = row[columns.indexOf('nh2')];
    rps.vo_AOM_SlowDecCoeffStandard = row[columns.indexOf('k_slow')];
    rps.vo_AOM_FastDecCoeffStandard = row[columns.indexOf('k_fast')];
    rps.vo_PartAOM_to_AOM_Slow = row[columns.indexOf('part_s')];
    rps.vo_PartAOM_to_AOM_Fast = row[columns.indexOf('part_f')];
    rps.vo_CN_Ratio_AOM_Slow = row[columns.indexOf('cn_s')];
    rps.vo_CN_Ratio_AOM_Fast = row[columns.indexOf('cn_f')];
    rps.vo_PartAOM_Slow_to_SMB_Slow = row[columns.indexOf('smb_s')];
    rps.vo_PartAOM_Slow_to_SMB_Fast = row[columns.indexOf('smb_f')];

  }  

  return rps;

};


var readCapillaryRiseRates = function () {

  var res = db.exec("SELECT soil_type, distance, capillary_rate FROM capillary_rise_rate");

  var columns = res[0].columns;
  var rows = res[0].values;

  var cap_rates = new CapillaryRiseRates();

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];
    
    var soil_type = row[columns.indexOf('soil_type')];
    var distance = row[columns.indexOf('distance')];
    var rate = row[columns.indexOf('capillary_rate')];

    cap_rates.addRate(soil_type, distance, rate);
  
  }  

  return cap_rates;

};

/* type is always MODE_HERMES */
var readUserParameterFromDatabase = function () {

  var res = db.exec("SELECT name, value_hermes FROM user_parameter");

  var columns = res[0].columns;
  var rows = res[0].values;
  
  var cpp = new CentralParameterProvider();

  var user_crops = cpp.userCropParameters;
  var user_env = cpp.userEnvironmentParameters;
  var user_soil_moisture = cpp.userSoilMoistureParameters;
  var user_soil_temperature = cpp.userSoilTemperatureParameters;
  var user_soil_transport = cpp.userSoilTransportParameters;
  var user_soil_organic = cpp.userSoilOrganicParameters;
  var user_init_values = cpp.userInitValues;

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];

    var name = row[columns.indexOf('NAME')];
    var value = row[columns.indexOf('VALUE_HERMES')];

    if (name == "tortuosity")
      user_crops.pc_Tortuosity = value;
    else if (name == "canopy_reflection_coefficient")
      user_crops.pc_CanopyReflectionCoefficient = value;
    else if (name == "reference_max_assimilation_rate")
      user_crops.pc_ReferenceMaxAssimilationRate = value;
    else if (name == "reference_leaf_area_index")
      user_crops.pc_ReferenceLeafAreaIndex = value;
    else if (name == "maintenance_respiration_parameter_2")
      user_crops.pc_MaintenanceRespirationParameter2 = value;
    else if (name == "maintenance_respiration_parameter_1")
      user_crops.pc_MaintenanceRespirationParameter1 = value;
    else if (name == "minimum_n_concentration_root")
      user_crops.pc_MinimumNConcentrationRoot = value;
    else if (name == "minimum_available_n")
      user_crops.pc_MinimumAvailableN = value;
    else if (name == "reference_albedo")
      user_crops.pc_ReferenceAlbedo = value;
    else if (name == "stomata_conductance_alpha")
      user_crops.pc_StomataConductanceAlpha = value;
    else if (name == "saturation_beta")
      user_crops.pc_SaturationBeta = value;
    else if (name == "growth_respiration_redux")
      user_crops.pc_GrowthRespirationRedux = value;
    else if (name == "max_crop_n_demand")
      user_crops.pc_MaxCropNDemand = value;
    else if (name == "growth_respiration_parameter_2")
      user_crops.pc_GrowthRespirationParameter2 = value;
    else if (name == "growth_respiration_parameter_1")
      user_crops.pc_GrowthRespirationParameter1 = value;
    else if (name == "use_automatic_irrigation")
      user_env.p_UseAutomaticIrrigation = (value == 1); /* db value might be bool or int */
    else if (name == "use_nmin_mineral_fertilising_method")
      user_env.p_UseNMinMineralFertilisingMethod = (value == 1); /* db value might be bool or int */
    else if (name == "layer_thickness")
      user_env.p_LayerThickness = value;
    else if (name == "number_of_layers")
      user_env.p_NumberOfLayers = value;
    else if (name == "start_pv_index")
      user_env.p_StartPVIndex = value;
    else if (name == "albedo")
      user_env.p_Albedo = value;
    else if (name == "athmospheric_co2")
      user_env.p_AthmosphericCO2 = value;
    else if (name == "wind_speed_height")
      user_env.p_WindSpeedHeight = value;
    else if (name == "use_secondary_yields")
      user_env.p_UseSecondaryYields = (value == 1); /* db value might be bool or int */
    else if (name == "julian_day_automatic_fertilising")
      user_env.p_JulianDayAutomaticFertilising = value;
    else if (name == "critical_moisture_depth")
      user_soil_moisture.pm_CriticalMoistureDepth = value;
    else if (name == "saturated_hydraulic_conductivity")
      user_soil_moisture.pm_SaturatedHydraulicConductivity = value;
    else if (name == "surface_roughness")
      user_soil_moisture.pm_SurfaceRoughness = value;
    else if (name == "hydraulic_conductivity_redux")
      user_soil_moisture.pm_HydraulicConductivityRedux = value;
    else if (name == "snow_accumulation_treshold_temperature")
      user_soil_moisture.pm_SnowAccumulationTresholdTemperature = value;
    else if (name == "kc_factor")
      user_soil_moisture.pm_KcFactor = value;
    else if (name == "time_step")
      user_env.p_timeStep = value;
    else if (name == "temperature_limit_for_liquid_water")
      user_soil_moisture.pm_TemperatureLimitForLiquidWater = value;
    else if (name == "correction_snow")
      user_soil_moisture.pm_CorrectionSnow = value;
    else if (name == "correction_rain")
      user_soil_moisture.pm_CorrectionRain = value;
    else if (name == "snow_max_additional_density")
      user_soil_moisture.pm_SnowMaxAdditionalDensity = value;
    else if (name == "new_snow_density_min")
      user_soil_moisture.pm_NewSnowDensityMin = value;
    else if (name == "snow_retention_capacity_min")
      user_soil_moisture.pm_SnowRetentionCapacityMin = value;
    else if (name == "refreeze_parameter_2")
      user_soil_moisture.pm_RefreezeParameter2 = value;
    else if (name == "refreeze_parameter_1")
      user_soil_moisture.pm_RefreezeParameter1 = value;
    else if (name == "refreeze_temperature")
      user_soil_moisture.pm_RefreezeTemperature = value;
    else if (name == "snowmelt_temperature")
      user_soil_moisture.pm_SnowMeltTemperature = value;
    else if (name == "snow_packing")
      user_soil_moisture.pm_SnowPacking = value;
    else if (name == "snow_retention_capacity_max")
      user_soil_moisture.pm_SnowRetentionCapacityMax = value;
    else if (name == "evaporation_zeta")
      user_soil_moisture.pm_EvaporationZeta = value;
    else if (name == "xsa_critical_soil_moisture")
      user_soil_moisture.pm_XSACriticalSoilMoisture = value;
    else if (name == "maximum_evaporation_impact_depth")
      user_soil_moisture.pm_MaximumEvaporationImpactDepth = value;
    else if (name == "ntau")
      user_soil_temperature.pt_NTau = value;
    else if (name == "initial_surface_temperature")
      user_soil_temperature.pt_InitialSurfaceTemperature = value;
    else if (name == "base_temperature")
      user_soil_temperature.pt_BaseTemperature = value;
    else if (name == "quartz_raw_density")
      user_soil_temperature.pt_QuartzRawDensity = value;
    else if (name == "density_air")
      user_soil_temperature.pt_DensityAir = value;
    else if (name == "density_water")
      user_soil_temperature.pt_DensityWater = value;
    else if (name == "specific_heat_capacity_air")
      user_soil_temperature.pt_SpecificHeatCapacityAir = value;
    else if (name == "specific_heat_capacity_quartz")
      user_soil_temperature.pt_SpecificHeatCapacityQuartz = value;
    else if (name == "specific_heat_capacity_water")
      user_soil_temperature.pt_SpecificHeatCapacityWater = value;
    else if (name == "soil_albedo")
      user_soil_temperature.pt_SoilAlbedo = value;
    else if (name == "dispersion_length")
      user_soil_transport.pq_DispersionLength = value;
    else if (name == "AD")
      user_soil_transport.pq_AD = value;
    else if (name == "diffusion_coefficient_standard")
      user_soil_transport.pq_DiffusionCoefficientStandard = value;
    else if (name == "leaching_depth")
      user_env.p_LeachingDepth = value;
    else if (name == "groundwater_discharge")
      user_soil_moisture.pm_GroundwaterDischarge = value;
    else if (name == "density_humus")
      user_soil_temperature.pt_DensityHumus = value;
    else if (name == "specific_heat_capacity_humus")
      user_soil_temperature.pt_SpecificHeatCapacityHumus = value;
    else if (name == "max_percolation_rate")
      user_soil_moisture.pm_MaxPercolationRate = value;
    else if (name == "max_groundwater_depth")
      user_env.p_MaxGroundwaterDepth = value;
    else if (name == "min_groundwater_depth")
      user_env.p_MinGroundwaterDepth = value;
    else if (name == "min_groundwater_depth_month")
      user_env.p_MinGroundwaterDepthMonth = value;
    else if (name == "SOM_SlowDecCoeffStandard")
      user_soil_organic.po_SOM_SlowDecCoeffStandard = value;
    else if (name == "SOM_FastDecCoeffStandard")
      user_soil_organic.po_SOM_FastDecCoeffStandard = value;
    else if (name == "SMB_SlowMaintRateStandard")
      user_soil_organic.po_SMB_SlowMaintRateStandard = value;
    else if (name == "SMB_FastMaintRateStandard")
      user_soil_organic.po_SMB_FastMaintRateStandard = value;
    else if (name == "SMB_SlowDeathRateStandard")
      user_soil_organic.po_SMB_SlowDeathRateStandard = value;
    else if (name == "SMB_FastDeathRateStandard")
      user_soil_organic.po_SMB_FastDeathRateStandard = value;
    else if (name == "SMB_UtilizationEfficiency")
      user_soil_organic.po_SMB_UtilizationEfficiency = value;
    else if (name == "SOM_SlowUtilizationEfficiency")
      user_soil_organic.po_SOM_SlowUtilizationEfficiency = value;
    else if (name == "SOM_FastUtilizationEfficiency")
      user_soil_organic.po_SOM_FastUtilizationEfficiency = value;
    else if (name == "AOM_SlowUtilizationEfficiency")
      user_soil_organic.po_AOM_SlowUtilizationEfficiency = value;
    else if (name == "AOM_FastUtilizationEfficiency")
      user_soil_organic.po_AOM_FastUtilizationEfficiency = value;
    else if (name == "AOM_FastMaxC_to_N")
      user_soil_organic.po_AOM_FastMaxC_to_N = value;
    else if (name == "PartSOM_Fast_to_SOM_Slow")
      user_soil_organic.po_PartSOM_Fast_to_SOM_Slow = value;
    else if (name == "PartSMB_Slow_to_SOM_Fast")
      user_soil_organic.po_PartSMB_Slow_to_SOM_Fast = value;
    else if (name == "PartSMB_Fast_to_SOM_Fast")
      user_soil_organic.po_PartSMB_Fast_to_SOM_Fast = value;
    else if (name == "PartSOM_to_SMB_Slow")
      user_soil_organic.po_PartSOM_to_SMB_Slow = value;
    else if (name == "PartSOM_to_SMB_Fast")
      user_soil_organic.po_PartSOM_to_SMB_Fast = value;
    else if (name == "CN_Ratio_SMB")
      user_soil_organic.po_CN_Ratio_SMB = value;
    else if (name == "LimitClayEffect")
      user_soil_organic.po_LimitClayEffect = value;
    else if (name == "AmmoniaOxidationRateCoeffStandard")
      user_soil_organic.po_AmmoniaOxidationRateCoeffStandard = value;
    else if (name == "NitriteOxidationRateCoeffStandard")
      user_soil_organic.po_NitriteOxidationRateCoeffStandard = value;
    else if (name == "TransportRateCoeff")
      user_soil_organic.po_TransportRateCoeff = value;
    else if (name == "SpecAnaerobDenitrification")
      user_soil_organic.po_SpecAnaerobDenitrification = value;
    else if (name == "ImmobilisationRateCoeffNO3")
      user_soil_organic.po_ImmobilisationRateCoeffNO3 = value;
    else if (name == "ImmobilisationRateCoeffNH4")
      user_soil_organic.po_ImmobilisationRateCoeffNH4 = value;
    else if (name == "Denit1")
      user_soil_organic.po_Denit1 = value;
    else if (name == "Denit2")
      user_soil_organic.po_Denit2 = value;
    else if (name == "Denit3")
      user_soil_organic.po_Denit3 = value;
    else if (name == "HydrolysisKM")
      user_soil_organic.po_HydrolysisKM = value;
    else if (name == "ActivationEnergy")
      user_soil_organic.po_ActivationEnergy = value;
    else if (name == "HydrolysisP1")
      user_soil_organic.po_HydrolysisP1 = value;
    else if (name == "HydrolysisP2")
      user_soil_organic.po_HydrolysisP2 = value;
    else if (name == "AtmosphericResistance")
      user_soil_organic.po_AtmosphericResistance = value;
    else if (name == "N2OProductionRate")
      user_soil_organic.po_N2OProductionRate = value;
    else if (name == "Inhibitor_NH3")
      user_soil_organic.po_Inhibitor_NH3 = value;

    cpp.capillaryRiseRates = readCapillaryRiseRates();
  }

  return cpp;

};

var soilCharacteristicsKA5 = function (soilParameter) {

  logger(MSG.INFO, "soilCharacteristicsKA5");

  var texture = soilParameter.vs_SoilTexture;
  var stoneContent = soilParameter.vs_SoilStoneContent;

  var fc = 0.0;
  var sat = 0.0;
  var pwp = 0.0;

  if (texture != "") {
    var srd = soilParameter.vs_SoilRawDensity() / 1000.0; // [kg m-3] -> [g cm-3]
    var som = soilParameter.vs_SoilOrganicMatter() * 100.0; // [kg kg-1] -> [%]

    // ***************************************************************************
    // *** The following boundaries are extracted from:                        ***
    // *** Wessolek, G., M. Kaupenjohann, M. Renger (2009) Bodenphysikalische  ***
    // *** Kennwerte und Berechnungsverfahren für die Praxis. Bodenökologie    ***
    // *** und Bodengenese 40, Selbstverlag Technische Universität Berlin      ***
    // *** (Tab. 4).                                                           ***
    // ***************************************************************************

    var srd_lowerBound = 0.0;
    var srd_upperBound = 0.0;
    if (srd < 1.1) {
      srd_lowerBound = 1.1;
      srd_upperBound = 1.1;
    }
    else if ((srd >= 1.1) && (srd < 1.3)) {
      srd_lowerBound = 1.1;
      srd_upperBound = 1.3;
    }
    else if ((srd >= 1.3) && (srd < 1.5)) {
      srd_lowerBound = 1.3;
      srd_upperBound = 1.5;
    }
    else if ((srd >= 1.5) && (srd < 1.7)) {
      srd_lowerBound = 1.5;
      srd_upperBound = 1.7;
    }
    else if ((srd >= 1.7) && (srd < 1.9)) {
      srd_lowerBound = 1.7;
      srd_upperBound = 1.9;
    }
    else if (srd >= 1.9) {
      srd_lowerBound = 1.9;
      srd_upperBound = 1.9;
    }

    // special treatment for "torf" soils
    if (texture == "Hh" || texture == "Hn") {
        srd_lowerBound = -1;
        srd_upperBound = -1;
    }

    // Boundaries for linear interpolation
    var lbRes = readPrincipalSoilCharacteristicData(texture, srd_lowerBound);
    var sat_lowerBound = lbRes.sat;
    var fc_lowerBound = lbRes.fc;
    var pwp_lowerBound = lbRes.pwp;

    var ubRes = readPrincipalSoilCharacteristicData(texture, srd_upperBound);
    var sat_upperBound = ubRes.sat;
    var fc_upperBound = ubRes.fc;
    var pwp_upperBound = ubRes.pwp;

    if(lbRes.initialized && ubRes.initialized) {
      //    cout << "Soil Raw Density:\t" << vs_SoilRawDensity << endl;
      //    cout << "Saturation:\t\t" << vs_SaturationLowerBoundary << "\t" << vs_SaturationUpperBoundary << endl;
      //    cout << "Field Capacity:\t" << vs_FieldCapacityLowerBoundary << "\t" << vs_FieldCapacityUpperBoundary << endl;
      //    cout << "PermanentWP:\t" << vs_PermanentWiltingPointLowerBoundary << "\t" << vs_PermanentWiltingPointUpperBoundary << endl;
      //    cout << "Soil Organic Matter:\t" << vs_SoilOrganicMatter << endl;

      // ***************************************************************************
      // *** The following boundaries are extracted from:                        ***
      // *** Wessolek, G., M. Kaupenjohann, M. Renger (2009) Bodenphysikalische  ***
      // *** Kennwerte und Berechnungsverfahren für die Praxis. Bodenökologie    ***
      // *** und Bodengenese 40, Selbstverlag Technische Universität Berlin      ***
      // *** (Tab. 5).                                                           ***
      // ***************************************************************************

      var som_lowerBound = 0.0;
      var som_upperBound = 0.0;

      if(som >= 0.0 && som < 1.0) {
        som_lowerBound = 0.0;
        som_upperBound = 0.0;
      }
      else if(som >= 1.0 && som < 1.5) {
        som_lowerBound = 0.0;
        som_upperBound = 1.5;
      }
      else if(som >= 1.5 && som < 3.0) {
        som_lowerBound = 1.5;
        som_upperBound = 3.0;
      }
      else if(som >= 3.0 && som < 6.0) {
        som_lowerBound = 3.0;
        som_upperBound = 6.0;
      }
      else if(som >= 6.0 && som < 11.5) {
        som_lowerBound = 6.0;
        som_upperBound = 11.5;
      }
      else if(som >= 11.5) {
        som_lowerBound = 11.5;
        som_upperBound = 11.5;
      }

      // special treatment for "torf" soils
      if (texture == "Hh" || texture == "Hn") {
        som_lowerBound = 0.0;
        som_upperBound = 0.0;
      }

      // Boundaries for linear interpolation
      var fc_mod_lowerBound = 0.0;
      var sat_mod_lowerBound = 0.0;
      var pwp_mod_lowerBound = 0.0;
      // modifier values are given only for organic matter > 1.0% (class h2)
      if (som_lowerBound != 0.0) {
        var lbRes = readSoilCharacteristicModifier(texture, som_lowerBound);
        sat_mod_lowerBound = lbRes.sat;
        fc_mod_lowerBound = lbRes.fc;
        pwp_mod_lowerBound = lbRes.pwp;
      }

      var fc_mod_upperBound = 0.0;
      var sat_mod_upperBound = 0.0;
      var pwp_mod_upperBound = 0.0;
      if (som_upperBound != 0.0) {
        var ubRes = readSoilCharacteristicModifier(texture, som_upperBound);
        sat_mod_upperBound = ubRes.sat;
        fc_mod_upperBound = ubRes.fc;
        pwp_mod_upperBound = ubRes.pwp;
      }

//      cout << "Saturation-Modifier:\t" << sat_mod_lowerBound << "\t" << sat_mod_upperBound << endl;
//      cout << "Field capacity-Modifier:\t" << fc_mod_lowerBound << "\t" << fc_mod_upperBound << endl;
//      cout << "PWP-Modifier:\t" << pwp_mod_lowerBound << "\t" << pwp_mod_upperBound << endl;

      // Linear interpolation
      var fc_unmod = fc_lowerBound;
      if (fc_upperBound < 0.5 && fc_lowerBound >= 1.0)
        fc_unmod = fc_lowerBound;
      else if(fc_lowerBound < 0.5 && fc_upperBound >= 1.0)
        fc_unmod = fc_upperBound;
      else if(srd_upperBound != srd_lowerBound)
        fc_unmod = (srd - srd_lowerBound)/
                   (srd_upperBound - srd_lowerBound)*
                   (fc_upperBound - fc_lowerBound) + fc_lowerBound;

      var sat_unmod = sat_lowerBound;
      if(sat_upperBound < 0.5 && sat_lowerBound >= 1.0)
        sat_unmod = sat_lowerBound;
      else if(sat_lowerBound < 0.5 && sat_upperBound >= 1.0)
        sat_unmod = sat_upperBound;
      else if(srd_upperBound != srd_lowerBound)
        sat_unmod = (srd - srd_lowerBound)/
                    (srd_upperBound - srd_lowerBound)*
                    (sat_upperBound - sat_lowerBound) + sat_lowerBound;

      var pwp_unmod = pwp_lowerBound;
      if(pwp_upperBound < 0.5 && pwp_lowerBound >= 1.0)
        pwp_unmod = pwp_lowerBound;
      else if(pwp_lowerBound < 0.5 && pwp_upperBound >= 1.0)
        pwp_unmod = pwp_upperBound;
      else if(srd_upperBound != srd_lowerBound)
        pwp_unmod = (srd - srd_lowerBound)/
                    (srd_upperBound - srd_lowerBound)*
                    (pwp_upperBound - pwp_lowerBound) + pwp_lowerBound;

      //in this case upper and lower boundary are equal, so doesn't matter.
      var fc_mod = fc_mod_lowerBound;
      var sat_mod = sat_mod_lowerBound;
      var pwp_mod = pwp_mod_lowerBound;
      if(som_upperBound != som_lowerBound) {
        fc_mod = (som - som_lowerBound)/
                 (som_upperBound - som_lowerBound)*
                 (fc_mod_upperBound - fc_mod_lowerBound) + fc_mod_lowerBound;

        sat_mod = (som - som_lowerBound)/
                  (som_upperBound - som_lowerBound)*
                  (sat_mod_upperBound - sat_mod_lowerBound) + sat_mod_lowerBound;

        pwp_mod = (som - som_lowerBound)/
                  (som_upperBound - som_lowerBound)*
                  (pwp_mod_upperBound - pwp_mod_lowerBound) + pwp_mod_lowerBound;
      }

      // Modifying the principal values by organic matter
      fc = (fc_unmod + fc_mod)/100.0; // [m3 m-3]
      sat = (sat_unmod + sat_mod)/100.0; // [m3 m-3]
      pwp = (pwp_unmod + pwp_mod)/100.0; // [m3 m-3]

      // Modifying the principal values by stone content
      fc *= (1.0 - stoneContent);
      sat *= (1.0 - stoneContent);
      pwp *= (1.0 - stoneContent);
    }
  }

  soilParameter.vs_FieldCapacity = fc;
  soilParameter.vs_Saturation = sat;
  soilParameter.vs_PermanentWiltingPoint = pwp;
};


var readPrincipalSoilCharacteristicData = function (soilType, rawDensity) {

  // C++
  // typedef map<int, RPSCDRes> M1;
  // typedef map<string, M1> M2;
  // static M2 m;

  var res = db.exec(
   "SELECT soil_type, soil_raw_density*10 AS soil_raw_density, air_capacity, field_capacity, n_field_capacity \
    FROM soil_characteristic_data \
    WHERE air_capacity != 0 AND field_capacity != 0 AND n_field_capacity != 0 \
    ORDER BY soil_type, soil_raw_density"
  );

  if (res[0].values.length < 1)
    throw 'soil_characteristic_data not available in monica.sqlite';  

  var columns = res[0].columns;
  var rows = res[0].values;

  var m = {};

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];

    if (row[columns.indexOf('soil_type')] === soilType) {

      var ac = row[columns.indexOf('air_capacity')];
      var fc = row[columns.indexOf('field_capacity')];
      var nfc = row[columns.indexOf('n_field_capacity')];

      var rp = new RPSCDRes(true);
      rp.sat = ac + fc;
      rp.fc = fc;
      rp.pwp = fc - nfc;

      if (m[soilType] === undefined)
        m[soilType] = {};

      m[soilType][int(row[columns.indexOf('soil_raw_density')])] = rp;

    }
  }

  var rd10 = int(rawDensity * 10);
  if (m[soilType][rd10])
    return m[soilType][rd10];

  //if we didn't find values for a given raw density, e.g. 1.1 (= 11)
  //we try to find the closest next one (up (1.1) or down (1.9))
  while(!m[soilType][rd10] && (11 <= rd10 && rd10 <= 19))
    rd10 += (rd10 < 15) ? 1 : -1;

  return (m[soilType][rd10]) ? m[soilType][rd10] : new RPSCDRes();

};

var readSoilCharacteristicModifier = function (soilType, organicMatter) {

  // C++
  // typedef map<int, RPSCDRes> M1;
  // typedef map<string, M1> M2;
  // static M2 m;

  var res = db.exec(
   "SELECT soil_type, organic_matter*10 AS organic_matter, air_capacity, field_capacity, n_field_capacity \
    FROM soil_aggregation_values \
    ORDER BY soil_type, organic_matter"
  );

  if (res[0].values.length < 1)
    throw 'soil_aggregation_values not available in monica.sqlite';  

  var columns = res[0].columns;
  var rows = res[0].values;

  var m = {};

  for (var r = 0, rs = rows.length; r < rs; r++) {

    var row = rows[r];

    if (row[columns.indexOf('soil_type')] === soilType) {

      var ac = row[columns.indexOf('air_capacity')];
      var fc = row[columns.indexOf('field_capacity')];
      var nfc = row[columns.indexOf('n_field_capacity')];

      var rp = new RPSCDRes(true);
      rp.sat = ac + fc;
      rp.fc = fc;
      rp.pwp = fc - nfc;


      if (m[soilType] === undefined)
        m[soilType] = {};

      m[soilType][int(row[columns.indexOf('organic_matter')])] = rp;

    }
  }

  var rd10 = int(organicMatter * 10);

  return (m[soilType][rd10]) ? m[soilType][rd10] : new RPSCDRes();
  
};



var runMonica = function (env, progress_callback) {

  var res = { crops: [] };
  
  ResultId.forEach(function (id) {
    if (perCropResults.indexOf(id) === -1)
      res[id] = [];
  });

  if(env.cropRotation.length === 0) {
    logger(MSG.ERROR, "rotation is empty");
    return res;
  }

  logger(MSG.INFO, "starting monica");

  var write_output_files = (env.pathToOutputDir != null && !!fs);
  var foutFileName = env.pathToOutputDir + '/rmout.dat';
  var goutFileName = env.pathToOutputDir + '/smout.dat';
  var monicaParamFileName = env.pathToOutputDir + '/monica_parameters.txt';

  if (write_output_files) {
    // writes the header line to output files
    initializeFoutHeader(foutFileName);
    initializeGoutHeader(goutFileName);
    dumpMonicaParametersIntoFile(monicaParamFileName, env.centralParameterProvider);
  }

  //debug() << "MonicaModel" << endl;
  //debug() << env.toString();
  var model = new Model(env, env.da);
  var currentDate = env.da.startDate();
  var nods = env.da.noOfStepsPossible();

  var currentMonth = currentDate.getMonth();
  var dim = 0; //day in current month

  var avg10corg = 0, avg30corg = 0, watercontent = 0,
      groundwater = 0,  nLeaching= 0, yearly_groundwater=0,
      yearly_nleaching=0, monthSurfaceRunoff = 0.0;
  var monthPrecip = 0.0;
  var monthETa = 0.0;

  //iterator through the production processes
  var ppci = 0;
  //direct handle to current process
  var currentPP = env.cropRotation[ppci];
  //are the dates in the production process relative dates
  //or are they absolute as produced by the hermes inputs
  var useRelativeDates =  false;// currentPP.start().isRelativeDate();
  //the next application date, either a relative or an absolute date
  //to get the correct applications out of the production processes
  var nextPPApplicationDate = currentPP.start();

  //a definitely absolute next application date to keep track where
  //we are in the list of climate data
  var nextAbsolutePPApplicationDate =
      useRelativeDates ? nextPPApplicationDate.toAbsoluteDate
                         (currentDate.year() + 1) : nextPPApplicationDate;
  logger(MSG.INFO, "next app-date: " + nextPPApplicationDate.toString()
          + " next abs app-date: " + nextAbsolutePPApplicationDate.toString());

  //if for some reason there are no applications (no nothing) in the
  //production process: quit
  if(!nextAbsolutePPApplicationDate.isValid())
  {
    logger(MSG.ERROR, "start of production-process: " + currentPP.toString() + " is not valid");
    return res;
  }

  //beware: !!!! if there are absolute days used, then there is basically
  //no rotation if the last crop in the crop rotation has changed
  //the loop starts anew but the first crops date has already passed
  //so the crop won't be seeded again or any work applied
  //thus for absolute dates the crop rotation has to be as long as there
  //are climate data !!!!!

  for (var d = 0; d < nods; ++d, currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1), ++dim) {

    logger(MSG.INFO, "currentDate: " + currentDate.getDate() + "." + (currentDate.getMonth() + 1) + "." + currentDate.getFullYear());
    model.resetDailyCounter();

    // test if model's crop has been dying in previous step
    // if yes, it will be incorporated into soil
    if (model.cropGrowth() && model.cropGrowth().isDying()) {
        model.incorporateCurrentCrop();
    }

    //there's something to at this day
    if (nextAbsolutePPApplicationDate.setHours(0,0,0,0) == currentDate.setHours(0,0,0,0)) {

      logger(MSG.INFO, 
        " applying at: " + nextPPApplicationDate.toString() +
        " absolute-at: " + nextAbsolutePPApplicationDate.toString()
      );

      // store yields if cutting
      // debug('currentPP.getWorksteps()[0]', currentPP.getWorkstep(currentDate));
      // if (currentPP.getWorkstep(currentDate) instanceof Cutting && currentPP.getWorkstep(currentDate))
      //   res.crops.push(currentPP.cropResult());
      
      //apply everything to do at current day
      //cout << currentPP.toString() << endl;
      currentPP.apply(nextPPApplicationDate, model);

      //get the next application date to wait for (either absolute or relative)
      var prevPPApplicationDate = nextPPApplicationDate;

      nextPPApplicationDate =  currentPP.nextDate(nextPPApplicationDate);

      nextAbsolutePPApplicationDate =  useRelativeDates ? nextPPApplicationDate.toAbsoluteDate
          (currentDate.year() + (nextPPApplicationDate.dayOfYear() > prevPPApplicationDate.dayOfYear() ? 0 : 1),
           true) : nextPPApplicationDate;

      logger(MSG.INFO, 
        " next app-date: " + nextPPApplicationDate.toString() + 
        " next abs app-date: " + nextAbsolutePPApplicationDate.toString()
      );

      //if application date was not valid, we're (probably) at the end
      //of the application list of this production process
      //-> go to the next one in the crop rotation
      if(!nextAbsolutePPApplicationDate.isValid()) {
        
        //get yieldresults for crop
        res.crops.push(currentPP.cropResult());

        // if(!env.useSecondaryYields)
        //   res.crops[res.crops.length - 1]['secondaryYield'] = 0;
        // res.crops[res.crops.length - 1]['sumFertiliser'] = model.sumFertiliser();
        // res.crops[res.crops.length - 1]['daysWithCrop'] = model.daysWithCrop();
        // res.crops[res.crops.length - 1]['NStress'] = model.getAccumulatedNStress();
        // res.crops[res.crops.length - 1]['WaterStress'] = model.getAccumulatedWaterStress();
        // res.crops[res.crops.length - 1]['HeatStress'] = model.getAccumulatedHeatStress();
        // res.crops[res.crops.length - 1]['OxygenStress'] = model.getAccumulatedOxygenStress();

        //to count the applied fertiliser for the next production process
        model.resetFertiliserCounter();

        //resets crop values for use in next year
        currentPP.crop().reset();

        ppci++;

        //start anew if we reached the end of the crop rotation
        if(ppci == env.cropRotation.length)
          ppci = 0;

        currentPP = env.cropRotation[ppci];
        nextPPApplicationDate = currentPP.start();
        nextAbsolutePPApplicationDate =
            useRelativeDates ? nextPPApplicationDate.toAbsoluteDate
            (currentDate.year() + (nextPPApplicationDate.dayOfYear() > prevPPApplicationDate.dayOfYear() ? 0 : 1),
             true) : nextPPApplicationDate;

        logger(MSG.INFO, 
          " new valid next app-date: " + nextPPApplicationDate.toString() +
          " next abs app-date: " + nextAbsolutePPApplicationDate.toString()
        );
      }

      //if we got our next date relative it might be possible that
      //the actual relative date belongs into the next year
      //this is the case if we're already (dayOfYear) past the next dayOfYear
      if(useRelativeDates && currentDate > nextAbsolutePPApplicationDate)
        nextAbsolutePPApplicationDate.addYears(1);
    }
    // write simulation date to file
    if (write_output_files) {
        fs.appendFileSync(goutFileName, currentDate.toLocaleDateString(), { encoding: 'utf8' });
        fs.appendFileSync(foutFileName, currentDate.toLocaleDateString(), { encoding: 'utf8' });
    }

    // run crop step
    if(model.isCropPlanted()) {
      model.cropStep(d);
      // return;
    }

    // writes crop results to output file
    if (write_output_files)
      writeCropResults(model.cropGrowth(), foutFileName, goutFileName, model.isCropPlanted());
    
    /* if progress_callback is provided */
    if (progress_callback)
      progress_callback(currentDate, model);

    model.generalStep(d);

    // write special outputs at 31.03.
    if(currentDate.getDate() == 31 && currentDate.getMonth() == 3) {

      res['sum90cmYearlyNatDay'].push(fixed(10, model.sumNmin(0.9)));
      //      debug << "N at: " << model.sumNmin(0.9) << endl;
      res['sum30cmSoilTemperature'].push(fixed(10, model.sumSoilTemperature(3)));
      res['sum90cmYearlyNO3AtDay'].push(fixed(10, model.sumNO3AtDay(0.9)));
      res['avg30cmSoilTemperature'].push(fixed(10, model.avg30cmSoilTemperature()));
      //cout << "MONICA_TEMP:\t" << model.avg30cmSoilTemperature() << endl;
      res['avg0_30cmSoilMoisture'].push(fixed(10, model.avgSoilMoisture(0,3)));
      res['avg30_60cmSoilMoisture'].push(fixed(10, model.avgSoilMoisture(3,6)));
      res['avg60_90cmSoilMoisture'].push(fixed(10, model.avgSoilMoisture(6,9)));
      res['waterFluxAtLowerBoundary'].push(fixed(10, model.groundWaterRecharge()));
      res['avg0_30cmCapillaryRise'].push(fixed(10, model.avgCapillaryRise(0,3)));
      res['avg30_60cmCapillaryRise'].push(fixed(10, model.avgCapillaryRise(3,6)));
      res['avg60_90cmCapillaryRise'].push(fixed(10, model.avgCapillaryRise(6,9)));
      res['avg0_30cmPercolationRate'].push(fixed(10, model.avgPercolationRate(0,3)));
      res['avg30_60cmPercolationRate'].push(fixed(10, model.avgPercolationRate(3,6)));
      res['avg60_90cmPercolationRate'].push(fixed(10, model.avgPercolationRate(6,9)));
      res['evapotranspiration'].push(fixed(10, model.getEvapotranspiration()));
      res['transpiration'].push(fixed(10, model.getTranspiration()));
      res['evaporation'].push(fixed(10, model.getEvaporation()));
      res['sum30cmSMB_CO2EvolutionRate'].push(fixed(10, model.get_sum30cmSMB_CO2EvolutionRate()));
      res['NH3Volatilised'].push(fixed(10, model.getNH3Volatilised()));
      res['sum30cmActDenitrificationRate'].push(fixed(10, model.getsum30cmActDenitrificationRate()));
      res['leachingNAtBoundary'].push(fixed(10, model.nLeaching()));
    }

    if((currentDate.getMonth() != currentMonth) || (d == nods - 1)) {
      
      currentMonth = currentDate.getMonth();

      res['avg10cmMonthlyAvgCorg'].push(fixed(10, avg10corg / dim));
      res['avg30cmMonthlyAvgCorg'].push(fixed(10, avg30corg / dim));
      res['mean90cmMonthlyAvgWaterContent'].push(fixed(10, model.mean90cmWaterContent()));
      res['monthlySumGroundWaterRecharge'].push(fixed(10, groundwater));
      res['monthlySumNLeaching'].push(fixed(10, nLeaching));
      res['maxSnowDepth'].push(fixed(10, model.maxSnowDepth()));
      res['sumSnowDepth'].push(fixed(10, model.accumulatedSnowDepth()));
      res['sumFrostDepth'].push(fixed(10, model.accumulatedFrostDepth()));
      res['sumSurfaceRunOff'].push(fixed(10, model.sumSurfaceRunOff()));
      res['sumNH3Volatilised'].push(fixed(10, model.getSumNH3Volatilised()));
      res['monthlySurfaceRunoff'].push(fixed(10, monthSurfaceRunoff));
      res['monthlyPrecip'].push(fixed(10, monthPrecip));
      res['monthlyETa'].push(fixed(10, monthETa));
      res['monthlySoilMoistureL0'].push(fixed(10, model.avgSoilMoisture(0,1) * 100.0));
      res['monthlySoilMoistureL1'].push(fixed(10, model.avgSoilMoisture(1,2) * 100.0));
      res['monthlySoilMoistureL2'].push(fixed(10, model.avgSoilMoisture(2,3) * 100.0));
      res['monthlySoilMoistureL3'].push(fixed(10, model.avgSoilMoisture(3,4) * 100.0));
      res['monthlySoilMoistureL4'].push(fixed(10, model.avgSoilMoisture(4,5) * 100.0));
      res['monthlySoilMoistureL5'].push(fixed(10, model.avgSoilMoisture(5,6) * 100.0));
      res['monthlySoilMoistureL6'].push(fixed(10, model.avgSoilMoisture(6,7) * 100.0));
      res['monthlySoilMoistureL7'].push(fixed(10, model.avgSoilMoisture(7,8) * 100.0));
      res['monthlySoilMoistureL8'].push(fixed(10, model.avgSoilMoisture(8,9) * 100.0));
      res['monthlySoilMoistureL9'].push(fixed(10, model.avgSoilMoisture(9,10) * 100.0));
      res['monthlySoilMoistureL10'].push(fixed(10, model.avgSoilMoisture(10,11) * 100.0));
      res['monthlySoilMoistureL11'].push(fixed(10, model.avgSoilMoisture(11,12) * 100.0));
      res['monthlySoilMoistureL12'].push(fixed(10, model.avgSoilMoisture(12,13) * 100.0));
      res['monthlySoilMoistureL13'].push(fixed(10, model.avgSoilMoisture(13,14) * 100.0));
      res['monthlySoilMoistureL14'].push(fixed(10, model.avgSoilMoisture(14,15) * 100.0));
      res['monthlySoilMoistureL15'].push(fixed(10, model.avgSoilMoisture(15,16) * 100.0));
      res['monthlySoilMoistureL16'].push(fixed(10, model.avgSoilMoisture(16,17) * 100.0));
      res['monthlySoilMoistureL17'].push(fixed(10, model.avgSoilMoisture(17,18) * 100.0));
      res['monthlySoilMoistureL18'].push(fixed(10, model.avgSoilMoisture(18,19) * 100.0));

      avg10corg = avg30corg = watercontent = groundwater = nLeaching =  monthSurfaceRunoff = 0.0;
      monthPrecip = 0.0;
      monthETa = 0.0;

      dim = 0;
      logger(MSG.INFO, "stored monthly values for month: " + currentMonth);
    
    } else {

      avg10corg += model.avgCorg(0.1);
      avg30corg += model.avgCorg(0.3);
      watercontent += model.mean90cmWaterContent();
      groundwater += model.groundWaterRecharge();

      nLeaching += model.nLeaching();
      monthSurfaceRunoff += model.surfaceRunoff();
      monthPrecip += env.da.dataForTimestep(Climate.precip, d);
      monthETa += model.getETa();
    }

    // Yearly accumulated values
    if ((currentDate.getFullYear() != new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1).getFullYear()) && 
      (currentDate.getFullYear()!= env.da.startDate().getFullYear())) {
      res['yearlySumGroundWaterRecharge'].push(yearly_groundwater);
      res['yearlySumNLeaching'].push(yearly_nleaching);
      yearly_groundwater = 0.0;
      yearly_nleaching = 0.0;
    } else {
      yearly_groundwater += model.groundWaterRecharge();
      yearly_nleaching += model.nLeaching();
    }

    if (model.isCropPlanted())
      res['dev_stage'].push(model.cropGrowth().get_DevelopmentalStage()+1);
    else
      res['dev_stage'].push(0.0);

    // res.dates.push(currentDate.toMysqlString());

    if (write_output_files)
      writeGeneralResults(foutFileName, goutFileName, env, model, d);
  }

  logger(MSG.INFO, "returning from runMonica");
  
  /* if progress_callback is provided send null i.e. we are done*/
  if (progress_callback)
    progress_callback(null, null);

  return res;
};

/**
 * Write header line to fout Output file
 * @param fout File pointer to rmout.dat
 */
var initializeFoutHeader = function (foutFileName) {

  var outLayers = 20, numberOfOrgans = 5;
  var fout = "", endl = '\n';
  fout += "Datum     ";
  fout += "\tCrop";
  fout += "\tTraDef";
  fout += "\tTra";
  fout += "\tNDef";
  fout += "\tHeatRed";
  fout += "\tOxRed";

  fout += "\tStage";
  fout += "\tTempSum";
  fout += "\tVernF";
  fout += "\tDaylF";
  fout += "\tIncRoot";
  fout += "\tIncLeaf";
  fout += "\tIncShoot";
  fout += "\tIncFruit";

  fout += "\tRelDev";
  fout += "\tAbBiom";
  
  fout += "\tRoot";
  fout += "\tLeaf"; 
  fout += "\tShoot";
  fout += "\tFruit";
  fout += "\tStruct";
  fout += "\tSugar";

  fout += "\tYield";
  fout += "\tSumYield";

  fout += "\tGroPhot";
  fout += "\tNetPhot";
  fout += "\tMaintR";
  fout += "\tGrowthR";
  fout += "\tStomRes";
  fout += "\tHeight";
  fout += "\tLAI";
  fout += "\tRootDep";
  fout += "\tEffRootDep";

  fout += "\tNBiom";
  fout += "\tSumNUp";
  fout += "\tActNup";
  fout += "\tPotNup";
  fout += "\tNFixed";
  fout += "\tTarget";

  fout += "\tCritN";
  fout += "\tAbBiomN";
  fout += "\tYieldN";
  fout += "\tProtein";

  fout += "\tNPP";
  fout += "\tNPPRoot";
  fout += "\tNPPLeaf";
  fout += "\tNPPShoot";
  fout += "\tNPPFruit";
  fout += "\tNPPStruct";
  fout += "\tNPPSugar";

  fout += "\tGPP";
  fout += "\tRa";
  fout += "\tRaRoot";
  fout += "\tRaLeaf";
  fout += "\tRaShoot";
  fout += "\tRaFruit";
  fout += "\tRaStruct";
  fout += "\tRaSugar";

  for (var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\tMois" + i_Layer;
  }
  fout += "\tPrecip";
  fout += "\tIrrig";
  fout += "\tInfilt";
  fout += "\tSurface";
  fout += "\tRunOff";
  fout += "\tSnowD";
  fout += "\tFrostD";
  fout += "\tThawD";
  for (var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\tPASW-" + i_Layer;
  }
  fout += "\tSurfTemp";
  fout += "\tSTemp0";
  fout += "\tSTemp1";
  fout += "\tSTemp2";
  fout += "\tSTemp3";
  fout += "\tSTemp4";
  fout += "\tact_Ev";
  fout += "\tact_ET";
  fout += "\tET0";
  fout += "\tKc";
  fout += "\tatmCO2";
  fout += "\tGroundw";
  fout += "\tRecharge";
  fout += "\tNLeach";

  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\tNO3-" + i_Layer;
  }
  fout += "\tCarb";
  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\tNH4-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 4; i_Layer++) {
    fout += "\tNO2-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 6; i_Layer++) {
    fout += "\tSOC-" + i_Layer;
  }

  fout += "\tSOC-0-30";
  fout += "\tSOC-0-200";

  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tAOMf-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tAOMs-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tSMBf-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tSMBs-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tSOMf-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tSOMs-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\tCBal-" + i_Layer;
  }
  for(var i_Layer = 0; i_Layer < 3; i_Layer++) {
    fout += "\tNmin-" + i_Layer;
  }

  fout += "\tNetNmin";
  fout += "\tDenit";
  fout += "\tN2O";
  fout += "\tSoilpH";
  fout += "\tNEP";
  fout += "\tNEE";
  fout += "\tRh";


  fout += "\ttmin";
  fout += "\ttavg";
  fout += "\ttmax";
  fout += "\twind";
  fout += "\tglobrad";
  fout += "\trelhumid";
  fout += "\tsunhours";
  fout += endl;

  //**** Second header line ***
  fout += "TTMMYYY";  // Date
  fout += "\t[ ]";    // Crop name
  fout += "\t[0;1]";    // TranspirationDeficit
  fout += "\t[mm]";     // ActualTranspiration
  fout += "\t[0;1]";    // CropNRedux
  fout += "\t[0;1]";    // HeatStressRedux
  fout += "\t[0;1]";    // OxygenDeficit

  fout += "\t[ ]";      // DevelopmentalStage
  fout += "\t[°Cd]";    // CurrentTemperatureSum
  fout += "\t[0;1]";    // VernalisationFactor
  fout += "\t[0;1]";    // DaylengthFactor
  fout += "\t[kg/ha]";  // OrganGrowthIncrement root
  fout += "\t[kg/ha]";  // OrganGrowthIncrement leaf
  fout += "\t[kg/ha]";  // OrganGrowthIncrement shoot
  fout += "\t[kg/ha]";  // OrganGrowthIncrement fruit

  fout += "\t[0;1]";    // RelativeTotalDevelopment
  fout += "\t[kg/ha]";  // AbovegroundBiomass

  for (var i = 0; i < 6; i++) {
    fout += "\t[kgDM/ha]"; // get_OrganBiomass(i)
  }

  fout += "\t[kgDM/ha]";    // get_PrimaryCropYield(3)
  fout += "\t[kgDM/ha]";    // get_AccumulatedPrimaryCropYield(3)

  fout += "\t[kgCH2O/ha]";  // GrossPhotosynthesisHaRate
  fout += "\t[kgCH2O/ha]";  // NetPhotosynthesis
  fout += "\t[kgCH2O/ha]";  // MaintenanceRespirationAS
  fout += "\t[kgCH2O/ha]";  // GrowthRespirationAS
  fout += "\t[s/m]";        // StomataResistance
  fout += "\t[m]";          // CropHeight
  fout += "\t[m2/m2]";      // LeafAreaIndex
  fout += "\t[layer]";      // RootingDepth
  fout += "\t[m]";          // Effective RootingDepth

  fout += "\t[kgN/ha]";     // TotalBiomassNContent
  fout += "\t[kgN/ha]";     // SumTotalNUptake
  fout += "\t[kgN/ha]";     // ActNUptake
  fout += "\t[kgN/ha]";     // PotNUptake
  fout += "\t[kgN/ha]";     // NFixed
  fout += "\t[kgN/kg]";     // TargetNConcentration
  fout += "\t[kgN/kg]";     // CriticalNConcentration
  fout += "\t[kgN/kg]";     // AbovegroundBiomassNConcentration
  fout += "\t[kgN/kg]";     // PrimaryYieldNConcentration
  fout += "\t[kg/kg]";      // RawProteinConcentration

  fout += "\t[kg C ha-1]";   // NPP
  fout += "\t[kg C ha-1]";   // NPP root
  fout += "\t[kg C ha-1]";   // NPP leaf
  fout += "\t[kg C ha-1]";   // NPP shoot
  fout += "\t[kg C ha-1]";   // NPP fruit
  fout += "\t[kg C ha-1]";   // NPP struct
  fout += "\t[kg C ha-1]";   // NPP sugar

  fout += "\t[kg C ha-1]";   // GPP
  fout += "\t[kg C ha-1]";   // Ra
  fout += "\t[kg C ha-1]";   // Ra root
  fout += "\t[kg C ha-1]";   // Ra leaf
  fout += "\t[kg C ha-1]";   // Ra shoot
  fout += "\t[kg C ha-1]";   // Ra fruit
  fout += "\t[kg C ha-1]";   // Ra struct
  fout += "\t[kg C ha-1]";   // Ra sugar

  for (var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\t[m3/m3]"; // Soil moisture content
  }
  fout += "\t[mm]"; // Precipitation
  fout += "\t[mm]"; // Irrigation
  fout += "\t[mm]"; // Infiltration
  fout += "\t[mm]"; // Surface water storage
  fout += "\t[mm]"; // Surface water runoff
  fout += "\t[mm]"; // Snow depth
  fout += "\t[m]"; // Frost front depth in soil
  fout += "\t[m]"; // Thaw front depth in soil
  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\t[m3/m3]"; //PASW
  }

  fout += "\t[°C]"; //
  fout += "\t[°C]";
  fout += "\t[°C]";
  fout += "\t[°C]";
  fout += "\t[°C]";
  fout += "\t[°C]";
  fout += "\t[mm]";
  fout += "\t[mm]";
  fout += "\t[mm]";
  fout += "\t[ ]";
  fout += "\t[ppm]";
  fout += "\t[m]";
  fout += "\t[mm]";
  fout += "\t[kgN/ha]";

  // NO3
  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\t[kgN/m3]";
  }

  fout += "\t[kgN/m3]";  // Soil Carbamid

  // NH4
  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
    fout += "\t[kgN/m3]";
  }

  // NO2
  for(var i_Layer = 0; i_Layer < 4; i_Layer++) {
    fout += "\t[kgN/m3]";
  }

  // get_SoilOrganicC
  for(var i_Layer = 0; i_Layer < 6; i_Layer++) {
    fout += "\t[kgC/kg]";
  }

  fout += "\t[gC m-2]";   // SOC-0-30
  fout += "\t[gC m-2]";   // SOC-0-200

  // get_AOM_FastSum
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }
  // get_AOM_SlowSum
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }

  // get_SMB_Fast
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }
  // get_SMB_Slow
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }

  // get_SOM_Fast
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }
  // get_SOM_Slow
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }

  // get_CBalance
  for(var i_Layer = 0; i_Layer < 1; i_Layer++) {
    fout += "\t[kgC/m3]";
  }

  // NetNMineralisationRate
  for(var i_Layer = 0; i_Layer < 3; i_Layer++) {
    fout += "\t[kgN/ha]";
  }

  fout += "\t[kgN/ha]";  // NetNmin
  fout += "\t[kgN/ha]";  // Denit
  fout += "\t[kgN/ha]";  // N2O
  fout += "\t[ ]";       // SoilpH
  fout += "\t[kgC/ha]";  // NEP
  fout += "\t[kgC/ha]";  // NEE
  fout += "\t[kgC/ha]"; // Rh

  fout += "\t[°C]";     // tmin
  fout += "\t[°C]";     // tavg
  fout += "\t[°C]";     // tmax
  fout += "\t[m/s]";    // wind
  fout += "\tglobrad";  // globrad
  fout += "\t[m3/m3]";  // relhumid
  fout += "\t[h]";      // sunhours
  fout += endl;

  fs.writeFileSync(foutFileName, fout, { encoding: 'utf8' });

};

/**
 * Writes header line to gout-Outputfile
 * @param gout File pointer to smout.dat
 */
var initializeGoutHeader = function (goutFileName) {

  var gout = "", endl = '\n';
  gout += "Datum     ";
  gout += "\tCrop";
  gout += "\tStage";
  gout += "\tHeight";
  gout += "\tRoot";
  gout += "\tRoot10";
  gout += "\tLeaf";
  gout += "\tShoot";
  gout += "\tFruit";
  gout += "\tAbBiom";
  gout += "\tAbGBiom";
  gout += "\tYield";
  gout += "\tEarNo";
  gout += "\tGrainNo";

  gout += "\tLAI";
  gout += "\tAbBiomNc";
  gout += "\tYieldNc";
  gout += "\tAbBiomN";
  gout += "\tYieldN";

  gout += "\tTotNup";
  gout += "\tNGrain";
  gout += "\tProtein";


  gout += "\tBedGrad";
  gout += "\tM0-10";
  gout += "\tM10-20";
  gout += "\tM20-30";
  gout += "\tM30-40";
  gout += "\tM40-50";
  gout += "\tM50-60";
  gout += "\tM60-70";
  gout += "\tM70-80";
  gout += "\tM80-90";
  gout += "\tM0-30";
  gout += "\tM30-60";
  gout += "\tM60-90";
  gout += "\tM0-60";
  gout += "\tM0-90";
  gout += "\tPAW0-200";
  gout += "\tPAW0-130";
  gout += "\tPAW0-150";
  gout += "\tN0-30";
  gout += "\tN30-60";
  gout += "\tN60-90";
  gout += "\tN90-120";
  gout += "\tN0-60";
  gout += "\tN0-90";
  gout += "\tN0-200";
  gout += "\tN0-130";
  gout += "\tN0-150";
  gout += "\tNH430";
  gout += "\tNH460";
  gout += "\tNH490";
  gout += "\tCo0-10";
  gout += "\tCo0-30";
  gout += "\tT0-10";
  gout += "\tT20-30";
  gout += "\tT50-60";
  gout += "\tCO2";
  gout += "\tNH3";
  gout += "\tN2O";
  gout += "\tN2";
  gout += "\tNgas";
  gout += "\tNFert";
  gout += "\tIrrig";
  gout += endl;

  // **** Second header line ****

  gout += "TTMMYYYY";
  gout += "\t[ ]";
  gout += "\t[ ]";
  gout += "\t[m]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[kgDM/ha]";
  gout += "\t[ ]";
  gout += "\t[ ]";
  gout += "\t[m2/m2]";
  gout += "\t[kgN/kgDM";
  gout += "\t[kgN/kgDM]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[-]";
  gout += "\t[kg/kgDM]";

  gout += "\t[0;1]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[m3/m3]";
  gout += "\t[mm]";
  gout += "\t[mm]";
  gout += "\t[mm]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[kgC/ha]";
  gout += "\t[kgC/ha]";
  gout += "\t[°C]";
  gout += "\t[°C]";
  gout += "\t[°C]";
  gout += "\t[kgC/ha]";
  gout += "\t[kgN/ha]";
  gout += "\t[-]";
  gout += "\t[-]";
  gout += "\t[-]";
  gout += "\t[kgN/ha]";
  gout += "\t[mm]";
  gout += endl;

  fs.writeFileSync(goutFileName, gout, { encoding: 'utf8' });

};

/**
 * Write crop results to file; if no crop is planted, fields are filled out with zeros;
 * @param mcg CropGrowth modul that contains information about crop
 * @param fout File pointer to rmout.dat
 * @param gout File pointer to smout.dat
 */
var writeCropResults = function (mcg, foutFileName, goutFileName, crop_is_planted) {

  var fout = '', gout = '', endl = '\n';

  if (crop_is_planted) {
    fout += "\t" + mcg.get_CropName();
    fout += "\t" + fixed(10, mcg.get_TranspirationDeficit());// [0;1]
    fout += "\t" + fixed(10, mcg.get_ActualTranspiration());
    fout += "\t" + fixed(10, mcg.get_CropNRedux());// [0;1]
    fout += "\t" + fixed(10, mcg.get_HeatStressRedux());// [0;1]
    fout += "\t" + fixed(10, mcg.get_OxygenDeficit());// [0;1]

    fout += "\t" + fixed(10, mcg.get_DevelopmentalStage() + 1);
    fout += "\t" + fixed(10, mcg.get_CurrentTemperatureSum());
    fout += "\t" + fixed(10, mcg.get_VernalisationFactor());
    fout += "\t" + fixed(10, mcg.get_DaylengthFactor());
    fout += "\t" + fixed(10, mcg.get_OrganGrowthIncrement(0));
    fout += "\t" + fixed(10, mcg.get_OrganGrowthIncrement(1));
    fout += "\t" + fixed(10, mcg.get_OrganGrowthIncrement(2));
    fout += "\t" + fixed(10, mcg.get_OrganGrowthIncrement(3));
    
    fout += "\t" + fixed(10, mcg.get_RelativeTotalDevelopment());
    fout += "\t" + fixed(10, mcg.get_AbovegroundBiomass());

    for (var i = 0, is = mcg.get_NumberOfOrgans(); i < is; i++)
      fout += "\t" + fixed(10, mcg.get_OrganBiomass(i)); // biomass organs, [kg C ha-1]

    for (var i = 0, is = (6 - mcg.get_NumberOfOrgans()); i < is; i++)
      fout += "\t" + 0.0; // adding zero fill if biomass organs < 6,

    /* TODO: implement mcg.get_AccumulatedPrimaryCropYield() */
    fout += "\t" + fixed(10, mcg.get_PrimaryCropYield());
    fout += "\t" + 0.0/* fixed(10, mcg.get_AccumulatedPrimaryCropYield())*/;

    fout += "\t" + fixed(10, mcg.get_GrossPhotosynthesisHaRate()); // [kg CH2O ha-1 d-1]
    fout += "\t" + fixed(10, mcg.get_NetPhotosynthesis());  // [kg CH2O ha-1 d-1]
    fout += "\t" + fixed(10, mcg.get_MaintenanceRespirationAS());// [kg CH2O ha-1]
    fout += "\t" + fixed(10, mcg.get_GrowthRespirationAS());// [kg CH2O ha-1]

    fout += "\t" + fixed(10, mcg.get_StomataResistance());// [s m-1]

    fout += "\t" + fixed(10, mcg.get_CropHeight());// [m]
    fout += "\t" + fixed(10, mcg.get_LeafAreaIndex()); //[m2 m-2]
    fout += "\t" + fixed(10, mcg.get_RootingDepth()); //[layer]
    fout += "\t" + fixed(10, mcg.getEffectiveRootingDepth()); //[m]

    fout += "\t" + fixed(10, mcg.get_TotalBiomassNContent());
    fout += "\t" + fixed(10, mcg.get_SumTotalNUptake());
    fout += "\t" + fixed(10, mcg.get_ActNUptake()); // [kg N ha-1]
    fout += "\t" + fixed(10, mcg.get_PotNUptake()); // [kg N ha-1]
    /* TODO: implement get_BiologicalNFixation */
    fout += "\t" + 0.0/*fixed(10, mcg.get_BiologicalNFixation())*/; // [kg N ha-1]
    fout += "\t" + fixed(10, mcg.get_TargetNConcentration());//[kg N kg-1]

    fout += "\t" + fixed(10, mcg.get_CriticalNConcentration());//[kg N kg-1]
    fout += "\t" + fixed(10, mcg.get_AbovegroundBiomassNConcentration());//[kg N kg-1]
    fout += "\t" + fixed(10, mcg.get_PrimaryYieldNConcentration());//[kg N kg-1]
    fout += "\t" + fixed(10, mcg.get_RawProteinConcentration());//[kg N kg-1]
    fout += "\t" + fixed(10, mcg.get_NetPrimaryProduction());//[kg N kg-1]

    for (var i=0; i<mcg.get_NumberOfOrgans(); i++) {
        fout += "\t" + fixed(10, mcg.get_OrganSpecificNPP(i)); // NPP organs, [kg C ha-1]
    }
    // if there less than 4 organs we have to fill the column that
    // was added in the output header of rmout; in this header there
    // are statically 4 columns initialised for the organ NPP
    for (var i=mcg.get_NumberOfOrgans(); i<6; i++) {
        fout += "\t0.0"; // NPP organs, [kg C ha-1]
    }

    fout += "\t" + fixed(10, mcg.get_GrossPrimaryProduction()); // GPP, [kg C ha-1]

    fout += "\t" + fixed(10, mcg.get_AutotrophicRespiration()); // Ra, [kg C ha-1]
    for (var i=0; i<mcg.get_NumberOfOrgans(); i++) {
      fout += "\t" + fixed(10, mcg.get_OrganSpecificTotalRespired(i)); // Ra organs, [kg C ha-1]
    }
    // if there less than 4 organs we have to fill the column that
    // was added in the output header of rmout; in this header there
    // are statically 4 columns initialised for the organ RA
    for (var i=mcg.get_NumberOfOrgans(); i<6; i++) {
        fout += "\t0.0";
    }

    gout += "\t" + mcg.get_CropName();
    gout += "\t" + fixed(10, mcg.get_DevelopmentalStage() + 1);
    gout += "\t" + fixed(10, mcg.get_CropHeight());
    gout += "\t" + fixed(10, mcg.get_OrganBiomass(0));
    gout += "\t" + fixed(10, mcg.get_OrganBiomass(0)); //! @todo
    gout += "\t" + fixed(10, mcg.get_OrganBiomass(1));
    gout += "\t" + fixed(10, mcg.get_OrganBiomass(2));
    gout += "\t" + fixed(10, mcg.get_OrganBiomass(3));
    gout += "\t" + fixed(10, mcg.get_AbovegroundBiomass());
    gout += "\t" + fixed(10, mcg.get_AbovegroundBiomass()); //! @todo
    gout += "\t" + fixed(10, mcg.get_PrimaryCropYield());
    gout += "\t0"; //! @todo
    gout += "\t0"; //! @todo
    gout += "\t" + fixed(10, mcg.get_LeafAreaIndex());
    gout += "\t" + fixed(10, mcg.get_AbovegroundBiomassNConcentration());
    gout += "\t" + fixed(10, mcg.get_PrimaryYieldNConcentration());
    gout += "\t" + fixed(10, mcg.get_AbovegroundBiomassNContent());
    gout += "\t" + fixed(10, mcg.get_PrimaryYieldNContent());
    gout += "\t" + fixed(10, mcg.get_TotalBiomassNContent());
    gout += "\t0"; //! @todo
    gout += "\t" + fixed(10, mcg.get_RawProteinConcentration());

  } else { // crop is not planted

    fout += "\t"; // Crop Name
    fout += "\t1.00"; // TranspirationDeficit
    fout += "\t0.00"; // ActualTranspiration
    fout += "\t1.00"; // CropNRedux
    fout += "\t1.00"; // HeatStressRedux
    fout += "\t1.00"; // OxygenDeficit

    fout += "\t0";      // DevelopmentalStage
    fout += "\t0.0";    // CurrentTemperatureSum
    fout += "\t0.00";   // VernalisationFactor
    fout += "\t0.00";   // DaylengthFactor

    fout += "\t0.00";   // OrganGrowthIncrement root
    fout += "\t0.00";   // OrganGrowthIncrement leaf
    fout += "\t0.00";   // OrganGrowthIncrement shoot
    fout += "\t0.00";   // OrganGrowthIncrement fruit
    fout += "\t0.00";   // RelativeTotalDevelopment

    fout += "\t0.0";    // AbovegroundBiomass
    fout += "\t0.0";    // get_OrganBiomass(0)
    fout += "\t0.0";    // get_OrganBiomass(1)
    fout += "\t0.0";    // get_OrganBiomass(2)
    fout += "\t0.0";    // get_OrganBiomass(3)
    fout += "\t0.0";    // get_OrganBiomass(4)
    fout += "\t0.0";    // get_OrganBiomass(5)
    fout += "\t0.0";    // get_PrimaryCropYield(3)
    fout += "\t0.0";    // get_AccumulatedPrimaryCropYield(3)

    fout += "\t0.000";  // GrossPhotosynthesisHaRate
    fout += "\t0.00";   // NetPhotosynthesis
    fout += "\t0.000";  // MaintenanceRespirationAS
    fout += "\t0.000";  // GrowthRespirationAS
    fout += "\t0.00";   // StomataResistance
    fout += "\t0.00";   // CropHeight
    fout += "\t0.00";   // LeafAreaIndex
    fout += "\t0";      // RootingDepth
    fout += "\t0.0";    // EffectiveRootingDepth

    fout += "\t0.0";    // TotalBiomassNContent
    fout += "\t0.00";   // SumTotalNUptake
    fout += "\t0.00";   // ActNUptake
    fout += "\t0.00";   // PotNUptake
    fout += "\t0.00";   // NFixed
    fout += "\t0.000";  // TargetNConcentration
    fout += "\t0.000";  // CriticalNConcentration
    fout += "\t0.000";  // AbovegroundBiomassNConcentration
    fout += "\t0.000";  // PrimaryYieldNConcentration
    fout += "\t0.000";  // RawProteinConcentration

    fout += "\t0.0";    // NetPrimaryProduction
    fout += "\t0.0"; // NPP root
    fout += "\t0.0"; // NPP leaf
    fout += "\t0.0"; // NPP shoot
    fout += "\t0.0"; // NPP fruit
    fout += "\t0.0"; // NPP struct
    fout += "\t0.0"; // NPP sugar

    fout += "\t0.0"; // GrossPrimaryProduction
    fout += "\t0.0"; // Ra - VcRespiration
    fout += "\t0.0"; // Ra root - OrganSpecificTotalRespired
    fout += "\t0.0"; // Ra leaf - OrganSpecificTotalRespired
    fout += "\t0.0"; // Ra shoot - OrganSpecificTotalRespired
    fout += "\t0.0"; // Ra fruit - OrganSpecificTotalRespired
    fout += "\t0.0"; // Ra struct - OrganSpecificTotalRespired
    fout += "\t0.0"; // Ra sugar - OrganSpecificTotalRespired

    gout += "\t";       // Crop Name
    gout += "\t0";      // DevelopmentalStage
    gout += "\t0.00";   // CropHeight
    gout += "\t0.0";    // OrganBiomass(0)
    gout += "\t0.0";    // OrganBiomass(0)
    gout += "\t0.0";    // OrganBiomass(1)

    gout += "\t0.0";    // OrganBiomass(2)
    gout += "\t0.0";    // OrganBiomass(3)
    gout += "\t0.0";    // AbovegroundBiomass
    gout += "\t0.0";    // AbovegroundBiomass
    gout += "\t0.0";    // PrimaryCropYield

    gout += "\t0";
    gout += "\t0";

    gout += "\t0.00";   // LeafAreaIndex
    gout += "\t0.000";  // AbovegroundBiomassNConcentration
    gout += "\t0.0";    // PrimaryYieldNConcentration
    gout += "\t0.00";   // AbovegroundBiomassNContent
    gout += "\t0.0";    // PrimaryYieldNContent

    gout += "\t0.0";    // TotalBiomassNContent
    gout += "\t0";
    gout += "\t0.00";   // RawProteinConcentration
  }

  fs.appendFileSync(goutFileName, gout, { encoding: 'utf8' });
  fs.appendFileSync(foutFileName, fout, { encoding: 'utf8' });

};


/**
 * Writing general results from MONICA simulation to output files
 * @param fout File pointer to rmout.dat
 * @param gout File pointer to smout.dat
 * @param env Environment object
 * @param monica MONICA model that contains pointer to all submodels
 * @param d Day of simulation
 */
var writeGeneralResults = function (foutFileName, goutFileName, env, monica, d) {

  var fout = '', gout = '', endl = '\n';
  var mst = monica.soilTemperature();
  var msm = monica.soilMoisture();
  var mso = monica.soilOrganic();
  var msc = monica.soilColumn();

  //! TODO: schmutziger work-around. Hier muss was eleganteres hin!
  var msa = monica.soilColumnNC();
  var msq = monica.soilTransport();

  var outLayers = 20;
  for (var i_Layer = 0; i_Layer < outLayers; i_Layer++)
    fout += "\t" + fixed(10, msm.get_SoilMoisture(i_Layer));

  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.precip, d));
  fout += "\t" + fixed(10, monica.dailySumIrrigationWater());
  fout += "\t" + fixed(10, msm.get_Infiltration()); // {mm]
  fout += "\t" + fixed(10, msm.get_SurfaceWaterStorage());// {mm]
  fout += "\t" + fixed(10, msm.get_SurfaceRunOff());// {mm]
  fout += "\t" + fixed(10, msm.get_SnowDepth()); // [mm]
  fout += "\t" + fixed(10, msm.get_FrostDepth());
  fout += "\t" + fixed(10, msm.get_ThawDepth());
  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++)
    fout += "\t" + fixed(10, msm.get_SoilMoisture(i_Layer) - msa[i_Layer].get_PermanentWiltingPoint());

  fout += "\t" + fixed(10, mst.get_SoilSurfaceTemperature());

  for(var i_Layer = 0; i_Layer < 5; i_Layer++)
    fout += "\t" + fixed(10, mst.get_SoilTemperature(i_Layer));// [°C]

  fout += "\t" + fixed(10, msm.get_ActualEvaporation());// [mm]
  fout += "\t" + fixed(10, msm.get_Evapotranspiration());// [mm]
  fout += "\t" + fixed(10, msm.get_ET0());// [mm]
  fout += "\t" + fixed(10, msm.get_KcFactor());
  fout += "\t" + fixed(10, monica.get_AtmosphericCO2Concentration());// [ppm]
  fout += "\t" + fixed(10, monica.get_GroundwaterDepth());// [m]
  fout += "\t" + fixed(10, msm.get_GroundwaterRecharge());// [mm]
  fout += "\t" + fixed(10, msq.get_NLeaching()); // [kg N ha-1]


  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++)
    fout += "\t" + fixed(10, msc.soilLayer(i_Layer).get_SoilNO3());// [kg N m-3]

  fout += "\t" + fixed(10, msc.soilLayer(0).get_SoilCarbamid());

  for(var i_Layer = 0; i_Layer < outLayers; i_Layer++)
    fout += "\t" + fixed(10, msc.soilLayer(i_Layer).get_SoilNH4());

  for(var i_Layer = 0; i_Layer < 4; i_Layer++)
    fout += "\t" + fixed(10, msc.soilLayer(i_Layer).get_SoilNO2());

  for(var i_Layer = 0; i_Layer < 6; i_Layer++)
    fout += "\t" + fixed(10, msc.soilLayer(i_Layer).vs_SoilOrganicCarbon()); // [kg C kg-1]

  // SOC-0-30 [g C m-2]
  var  soc_30_accumulator = 0.0;
  for (var i_Layer = 0; i_Layer < 3; i_Layer++) {
      // kg C / kg --> g C / m2
      soc_30_accumulator += msc.soilLayer(i_Layer).vs_SoilOrganicCarbon() * msc.soilLayer(i_Layer).vs_SoilBulkDensity() * msc.soilLayer(i_Layer).vs_LayerThickness * 1000;
  }
  fout += "\t" + fixed(10, soc_30_accumulator);


  // SOC-0-200   [g C m-2]
  var  soc_200_accumulator = 0.0;
  for (var i_Layer = 0; i_Layer < outLayers; i_Layer++) {
      // kg C / kg --> g C / m2
      soc_200_accumulator += msc.soilLayer(i_Layer).vs_SoilOrganicCarbon() * msc.soilLayer(i_Layer).vs_SoilBulkDensity() * msc.soilLayer(i_Layer).vs_LayerThickness * 1000;
  }
  fout += "\t" + fixed(10, soc_200_accumulator);

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_AOM_FastSum(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_AOM_SlowSum(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_SMB_Fast(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_SMB_Slow(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_SOM_Fast(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_SOM_Slow(i_Layer));

  for(var i_Layer = 0; i_Layer < 1; i_Layer++)
    fout += "\t" + fixed(10, mso.get_CBalance(i_Layer));

  for(var i_Layer = 0; i_Layer < 3; i_Layer++)
    fout += "\t" + fixed(10, mso.get_NetNMineralisationRate(i_Layer)); // [kg N ha-1]


  fout += "\t" + fixed(10, mso.get_NetNMineralisation()); // [kg N ha-1]
  fout += "\t" + fixed(10, mso.get_Denitrification()); // [kg N ha-1]
  fout += "\t" + fixed(10, mso.get_N2O_Produced()); // [kg N ha-1]
  fout += "\t" + fixed(10, msc.soilLayer(0).get_SoilpH()); // [ ]
  fout += "\t" + fixed(10, mso.get_NetEcosystemProduction()); // [kg C ha-1]
  fout += "\t" + fixed(10, mso.get_NetEcosystemExchange()); // [kg C ha-1]
  fout += "\t" + fixed(10, mso.get_DecomposerRespiration()); // Rh, [kg C ha-1 d-1]


  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.tmin, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.tavg, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.tmax, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.wind, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.globrad, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.relhumid, d));
  fout += "\t" + fixed(10, env.da.dataForTimestep(Climate.sunhours, d));
  fout += endl;

  // smout
  gout += "\t" + fixed(10, msm.get_PercentageSoilCoverage());

  for(var i_Layer = 0; i_Layer < 9; i_Layer++) {
    gout += "\t" + fixed(10, msm.get_SoilMoisture(i_Layer)); // [m3 m-3]
  }

  gout += "\t" + fixed(10, (msm.get_SoilMoisture(0) + msm.get_SoilMoisture(1) + msm.get_SoilMoisture(2)) / 3.0); //[m3 m-3]
  gout += "\t" + fixed(10, (msm.get_SoilMoisture(3) + msm.get_SoilMoisture(4) + msm.get_SoilMoisture(5)) / 3.0); //[m3 m-3]
  gout += "\t" + fixed(10, (msm.get_SoilMoisture(6) + msm.get_SoilMoisture(7) + msm.get_SoilMoisture(8)) / 3.0); //[m3 m-3]

  var M0_60 = 0.0;
  for(var i_Layer = 0; i_Layer < 6; i_Layer++) {
    M0_60 += msm.get_SoilMoisture(i_Layer);
  }
  gout += "\t" + fixed(10, (M0_60 / 6.0)); // [m3 m-3]

  var M0_90 = 0.0;
  for(var i_Layer = 0; i_Layer < 9; i_Layer++) {
    M0_90 += msm.get_SoilMoisture(i_Layer);
  }
  gout += "\t" + fixed(10, (M0_90 / 9.0)); // [m3 m-3]

  var PAW0_200 = 0.0;
  for(var i_Layer = 0; i_Layer < 20; i_Layer++) {
      PAW0_200 += (msm.get_SoilMoisture(i_Layer) - msa[i_Layer].get_PermanentWiltingPoint()) ;
  }
  gout += "\t" + fixed(10, (PAW0_200 * 0.1 * 1000.0)); // [mm]

  var PAW0_130 = 0.0;
  for(var i_Layer = 0; i_Layer < 13; i_Layer++) {
      PAW0_130 += (msm.get_SoilMoisture(i_Layer) - msa[i_Layer].get_PermanentWiltingPoint()) ;
  }
  gout += "\t" + fixed(10, (PAW0_130 * 0.1 * 1000.0)); // [mm]

    var PAW0_150 = 0.0;
    for(var i_Layer = 0; i_Layer < 15; i_Layer++) {
            PAW0_150 += (msm.get_SoilMoisture(i_Layer) - msa[i_Layer].get_PermanentWiltingPoint()) ;
  }
    gout += "\t" + fixed(10, (PAW0_150 * 0.1 * 1000.0)); // [mm]

  gout += "\t" + fixed(10, (msc.soilLayer(0).get_SoilNmin() + msc.soilLayer(1).get_SoilNmin() + msc.soilLayer(2).get_SoilNmin()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, (msc.soilLayer(3).get_SoilNmin() + msc.soilLayer(4).get_SoilNmin() + msc.soilLayer(5).get_SoilNmin()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, (msc.soilLayer(6).get_SoilNmin() + msc.soilLayer(7).get_SoilNmin() + msc.soilLayer(8).get_SoilNmin()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, (msc.soilLayer(9).get_SoilNmin() + msc.soilLayer(10).get_SoilNmin() + msc.soilLayer(11).get_SoilNmin()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]

  var N0_60 = 0.0;
  for(var i_Layer = 0; i_Layer < 6; i_Layer++) {
    N0_60 += msc.soilLayer(i_Layer).get_SoilNmin();
  }
  gout += "\t" + fixed(10, (N0_60 * 0.1 * 10000));  // [kg m-3] -> [kg ha-1]

  var N0_90 = 0.0;
  for(var i_Layer = 0; i_Layer < 9; i_Layer++) {
    N0_90 += msc.soilLayer(i_Layer).get_SoilNmin();
  }
  gout += "\t" + fixed(10, (N0_90 * 0.1 * 10000));  // [kg m-3] -> [kg ha-1]

  var N0_200 = 0.0;
  for(var i_Layer = 0; i_Layer < 20; i_Layer++) {
    N0_200 += msc.soilLayer(i_Layer).get_SoilNmin();
  }
  gout += "\t" + fixed(10, (N0_200 * 0.1 * 10000));  // [kg m-3] -> [kg ha-1]

  var N0_130 = 0.0;
  for(var i_Layer = 0; i_Layer < 13; i_Layer++) {
    N0_130 += msc.soilLayer(i_Layer).get_SoilNmin();
  }
  gout += "\t" + fixed(10, (N0_130 * 0.1 * 10000));  // [kg m-3] -> [kg ha-1]

  var N0_150 = 0.0;
  for(var i_Layer = 0; i_Layer < 15; i_Layer++) {
    N0_150 += msc.soilLayer(i_Layer).get_SoilNmin();
  }
  gout += "\t" + fixed(10, (N0_150 * 0.1 * 10000));  // [kg m-3] -> [kg ha-1]

  gout += "\t" + fixed(10, (msc.soilLayer(0).get_SoilNH4() + msc.soilLayer(1).get_SoilNH4() + msc.soilLayer(2).get_SoilNH4()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, (msc.soilLayer(3).get_SoilNH4() + msc.soilLayer(4).get_SoilNH4() + msc.soilLayer(5).get_SoilNH4()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, (msc.soilLayer(6).get_SoilNH4() + msc.soilLayer(7).get_SoilNH4() + msc.soilLayer(8).get_SoilNH4()) / 3.0 * 0.3 * 10000); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, mso.get_SoilOrganicC(0) * 0.1 * 10000);// [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, ((mso.get_SoilOrganicC(0) + mso.get_SoilOrganicC(1) + mso.get_SoilOrganicC(2)) / 3.0 * 0.3 * 10000)); // [kg m-3] -> [kg ha-1]
  gout += "\t" + fixed(10, mst.get_SoilTemperature(0));
  gout += "\t" + fixed(10, mst.get_SoilTemperature(2));
  gout += "\t" + fixed(10, mst.get_SoilTemperature(5));
  gout += "\t" + fixed(10, mso.get_DecomposerRespiration()); // Rh, [kg C ha-1 d-1]

  gout += "\t" + fixed(10, mso.get_NH3_Volatilised()); // [kg N ha-1]
  gout += "\t0"; //! @todo
  gout += "\t0"; //! @todo
  gout += "\t0"; //! @todo
  gout += "\t" + fixed(10, monica.dailySumFertiliser());
  gout += "\t" + fixed(10, monica.dailySumIrrigationWater());
  gout += endl;

  fs.appendFileSync(goutFileName, gout, { encoding: 'utf8' });
  fs.appendFileSync(foutFileName, fout, { encoding: 'utf8' });

}

var dumpMonicaParametersIntoFile = function (fileName, cpp) {

  var parameter_output = '', endl = '\n';

  //double po_AtmosphericResistance; //0.0025 [s m-1], from Sadeghi et al. 1988

  // userSoilOrganicParameters
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SOM_SlowDecCoeffStandard" + "\t" + cpp.userSoilOrganicParameters.po_SOM_SlowDecCoeffStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SOM_FastDecCoeffStandard" + "\t" + cpp.userSoilOrganicParameters.po_SOM_FastDecCoeffStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SMB_SlowMaintRateStandard" + "\t" + cpp.userSoilOrganicParameters.po_SMB_SlowMaintRateStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SMB_FastMaintRateStandard" + "\t" + cpp.userSoilOrganicParameters.po_SMB_FastMaintRateStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SMB_SlowDeathRateStandard" + "\t" + cpp.userSoilOrganicParameters.po_SMB_SlowDeathRateStandard + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SMB_FastDeathRateStandard" + "\t" + cpp.userSoilOrganicParameters.po_SMB_FastDeathRateStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SMB_UtilizationEfficiency" + "\t" + cpp.userSoilOrganicParameters.po_SMB_UtilizationEfficiency + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SOM_SlowUtilizationEfficiency" + "\t" + cpp.userSoilOrganicParameters.po_SOM_SlowUtilizationEfficiency + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SOM_FastUtilizationEfficiency" + "\t" + cpp.userSoilOrganicParameters.po_SOM_FastUtilizationEfficiency + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_AOM_SlowUtilizationEfficiency" + "\t" + cpp.userSoilOrganicParameters.po_AOM_SlowUtilizationEfficiency + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_AOM_FastUtilizationEfficiency" + "\t" + cpp.userSoilOrganicParameters.po_AOM_FastUtilizationEfficiency + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_AOM_FastMaxC_to_N" + "\t" + cpp.userSoilOrganicParameters.po_AOM_FastMaxC_to_N + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_PartSOM_Fast_to_SOM_Slow" + "\t" + cpp.userSoilOrganicParameters.po_PartSOM_Fast_to_SOM_Slow + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_PartSMB_Slow_to_SOM_Fast" + "\t" + cpp.userSoilOrganicParameters.po_PartSMB_Slow_to_SOM_Fast + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_PartSMB_Fast_to_SOM_Fast" + "\t" + cpp.userSoilOrganicParameters.po_PartSMB_Fast_to_SOM_Fast + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_PartSOM_to_SMB_Slow" + "\t" + cpp.userSoilOrganicParameters.po_PartSOM_to_SMB_Slow + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_PartSOM_to_SMB_Fast" + "\t" + cpp.userSoilOrganicParameters.po_PartSOM_to_SMB_Fast + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_CN_Ratio_SMB" + "\t" + cpp.userSoilOrganicParameters.po_CN_Ratio_SMB + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_LimitClayEffect" + "\t" + cpp.userSoilOrganicParameters.po_LimitClayEffect + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_AmmoniaOxidationRateCoeffStandard" + "\t" + cpp.userSoilOrganicParameters.po_AmmoniaOxidationRateCoeffStandard + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_NitriteOxidationRateCoeffStandard" + "\t" + cpp.userSoilOrganicParameters.po_NitriteOxidationRateCoeffStandard + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_TransportRateCoeff" + "\t" + cpp.userSoilOrganicParameters.po_TransportRateCoeff + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_SpecAnaerobDenitrification" + "\t" + cpp.userSoilOrganicParameters.po_SpecAnaerobDenitrification + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_ImmobilisationRateCoeffNO3" + "\t" + cpp.userSoilOrganicParameters.po_ImmobilisationRateCoeffNO3 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_ImmobilisationRateCoeffNH4" + "\t" + cpp.userSoilOrganicParameters.po_ImmobilisationRateCoeffNH4 + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_Denit1" + "\t" + cpp.userSoilOrganicParameters.po_Denit1 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_Denit2" + "\t" + cpp.userSoilOrganicParameters.po_Denit2 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_Denit3" + "\t" + cpp.userSoilOrganicParameters.po_Denit3 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_HydrolysisKM" + "\t" + cpp.userSoilOrganicParameters.po_HydrolysisKM + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_ActivationEnergy" + "\t" + cpp.userSoilOrganicParameters.po_ActivationEnergy + endl;

  parameter_output += "userSoilOrganicParameters" + "\t" + "po_HydrolysisP1" + "\t" + cpp.userSoilOrganicParameters.po_HydrolysisP1 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_HydrolysisP2" + "\t" + cpp.userSoilOrganicParameters.po_HydrolysisP2 + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_AtmosphericResistance" + "\t" + cpp.userSoilOrganicParameters.po_AtmosphericResistance + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_N2OProductionRate" + "\t" + cpp.userSoilOrganicParameters.po_N2OProductionRate + endl;
  parameter_output += "userSoilOrganicParameters" + "\t" + "po_Inhibitor_NH3" + "\t" + cpp.userSoilOrganicParameters.po_Inhibitor_NH3 + endl;

  parameter_output += endl;

  fs.writeFileSync(fileName, parameter_output, { encoding: 'utf8' });

};



var SoilLayer = function (vs_LayerThickness, sps, cpp) {

  if (DEBUG) debug(arguments);

  var that = this;

  // JS! Contructor with 0 arguments. Only used in SoilTemperature (ground and bottom layer)
  if (arguments.length === 0) {

    this.vs_SoilSandContent = 0.90;
    this.vs_SoilClayContent = 0.05;
    this.vs_SoilStoneContent = 0;
    this.vs_SoilTexture = "Ss";
    this.vs_SoilpH = 7;
    this.vs_SoilMoistureOld_m3 = 0.25;
    this.vs_SoilWaterFlux = 0;
    this.vs_Lambda = 0.5;
    this.vs_FieldCapacity = 0.21;
    this.vs_Saturation = 0.43;
    this.vs_PermanentWiltingPoint = 0.08;
    this.vs_SOM_Slow = 0;
    this.vs_SOM_Fast = 0;
    this.vs_SMB_Slow = 0;
    this.vs_SMB_Fast = 0;
    this.vs_SoilCarbamid = 0;
    this.vs_SoilNH4 = 0.0001;
    this.vs_SoilNO2 = 0.001;
    this.vs_SoilNO3 = 0.001;
    this.vs_SoilFrozen = false;
    var _vs_SoilOrganicCarbon = -1.0;
    var _vs_SoilOrganicMatter = -1.0;
    var _vs_SoilBulkDensity = 0;
    var _vs_SoilMoisture_pF = -1;
    var vs_SoilMoisture_m3 = 0.25;
    var vs_SoilTemperature = 0;
    this.vo_AOM_Pool = [];

    // JV! initialized with default instead of real user values
    var centralParameterProvider = new CentralParameterProvider(); // JS!
    this.vs_SoilMoisture_m3 = this.vs_FieldCapacity * centralParameterProvider.userInitValues.p_initPercentageFC;
    this.vs_SoilMoistureOld_m3 = this.vs_FieldCapacity * centralParameterProvider.userInitValues.p_initPercentageFC;
    this.vs_SoilNO3 = centralParameterProvider.userInitValues.p_initSoilNitrate;
    this.vs_SoilNH4 = centralParameterProvider.userInitValues.p_initSoilAmmonium;

  } else {

    if (arguments.length !== 3 || !(arguments[2] instanceof CentralParameterProvider))
      throw arguments;

    this.vs_LayerThickness = vs_LayerThickness;
    this.vs_SoilSandContent = sps.vs_SoilSandContent;
    this.vs_SoilClayContent = sps.vs_SoilClayContent;
    this.vs_SoilStoneContent = sps.vs_SoilStoneContent;
    this.vs_SoilTexture = sps.vs_SoilTexture;
    this.vs_SoilpH = sps.vs_SoilpH;
    this.vs_SoilMoistureOld_m3 = 0.25; // QUESTION - Warum wird hier mit 0.25 initialisiert?
    this.vs_SoilWaterFlux = 0;
    this.vs_Lambda = sps.vs_Lambda;
    this.vs_FieldCapacity = sps.vs_FieldCapacity;
    this.vs_Saturation = sps.vs_Saturation;
    this.vs_PermanentWiltingPoint = sps.vs_PermanentWiltingPoint;
    this.vs_SOM_Slow = 0;
    this.vs_SOM_Fast = 0;
    this.vs_SMB_Slow = 0;
    this.vs_SMB_Fast = 0;
    this.vs_SoilCarbamid = 0;
    this.vs_SoilNH4 = 0.0001;
    this.vs_SoilNO2 = 0.001;
    this.vs_SoilNO3 = 0.005;
    this.vs_SoilFrozen = false;
    this.centralParameterProvider = cpp;
    var _vs_SoilOrganicCarbon = sps.vs_SoilOrganicCarbon();
    var _vs_SoilOrganicMatter = sps.vs_SoilOrganicMatter();
    var _vs_SoilBulkDensity = sps.vs_SoilBulkDensity();
    var _vs_SoilMoisture_pF = 0;
    var vs_SoilMoisture_m3 = 0.25; // QUESTION - Warum wird hier mit 0.25 initialisiert?
    var vs_SoilTemperature = 0;
    this.vo_AOM_Pool = [];

    if (!((_vs_SoilOrganicCarbon - (_vs_SoilOrganicMatter * organicConstants.po_SOM_to_C)) < 0.00001))
      throw "_vs_SoilOrganicCarbon - (_vs_SoilOrganicMatter * organicConstants.po_SOM_to_C)) < 0.00001)";

    vs_SoilMoisture_m3 = this.vs_FieldCapacity * cpp.userInitValues.p_initPercentageFC;
    this.vs_SoilMoistureOld_m3 = this.vs_FieldCapacity * cpp.userInitValues.p_initPercentageFC;

    if (sps.vs_SoilAmmonium < 0.0)
      this.vs_SoilNH4 = cpp.userInitValues.p_initSoilAmmonium;
    else
      this.vs_SoilNH4 = sps.vs_SoilAmmonium; // kg m-3

    if (sps.vs_SoilNitrate < 0.0)
      this.vs_SoilNO3 = cpp.userInitValues.p_initSoilNitrate;
    else
      this.vs_SoilNO3 = sps.vs_SoilNitrate;  // kg m-3

  }

  /**
   * @brief Returns value for soil organic carbon.
   *
   * If value for soil organic matter is not defined, because DB does not
   * contain the according value, than the store value for organic carbon
   * is returned. If the soil organic matter parameter is defined,
   * than the value for soil organic carbon is calculated depending on
   * the soil organic matter.
   *
   * @return Value for soil organic carbon
   */
  var vs_SoilOrganicCarbon = function () {
    // if soil organic carbon is not defined, than calculate from soil organic
    // matter value [kg C kg-1]
    if(_vs_SoilOrganicCarbon >= 0.0) {
      return _vs_SoilOrganicCarbon;
    }
    // calculate soil organic carbon with soil organic matter parameter
    return _vs_SoilOrganicMatter * organicConstants.po_SOM_to_C;
  };

  /**
   * @brief Returns value for soil organic matter.
   *
   * If the value for soil organic carbon is not defined, because the DB does
   * not contain any value, than the stored value for organic matter
   * is returned. If the soil organic carbon parameter is defined,
   * than the value for soil organic matter is calculated depending on
   * the soil organic carbon.
   *
   * @return Value for soil organic matter
   * */
  var vs_SoilOrganicMatter = function () {
    // if soil organic matter is not defined, calculate from soil organic C
    if(_vs_SoilOrganicMatter >= 0.0) {
      return _vs_SoilOrganicMatter;
    }

    // ansonsten berechne den Wert aus dem C-Gehalt
    return (_vs_SoilOrganicCarbon / organicConstants.po_SOM_to_C); //[kg C kg-1]
  };

  /**
   * @brief Returns fraction of silt content of the layer.
   *
   * Calculates the silt particle size fraction in the layer in dependence
   * of its sand and clay content.
   *
   * @return Fraction of silt in the layer.
   */
  var vs_SoilSiltContent = function () {
    return (1 - that.vs_SoilSandContent - that.vs_SoilClayContent);
  };

  /**
   * Soil layer's moisture content, expressed as logarithm of
   * pressure head in cm water column. Algorithm of Van Genuchten is used.
   * Conversion of water saturation into soil-moisture tension.
   *
   * @todo Einheiten prüfen
   */
  var calc_vs_SoilMoisture_pF = function () {
    /** Derivation of Van Genuchten parameters (Vereecken at al. 1989) */
    //TODO Einheiten prüfen
    var vs_ThetaR;
    var vs_ThetaS;

    if (that.vs_PermanentWiltingPoint > 0.0){
      vs_ThetaR = that.vs_PermanentWiltingPoint;
    } else {
      vs_ThetaR = get_PermanentWiltingPoint();
    }

    if (that.vs_Saturation > 0.0){
      vs_ThetaS = that.vs_Saturation;
    } else {
      vs_ThetaS = get_Saturation();
    }

    var vs_VanGenuchtenAlpha = exp(-2.486 + (2.5 * that.vs_SoilSandContent)
                                      - (35.1 * vs_SoilOrganicCarbon())
                                      - (2.617 * (vs_SoilBulkDensity() / 1000.0))
              - (2.3 * that.vs_SoilClayContent));

    var vs_VanGenuchtenM = 1.0;

    var vs_VanGenuchtenN = exp(0.053
                                  - (0.9 * that.vs_SoilSandContent)
                                  - (1.3 * that.vs_SoilClayContent)
          + (1.5 * (pow(that.vs_SoilSandContent, 2.0))));


    /** Van Genuchten retention curve */
    var vs_MatricHead;

    if(get_Vs_SoilMoisture_m3() <= vs_ThetaR) {
      vs_MatricHead = 5.0E+7;
      //else  d_MatricHead = (1.0 / vo_VanGenuchtenAlpha) * (pow(((1 / (pow(((d_SoilMoisture_m3 - d_ThetaR) /
       //                     (d_ThetaS - d_ThetaR)), (1 / vo_VanGenuchtenM)))) - 1), (1 / vo_VanGenuchtenN)));
    }   else {
      vs_MatricHead = (1.0 / vs_VanGenuchtenAlpha)
        * (pow(
            (
                (pow(
                      (
                        (vs_ThetaS - vs_ThetaR) / (get_Vs_SoilMoisture_m3() - vs_ThetaR)
                      ),
                      (
                         1 / vs_VanGenuchtenM
                      )
                    )
                )
                - 1
             ),
             (1 / vs_VanGenuchtenN)
             )
        );
    }

    _vs_SoilMoisture_pF = log10(vs_MatricHead);

    /* set _vs_SoilMoisture_pF to "small" number in case of vs_Theta "close" to vs_ThetaS (vs_Psi < 1 -> log(vs_Psi) < 0) */
    _vs_SoilMoisture_pF = (_vs_SoilMoisture_pF < 0.0) ? 5.0E-7 : _vs_SoilMoisture_pF; 

  };

  /**
   * Soil layer's water content at field capacity (1.8 < pF < 2.1) [m3 m-3]
   *
   * This method applies only in the case when soil charcteristics have not
   * been set before.
   *
   * In german: "Maximaler Wassergehalt, der gegen die Wirkung der
   * Schwerkraft zurückgehalten wird"
   *
   * @todo Einheiten prüfen
   */
  var get_FieldCapacity = function () {

    //***** Derivation of Van Genuchten parameters (Vereecken at al. 1989) *****
    if (that.vs_SoilTexture == "") {
  //    cout << "Field capacity is calculated from van Genuchten parameters" << endl;
      var vs_ThetaR;
      var vs_ThetaS;

      if (that.vs_PermanentWiltingPoint > 0.0){
        vs_ThetaR = that.vs_PermanentWiltingPoint;
      } else {
        vs_ThetaR = get_PermanentWiltingPoint();
      }

      if (that.vs_Saturation > 0.0){
        vs_ThetaS = that.vs_Saturation;
      } else {
        vs_ThetaS = get_Saturation();
      }

      var vs_VanGenuchtenAlpha = exp(-2.486
                + 2.5 * that.vs_SoilSandContent
                - 35.1 * vs_SoilOrganicCarbon()
                - 2.617 * (vs_SoilBulkDensity() / 1000.0)
                - 2.3 * that.vs_SoilClayContent);

      var vs_VanGenuchtenM = 1.0;

      var vs_VanGenuchtenN = exp(0.053
            - 0.9 * that.vs_SoilSandContent
            - 1.3 * that.vs_SoilClayContent
            + 1.5 * (pow(that.vs_SoilSandContent, 2.0)));

      //***** Van Genuchten retention curve to calculate volumetric water content at
      //***** moisture equivalent (Field capacity definition KA5)

      var vs_FieldCapacity_pF = 2.1;
      if ((that.vs_SoilSandContent > 0.48) && (that.vs_SoilSandContent <= 0.9) && (that.vs_SoilClayContent <= 0.12))
        vs_FieldCapacity_pF = 2.1 - (0.476 * (that.vs_SoilSandContent - 0.48));
      else if ((that.vs_SoilSandContent > 0.9) && (that.vs_SoilClayContent <= 0.05))
        vs_FieldCapacity_pF = 1.9;
      else if (that.vs_SoilClayContent > 0.45)
        vs_FieldCapacity_pF = 2.5;
      else if ((that.vs_SoilClayContent > 0.30) && (that.vs_SoilSandContent < 0.2))
        vs_FieldCapacity_pF = 2.4;
      else if (that.vs_SoilClayContent > 0.35)
        vs_FieldCapacity_pF = 2.3;
      else if ((that.vs_SoilClayContent > 0.25) && (that.vs_SoilSandContent < 0.1))
        vs_FieldCapacity_pF = 2.3;
      else if ((that.vs_SoilClayContent > 0.17) && (that.vs_SoilSandContent > 0.68))
        vs_FieldCapacity_pF = 2.2;
      else if ((that.vs_SoilClayContent > 0.17) && (that.vs_SoilSandContent < 0.33))
        vs_FieldCapacity_pF = 2.2;
      else if ((that.vs_SoilClayContent > 0.08) && (that.vs_SoilSandContent < 0.27))
        vs_FieldCapacity_pF = 2.2;
      else if ((that.vs_SoilClayContent > 0.25) && (that.vs_SoilSandContent < 0.25))
        vs_FieldCapacity_pF = 2.2;

      var vs_MatricHead = pow(10, vs_FieldCapacity_pF);

      that.vs_FieldCapacity = vs_ThetaR + ((vs_ThetaS - vs_ThetaR) /
              (pow((1.0 + pow((vs_VanGenuchtenAlpha * vs_MatricHead),
              vs_VanGenuchtenN)), vs_VanGenuchtenM)));

      that.vs_FieldCapacity *= (1.0 - that.vs_SoilStoneContent);
    }

    return that.vs_FieldCapacity;

  };

  /**
   * Soil layer's water content at full saturation (pF=0.0) [m3 m-3].
   * Uses empiric calculation of Van Genuchten. *
   *
   * In german:  Wassergehalt bei maximaler Füllung des Poren-Raums
   *
   * @return Water content at full saturation
   */
  var get_Saturation = function () {
    
    if (that.vs_SoilTexture == "") {
      that.vs_Saturation = 0.81 - 0.283 * (vs_SoilBulkDensity() / 1000.0) + 0.1 * that.vs_SoilClayContent;

      that.vs_Saturation *= (1.0 - that.vs_SoilStoneContent);
    }
    return that.vs_Saturation;
  };

  /**
   * Soil layer's water content at permanent wilting point (pF=4.2) [m3 m-3].
   * Uses empiric calculation of Van Genuchten.
   *
   * In german: Wassergehalt des Bodens am permanenten Welkepunkt.
   *
   * @return Water content at permanent wilting point
   */
  var get_PermanentWiltingPoint = function () {

    if (that.vs_SoilTexture == "") {
  //    cout << "Permanent Wilting Point is calculated from van Genuchten parameters" << endl;
      that.vs_PermanentWiltingPoint = 0.015 + 0.5 * that.vs_SoilClayContent + 1.4 * that.vs_SoilOrganicCarbon();

      that.vs_PermanentWiltingPoint *= (1.0 - that.vs_SoilStoneContent);
    }

    return that.vs_PermanentWiltingPoint;
  };

  /**
   * Returns bulk density of soil layer [kg m-3]
   * @return bulk density of soil layer [kg m-3]
   */
  var vs_SoilBulkDensity = function () {
    return _vs_SoilBulkDensity;
  };

  var set_SoilOrganicMatter =  function (som) {
    _vs_SoilOrganicMatter = som;
  };

  /**
   * Sets value for soil organic carbon.
   * @param soc New value for soil organic carbon.
   */
  var set_SoilOrganicCarbon =  function (soc) {
    _vs_SoilOrganicCarbon = soc;
  };


  /**
   * Returns pH value of soil layer
   * @return pH value of soil layer [ ]
   */
  var get_SoilpH =  function () {
    return that.vs_SoilpH;
  };

  /**
   * Returns soil water pressure head as common logarithm pF.
   * @return soil water pressure head [pF]
   */
  var vs_SoilMoisture_pF =  function () {
    calc_vs_SoilMoisture_pF();
    return _vs_SoilMoisture_pF;
  };

  /**
   * Returns soil ammonium content.
   * @return soil ammonium content [kg N m-3]
   */
  var get_SoilNH4 = function () { return this.vs_SoilNH4; };

  /**
   * Returns soil nitrite content.
   * @return soil nitrite content [kg N m-3]
   */
  var get_SoilNO2 = function () { return this.vs_SoilNO2; };

  /**
   * Returns soil nitrate content.
   * @return soil nitrate content [kg N m-3]
   */
  var get_SoilNO3 = function () { return this.vs_SoilNO3; };

  /**
   * Returns soil carbamide content.
   * @return soil carbamide content [kg m-3]
   */
  var get_SoilCarbamid = function () { return this.vs_SoilCarbamid; };

  /**
   * Returns soil mineral N content.
   * @return soil mineral N content [kg m-3]
   */
  var get_SoilNmin = function () { return this.vs_SoilNO3 + this.vs_SoilNO2 + this.vs_SoilNH4; };
  var get_Vs_SoilMoisture_m3 = function () { return vs_SoilMoisture_m3; };
  var set_Vs_SoilMoisture_m3 = function (ms) { /*debug('set_Vs_SoilMoisture_m3', ms);*/ vs_SoilMoisture_m3 = ms; };
  var get_Vs_SoilTemperature = function () { return vs_SoilTemperature; };
  var set_Vs_SoilTemperature = function (st) { vs_SoilTemperature = st; };
  var vs_SoilOrganicCarbon = function () { return _vs_SoilOrganicCarbon; }; /**< Soil layer's organic carbon content [kg C kg-1] */
  var vs_SoilOrganicMatter = function () { return _vs_SoilOrganicMatter; }; /**< Soil layer's organic matter content [kg OM kg-1] */
  var vs_SoilSiltContent = function () { return this.vs_SoilSiltContent; }; /**< Soil layer's silt content [kg kg-1] (Schluff) */

  return {
    // anorganische Stickstoff-Formen
    calc_vs_SoilMoisture_pF: calc_vs_SoilMoisture_pF,
    centralParameterProvider: this.centralParameterProvider,
    get_FieldCapacity: get_FieldCapacity,
    get_PermanentWiltingPoint: get_PermanentWiltingPoint,
    get_Saturation: get_Saturation,
    get_SoilCarbamid: get_SoilCarbamid,
    get_SoilNH4: get_SoilNH4,
    get_SoilNmin: get_SoilNmin,
    get_SoilNO2: get_SoilNO2,
    get_SoilNO3: get_SoilNO3,
    get_SoilpH: get_SoilpH,
    get_Vs_SoilMoisture_m3: get_Vs_SoilMoisture_m3,
    get_Vs_SoilTemperature: get_Vs_SoilTemperature,
    set_SoilOrganicCarbon: set_SoilOrganicCarbon,
    set_SoilOrganicMatter: set_SoilOrganicMatter,
    set_Vs_SoilMoisture_m3: set_Vs_SoilMoisture_m3,
    set_Vs_SoilTemperature: set_Vs_SoilTemperature,
    vo_AOM_Pool: this.vo_AOM_Pool, /**< List of different added organic matter pools in soil layer */
    vs_FieldCapacity: this.vs_FieldCapacity,
    vs_Lambda: this.vs_Lambda, /**< Soil water conductivity coefficient [] */
    vs_LayerThickness: this.vs_LayerThickness, /**< Soil layer's vertical extension [m] */
    vs_PermanentWiltingPoint: this.vs_PermanentWiltingPoint,
    vs_Saturation: this.vs_Saturation,
    vs_SMB_Fast: this.vs_SMB_Fast, /**< C content of soil microbial biomass fast pool size [kg C m-3] */
    vs_SMB_Slow: this.vs_SMB_Slow, /**< C content of soil microbial biomass slow pool size [kg C m-3] */
    vs_SoilBulkDensity: vs_SoilBulkDensity,
    vs_SoilCarbamid: this.vs_SoilCarbamid, /**< Soil layer's carbamide-N content [kg Carbamide-N m-3] */
    vs_SoilClayContent: this.vs_SoilClayContent, /**< Soil layer's clay content [kg kg-1] (Ton) */
    vs_SoilFrozen: this.vs_SoilFrozen,
    vs_SoilMoisture_pF: vs_SoilMoisture_pF,
    vs_SoilMoistureOld_m3: this.vs_SoilMoistureOld_m3, /**< Soil layer's moisture content of previous day [m3 m-3] */
    vs_SoilNH4: this.vs_SoilNH4, /**< Soil layer's NH4-N content [kg NH4-N m-3] */
    vs_SoilNO2: this.vs_SoilNO2, /**< Soil layer's NO2-N content [kg NO2-N m-3] */
    vs_SoilNO3: this.vs_SoilNO3, /**< Soil layer's NO3-N content [kg NO3-N m-3] */
    vs_SoilOrganicCarbon: vs_SoilOrganicCarbon,
    vs_SoilOrganicMatter: vs_SoilOrganicMatter,
    vs_SoilpH: this.vs_SoilpH, /**< Soil pH value [] */
    vs_SoilSandContent: this.vs_SoilSandContent, /**< Soil layer's sand content [kg kg-1] */
    vs_SoilSiltContent: vs_SoilSiltContent,
    vs_SoilStoneContent: this.vs_SoilStoneContent, /**< Soil layer's stone content in soil [kg kg-1] */
    vs_SoilTexture: this.vs_SoilTexture,
    vs_SoilWaterFlux: this.vs_SoilWaterFlux, /**< Water flux at the upper boundary of the soil layer [l m-2] */
    vs_SOM_Fast: this.vs_SOM_Fast, /**< C content of soil organic matter fast pool size [kg C m-3] */
    vs_SOM_Slow: this.vs_SOM_Slow /**< C content of soil organic matter slow pool [kg C m-3] */
  };

};



var SoilColumn = function (gps, sp, cpp) {

  // private properties
  var that = this;
  this.generalParams = gps;
  this.soilParams = sp;
  this.centralParameterProvider = cpp;
  this.cropGrowth = null;
  this._delayedNMinApplications = []; 
  this._vf_TopDressing = 0.0;
  this._vf_TopDressingDelay = 0;
  this._vs_NumberOfOrganicLayers = 0;


  var soilColumnArray = [];
  // public properties and methods
  soilColumnArray.vs_SurfaceWaterStorage = 0.0;
  soilColumnArray.vs_InterceptionStorage = 0.0;
  soilColumnArray.vm_GroundwaterTable = 0;
  soilColumnArray.vs_FluxAtLowerBoundary = 0.0;
  soilColumnArray.vq_CropNUptake = 0.0;
  soilColumnArray.vs_SoilLayers = [];

  logger(MSG.INFO, "Constructor: SoilColumn "  + sp.length);

  for (var i = 0; i < this.soilParams.length; i++) {
    var layer = new SoilLayer(gps.ps_LayerThickness[0], sp[i], cpp);
    soilColumnArray.vs_SoilLayers.push(layer);
    soilColumnArray[i] = layer;
  }

  soilColumnArray.applyMineralFertiliser = function (fp, amount) {

    // C++
    // [kg N ha-1 -> kg m-3]
    // soilLayer(0).vs_SoilNO3 += amount * fp.getNO3() / 10000.0 / soilLayer(0).vs_LayerThickness;
    // soilLayer(0).vs_SoilNH4 += amount * fp.getNH4() / 10000.0 / soilLayer(0).vs_LayerThickness;
    // soilLayer(0).vs_SoilCarbamid += amount * fp.getCarbamid() / 10000.0 / soilLayer(0).vs_LayerThickness;

    // JS
    // [kg N ha-1 -> kg m-3]
    this[0].vs_SoilNO3 += amount * fp.getNO3() / 10000.0 / this[0].vs_LayerThickness;
    this[0].vs_SoilNH4 += amount * fp.getNH4() / 10000.0 / this[0].vs_LayerThickness;
    this[0].vs_SoilCarbamid += amount * fp.getCarbamid() / 10000.0 / this[0].vs_LayerThickness;

    if (this[0].vs_SoilNH4 < 0)
      throw this[0].vs_SoilNH4;
  };

  // prüft ob top-dressing angewendet werden sollte, ansonsten wird
  // zeitspanne nur reduziert

  /**
   * Tests for every calculation step if a delayed fertilising should be applied.
   * If not, the delay time will be decremented. Otherwise the surplus fertiliser
   * stored in _vf_TopDressing is applied.
   *
   * @see ApplyFertiliser
   */
  soilColumnArray.applyPossibleTopDressing = function () {
    // do nothing if there is no active delay time
    if (that._vf_TopDressingDelay > 0) {
      // if there is a delay time, decrement this value for this time step
      that._vf_TopDressingDelay--;
      // test if now is the correct time for applying top dressing
      if (that._vf_TopDressingDelay == 0) {
        var amount = that._vf_TopDressing;
        this.applyMineralFertiliser(that._vf_TopDressingPartition, amount);
        that._vf_TopDressing = 0;
        return amount;
      }
    }
    return 0.0;
  };


  /**
   * Calls function for applying delayed fertilizer and
   * then removes the first fertilizer item in list.
   */
  soilColumnArray.applyPossibleDelayedFerilizer = function () {
    var delayedApps = that._delayedNMinApplications;
    var n_amount = 0.0;
    while(!delayedApps.length === 0) {
      n_amount += delayedApps[0].func.apply(this, delayedApps[0].args);
      delayedApps.shift();
      // JS: delayedApps === _delayedNMinApplications
      if (DEBUG && delayedApps != _delayedNMinApplications)
        throw delayedApps;
      // _delayedNMinApplications.shift();
    }
    return n_amount;
  };


  /**
   * Method for calculating fertilizer demand from crop demand and soil mineral
   * status (Nmin method).
   *
   * @param fp
   * @param vf_SamplingDepth
   * @param vf_CropNTarget N availability required by the crop down to rooting depth
   * @param vf_CropNTarget30 N availability required by the crop down to 30 cm
   * @param vf_FertiliserMaxApplication Maximal value of N that can be applied until the crop will be damaged
   * @param vf_FertiliserMinApplication Threshold value for economically reasonable fertilizer application
   * @param vf_TopDressingDelay Number of days for which the application of surplus fertilizer is delayed
   */
  soilColumnArray.applyMineralFertiliserViaNMinMethod = function (
    fp,
    vf_SamplingDepth,
    vf_CropNTarget,
    vf_CropNTarget30,
    vf_FertiliserMinApplication,
    vf_FertiliserMaxApplication,
    vf_TopDressingDelay 
  ) {

    // JS: soilLayer(x) === this[x]

    // Wassergehalt > Feldkapazität
    if(this[0].get_Vs_SoilMoisture_m3() > this[0].get_FieldCapacity()) {
      that._delayedNMinApplications.push({
        func: this.applyMineralFertiliserViaNMinMethod,
        args: [fp, vf_SamplingDepth, vf_CropNTarget, vf_CropNTarget30, vf_FertiliserMinApplication, vf_FertiliserMaxApplication, vf_TopDressingDelay]
      });
      logger(MSG.WARN, "Soil too wet for fertilisation. Fertiliser event adjourned to next day.");
      return 0.0;
    }

    var vf_SoilNO3Sum = 0.0;
    var vf_SoilNO3Sum30 = 0.0;
    var vf_SoilNH4Sum = 0.0;
    var vf_SoilNH4Sum30 = 0.0;
    var vf_Layer30cm = this.getLayerNumberForDepth(0.3);

    // JS
    var i_Layers = ceil(vf_SamplingDepth / this[i_Layer].vs_LayerThickness);
    for (var i_Layer = 0; i_Layer < i_Layers; i_Layer++) {
      //vf_TargetLayer is in cm. We want number of layers
      vf_SoilNO3Sum += this[i_Layer].vs_SoilNO3; //! [kg N m-3]
      vf_SoilNH4Sum += this[i_Layer].vs_SoilNH4; //! [kg N m-3]
    }

    // Same calculation for a depth of 30 cm
    /** @todo Must be adapted when using variable layer depth. */
    for(var i_Layer = 0; i_Layer < vf_Layer30cm; i_Layer++) {
      vf_SoilNO3Sum30 += this[i_Layer].vs_SoilNO3; //! [kg N m-3]
      vf_SoilNH4Sum30 += this[i_Layer].vs_SoilNH4; //! [kg N m-3]
    }

    // Converts [kg N ha-1] to [kg N m-3]
    var vf_CropNTargetValue = vf_CropNTarget / 10000.0 / this[0].vs_LayerThickness;

    // Converts [kg N ha-1] to [kg N m-3]
    var vf_CropNTargetValue30 = vf_CropNTarget30 / 10000.0 / this[0].vs_LayerThickness;

    var vf_FertiliserDemandVol = vf_CropNTargetValue - (vf_SoilNO3Sum + vf_SoilNH4Sum);
    var vf_FertiliserDemandVol30 = vf_CropNTargetValue30 - (vf_SoilNO3Sum30 + vf_SoilNH4Sum30);

    // Converts fertiliser demand back from [kg N m-3] to [kg N ha-1]
    var vf_FertiliserDemand = vf_FertiliserDemandVol * 10000.0 * this[0].vs_LayerThickness;
    var vf_FertiliserDemand30 = vf_FertiliserDemandVol30 * 10000.0 * this[0].vs_LayerThickness;

    var vf_FertiliserRecommendation = max(vf_FertiliserDemand, vf_FertiliserDemand30);

    if (vf_FertiliserRecommendation < vf_FertiliserMinApplication) {
      // If the N demand of the crop is smaller than the user defined
      // minimum fertilisation then no need to fertilise
      vf_FertiliserRecommendation = 0.0;
      logger(MSG.WARN, "Fertiliser demand below minimum application value. No fertiliser applied.");
    }

    if( vf_FertiliserRecommendation > vf_FertiliserMaxApplication) {
      // If the N demand of the crop is greater than the user defined
      // maximum fertilisation then need to split so surplus fertilizer can
      // be applied after a delay time
      that._vf_TopDressing = vf_FertiliserRecommendation - vf_FertiliserMaxApplication;
      that._vf_TopDressingPartition = fp;
      that._vf_TopDressingDelay = vf_TopDressingDelay;
      vf_FertiliserRecommendation = vf_FertiliserMaxApplication;
      logger(MSG.WARN, 
        "Fertiliser demand above maximum application value. " +
        "A top dressing of " + _vf_TopDressing + " " + 
        "will be applied from now on day" + vf_TopDressingDelay + "."
       );
    }

    //Apply fertiliser
    this.applyMineralFertiliser(fp, vf_FertiliserRecommendation);

    logger(MSG.INFO, "SoilColumn::applyMineralFertiliserViaNMinMethod:\t" + vf_FertiliserRecommendation);

    //apply the callback to all of the fertiliser, even though some if it
    //(the top-dressing) will only be applied later
    //we simply assume it really will be applied, in the worst case
    //the delay is so long, that the crop is already harvested until
    //the top-dressing will be applied
     return vf_FertiliserRecommendation;// + _vf_TopDressing);
  };

  /**
   * Method for calculating irrigation demand from soil moisture status.
   * The trigger will be activated and deactivated according to crop parameters
   * (temperature sum)
   *
   * @param vi_IrrigationThreshold
   * @return could irrigation be applied
   */
  soilColumnArray.applyIrrigationViaTrigger = function (
    vi_IrrigationThreshold,
    vi_IrrigationAmount,
    vi_IrrigationNConcentration
  ) {

    // JS: soilLayer(x) === this[x]

    //is actually only called from cropStep and thus there should always
    //be a crop
    if (that.cropGrowth === null)
      logger(MSG.ERROR, "crop is null");

    var s = that.cropGrowth.get_HeatSumIrrigationStart();
    var e = that.cropGrowth.get_HeatSumIrrigationEnd();
    var cts = that.cropGrowth.get_CurrentTemperatureSum();

    if (cts < s || cts > e) return false;

    var vi_CriticalMoistureDepth = that.centralParameterProvider.userSoilMoistureParameters.pm_CriticalMoistureDepth;

    // Initialisation
    var vi_ActualPlantAvailableWater = 0.0;
    var vi_MaxPlantAvailableWater = 0.0;
    var vi_PlantAvailableWaterFraction = 0.0;
    var vi_CriticalMoistureLayer = int(ceil(vi_CriticalMoistureDepth / this[0].vs_LayerThickness));

    for (var i_Layer = 0; i_Layer < vi_CriticalMoistureLayer; i_Layer++){
      vi_ActualPlantAvailableWater += (this[i_Layer].get_Vs_SoilMoisture_m3()
                                   - this[i_Layer].get_PermanentWiltingPoint())
                                   * this.vs_LayerThickness() * 1000.0; // [mm]
      vi_MaxPlantAvailableWater += (this[i_Layer].get_FieldCapacity()
                                   - this[i_Layer].get_PermanentWiltingPoint())
                                   * this.vs_LayerThickness() * 1000.0; // [mm]
      vi_PlantAvailableWaterFraction = vi_ActualPlantAvailableWater
                                         / vi_MaxPlantAvailableWater; // []
    }
    if (vi_PlantAvailableWaterFraction <= vi_IrrigationThreshold) {
      this.applyIrrigation(vi_IrrigationAmount, vi_IrrigationNConcentration);

      logger(MSG.INFO, 
        "applying automatic irrigation threshold: " + vi_IrrigationThreshold +
        " amount: " + vi_IrrigationAmount +
        " N concentration: " + vi_IrrigationNConcentration
      );

      return true;
    }

    return false;
  };

  /**
   * @brief Applies irrigation
   *
   * @author: Claas Nendel
   */
  soilColumnArray.applyIrrigation = function (vi_IrrigationAmount, vi_IrrigationNConcentration) {

    // JS: soilLayer(x) === this[x]

    var vi_NAddedViaIrrigation = 0.0; //[kg m-3]

    // Adding irrigation water amount to surface water storage
    this.vs_SurfaceWaterStorage += vi_IrrigationAmount; // [mm]

    vi_NAddedViaIrrigation = vi_IrrigationNConcentration * // [mg dm-3]
             vi_IrrigationAmount / //[dm3 m-2]
             this[0].vs_LayerThickness / 1000000.0; // [m]
             // [-> kg m-3]

    // Adding N from irrigation water to top soil nitrate pool
    this[0].vs_SoilNO3 += vi_NAddedViaIrrigation;
  };

  /**
   * @brief Checks and deletes AOM pool
   *
   * This method checks the content of each AOM Pool. In case the sum over all
   * layers of a respective pool is very low the pool will be deleted from the
   * list.
   *
   * @author: Claas Nendel
   */
  soilColumnArray.deleteAOMPool = function () {

    // JS: soilLayer(x) === this[x]

    for (var i_AOMPool = 0; i_AOMPool < this[0].vo_AOM_Pool.length;){

      var vo_SumAOM_Slow = 0.0;
      var vo_SumAOM_Fast = 0.0;

      for (var i_Layer = 0; i_Layer < that._vs_NumberOfOrganicLayers; i_Layer++) {
        vo_SumAOM_Slow += this[i_Layer].vo_AOM_Pool[i_AOMPool].vo_AOM_Slow;
        vo_SumAOM_Fast += this[i_Layer].vo_AOM_Pool[i_AOMPool].vo_AOM_Fast;
      }

      //cout << "Pool " << i_AOMPool << " -> Slow: " << vo_SumAOM_Slow << "; Fast: " << vo_SumAOM_Fast << endl;

      if ((vo_SumAOM_Slow + vo_SumAOM_Fast) < 0.00001) {
        for (var i_Layer = 0; i_Layer < that._vs_NumberOfOrganicLayers; i_Layer++){
          var it_AOMPool = 0; // TODO: Korrekt in JS? Konstruktion nicht klar
          it_AOMPool += i_AOMPool;
          this[i_Layer].vo_AOM_Pool.splice(it_AOMPool, 1);
        }
        //cout << "Habe Pool " << i_AOMPool << " gelöscht" << endl;
      } else {
        i_AOMPool++;
      }
    }

  };

  soilColumnArray.vs_NumberOfLayers = function () {
    return this.length;
  };

  /**
   * Applies tillage to effected layers. Parameters for effected soil layers
   * are averaged.
   * @param depth Depth of affected soil.
   */
  soilColumnArray.applyTillage = function (depth) {

    // JS: soilLayer(x) === this[x]

    var layer_index = this.getLayerNumberForDepth(depth) + 1;

    var soil_organic_carbon = 0.0;
    var soil_organic_matter = 0.0;
    var soil_temperature = 0.0;
    var soil_moisture = 0.0;
    var soil_moistureOld = 0.0;
    var som_slow = 0.0;
    var som_fast = 0.0;
    var smb_slow = 0.0;
    var smb_fast = 0.0;
    var carbamid = 0.0;
    var nh4 = 0.0;
    var no2 = 0.0;
    var no3 = 0.0;

    // add up all parameters that are affected by tillage
    for (var i = 0; i < layer_index; i++) {
      // debug('SoilColumn::applyTillage layer i:', i);
      soil_organic_carbon += this[i].vs_SoilOrganicCarbon();
      soil_organic_matter += this[i].vs_SoilOrganicMatter();
      soil_temperature += this[i].get_Vs_SoilTemperature();
      soil_moisture += this[i].get_Vs_SoilMoisture_m3();
      soil_moistureOld += this[i].vs_SoilMoistureOld_m3;
      som_slow += this[i].vs_SOM_Slow;
      som_fast += this[i].vs_SOM_Fast;
      smb_slow += this[i].vs_SMB_Slow;
      smb_fast += this[i].vs_SMB_Fast;
      carbamid += this[i].vs_SoilCarbamid;
      nh4 += this[i].vs_SoilNH4;
      no2 += this[i].vs_SoilNO2;
      no3 += this[i].vs_SoilNO3;
    }

    if (this[0].vs_SoilNH4 < 0)
      throw this[0].vs_SoilNH4;
    if (this[0].vs_SoilNO2 < 0)
      throw this[0].vs_SoilNO2;
    if (this[0].vs_SoilNO3 < 0)
      throw this[0].vs_SoilNO3;

    // calculate mean value of accumulated soil paramters
    soil_organic_carbon = soil_organic_carbon / layer_index;
    soil_organic_matter = soil_organic_matter / layer_index;
    soil_temperature = soil_temperature / layer_index;
    soil_moisture = soil_moisture / layer_index;
    soil_moistureOld = soil_moistureOld / layer_index;
    som_slow = som_slow / layer_index;
    som_fast = som_fast / layer_index;
    smb_slow = smb_slow / layer_index;
    smb_fast = smb_fast / layer_index;
    carbamid = carbamid / layer_index;
    nh4 = nh4 / layer_index;
    no2 = no2 / layer_index;
    no3 = no3 / layer_index;

    // debug('SoilColumn::layer_index', layer_index);

    // use calculated mean values for all affected layers
    for (var i = 0; i < layer_index; i++) {

      //assert((soil_organic_carbon - (soil_organic_matter * organicConstants.po_SOM_to_C)) < 0.00001);
      this[i].set_SoilOrganicCarbon(soil_organic_carbon);
      this[i].set_SoilOrganicMatter(soil_organic_matter);
      this[i].set_Vs_SoilTemperature(soil_temperature);
      // debug('call: SoilColumn::this[i].set_Vs_SoilMoisture_m3(soil_moisture) i=' + i);
      this[i].set_Vs_SoilMoisture_m3(soil_moisture);
      this[i].vs_SoilMoistureOld_m3 = soil_moistureOld;
      this[i].vs_SOM_Slow = som_slow;
      this[i].vs_SOM_Fast = som_fast;
      this[i].vs_SMB_Slow = smb_slow;
      this[i].vs_SMB_Fast = smb_fast;
      this[i].vs_SoilCarbamid = carbamid;
      this[i].vs_SoilNH4 = nh4;
      this[i].vs_SoilNO2 = no2;
      this[i].vs_SoilNO3 = no3;
      
      if (this[i].vs_SoilNH4 < 0)
        throw this[i].vs_SoilNH4;
      if (this[i].vs_SoilNO2 < 0)
        throw this[i].vs_SoilNO2;
      if (this[i].vs_SoilNO3 < 0)
        throw this[i].vs_SoilNO3;

    }

    // merge aom pool
    var aom_pool_count = this[0].vo_AOM_Pool.length;

    if (aom_pool_count > 0) {
      var aom_slow = new Array(aom_pool_count);
      var aom_fast = new Array(aom_pool_count);

      // initialization of aom pool accumulator
      for (var pool_index = 0; pool_index < aom_pool_count; pool_index++) {
        aom_slow[pool_index] = 0.0;
        aom_fast[pool_index] = 0.0;
      }

      layer_index = min(layer_index, this.vs_NumberOfOrganicLayers());

      //cout << "Soil parameters before applying tillage for the first "<< layer_index+1 << " layers: " << endl;

      // add up pools for affected layer with same index
      for (var j = 0; j < layer_index; j++) {
        //cout << "Layer " << j << endl << endl;

        var layer = this[j];
        var pool_index = 0;
        layer.vo_AOM_Pool.forEach(function (it_AOM_Pool) {

          aom_slow[pool_index] += it_AOM_Pool.vo_AOM_Slow;
          aom_fast[pool_index] += it_AOM_Pool.vo_AOM_Fast;

          //cout << "AOMPool " << pool_index << endl;
          //cout << "vo_AOM_Slow:\t"<< it_AOM_Pool.vo_AOM_Slow << endl;
          //cout << "vo_AOM_Fast:\t"<< it_AOM_Pool.vo_AOM_Fast << endl;

          pool_index++;
        });
      }

      //
      for (var pool_index = 0; pool_index < aom_pool_count; pool_index++) {
        aom_slow[pool_index] = aom_slow[pool_index] / (layer_index);
        aom_fast[pool_index] = aom_fast[pool_index] / (layer_index);
      }

      //cout << "Soil parameters after applying tillage for the first "<< layer_index+1 << " layers: " << endl;

      // rewrite parameters of aom pool with mean values
      for (var j = 0; j < layer_index; j++) {
        layer = this[j];
        //cout << "Layer " << j << endl << endl;
        var pool_index = 0;
        layer.vo_AOM_Pool.forEach(function (it_AOM_Pool) {

          it_AOM_Pool.vo_AOM_Slow = aom_slow[pool_index];
          it_AOM_Pool.vo_AOM_Fast = aom_fast[pool_index];

          //cout << "AOMPool " << pool_index << endl;
          //cout << "vo_AOM_Slow:\t"<< it_AOM_Pool.vo_AOM_Slow << endl;
          //cout << "vo_AOM_Fast:\t"<< it_AOM_Pool.vo_AOM_Fast << endl;

          pool_index++;
        });
      }
    }

    //cout << "soil_organic_carbon: " << soil_organic_carbon << endl;
    //cout << "soil_organic_matter: " << soil_organic_matter << endl;
    //cout << "soil_temperature: " << soil_temperature << endl;
    //cout << "soil_moisture: " << soil_moisture << endl;
    //cout << "soil_moistureOld: " << soil_moistureOld << endl;
    //cout << "som_slow: " << som_slow << endl;
    //cout << "som_fast: " << som_fast << endl;
    //cout << "smb_slow: " << smb_slow << endl;
    //cout << "smb_fast: " << smb_fast << endl;
    //cout << "carbamid: " << carbamid << endl;
    //cout << "nh4: " << nh4 << endl;
    //cout << "no3: " << no3 << endl << endl;
  };

  /**
   * Returns number of organic layers. Usually the number
   * of layers in the first 30 cm depth of soil.
   * @return Number of organic layers
   */
  soilColumnArray.vs_NumberOfOrganicLayers = function () {
    return that._vs_NumberOfOrganicLayers;
  };


  /**
   * Returns a soil layer at given Index.
   * @return Reference to a soil layer
   */
  soilColumnArray.soilLayer = function (i_Layer) {
    return this[i_Layer];
  };

  /**
   * Returns the thickness of a layer.
   * Right now by definition all layers have the same size,
   * therefor only the thickness of first layer is returned.
   *
   * @return Size of a layer
   *
   * @todo Need to be changed if different layer sizes are used.
   */
  soilColumnArray.vs_LayerThickness = function () {
    return this[0].vs_LayerThickness;
  };

  /**
   * @brief Returns daily crop N uptake [kg N ha-1 d-1]
   * @return Daily crop N uptake
   */
  soilColumnArray.get_DailyCropNUptake = function () {
    return this.vq_CropNUptake * 10000.0;
  };

  /**
   * @brief Returns index of layer that lays in the given depth.
   * @param depth Depth in meters
   * @return Index of layer
   */
  soilColumnArray.getLayerNumberForDepth = function (depth) {

    var layer = 0;
    var size= this.length;
    var accu_depth = 0;
    var layer_thickness= this[0].vs_LayerThickness;

    // find number of layer that lay between the given depth
    for (var i = 0; i < size; i++) {
      accu_depth += layer_thickness;
      if (depth <= accu_depth)
        break;
      layer++;
    }

    return layer;
  };

  /**
   * @brief Makes crop information available when needed.
   *
   * @return crop object
   */
  soilColumnArray.put_Crop = function (c) {
      that.cropGrowth = c;
  };

  /**
   * @brief Deletes crop object when not needed anymore.
   *
   * @return crop object is NULL
   */
  soilColumnArray.remove_Crop = function () {
      that.cropGrowth = null;
  };

  /**
   * Returns sum of soiltemperature for several soil layers.
   * @param layers Number of layers that are of interest
   * @return Temperature sum
   */
  soilColumnArray.sumSoilTemperature = function (layers) {
    var accu = 0.0;
    for (var i = 0; i < layers; i++)
      accu += this[i].get_Vs_SoilTemperature();
    return accu;
  };

  soilColumnArray.vs_NumberOfLayers = function () {
      return this.length;
  };



  // end soilColumnArray

  // private methods

  /**
   * @brief Calculates number of organic layers.
   *
   * Calculates number of organic layers in in in dependency on
   * the layer depth and the ps_MaxMineralisationDepth. Result is saved
   * in private member variable _vs_NumberOfOrganicLayers.
   */
  var set_vs_NumberOfOrganicLayers = function () {
    var lsum = 0;
    var count = 0;
    for (var i = 0; i < soilColumnArray.vs_NumberOfLayers(); i++) {
      count++;
      lsum += soilColumnArray.vs_SoilLayers[i].vs_LayerThickness;
      if (lsum >= that.generalParams.ps_MaxMineralisationDepth)
        break;
    }
    that._vs_NumberOfOrganicLayers = count;
  };

  // apply set_vs_NumberOfOrganicLayers
  set_vs_NumberOfOrganicLayers();

  return soilColumnArray;

};


var SoilOrganic = function (sc, gps, stps, cpp) {

  var soilColumn = sc,
      generalParams = gps,
      siteParams = stps,
      centralParameterProvider = cpp,
      vs_NumberOfLayers = sc.vs_NumberOfLayers(),
      vs_NumberOfOrganicLayers = sc.vs_NumberOfOrganicLayers(),
      addedOrganicMatter = false,
      irrigationAmount = 0,
      vo_ActDenitrificationRate = new Float64Array(sc.vs_NumberOfOrganicLayers()),  //[kg N m-3 d-1]
      vo_AOM_FastDeltaSum =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_AOM_FastInput = 0,
      vo_AOM_FastSum =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_AOM_SlowDeltaSum =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_AOM_SlowInput = 0,
      vo_AOM_SlowSum =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_CBalance =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_DecomposerRespiration = 0.0,
      vo_InertSoilOrganicC =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_N2O_Produced = 0.0,
      vo_NetEcosystemExchange = 0.0,
      vo_NetEcosystemProduction = 0.0,
      vo_NetNMineralisation = 0.0,
      vo_NetNMineralisationRate =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_Total_NH3_Volatilised = 0.0,
      vo_NH3_Volatilised = 0.0,
      vo_SMB_CO2EvolutionRate =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SMB_FastDelta =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SMB_SlowDelta =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SoilOrganicC =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SOM_FastDelta =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SOM_FastInput = 0,
      vo_SOM_SlowDelta =  new Float64Array(sc.vs_NumberOfOrganicLayers()),
      vo_SumDenitrification = 0.0,
      vo_SumNetNMineralisation = 0.0,
      vo_SumN2O_Produced = 0.0,
      vo_SumNH3_Volatilised = 0.0,
      vo_TotalDenitrification = 0.0,
      incorporation = false,
      crop = null;

      // JS! unused in cpp
      // vs_SoilMineralNContent = new Float64Array(sc.vs_NumberOfOrganicLayers()),


  // Subroutine Pool initialisation
  var po_SOM_SlowUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_SOM_SlowUtilizationEfficiency;
  var po_PartSOM_to_SMB_Slow = centralParameterProvider.userSoilOrganicParameters.po_PartSOM_to_SMB_Slow;
  var po_SOM_FastUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_SOM_FastUtilizationEfficiency;
  var po_PartSOM_to_SMB_Fast = centralParameterProvider.userSoilOrganicParameters.po_PartSOM_to_SMB_Fast;
  var po_SOM_SlowDecCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_SOM_SlowDecCoeffStandard;
  var po_SOM_FastDecCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_SOM_FastDecCoeffStandard;
  var po_PartSOM_Fast_to_SOM_Slow = centralParameterProvider.userSoilOrganicParameters.po_PartSOM_Fast_to_SOM_Slow;

  //Conversion of soil organic carbon weight fraction to volume unit
  for(var i_Layer = 0; i_Layer < vs_NumberOfOrganicLayers; i_Layer++) {

    vo_SoilOrganicC[i_Layer] = soilColumn[i_Layer].vs_SoilOrganicCarbon() * soilColumn[i_Layer].vs_SoilBulkDensity(); //[kg C kg-1] * [kg m-3] --> [kg C m-3]

    // Falloon et al. (1998): Estimating the size of the inert organic matter pool
    // from total soil oragnic carbon content for use in the Rothamsted Carbon model.
    // Soil Biol. Biochem. 30 (8/9), 1207-1211. for values in t C ha-1.
  // vo_InertSoilOrganicC is calculated back to [kg C m-3].
    vo_InertSoilOrganicC[i_Layer] = (0.049 * pow((vo_SoilOrganicC[i_Layer] // [kg C m-3]
            * soilColumn[i_Layer].vs_LayerThickness // [kg C m-2]
            / 1000 * 10000.0), 1.139)) // [t C ha-1]
          / 10000.0 * 1000.0 // [kg C m-2]
          / soilColumn[i_Layer].vs_LayerThickness; // [kg C m-3]

    vo_SoilOrganicC[i_Layer] -= vo_InertSoilOrganicC[i_Layer]; // [kg C m-3]

    // Initialisation of pool SMB_Slow [kg C m-3]
    soilColumn[i_Layer].vs_SMB_Slow = po_SOM_SlowUtilizationEfficiency
         * po_PartSOM_to_SMB_Slow * vo_SoilOrganicC[i_Layer];

    // Initialisation of pool SMB_Fast [kg C m-3]
    soilColumn[i_Layer].vs_SMB_Fast = po_SOM_FastUtilizationEfficiency
              * po_PartSOM_to_SMB_Fast * vo_SoilOrganicC[i_Layer];

    // Initialisation of pool SOM_Slow [kg C m-3]
    soilColumn[i_Layer].vs_SOM_Slow = vo_SoilOrganicC[i_Layer] / (1.0 + po_SOM_SlowDecCoeffStandard
              / (po_SOM_FastDecCoeffStandard * po_PartSOM_Fast_to_SOM_Slow));

    // Initialisation of pool SOM_Fast [kg C m-3]
    soilColumn[i_Layer].vs_SOM_Fast = vo_SoilOrganicC[i_Layer] - soilColumn[i_Layer].vs_SOM_Slow;

    // Soil Organic Matter pool update [kg C m-3]
    vo_SoilOrganicC[i_Layer] -= soilColumn[i_Layer].vs_SMB_Slow + soilColumn[i_Layer].vs_SMB_Fast;

    soilColumn[i_Layer].set_SoilOrganicCarbon((vo_SoilOrganicC[i_Layer] + vo_InertSoilOrganicC[i_Layer]) / soilColumn[i_Layer].vs_SoilBulkDensity()); // [kg C m-3] / [kg m-3] --> [kg C kg-1]

  soilColumn[i_Layer].set_SoilOrganicMatter((vo_SoilOrganicC[i_Layer] + vo_InertSoilOrganicC[i_Layer]) / organicConstants.po_SOM_to_C
              / soilColumn[i_Layer].vs_SoilBulkDensity());  // [kg C m-3] / [kg m-3] --> [kg C kg-1]


    vo_ActDenitrificationRate[i_Layer] = 0.0;
  } // for

  var step = function (
    vw_MeanAirTemperature,
    vw_Precipitation,
    vw_WindSpeed
    ) 
  {

    var vc_NetPrimaryProduction = 0.0;
    vc_NetPrimaryProduction = crop ? crop.get_NetPrimaryProduction() : 0;

    debug("vc_NetPrimaryProduction: " + vc_NetPrimaryProduction);
    debug("crop: " + crop);

    //fo_OM_Input(vo_AOM_Addition);
    fo_Urea(vw_Precipitation + irrigationAmount);
    // Mineralisation Immobilisitation Turn-Over
    fo_MIT();
    fo_Volatilisation(addedOrganicMatter, vw_MeanAirTemperature, vw_WindSpeed);
    fo_Nitrification();
    fo_Denitrification();
    fo_N2OProduction();
    fo_PoolUpdate();

    vo_NetEcosystemProduction =
            fo_NetEcosystemProduction(vc_NetPrimaryProduction, vo_DecomposerRespiration);
    vo_NetEcosystemExchange =
            fo_NetEcosystemExchange(vc_NetPrimaryProduction, vo_DecomposerRespiration);

    vo_SumNH3_Volatilised += vo_NH3_Volatilised;

    vo_SumN2O_Produced += vo_N2O_Produced;

    //clear everything for next step
    //thus in order apply irrigation water or fertiliser, this has to be
    //done before the stepping method
    irrigationAmount = 0.0;
    vo_AOM_SlowInput = 0.0;
    vo_AOM_FastInput = 0.0;
    vo_SOM_FastInput = 0.0;
    addedOrganicMatter = false;
  };

  var addOrganicMatter = function (
    params,
    amount,
    nConcentration
    )
  {
    debug("SoilOrganic: addOrganicMatter: " + params.toString());
    var vo_AddedOrganicMatterAmount = amount;
    // TODO: nConcentration is immer 0. Warum?
    var vo_AddedOrganicMatterNConcentration = nConcentration;


    var vo_AOM_DryMatterContent = params.vo_AOM_DryMatterContent;
    var vo_AOM_NH4Content = params.vo_AOM_NH4Content;
    var vo_AOM_NO3Content = params.vo_AOM_NO3Content;
    var vo_AOM_CarbamidContent = params.vo_AOM_CarbamidContent;
    var vo_PartAOM_to_AOM_Slow = params.vo_PartAOM_to_AOM_Slow;
    var vo_PartAOM_to_AOM_Fast = params.vo_PartAOM_to_AOM_Fast;
    var vo_CN_Ratio_AOM_Slow = params.vo_CN_Ratio_AOM_Slow;
    var vo_CN_Ratio_AOM_Fast = params.vo_CN_Ratio_AOM_Fast;

    var po_AOM_FastMaxC_to_N = centralParameterProvider.userSoilOrganicParameters.po_AOM_FastMaxC_to_N;

    //urea
    if(soilColumn.vs_NumberOfOrganicLayers() > 0) {
      // kg N m-3 soil
      soilColumn[0].vs_SoilCarbamid += vo_AddedOrganicMatterAmount
               * vo_AOM_DryMatterContent * vo_AOM_CarbamidContent
               / 10000.0 / soilColumn[0].vs_LayerThickness;
    }

    var vo_AddedOrganicCarbonAmount = 0.0;
    var vo_AddedOrganicNitrogenAmount = 0.0;

    //MIT
    var nools = soilColumn.vs_NumberOfOrganicLayers();
    
    for(var i_Layer = 0; i_Layer < nools; i_Layer++) {
      //New AOM pool
      if(i_Layer == 0) {
        var aom_pool = new AOM_Properties();

        aom_pool.vo_DaysAfterApplication = 0;
        aom_pool.vo_AOM_DryMatterContent = vo_AOM_DryMatterContent;
        aom_pool.vo_AOM_NH4Content = vo_AOM_NH4Content;
        aom_pool.vo_AOM_Slow = 0.0;
        aom_pool.vo_AOM_Fast = 0.0;
        aom_pool.vo_AOM_SlowDecCoeffStandard = params.vo_AOM_SlowDecCoeffStandard;
        aom_pool.vo_AOM_FastDecCoeffStandard = params.vo_AOM_FastDecCoeffStandard;
        aom_pool.vo_CN_Ratio_AOM_Slow = vo_CN_Ratio_AOM_Slow;
        aom_pool.incorporation = incorporation;

        // Converting AOM from kg FM OM ha-1 to kg C m-3
        vo_AddedOrganicCarbonAmount = vo_AddedOrganicMatterAmount * vo_AOM_DryMatterContent * organicConstants.po_AOM_to_C
              / 10000.0 / soilColumn[0].vs_LayerThickness;

        if(vo_CN_Ratio_AOM_Fast <= 1.0E-7) {
          // Wenn in der Datenbank hier Null steht, handelt es sich um einen
          // Pflanzenrückstand. Dann erfolgt eine dynamische Berechnung des
          // C/N-Verhältnisses. Für Wirtschafstdünger ist dieser Wert
          // parametrisiert.

          // Converting AOM N content from kg N kg DM-1 to kg N m-3
          vo_AddedOrganicNitrogenAmount = vo_AddedOrganicMatterAmount * vo_AOM_DryMatterContent
          * vo_AddedOrganicMatterNConcentration / 10000.0 / soilColumn[0].vs_LayerThickness;

          debug("Added organic matter N amount: " + vo_AddedOrganicNitrogenAmount);
          if(vo_AddedOrganicMatterNConcentration <= 0.0) {
            vo_AddedOrganicNitrogenAmount = 0.01;
          }

          // Assigning the dynamic C/N ratio to the AOM_Fast pool
          if((vo_AddedOrganicCarbonAmount * vo_PartAOM_to_AOM_Slow / vo_CN_Ratio_AOM_Slow)
              < vo_AddedOrganicNitrogenAmount) {

            vo_CN_Ratio_AOM_Fast = (vo_AddedOrganicCarbonAmount * vo_PartAOM_to_AOM_Fast)
              / (vo_AddedOrganicNitrogenAmount
              - (vo_AddedOrganicCarbonAmount * vo_PartAOM_to_AOM_Slow
              / vo_CN_Ratio_AOM_Slow));
          } else {

            vo_CN_Ratio_AOM_Fast = po_AOM_FastMaxC_to_N;
          }

          if(vo_CN_Ratio_AOM_Fast > po_AOM_FastMaxC_to_N) {
            vo_CN_Ratio_AOM_Fast = po_AOM_FastMaxC_to_N;
          }

          aom_pool.vo_CN_Ratio_AOM_Fast = vo_CN_Ratio_AOM_Fast;

        } else {
          aom_pool.vo_CN_Ratio_AOM_Fast = params.vo_CN_Ratio_AOM_Fast;
        }

        aom_pool.vo_PartAOM_Slow_to_SMB_Slow = params.vo_PartAOM_Slow_to_SMB_Slow;
        aom_pool.vo_PartAOM_Slow_to_SMB_Fast = params.vo_PartAOM_Slow_to_SMB_Fast;

        soilColumn[0].vo_AOM_Pool.push(aom_pool);
        //cout << "poolsize: " << soilColumn[0].vo_AOM_Pool.length << endl;

      } else {//if (i_Layer == 0)

        var aom_pool = new AOM_Properties();

        aom_pool.vo_DaysAfterApplication = 0;
        aom_pool.vo_AOM_DryMatterContent = 0.0;
        aom_pool.vo_AOM_NH4Content = 0.0;
        aom_pool.vo_AOM_Slow = 0.0;
        aom_pool.vo_AOM_Fast = 0.0;
        aom_pool.vo_AOM_SlowDecCoeffStandard = params.vo_AOM_SlowDecCoeffStandard;
        aom_pool.vo_AOM_FastDecCoeffStandard = params.vo_AOM_FastDecCoeffStandard;
        aom_pool.vo_CN_Ratio_AOM_Slow = vo_CN_Ratio_AOM_Slow;
        if(!soilColumn[0].vo_AOM_Pool.length === 0) {
          aom_pool.vo_CN_Ratio_AOM_Fast = soilColumn[0].vo_AOM_Pool[soilColumn[0].vo_AOM_Pool.length - 1].vo_CN_Ratio_AOM_Fast;
        } else {
          aom_pool.vo_CN_Ratio_AOM_Fast = vo_CN_Ratio_AOM_Fast;
        }
        aom_pool.vo_PartAOM_Slow_to_SMB_Slow = params.vo_PartAOM_Slow_to_SMB_Slow;
        aom_pool.vo_PartAOM_Slow_to_SMB_Fast = params.vo_PartAOM_Slow_to_SMB_Fast;
        aom_pool.incorporation = incorporation;

        soilColumn[i_Layer].vo_AOM_Pool.push(aom_pool);

      } //else
    } // for i_Layer

    var AOM_SlowInput = vo_PartAOM_to_AOM_Slow * vo_AddedOrganicCarbonAmount;
    var AOM_FastInput = vo_PartAOM_to_AOM_Fast * vo_AddedOrganicCarbonAmount;

    var vo_SoilNH4Input = vo_AOM_NH4Content * vo_AddedOrganicMatterAmount
             * vo_AOM_DryMatterContent / 10000.0 / soilColumn[0].vs_LayerThickness;

    var vo_SoilNO3Input = vo_AOM_NO3Content * vo_AddedOrganicMatterAmount
             * vo_AOM_DryMatterContent / 10000.0 / soilColumn[0].vs_LayerThickness;

    var SOM_FastInput = (1.0 - (vo_PartAOM_to_AOM_Slow
           + vo_PartAOM_to_AOM_Fast)) * vo_AddedOrganicCarbonAmount;
    // Immediate top layer pool update
    soilColumn[0].vo_AOM_Pool[soilColumn[0].vo_AOM_Pool.length - 1].vo_AOM_Slow += AOM_SlowInput;
    soilColumn[0].vo_AOM_Pool[soilColumn[0].vo_AOM_Pool.length - 1].vo_AOM_Fast += AOM_FastInput;
    soilColumn[0].vs_SoilNH4 += vo_SoilNH4Input;
    soilColumn[0].vs_SoilNO3 += vo_SoilNO3Input;
    soilColumn[0].vs_SOM_Fast += SOM_FastInput;

    // JS!
    if (soilColumn[0].vs_SoilNO3 < 0 || soilColumn[0].vs_SoilNH4 < 0) {
      debug('vo_AddedOrganicCarbonAmount', vo_AddedOrganicCarbonAmount);
      debug('vo_AOM_NO3Content', vo_AOM_NO3Content);
      debug('vo_PartAOM_to_AOM_Slow', vo_PartAOM_to_AOM_Slow);
      debug('vo_PartAOM_to_AOM_Fast', vo_PartAOM_to_AOM_Fast);
      debug('vo_AOM_DryMatterContent', vo_AOM_DryMatterContent);
      debug('vo_AddedOrganicMatterAmount', vo_AddedOrganicMatterAmount);
      debug('vs_LayerThickness', soilColumn[0].vs_LayerThickness);
      debug('oilColumn.that[0].vs_SoilNO3', oilColumn.that[0].vs_SoilNO3);
      debug('soilColumn[0].vs_SoilNH4', soilColumn[0].vs_SoilNH4);
      throw 'N < 0';
    }

    //store for further use
    vo_AOM_SlowInput += AOM_SlowInput;
    vo_AOM_FastInput += AOM_FastInput;
    vo_SOM_FastInput += SOM_FastInput;

    addedOrganicMatter = true;
  };

  var addIrrigationWater = function (amount) {
    irrigationAmount += amount;
  };

  var fo_Urea = function (vo_RainIrrigation ) {

    var nools = soilColumn.vs_NumberOfOrganicLayers();
    var vo_SoilCarbamid_solid = []; // Solid carbamide concentration in soil solution [kmol urea m-3]
    var vo_SoilCarbamid_aq = []; // Dissolved carbamide concetzration in soil solution [kmol urea m-3]
    var vo_HydrolysisRate1 = []; // [kg N d-1]
    var vo_HydrolysisRate2 = []; // [kg N d-1]
    var vo_HydrolysisRateMax = []; // [kg N d-1]
    var vo_Hydrolysis_pH_Effect = [];// []
    var vo_HydrolysisRate = []; // [kg N d-1]
    var vo_H3OIonConcentration = 0.0; // Oxonium ion concentration in soil solution [kmol m-3]
    var vo_NH3aq_EquilibriumConst = 0.0; // []
    var vo_NH3_EquilibriumConst   = 0.0; // []
    var vs_SoilNH4aq = 0.0; // ammonium ion concentration in soil solution [kmol m-3}
    var vo_NH3aq = 0.0;
    var vo_NH3gas = 0.0;
    var vo_NH3_Volatilising = 0.0;

    var po_HydrolysisKM = centralParameterProvider.userSoilOrganicParameters.po_HydrolysisKM;
    var po_HydrolysisP1 = centralParameterProvider.userSoilOrganicParameters.po_HydrolysisP1;
    var po_HydrolysisP2 = centralParameterProvider.userSoilOrganicParameters.po_HydrolysisP2;
    var po_ActivationEnergy = centralParameterProvider.userSoilOrganicParameters.po_ActivationEnergy;

    vo_NH3_Volatilised = 0.0;

    for (var i_Layer = 0; i_Layer < soilColumn.vs_NumberOfOrganicLayers(); i_Layer++) {

      // kmol urea m-3 soil
      vo_SoilCarbamid_solid[i_Layer] = soilColumn[i_Layer].vs_SoilCarbamid /
               organicConstants.po_UreaMolecularWeight /
               organicConstants.po_Urea_to_N / 1000.0;

      // mol urea kg Solution-1
      vo_SoilCarbamid_aq[i_Layer] = (-1258.9 + 13.2843 * (soilColumn[i_Layer].get_Vs_SoilTemperature() + 273.15) -
             0.047381 * ((soilColumn[i_Layer].get_Vs_SoilTemperature() + 273.15) *
                 (soilColumn[i_Layer].get_Vs_SoilTemperature() + 273.15)) +
             5.77264e-5 * (pow((soilColumn[i_Layer].get_Vs_SoilTemperature() + 273.15), 3.0)));

      // kmol urea m-3 soil
      vo_SoilCarbamid_aq[i_Layer] = (vo_SoilCarbamid_aq[i_Layer] / (1.0 +
                    (vo_SoilCarbamid_aq[i_Layer] * 0.0453))) *
          soilColumn[i_Layer].get_Vs_SoilMoisture_m3();

      if (vo_SoilCarbamid_aq[i_Layer] >= vo_SoilCarbamid_solid[i_Layer]) {

        vo_SoilCarbamid_aq[i_Layer] = vo_SoilCarbamid_solid[i_Layer];
        vo_SoilCarbamid_solid[i_Layer] = 0.0;

      } else {
        vo_SoilCarbamid_solid[i_Layer] -= vo_SoilCarbamid_aq[i_Layer];
      }

      // Calculate urea hydrolysis

      vo_HydrolysisRate1[i_Layer] = (po_HydrolysisP1 *
                                    (soilColumn[i_Layer].vs_SoilOrganicMatter() * 100.0) *
                                    organicConstants.po_SOM_to_C + po_HydrolysisP2) /
                                    organicConstants.po_UreaMolecularWeight;

      vo_HydrolysisRate2[i_Layer] = vo_HydrolysisRate1[i_Layer] /
                                    (exp(-po_ActivationEnergy /
                                    (8.314 * 310.0)));

      vo_HydrolysisRateMax[i_Layer] = vo_HydrolysisRate2[i_Layer] * exp(-po_ActivationEnergy /
                                     (8.314 * (soilColumn[i_Layer].get_Vs_SoilTemperature() + 273.15)));

      vo_Hydrolysis_pH_Effect[i_Layer] = exp(-0.064 *
                                         ((soilColumn[i_Layer].vs_SoilpH - 6.5) *
                                         (soilColumn[i_Layer].vs_SoilpH - 6.5)));

      // debug(soilColumn[i_Layer].vs_SoilMoisture_pF(), 'soilColumn[i_Layer].vs_SoilMoisture_pF()');

      // kmol urea kg soil-1 s-1
      vo_HydrolysisRate[i_Layer] = vo_HydrolysisRateMax[i_Layer] *
                                   fo_MoistOnHydrolysis(soilColumn[i_Layer].vs_SoilMoisture_pF()) *
                                   vo_Hydrolysis_pH_Effect[i_Layer] * vo_SoilCarbamid_aq[i_Layer] /
                                   (po_HydrolysisKM + vo_SoilCarbamid_aq[i_Layer]);

      // kmol urea m soil-3 d-1
      vo_HydrolysisRate[i_Layer] = vo_HydrolysisRate[i_Layer] * 86400.0 *
                                   soilColumn[i_Layer].vs_SoilBulkDensity();

      if (vo_HydrolysisRate[i_Layer] >= vo_SoilCarbamid_aq[i_Layer]) {

        soilColumn[i_Layer].vs_SoilNH4 += soilColumn[i_Layer].vs_SoilCarbamid;
        soilColumn[i_Layer].vs_SoilCarbamid = 0.0;

      } else {

        // kg N m soil-3
        soilColumn[i_Layer].vs_SoilCarbamid -= vo_HydrolysisRate[i_Layer] *
               organicConstants.po_UreaMolecularWeight *
               organicConstants.po_Urea_to_N * 1000.0;

        // kg N m soil-3
        soilColumn[i_Layer].vs_SoilNH4 += vo_HydrolysisRate[i_Layer] *
          organicConstants.po_UreaMolecularWeight *
          organicConstants.po_Urea_to_N * 1000.0;
      }

      // Calculate general volatilisation from NH4-Pool in top layer

      if (i_Layer == 0) {

        vo_H3OIonConcentration = pow(10.0, (-soilColumn[0].vs_SoilpH)); // kmol m-3
        vo_NH3aq_EquilibriumConst = pow(10.0, ((-2728.3 /
                                    (soilColumn[0].get_Vs_SoilTemperature() + 273.15)) - 0.094219)); // K2 in Sadeghi's program

        vo_NH3_EquilibriumConst = pow(10.0, ((1630.5 /
                                  (soilColumn[0].get_Vs_SoilTemperature() + 273.15)) - 2.301));  // K1 in Sadeghi's program

        // kmol m-3, assuming that all NH4 is solved
        vs_SoilNH4aq = soilColumn[0].vs_SoilNH4 / (organicConstants.po_NH4MolecularWeight * 1000.0);


        // kmol m-3
        vo_NH3aq = vs_SoilNH4aq / (1.0 + (vo_H3OIonConcentration / vo_NH3aq_EquilibriumConst));


         vo_NH3gas = vo_NH3aq;
        //  vo_NH3gas = vo_NH3aq / vo_NH3_EquilibriumConst;

        // kg N m-3 d-1
         vo_NH3_Volatilising = vo_NH3gas * organicConstants.po_NH3MolecularWeight * 1000.0;


        if (vo_NH3_Volatilising >= soilColumn[0].vs_SoilNH4) {

          vo_NH3_Volatilising = soilColumn[0].vs_SoilNH4;
          soilColumn[0].vs_SoilNH4 = 0.0;

        } else {
          soilColumn[0].vs_SoilNH4 -= vo_NH3_Volatilising;
        }

        // kg N m-2 d-1
        vo_NH3_Volatilised = vo_NH3_Volatilising * soilColumn[0].vs_LayerThickness;

        if (soilColumn[0].vs_SoilNH4 < 0)
          throw soilColumn[0].vs_SoilNH4;

      } // if (i_Layer == 0) {
    } // for

    // set incorporation to false, if carbamid part is falling below a treshold
    // only, if organic matter was not recently added
    if (vo_SoilCarbamid_aq[0] < 0.001 && !addedOrganicMatter) {
      incorporation = false;
    }

  };

  var fo_MIT = function () {

    var nools = soilColumn.vs_NumberOfOrganicLayers();
    var po_SOM_SlowDecCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_SOM_SlowDecCoeffStandard;
    var po_SOM_FastDecCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_SOM_FastDecCoeffStandard;
    var po_SMB_SlowDeathRateStandard = centralParameterProvider.userSoilOrganicParameters.po_SMB_SlowDeathRateStandard;
    var po_SMB_SlowMaintRateStandard = centralParameterProvider.userSoilOrganicParameters.po_SMB_SlowMaintRateStandard;
    var po_SMB_FastDeathRateStandard = centralParameterProvider.userSoilOrganicParameters.po_SMB_FastDeathRateStandard;
    var po_SMB_FastMaintRateStandard = centralParameterProvider.userSoilOrganicParameters.po_SMB_FastMaintRateStandard;
    var po_LimitClayEffect = centralParameterProvider.userSoilOrganicParameters.po_LimitClayEffect;
    var po_SOM_SlowUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_SOM_SlowUtilizationEfficiency;
    var po_SOM_FastUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_SOM_FastUtilizationEfficiency;
    var po_PartSOM_Fast_to_SOM_Slow = centralParameterProvider.userSoilOrganicParameters.po_PartSOM_Fast_to_SOM_Slow;
    var po_PartSMB_Slow_to_SOM_Fast = centralParameterProvider.userSoilOrganicParameters.po_PartSMB_Slow_to_SOM_Fast;
    var po_SMB_UtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_SMB_UtilizationEfficiency;
    var po_CN_Ratio_SMB = centralParameterProvider.userSoilOrganicParameters.po_CN_Ratio_SMB;
    var po_AOM_SlowUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_AOM_SlowUtilizationEfficiency;
    var po_AOM_FastUtilizationEfficiency = centralParameterProvider.userSoilOrganicParameters.po_AOM_FastUtilizationEfficiency;
    var po_ImmobilisationRateCoeffNH4 = centralParameterProvider.userSoilOrganicParameters.po_ImmobilisationRateCoeffNH4;
    var po_ImmobilisationRateCoeffNO3 = centralParameterProvider.userSoilOrganicParameters.po_ImmobilisationRateCoeffNO3;

    // Sum of decomposition rates for fast added organic matter pools
    var vo_AOM_FastDecRateSum = [];

    //Added organic matter fast pool change by decomposition [kg C m-3]
    //var vo_AOM_FastDelta = [];

    //Sum of all changes to added organic matter fast pool [kg C m-3]
    var vo_AOM_FastDeltaSum = [];

    //Added organic matter fast pool change by input [kg C m-3]
    //double vo_AOM_FastInput = 0.0;

    // Sum of decomposition rates for slow added organic matter pools
    var vo_AOM_SlowDecRateSum = [];

    // Added organic matter slow pool change by decomposition [kg C m-3]
    //var vo_AOM_SlowDelta = [];

    // Sum of all changes to added organic matter slow pool [kg C m-3]
    var vo_AOM_SlowDeltaSum = [];
    
    // [kg m-3]
    //fill(vo_CBalance.begin(), vo_CBalance.end(), 0.0);
    for (var i = 0, is = vo_CBalance.length; i < is; i++)
      vo_CBalance[i] = 0.0;

    // C to N ratio of slowly decomposing soil organic matter []
    var vo_CN_Ratio_SOM_Slow;

    // C to N ratio of rapidly decomposing soil organic matter []
    var vo_CN_Ratio_SOM_Fast;

    // N balance of each layer [kg N m-3]
    var vo_NBalance = [];

    // CO2 preduced from fast fraction of soil microbial biomass [kg C m-3 d-1]
    var vo_SMB_FastCO2EvolutionRate = [];

    // Fast fraction of soil microbial biomass death rate [d-1]
    var vo_SMB_FastDeathRate = [];

    // Fast fraction of soil microbial biomass death rate coefficient [d-1]
    var vo_SMB_FastDeathRateCoeff = [];

    // Fast fraction of soil microbial biomass decomposition rate [d-1]
    var vo_SMB_FastDecCoeff = [];

    // Soil microbial biomass fast pool change [kg C m-3]
    //fill(vo_SMB_FastDelta.begin(), vo_SMB_FastDelta.end(), 0.0);
    for (var i = 0, is = vo_SMB_FastDelta.length; i < is; i++)
      vo_SMB_FastDelta[i] = 0.0;

    // CO2 preduced from slow fraction of soil microbial biomass [kg C m-3 d-1]
    var vo_SMB_SlowCO2EvolutionRate = [];

    // Slow fraction of soil microbial biomass death rate [d-1]
    var vo_SMB_SlowDeathRate = [];

    // Slow fraction of soil microbial biomass death rate coefficient [d-1]
    var vo_SMB_SlowDeathRateCoeff = [];

    // Slow fraction of soil microbial biomass decomposition rate [d-1]
    var vo_SMB_SlowDecCoeff = [];

    // Soil microbial biomass slow pool change [kg C m-3]
    //fill(vo_SMB_SlowDelta.begin(), vo_SMB_SlowDelta.end(), 0.0);
    for (var i = 0, is = vo_SMB_SlowDelta.length; i < is; i++)
      vo_SMB_SlowDelta[i] = 0.0;

    // Decomposition coefficient for rapidly decomposing soil organic matter [d-1]
    var vo_SOM_FastDecCoeff = [];

    // Soil organic matter fast pool change [kg C m-3]
    //fill(vo_SOM_FastDelta.begin(), vo_SOM_FastDelta.end(), 0.0);
    for (var i = 0, is = vo_SOM_FastDelta.length; i < is; i++)
      vo_SOM_FastDelta[i] = 0.0;

    // Sum of all changes to soil organic matter fast pool [kg C m-3]
    //var vo_SOM_FastDeltaSum = [];

    // Decomposition coefficient for slowly decomposing soil organic matter [d-1]
    var vo_SOM_SlowDecCoeff = [];

    // Soil organic matter slow pool change, unit [kg C m-3]
    //fill(vo_SOM_SlowDelta.begin(), vo_SOM_SlowDelta.end(), 0.0);
    for (var i = 0, is = vo_SOM_SlowDelta.length; i < is; i++)
      vo_SOM_SlowDelta[i] = 0.0;

    // Sum of all changes to soil organic matter slow pool [kg C m-3]
    //std::vector<double> vo_SOM_SlowDeltaSum = new Array(nools);

    // Calculation of decay rate coefficients

    var AOM_Pool, it_AOM_Pool; // JS! it's the same var! forEach is slower

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      var tod = fo_TempOnDecompostion(soilColumn[i_Layer].get_Vs_SoilTemperature());
      var mod = fo_MoistOnDecompostion(soilColumn[i_Layer].vs_SoilMoisture_pF());
  //    cout << "SO-5\t" << mod << endl;

      vo_SOM_SlowDecCoeff[i_Layer] = po_SOM_SlowDecCoeffStandard * tod * mod;
      vo_SOM_FastDecCoeff[i_Layer] = po_SOM_FastDecCoeffStandard * tod * mod;

      vo_SMB_SlowDecCoeff[i_Layer] = (po_SMB_SlowDeathRateStandard
             + po_SMB_SlowMaintRateStandard)
             * fo_ClayOnDecompostion(soilColumn[i_Layer].vs_SoilClayContent,
               po_LimitClayEffect) * tod * mod;

      vo_SMB_FastDecCoeff[i_Layer] = (po_SMB_FastDeathRateStandard
              + po_SMB_FastMaintRateStandard) * tod * mod;

      vo_SMB_SlowDeathRateCoeff[i_Layer] = po_SMB_SlowDeathRateStandard * tod * mod;
      vo_SMB_FastDeathRateCoeff[i_Layer] = po_SMB_FastDeathRateStandard * tod * mod;
      vo_SMB_SlowDeathRate[i_Layer] = vo_SMB_SlowDeathRateCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Slow;
      vo_SMB_FastDeathRate[i_Layer] = vo_SMB_FastDeathRateCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Fast;

      for (var i_Pool = 0, i_Pools = soilColumn[i_Layer].vo_AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool[i_Pool];
        AOM_Pool.vo_AOM_SlowDecCoeff = AOM_Pool.vo_AOM_SlowDecCoeffStandard * tod * mod;
        AOM_Pool.vo_AOM_FastDecCoeff = AOM_Pool.vo_AOM_FastDecCoeffStandard * tod * mod;      
      }
    } // for

    // Calculation of pool changes by decomposition
    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      for (var i_Pool = 0, i_Pools = soilColumn[i_Layer].vo_AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool[i_Pool];

        // Eq.6-5 and 6-6 in the DAISY manual
        AOM_Pool.vo_AOM_SlowDelta = -(AOM_Pool.vo_AOM_SlowDecCoeff * AOM_Pool.vo_AOM_Slow);

        if(-AOM_Pool.vo_AOM_SlowDelta > AOM_Pool.vo_AOM_Slow) {
          AOM_Pool.vo_AOM_SlowDelta = (-AOM_Pool.vo_AOM_Slow);
        }

        AOM_Pool.vo_AOM_FastDelta = -(AOM_Pool.vo_AOM_FastDecCoeff * AOM_Pool.vo_AOM_Fast);

        if(-AOM_Pool.vo_AOM_FastDelta > AOM_Pool.vo_AOM_Fast) {
          AOM_Pool.vo_AOM_FastDelta = (-AOM_Pool.vo_AOM_Fast);
        }
      }

      // soilColumn[i_Layer].vo_AOM_Pool.forEach(function (AOM_Pool) {
      //   // Eq.6-5 and 6-6 in the DAISY manual
      //   AOM_Pool.vo_AOM_SlowDelta = -(AOM_Pool.vo_AOM_SlowDecCoeff * AOM_Pool.vo_AOM_Slow);

      //   if(-AOM_Pool.vo_AOM_SlowDelta > AOM_Pool.vo_AOM_Slow) {
      //     AOM_Pool.vo_AOM_SlowDelta = (-AOM_Pool.vo_AOM_Slow);
      //   }

      //   AOM_Pool.vo_AOM_FastDelta = -(AOM_Pool.vo_AOM_FastDecCoeff * AOM_Pool.vo_AOM_Fast);

      //   if(-AOM_Pool.vo_AOM_FastDelta > AOM_Pool.vo_AOM_Fast) {
      //     AOM_Pool.vo_AOM_FastDelta = (-AOM_Pool.vo_AOM_Fast);
      //   }
      // });

      // Eq.6-7 in the DAISY manual
      vo_AOM_SlowDecRateSum[i_Layer] = 0.0;

      for (var i_Pool = 0, i_Pools = soilColumn[i_Layer].vo_AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool[i_Pool];
        AOM_Pool.vo_AOM_SlowDecRate = AOM_Pool.vo_AOM_SlowDecCoeff * AOM_Pool.vo_AOM_Slow;
        vo_AOM_SlowDecRateSum[i_Layer] += AOM_Pool.vo_AOM_SlowDecRate;
      }

      // soilColumn[i_Layer].vo_AOM_Pool.forEach(function (AOM_Pool) {
      //   AOM_Pool.vo_AOM_SlowDecRate = AOM_Pool.vo_AOM_SlowDecCoeff * AOM_Pool.vo_AOM_Slow;
      //   vo_AOM_SlowDecRateSum[i_Layer] += AOM_Pool.vo_AOM_SlowDecRate;
      // });

      vo_SMB_SlowDelta[i_Layer] = (po_SOM_SlowUtilizationEfficiency * vo_SOM_SlowDecCoeff[i_Layer]
          * soilColumn[i_Layer].vs_SOM_Slow)
          + (po_SOM_FastUtilizationEfficiency * (1.0
          - po_PartSOM_Fast_to_SOM_Slow)
          * vo_SOM_FastDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SOM_Fast)
          + (po_AOM_SlowUtilizationEfficiency
          * vo_AOM_SlowDecRateSum[i_Layer])
          - (vo_SMB_SlowDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Slow
          + vo_SMB_SlowDeathRate[i_Layer]);

      // Eq.6-8 in the DAISY manual
      vo_AOM_FastDecRateSum[i_Layer] = 0.0;

      for (var i_Pool = 0, i_Pools = soilColumn[i_Layer].vo_AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool[i_Pool];
        AOM_Pool.vo_AOM_FastDecRate = AOM_Pool.vo_AOM_FastDecCoeff * AOM_Pool.vo_AOM_Fast;
        vo_AOM_FastDecRateSum[i_Layer] += AOM_Pool.vo_AOM_FastDecRate;
      }

      // soilColumn[i_Layer].vo_AOM_Pool.forEach(function (AOM_Pool) {
      //   AOM_Pool.vo_AOM_FastDecRate = AOM_Pool.vo_AOM_FastDecCoeff * AOM_Pool.vo_AOM_Fast;
      //   vo_AOM_FastDecRateSum[i_Layer] += AOM_Pool.vo_AOM_FastDecRate;
      // });

      vo_SMB_FastDelta[i_Layer] = (po_SMB_UtilizationEfficiency * (1.0
          - po_PartSMB_Slow_to_SOM_Fast)
          * (vo_SMB_SlowDeathRate[i_Layer]
          + vo_SMB_FastDeathRate[i_Layer]))
          + (po_AOM_FastUtilizationEfficiency
          * vo_AOM_FastDecRateSum[i_Layer])
          - ((vo_SMB_FastDecCoeff[i_Layer]
          * soilColumn[i_Layer].vs_SMB_Fast)
          + vo_SMB_FastDeathRate[i_Layer]);

      //!Eq.6-9 in the DAISY manual
      vo_SOM_SlowDelta[i_Layer] = po_PartSOM_Fast_to_SOM_Slow * vo_SOM_FastDecCoeff[i_Layer]
          * soilColumn[i_Layer].vs_SOM_Fast - vo_SOM_SlowDecCoeff[i_Layer]
          * soilColumn[i_Layer].vs_SOM_Slow;

      // Eq.6-10 in the DAISY manual
      vo_SOM_FastDelta[i_Layer] = po_PartSMB_Slow_to_SOM_Fast * (vo_SMB_SlowDeathRate[i_Layer]
          + vo_SMB_FastDeathRate[i_Layer]) - vo_SOM_FastDecCoeff[i_Layer]
          * soilColumn[i_Layer].vs_SOM_Fast;

      vo_AOM_SlowDeltaSum[i_Layer] = 0.0;
      vo_AOM_FastDeltaSum[i_Layer] = 0.0;

      for (var i_Pool = 0, i_Pools = soilColumn[i_Layer].vo_AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool[i_Pool];
        vo_AOM_SlowDeltaSum[i_Layer] += AOM_Pool.vo_AOM_SlowDelta;
        vo_AOM_FastDeltaSum[i_Layer] += AOM_Pool.vo_AOM_FastDelta;
      }

      // soilColumn[i_Layer].vo_AOM_Pool.forEach(function (AOM_Pool) {
      //   vo_AOM_SlowDeltaSum[i_Layer] += AOM_Pool.vo_AOM_SlowDelta;
      //   vo_AOM_FastDeltaSum[i_Layer] += AOM_Pool.vo_AOM_FastDelta;
      // });

    } // for i_Layer

    vo_DecomposerRespiration = 0.0;

    // Calculation of CO2 evolution
    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      vo_SMB_SlowCO2EvolutionRate[i_Layer] = ((1.0 - po_SOM_SlowUtilizationEfficiency)
              * vo_SOM_SlowDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SOM_Slow) + ((1.0
              - po_SOM_FastUtilizationEfficiency) * (1.0 - po_PartSOM_Fast_to_SOM_Slow)
              * vo_SOM_FastDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SOM_Fast) + ((1.0
              - po_AOM_SlowUtilizationEfficiency) * vo_AOM_SlowDecRateSum[i_Layer])
              + (po_SMB_UtilizationEfficiency
              * (vo_SMB_SlowDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Slow));

      vo_SMB_FastCO2EvolutionRate[i_Layer] = ((1.0 - po_SMB_UtilizationEfficiency) * (1.0
             - po_PartSMB_Slow_to_SOM_Fast) * (vo_SMB_SlowDeathRate[i_Layer] + vo_SMB_FastDeathRate[i_Layer]))
             + ((1.0 - po_AOM_FastUtilizationEfficiency) * vo_AOM_FastDecRateSum[i_Layer])
             + ((vo_SMB_FastDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Fast));

      vo_SMB_CO2EvolutionRate[i_Layer] = vo_SMB_SlowCO2EvolutionRate[i_Layer] + vo_SMB_FastCO2EvolutionRate[i_Layer];

      vo_DecomposerRespiration += vo_SMB_CO2EvolutionRate[i_Layer] * soilColumn[i_Layer].vs_LayerThickness; // [kg C m-3] -> [kg C m-2]

    } // for i_Layer

    // Calculation of N balance
    vo_CN_Ratio_SOM_Slow = siteParams.vs_Soil_CN_Ratio;
    vo_CN_Ratio_SOM_Fast = siteParams.vs_Soil_CN_Ratio;

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      vo_NBalance[i_Layer] = -(vo_SMB_SlowDelta[i_Layer] / po_CN_Ratio_SMB)
          - (vo_SMB_FastDelta[i_Layer] / po_CN_Ratio_SMB)
          - (vo_SOM_SlowDelta[i_Layer] / vo_CN_Ratio_SOM_Slow)
          - (vo_SOM_FastDelta[i_Layer] / vo_CN_Ratio_SOM_Fast);

      /*var*/ AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool;

      for (var i_Pool = 0, i_Pools = AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
        it_AOM_Pool = AOM_Pool[i_Pool];
        if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Fast) >= 1.0E-7) {
          vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_FastDelta / it_AOM_Pool.vo_CN_Ratio_AOM_Fast);
        } // if

        if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Slow) >= 1.0E-7) {
          vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_SlowDelta / it_AOM_Pool.vo_CN_Ratio_AOM_Slow);
        } // if
      } // for it_AOM_Pool

      // AOM_Pool.forEach(function (it_AOM_Pool) {

      //   if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Fast) >= 1.0E-7) {
      //     vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_FastDelta / it_AOM_Pool.vo_CN_Ratio_AOM_Fast);
      //   } // if

      //   if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Slow) >= 1.0E-7) {
      //     vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_SlowDelta / it_AOM_Pool.vo_CN_Ratio_AOM_Slow);
      //   } // if
      // }); // for it_AOM_Pool
    } // for i_Layer

    // Check for Nmin availablity in case of immobilisation

    vo_NetNMineralisation = 0.0;

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      if (vo_NBalance[i_Layer] < 0.0) {

        if (abs(vo_NBalance[i_Layer]) >= ((soilColumn[i_Layer].vs_SoilNH4 * po_ImmobilisationRateCoeffNH4)
          + (soilColumn[i_Layer].vs_SoilNO3 * po_ImmobilisationRateCoeffNO3))) {
          vo_AOM_SlowDeltaSum[i_Layer] = 0.0;
          vo_AOM_FastDeltaSum[i_Layer] = 0.0;

          AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool;

          for (var i_Pool = 0, i_Pools = AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {
            it_AOM_Pool = AOM_Pool[i_Pool];

            if (it_AOM_Pool.vo_CN_Ratio_AOM_Slow >= (po_CN_Ratio_SMB
                 / po_AOM_SlowUtilizationEfficiency)) {

              it_AOM_Pool.vo_AOM_SlowDelta = 0.0;
            } // if

            if (it_AOM_Pool.vo_CN_Ratio_AOM_Fast >= (po_CN_Ratio_SMB
                 / po_AOM_FastUtilizationEfficiency)) {

              it_AOM_Pool.vo_AOM_FastDelta = 0.0;
            } // if

            vo_AOM_SlowDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_SlowDelta;
            vo_AOM_FastDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_FastDelta;

          } // for

          // AOM_Pool.forEach(function (it_AOM_Pool) {

          //   if (it_AOM_Pool.vo_CN_Ratio_AOM_Slow >= (po_CN_Ratio_SMB
          //        / po_AOM_SlowUtilizationEfficiency)) {

          //     it_AOM_Pool.vo_AOM_SlowDelta = 0.0;
          //   } // if

          //   if (it_AOM_Pool.vo_CN_Ratio_AOM_Fast >= (po_CN_Ratio_SMB
          //        / po_AOM_FastUtilizationEfficiency)) {

          //     it_AOM_Pool.vo_AOM_FastDelta = 0.0;
          //   } // if

          //   vo_AOM_SlowDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_SlowDelta;
          //   vo_AOM_FastDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_FastDelta;

          // }); // for

          if (vo_CN_Ratio_SOM_Slow >= (po_CN_Ratio_SMB / po_SOM_SlowUtilizationEfficiency)) {

            vo_SOM_SlowDelta[i_Layer] = 0.0;
          } // if

          if (vo_CN_Ratio_SOM_Fast >= (po_CN_Ratio_SMB / po_SOM_FastUtilizationEfficiency)) {

            vo_SOM_FastDelta[i_Layer] = 0.0;
          } // if

          // Recalculation of SMB pool changes

          /** @todo <b>Claas: </b> Folgende Algorithmen prüfen: Was verändert sich? */
          vo_SMB_SlowDelta[i_Layer] = (po_SOM_SlowUtilizationEfficiency * vo_SOM_SlowDecCoeff[i_Layer]
               * soilColumn[i_Layer].vs_SOM_Slow) + (po_SOM_FastUtilizationEfficiency * (1.0
               - po_PartSOM_Fast_to_SOM_Slow) * vo_SOM_FastDecCoeff[i_Layer]
               * soilColumn[i_Layer].vs_SOM_Fast) + (po_AOM_SlowUtilizationEfficiency
               * (-vo_AOM_SlowDeltaSum[i_Layer])) - (vo_SMB_SlowDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Slow
               + vo_SMB_SlowDeathRate[i_Layer]);

          vo_SMB_FastDelta[i_Layer] = (po_SMB_UtilizationEfficiency * (1.0
              - po_PartSMB_Slow_to_SOM_Fast) * (vo_SMB_SlowDeathRate[i_Layer]
              + vo_SMB_FastDeathRate[i_Layer])) + (po_AOM_FastUtilizationEfficiency
              * (-vo_AOM_FastDeltaSum[i_Layer])) - ((vo_SMB_FastDecCoeff[i_Layer] * soilColumn[i_Layer].vs_SMB_Fast)
              + vo_SMB_FastDeathRate[i_Layer]);

          // Recalculation of N balance under conditions of immobilisation
          vo_NBalance[i_Layer] = -(vo_SMB_SlowDelta[i_Layer] / po_CN_Ratio_SMB)
               - (vo_SMB_FastDelta[i_Layer] / po_CN_Ratio_SMB) - (vo_SOM_SlowDelta[i_Layer]
               / vo_CN_Ratio_SOM_Slow) - (vo_SOM_FastDelta[i_Layer] / vo_CN_Ratio_SOM_Fast);

          for (var i_Pool = 0, i_Pools = AOM_Pool.length; i_Pool < i_Pools; i_Pool++) {

            it_AOM_Pool = AOM_Pool[i_Pool];
            
            if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Fast) >= 1.0E-7) {

              vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_FastDelta
                                       / it_AOM_Pool.vo_CN_Ratio_AOM_Fast);
            } // if

            if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Slow) >= 1.0E-7) {

              vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_SlowDelta
                                       / it_AOM_Pool.vo_CN_Ratio_AOM_Slow);
            } // if

          } // for

          // AOM_Pool.forEach(function (it_AOM_Pool) {

          //   if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Fast) >= 1.0E-7) {

          //     vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_FastDelta
          //                              / it_AOM_Pool.vo_CN_Ratio_AOM_Fast);
          //   } // if

          //   if (abs(it_AOM_Pool.vo_CN_Ratio_AOM_Slow) >= 1.0E-7) {

          //     vo_NBalance[i_Layer] -= (it_AOM_Pool.vo_AOM_SlowDelta
          //                              / it_AOM_Pool.vo_CN_Ratio_AOM_Slow);
          //   } // if
          // }); // for

          // Update of Soil NH4 after recalculated N balance
          soilColumn[i_Layer].vs_SoilNH4 += abs(vo_NBalance[i_Layer]);


        } else { //if
          // Bedarf kann durch Ammonium-Pool nicht gedeckt werden --> Nitrat wird verwendet
          if (abs(vo_NBalance[i_Layer]) >= (soilColumn[i_Layer].vs_SoilNH4
               * po_ImmobilisationRateCoeffNH4)) {

            soilColumn[i_Layer].vs_SoilNO3 -= abs(vo_NBalance[i_Layer])
                 - (soilColumn[i_Layer].vs_SoilNH4
                 * po_ImmobilisationRateCoeffNH4);

            soilColumn[i_Layer].vs_SoilNH4 -= soilColumn[i_Layer].vs_SoilNH4
                 * po_ImmobilisationRateCoeffNH4;

          } else { // if

            soilColumn[i_Layer].vs_SoilNH4 -= abs(vo_NBalance[i_Layer]);
            if (soilColumn[i_Layer].vs_SoilNH4 < 0)
              throw soilColumn[i_Layer].vs_SoilNH4;
          } //else
        } //else

      } else { //if (N_Balance[i_Layer]) < 0.0

        soilColumn[i_Layer].vs_SoilNH4 += abs(vo_NBalance[i_Layer]);
      }

    vo_NetNMineralisationRate[i_Layer] = abs(vo_NBalance[i_Layer])
        * soilColumn[0].vs_LayerThickness; // [kg m-3] --> [kg m-2]
    vo_NetNMineralisation += abs(vo_NBalance[i_Layer])
        * soilColumn[0].vs_LayerThickness; // [kg m-3] --> [kg m-2]
    vo_SumNetNMineralisation += abs(vo_NBalance[i_Layer])
          * soilColumn[0].vs_LayerThickness; // [kg m-3] --> [kg m-2]

    }
  };

  var fo_Volatilisation = function (
    vo_AOM_Addition,
    vw_MeanAirTemperature,
    vw_WindSpeed
    ) {
    
    var vo_SoilWet;
    var vo_AOM_TAN_Content; // added organic matter total ammonium content [g N kg FM OM-1]
    var vo_MaxVolatilisation; // Maximum volatilisation [kg N ha-1 (kg N ha-1)-1]
    var vo_VolatilisationHalfLife; // [d]
    var vo_VolatilisationRate; // [kg N ha-1 (kg N ha-1)-1 d-1]
    var vo_N_PotVolatilised; // Potential volatilisation [kg N m-2]
    var vo_N_PotVolatilisedSum = 0.0; // Sums up potential volatilisation of all AOM pools [kg N m-2]
    var vo_N_ActVolatilised = 0.0; // Actual volatilisation [kg N m-2]

    var vo_DaysAfterApplicationSum = 0;

    if (soilColumn[0].vs_SoilMoisture_pF() > 2.5) {
      vo_SoilWet = 0.0;
    } else {
      vo_SoilWet = 1.0;
    }

    var AOM_Pool = soilColumn[0].vo_AOM_Pool;

    AOM_Pool.forEach(function (it_AOM_Pool) {

      vo_DaysAfterApplicationSum += it_AOM_Pool.vo_DaysAfterApplication;
    });

    if (vo_DaysAfterApplicationSum > 0 || vo_AOM_Addition) {

      /** @todo <b>Claas: </b> if (vo_AOM_Addition == true)
       vo_DaysAfterApplication[vo_AOM_PoolAllocator]= 1; */

      vo_N_PotVolatilisedSum = 0.0;

      AOM_Pool.forEach(function (it_AOM_Pool) {

        vo_AOM_TAN_Content = 0.0;
        vo_MaxVolatilisation = 0.0;
        vo_VolatilisationHalfLife = 0.0;
        vo_VolatilisationRate = 0.0;
        vo_N_PotVolatilised = 0.0;

        vo_AOM_TAN_Content = it_AOM_Pool.vo_AOM_NH4Content * 1000.0 * it_AOM_Pool.vo_AOM_DryMatterContent;

        vo_MaxVolatilisation = 0.0495 * pow(1.1020, vo_SoilWet) * pow(1.0223, vw_MeanAirTemperature) * pow(1.0417,
                           vw_WindSpeed) * pow(1.1080, it_AOM_Pool.vo_AOM_DryMatterContent) * pow(0.8280, vo_AOM_TAN_Content) * pow(
                               11.300, Number(it_AOM_Pool.incorporation));

        vo_VolatilisationHalfLife = 1.0380 * pow(1.1020, vo_SoilWet) * pow(0.9600, vw_MeanAirTemperature) * pow(0.9500,
                        vw_WindSpeed) * pow(1.1750, it_AOM_Pool.vo_AOM_DryMatterContent) * pow(1.1060, vo_AOM_TAN_Content) * pow(
                                                  1.0000, Number(it_AOM_Pool.incorporation)) * (18869.3 * exp(-soilColumn[0].vs_SoilpH / 0.63321) + 0.70165);

        // ******************************************************************************************
        // *** Based on He et al. (1999): Soil Sci. 164 (10), 750-758. The curves on p. 755 were  ***
        // *** digitised and fit to Michaelis-Menten. The pH - Nhalf relation was normalised (pH  ***
        // *** 7.0 = 1; average soil pH of the ALFAM experiments) and fit to a decay function.    ***
        // *** The resulting factor was added to the Half Life calculation.                       ***
        // ******************************************************************************************

        vo_VolatilisationRate = vo_MaxVolatilisation * (vo_VolatilisationHalfLife / (pow((it_AOM_Pool.vo_DaysAfterApplication + vo_VolatilisationHalfLife), 2.0)));

        vo_N_PotVolatilised = vo_VolatilisationRate * vo_AOM_TAN_Content * (it_AOM_Pool.vo_AOM_Slow
                    + it_AOM_Pool.vo_AOM_Fast) / 10000.0 / 1000.0;

        vo_N_PotVolatilisedSum += vo_N_PotVolatilised;

        // debug('vo_VolatilisationRate', vo_VolatilisationRate);
        // debug('vo_SoilWet', vo_SoilWet);
        // debug('vw_MeanAirTemperature', vw_MeanAirTemperature);
        // debug('vw_WindSpeed', vw_WindSpeed);
        // debug('it_AOM_Pool.vo_AOM_DryMatterContent', it_AOM_Pool.vo_AOM_DryMatterContent);
        // debug('Number(it_AOM_Pool.incorporation)', Number(it_AOM_Pool.incorporation));
        // debug('soilColumn[0].vs_SoilpH ', soilColumn[0].vs_SoilpH);
        // debug('vo_N_PotVolatilised', vo_N_PotVolatilised);
        // debug('vo_AOM_TAN_Content', vo_AOM_TAN_Content);
        // debug('vo_MaxVolatilisation', vo_MaxVolatilisation);
        // debug('vo_VolatilisationHalfLife', vo_VolatilisationHalfLife);
        // debug('it_AOM_Pool.vo_DaysAfterApplication', it_AOM_Pool.vo_DaysAfterApplication);
        // debug('AOM_Pool', AOM_Pool);

      });

      if (soilColumn[0].vs_SoilNH4 > (vo_N_PotVolatilisedSum)) {
        vo_N_ActVolatilised = vo_N_PotVolatilisedSum;
      } else {
        vo_N_ActVolatilised = soilColumn[0].vs_SoilNH4;
      }
      // update NH4 content of top soil layer with volatilisation balance

      soilColumn[0].vs_SoilNH4 -= (vo_N_ActVolatilised / soilColumn[0].vs_LayerThickness);
    } else {
      vo_N_ActVolatilised = 0.0;
    }

    if (soilColumn[0].vs_SoilNH4 < 0)
      throw soilColumn[0].vs_SoilNH4;

    // NH3 volatilised from top layer NH4 pool. See Urea section
    vo_Total_NH3_Volatilised = (vo_N_ActVolatilised + vo_NH3_Volatilised); // [kg N m-2]
    /** @todo <b>Claas: </b>Zusammenfassung für output. Wohin damit??? */

    AOM_Pool.forEach(function (it_AOM_Pool) {

      if (it_AOM_Pool.vo_DaysAfterApplication > 0 && !vo_AOM_Addition) {
        it_AOM_Pool.vo_DaysAfterApplication++;
      }
    });
  }

  var fo_Nitrification = function () {

    if (soilColumn[0].vs_SoilNO3 < 0)
      throw soilColumn[0].vs_SoilNO3;
   
    var nools = soilColumn.vs_NumberOfOrganicLayers();
    var po_AmmoniaOxidationRateCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_AmmoniaOxidationRateCoeffStandard;
    var po_NitriteOxidationRateCoeffStandard = centralParameterProvider.userSoilOrganicParameters.po_NitriteOxidationRateCoeffStandard;

    //! Nitrification rate coefficient [d-1]
    var vo_AmmoniaOxidationRateCoeff = new Array(nools);
    var vo_NitriteOxidationRateCoeff = new Array(nools);

    //! Nitrification rate [kg NH4-N m-3 d-1]
    var vo_AmmoniaOxidationRate = new Array(nools);
    var vo_NitriteOxidationRate = new Array(nools);

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      // Calculate nitrification rate coefficients
  //    cout << "SO-2:\t" << soilColumn[i_Layer].vs_SoilMoisture_pF() << endl;
      vo_AmmoniaOxidationRateCoeff[i_Layer] = po_AmmoniaOxidationRateCoeffStandard * fo_TempOnNitrification(
          soilColumn[i_Layer].get_Vs_SoilTemperature()) * fo_MoistOnNitrification(soilColumn[i_Layer].vs_SoilMoisture_pF());

      vo_AmmoniaOxidationRate[i_Layer] = vo_AmmoniaOxidationRateCoeff[i_Layer] * soilColumn[i_Layer].vs_SoilNH4;

      vo_NitriteOxidationRateCoeff[i_Layer] = po_NitriteOxidationRateCoeffStandard
          * fo_TempOnNitrification(soilColumn[i_Layer].get_Vs_SoilTemperature())
          * fo_MoistOnNitrification(soilColumn[i_Layer].vs_SoilMoisture_pF())
              * fo_NH3onNitriteOxidation(soilColumn[i_Layer].vs_SoilNH4,soilColumn[i_Layer].vs_SoilpH);

      vo_NitriteOxidationRate[i_Layer] = vo_NitriteOxidationRateCoeff[i_Layer] * soilColumn[i_Layer].vs_SoilNH4;

    }

    // debug('vo_AmmoniaOxidationRateCoeff', vo_AmmoniaOxidationRateCoeff);
    // debug('vo_NitriteOxidationRate', vo_NitriteOxidationRate);

    if (soilColumn[0].vs_SoilNH4 < 0)
      throw soilColumn[0].vs_SoilNH4;

    if (soilColumn[0].vs_SoilNO2 < 0)
      throw soilColumn[0].vs_SoilNO2;

    if (soilColumn[0].vs_SoilNO3 < 0)
      throw soilColumn[0].vs_SoilNO3;

    // Update NH4, NO2 and NO3 content with nitrification balance
    // Stange, F., C. Nendel (2014): N.N., in preparation


    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      if (soilColumn[i_Layer].vs_SoilNH4 > vo_AmmoniaOxidationRate[i_Layer]) {

        soilColumn[i_Layer].vs_SoilNH4 -= vo_AmmoniaOxidationRate[i_Layer];
        soilColumn[i_Layer].vs_SoilNO2 += vo_AmmoniaOxidationRate[i_Layer];


      } else {

        soilColumn[i_Layer].vs_SoilNO2 += soilColumn[i_Layer].vs_SoilNH4;
        soilColumn[i_Layer].vs_SoilNH4 = 0.0;
      }

      if (soilColumn[i_Layer].vs_SoilNO2 > vo_NitriteOxidationRate[i_Layer]) {

        soilColumn[i_Layer].vs_SoilNO2 -= vo_NitriteOxidationRate[i_Layer];
        soilColumn[i_Layer].vs_SoilNO3 += vo_NitriteOxidationRate[i_Layer];


      } else {

        soilColumn[i_Layer].vs_SoilNO3 += soilColumn[i_Layer].vs_SoilNO2;
        soilColumn[i_Layer].vs_SoilNO2 = 0.0;
      }
    }

    // debug('vo_NitriteOxidationRate', vo_NitriteOxidationRate);
    // debug('vo_AmmoniaOxidationRate', vo_AmmoniaOxidationRate);

    if (soilColumn[0].vs_SoilNH4 < 0)
      throw soilColumn[0].vs_SoilNH4;

    if (soilColumn[0].vs_SoilNO2 < 0)
      throw soilColumn[0].vs_SoilNO2;

    if (soilColumn[0].vs_SoilNO3 < 0)
      throw soilColumn[0].vs_SoilNO3;

  };

  var fo_Denitrification = function () {

    var nools = soilColumn.vs_NumberOfOrganicLayers();
    var vo_PotDenitrificationRate = new Array(nools);
    var po_SpecAnaerobDenitrification = centralParameterProvider.userSoilOrganicParameters.po_SpecAnaerobDenitrification;
    var po_TransportRateCoeff = centralParameterProvider.userSoilOrganicParameters.po_TransportRateCoeff;
    vo_TotalDenitrification = 0.0;

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      //Temperature function is the same as in Nitrification subroutine
      vo_PotDenitrificationRate[i_Layer] = po_SpecAnaerobDenitrification
          * vo_SMB_CO2EvolutionRate[i_Layer]
          * fo_TempOnNitrification(soilColumn[i_Layer].get_Vs_SoilTemperature());

      vo_ActDenitrificationRate[i_Layer] = min(vo_PotDenitrificationRate[i_Layer]
           * fo_MoistOnDenitrification(soilColumn[i_Layer].get_Vs_SoilMoisture_m3(),
           soilColumn[i_Layer].get_Saturation()), po_TransportRateCoeff
           * soilColumn[i_Layer].vs_SoilNO3);

      // debug('fo_TempOnNitrification ' + i_Layer, fo_TempOnNitrification(soilColumn[i_Layer].get_Vs_SoilTemperature()));
      // debug('fo_MoistOnDenitrification ' + i_Layer, fo_MoistOnDenitrification(soilColumn[i_Layer].get_Vs_SoilMoisture_m3(),
      //      soilColumn[i_Layer].get_Saturation()));
      // debug('soilColumn.that['+i_Layer+'].vs_SoilNO3', soilColumn[i_Layer].vs_SoilNO3);
    }

      // update NO3 content of soil layer with denitrification balance [kg N m-3]

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

      if (soilColumn[i_Layer].vs_SoilNO3 > vo_ActDenitrificationRate[i_Layer]) {

        
        soilColumn[i_Layer].vs_SoilNO3 -= vo_ActDenitrificationRate[i_Layer];

      } else {

        vo_ActDenitrificationRate[i_Layer] = soilColumn[i_Layer].vs_SoilNO3;
        soilColumn[i_Layer].vs_SoilNO3 = 0.0;

      }

      vo_TotalDenitrification += vo_ActDenitrificationRate[i_Layer] * soilColumn[0].vs_LayerThickness; // [kg m-3] --> [kg m-2] ;
    }

    vo_SumDenitrification += vo_TotalDenitrification; // [kg N m-2]

    // debug('vo_PotDenitrificationRate', vo_PotDenitrificationRate);
    // debug('po_SpecAnaerobDenitrification', po_SpecAnaerobDenitrification);
    // debug('po_TransportRateCoeff', po_TransportRateCoeff);
    // debug('vo_TotalDenitrification', vo_TotalDenitrification);
    // debug('vo_SMB_CO2EvolutionRate'[i_Layer], vo_SMB_CO2EvolutionRate[i_Layer]);
    // debug('fo_TempOnNitrification', fo_TempOnNitrification(soilColumn[i_Layer].get_Vs_SoilTemperature()));
    // debug('fo_MoistOnDenitrification', fo_MoistOnDenitrification(soilColumn[i_Layer].get_Vs_SoilMoisture_m3(),
    //        soilColumn[i_Layer].get_Saturation()));
    // debug('po_TransportRateCoeff', po_TransportRateCoeff);
    // debug('vo_ActDenitrificationRate', vo_ActDenitrificationRate);

    if (vo_TotalDenitrification < 0)
      throw vo_TotalDenitrification;

  };


  var fo_N2OProduction = function () {

    var nools = soilColumn.vs_NumberOfOrganicLayers();
    var vo_N2OProduction = new Array(nools);
    var po_N2OProductionRate = centralParameterProvider.userSoilOrganicParameters.po_N2OProductionRate;
    vo_N2O_Produced = 0.0;

    for (var i_Layer = 0; i_Layer < nools; i_Layer++) {

        vo_N2OProduction[i_Layer] = soilColumn[i_Layer].vs_SoilNO2
             * fo_TempOnNitrification(soilColumn[i_Layer].get_Vs_SoilTemperature())
             * po_N2OProductionRate * (1.0 / (1.0 +
             (pow(10.0,soilColumn[i_Layer].vs_SoilpH) - organicConstants.po_pKaHNO2)));

        vo_N2O_Produced += vo_N2OProduction[i_Layer];
    }

  };

  var fo_PoolUpdate = function () {
    
    for (var i_Layer = 0; i_Layer < soilColumn.vs_NumberOfOrganicLayers(); i_Layer++) {

      var AOM_Pool = soilColumn[i_Layer].vo_AOM_Pool;

      vo_AOM_SlowDeltaSum[i_Layer] = 0.0;
      vo_AOM_FastDeltaSum[i_Layer] = 0.0;
      vo_AOM_SlowSum[i_Layer] = 0.0;
      vo_AOM_FastSum[i_Layer] = 0.0;

      AOM_Pool.forEach(function (it_AOM_Pool) {
        it_AOM_Pool.vo_AOM_Slow += it_AOM_Pool.vo_AOM_SlowDelta;
        it_AOM_Pool.vo_AOM_Fast += it_AOM_Pool.vo_AOM_FastDelta;

        vo_AOM_SlowDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_SlowDelta;
        vo_AOM_FastDeltaSum[i_Layer] += it_AOM_Pool.vo_AOM_FastDelta;

        vo_AOM_SlowSum[i_Layer] += it_AOM_Pool.vo_AOM_Slow;
        vo_AOM_FastSum[i_Layer] += it_AOM_Pool.vo_AOM_Fast;
      });

      soilColumn[i_Layer].vs_SOM_Slow += vo_SOM_SlowDelta[i_Layer];
      soilColumn[i_Layer].vs_SOM_Fast += vo_SOM_FastDelta[i_Layer];
      soilColumn[i_Layer].vs_SMB_Slow += vo_SMB_SlowDelta[i_Layer];
      soilColumn[i_Layer].vs_SMB_Fast += vo_SMB_FastDelta[i_Layer];

      if (i_Layer == 0) {

        vo_CBalance[i_Layer] = vo_AOM_SlowInput + vo_AOM_FastInput + vo_AOM_SlowDeltaSum[i_Layer]
               + vo_AOM_FastDeltaSum[i_Layer] + vo_SMB_SlowDelta[i_Layer]
               + vo_SMB_FastDelta[i_Layer] + vo_SOM_SlowDelta[i_Layer]
               + vo_SOM_FastDelta[i_Layer] + vo_SOM_FastInput;

      } else {
        vo_CBalance[i_Layer] = vo_AOM_SlowDeltaSum[i_Layer]
               + vo_AOM_FastDeltaSum[i_Layer] + vo_SMB_SlowDelta[i_Layer]
               + vo_SMB_FastDelta[i_Layer] + vo_SOM_SlowDelta[i_Layer]
               + vo_SOM_FastDelta[i_Layer];
      }


      vo_SoilOrganicC[i_Layer] = (soilColumn[i_Layer].vs_SoilOrganicCarbon() * soilColumn[i_Layer].vs_SoilBulkDensity()) - vo_InertSoilOrganicC[i_Layer]; // ([kg C kg-1] * [kg m-3]) - [kg C m-3]
      vo_SoilOrganicC[i_Layer] += vo_CBalance[i_Layer];
      
      soilColumn[i_Layer].set_SoilOrganicCarbon((vo_SoilOrganicC[i_Layer] + vo_InertSoilOrganicC[i_Layer]) / soilColumn[i_Layer].vs_SoilBulkDensity()); // [kg C m-3] / [kg m-3] --> [kg C kg-1]

    soilColumn[i_Layer].set_SoilOrganicMatter((vo_SoilOrganicC[i_Layer] + vo_InertSoilOrganicC[i_Layer])/ organicConstants.po_SOM_to_C
                / soilColumn[i_Layer].vs_SoilBulkDensity()); // [kg C m-3] / [kg m-3] --> [kg C kg-1]
    } // for
  };

  var fo_ClayOnDecompostion = function (d_SoilClayContent, d_LimitClayEffect) {
    
    var fo_ClayOnDecompostion=0.0;

    if (d_SoilClayContent >= 0.0 && d_SoilClayContent <= d_LimitClayEffect) {
      fo_ClayOnDecompostion = 1.0 - 2.0 * d_SoilClayContent;
    } else if (d_SoilClayContent > d_LimitClayEffect && d_SoilClayContent <= 1.0) {
      fo_ClayOnDecompostion = 1.0 - 2.0 * d_LimitClayEffect;
    } else {
      debug("irregular clay content");
    }
    return fo_ClayOnDecompostion;
  };

  var fo_TempOnDecompostion = function (d_SoilTemperature) {
    
    var fo_TempOnDecompostion=0.0;

    if (d_SoilTemperature <= 0.0 && d_SoilTemperature > -40.0) {

      //
      fo_TempOnDecompostion = 0.0;

    } else if (d_SoilTemperature > 0.0 && d_SoilTemperature <= 20.0) {

      fo_TempOnDecompostion = 0.1 * d_SoilTemperature;

    } else if (d_SoilTemperature > 20.0 && d_SoilTemperature <= 70.0) {

      fo_TempOnDecompostion = exp(0.47 - (0.027 * d_SoilTemperature) + (0.00193 * d_SoilTemperature * d_SoilTemperature));
    } else {
      debug("irregular soil temperature fo_TempOnDecompostion (d_SoilTemperature = "+d_SoilTemperature+")");
    }

    return fo_TempOnDecompostion;
  };

  var fo_MoistOnDecompostion = function (d_SoilMoisture_pF) {
    
    var fo_MoistOnDecompostion=0.0;

    if (abs(d_SoilMoisture_pF) <= 1.0E-7) {
      //
      fo_MoistOnDecompostion = 0.6;

    } else if (d_SoilMoisture_pF > 0.0 && d_SoilMoisture_pF <= 1.5) {
      //
      fo_MoistOnDecompostion = 0.6 + 0.4 * (d_SoilMoisture_pF / 1.5);

    } else if (d_SoilMoisture_pF > 1.5 && d_SoilMoisture_pF <= 2.5) {
      //
      fo_MoistOnDecompostion = 1.0;

    } else if (d_SoilMoisture_pF > 2.5 && d_SoilMoisture_pF <= 6.5) {
      //
      fo_MoistOnDecompostion = 1.0 - ((d_SoilMoisture_pF - 2.5) / 4.0);

    } else if (d_SoilMoisture_pF > 6.5) {

      fo_MoistOnDecompostion = 0.0;

    }  else if (d_SoilMoisture_pF === -Infinity) { /* TODO: Special JavaScript case ? */
      fo_MoistOnDecompostion = 0.0;
    
    } else {
      debug("fo_MoistOnDecompostion ( d_SoilMoisture_pF ) : irregular soil water content");
    }

    return fo_MoistOnDecompostion;
  };

  var fo_MoistOnHydrolysis = function (d_SoilMoisture_pF) {

    if (DEBUG) debug(arguments);

    var fo_MoistOnHydrolysis=0.0;

    if (d_SoilMoisture_pF > 0.0 && d_SoilMoisture_pF <= 1.1) {
      fo_MoistOnHydrolysis = 0.72;

    } else if (d_SoilMoisture_pF > 1.1 && d_SoilMoisture_pF <= 2.4) {
      fo_MoistOnHydrolysis = 0.2207 * d_SoilMoisture_pF + 0.4672;

    } else if (d_SoilMoisture_pF > 2.4 && d_SoilMoisture_pF <= 3.4) {
      fo_MoistOnHydrolysis = 1.0;

    } else if (d_SoilMoisture_pF > 3.4 && d_SoilMoisture_pF <= 4.6) {
      fo_MoistOnHydrolysis = -0.8659 * d_SoilMoisture_pF + 3.9849;

    } else if (d_SoilMoisture_pF > 4.6) {
      fo_MoistOnHydrolysis = 0.0;

    } else if (d_SoilMoisture_pF === -Infinity) { /* TODO: Special JavaScript case ? */
      fo_MoistOnHydrolysis = 0.0;
    
    } else {
      debug("fo_MoistOnHydrolysis ( d_SoilMoisture_pF: "+d_SoilMoisture_pF+" ) irregular soil water content");
    }

    return fo_MoistOnHydrolysis;
  };

  var fo_TempOnNitrification = function (d_SoilTemperature) {
    
    var fo_TempOnNitrification=0.0;

    if (d_SoilTemperature <= 2.0 && d_SoilTemperature > -40.0) {
      fo_TempOnNitrification = 0.0;

    } else if (d_SoilTemperature > 2.0 && d_SoilTemperature <= 6.0) {
      fo_TempOnNitrification = 0.15 * (d_SoilTemperature - 2.0);

    } else if (d_SoilTemperature > 6.0 && d_SoilTemperature <= 20.0) {
      fo_TempOnNitrification = 0.1 * d_SoilTemperature;

    } else if (d_SoilTemperature > 20.0 && d_SoilTemperature <= 70.0) {
      fo_TempOnNitrification
          = exp(0.47 - (0.027 * d_SoilTemperature) + (0.00193 * d_SoilTemperature * d_SoilTemperature));
    } else {
      debug("irregular soil temperature");
    }

    return fo_TempOnNitrification;
  };

  var fo_MoistOnNitrification = function (d_SoilMoisture_pF) {
    
    var fo_MoistOnNitrification=0.0;

    if (abs(d_SoilMoisture_pF) <= 1.0E-7) {
      fo_MoistOnNitrification = 0.6;

    } else if (d_SoilMoisture_pF > 0.0 && d_SoilMoisture_pF <= 1.5) {
      fo_MoistOnNitrification = 0.6 + 0.4 * (d_SoilMoisture_pF / 1.5);

    } else if (d_SoilMoisture_pF > 1.5 && d_SoilMoisture_pF <= 2.5) {
      fo_MoistOnNitrification = 1.0;

    } else if (d_SoilMoisture_pF > 2.5 && d_SoilMoisture_pF <= 5.0) {
      fo_MoistOnNitrification = 1.0 - ((d_SoilMoisture_pF - 2.5) / 2.5);

    } else if (d_SoilMoisture_pF > 5.0) {
      fo_MoistOnNitrification = 0.0;

    } else {
      debug("irregular soil water content");
    }
    return fo_MoistOnNitrification;
  };

  var fo_MoistOnDenitrification = function (d_SoilMoisture_m3, d_Saturation) {

    var po_Denit1 = centralParameterProvider.userSoilOrganicParameters.po_Denit1;
    var po_Denit2 = centralParameterProvider.userSoilOrganicParameters.po_Denit2;
    var po_Denit3 = centralParameterProvider.userSoilOrganicParameters.po_Denit3;
    var fo_MoistOnDenitrification=0.0;

    if ((d_SoilMoisture_m3 / d_Saturation) <= 0.8) {
      fo_MoistOnDenitrification = 0.0;

    } else if ((d_SoilMoisture_m3 / d_Saturation) > 0.8 && (d_SoilMoisture_m3 / d_Saturation) <= 0.9) {

      fo_MoistOnDenitrification = po_Denit1 * ((d_SoilMoisture_m3 / d_Saturation)
           - po_Denit2) / (po_Denit3 - po_Denit2);

    } else if ((d_SoilMoisture_m3 / d_Saturation) > 0.9 && (d_SoilMoisture_m3 / d_Saturation) <= 1.0) {

      fo_MoistOnDenitrification = po_Denit1 + (1.0 - po_Denit1)
          * ((d_SoilMoisture_m3 / d_Saturation) - po_Denit3) / (1.0 - po_Denit3);
    } else {
      debug("irregular soil water content");
    }

    return fo_MoistOnDenitrification;
  };

  var fo_NH3onNitriteOxidation = function (d_SoilNH4, d_SoilpH) {

    var po_Inhibitor_NH3 = centralParameterProvider.userSoilOrganicParameters.po_Inhibitor_NH3;
    var fo_NH3onNitriteOxidation=0.0;

    fo_NH3onNitriteOxidation = po_Inhibitor_NH3 + d_SoilNH4 * (1.0 - 1.0 / (1.0
         + pow(10.0,(d_SoilpH - organicConstants.po_pKaNH3)))) / po_Inhibitor_NH3;

    return fo_NH3onNitriteOxidation;
  };

  var fo_NetEcosystemProduction = function (d_NetPrimaryProduction, d_DecomposerRespiration) {

    var vo_NEP = 0.0;

    vo_NEP = d_NetPrimaryProduction - (d_DecomposerRespiration * 10000.0); // [kg C ha-1 d-1]

    return vo_NEP;
  };

  var fo_NetEcosystemExchange = function (d_NetPrimaryProduction, d_DecomposerRespiration) {

    // NEE = NEP (M.U.F. Kirschbaum and R. Mueller (2001): Net Ecosystem Exchange. Workshop Proceedings CRC for greenhouse accounting.
    // Per definition: NPP is negative and respiration is positive

    var vo_NEE = 0.0;

    vo_NEE = - d_NetPrimaryProduction + (d_DecomposerRespiration * 10000.0); // [kg C ha-1 d-1]

    return vo_NEE;
  };

  var get_SoilOrganicC = function (i_Layer)  {
    return vo_SoilOrganicC[i_Layer] / soilColumn[i_Layer].vs_SoilBulkDensity();
  };

  var get_AOM_FastSum = function (i_Layer) {
    return vo_AOM_FastSum[i_Layer];
  };

  var get_AOM_SlowSum = function (i_Layer) {
    return vo_AOM_SlowSum[i_Layer];
  };

  var get_SMB_Fast = function (i_Layer) {
    return soilColumn[i_Layer].vs_SMB_Fast;
  };

  var get_SMB_Slow = function (i_Layer) {
    return soilColumn[i_Layer].vs_SMB_Slow;
  };

  var get_SOM_Fast = function (i_Layer) {
    return soilColumn[i_Layer].vs_SOM_Fast;
  };

  var get_SOM_Slow = function (i_Layer) {
    return soilColumn[i_Layer].vs_SOM_Slow;
  };

  var get_CBalance = function (i_Layer) {
    return vo_CBalance[i_Layer];
  };

  var get_SMB_CO2EvolutionRate = function (i_Layer) {
    return vo_SMB_CO2EvolutionRate[i_Layer];
  };

  var get_ActDenitrificationRate = function (i_Layer) {
    return vo_ActDenitrificationRate[i_Layer];
  };

  var get_NetNMineralisationRate = function (i_Layer) {
    return vo_NetNMineralisationRate[i_Layer] * 10000.0;
  };

  var get_NetNMineralisation = function () {
    return vo_NetNMineralisation * 10000.0;
  };

  var get_SumNetNMineralisation = function () {
    return vo_SumNetNMineralisation * 10000.0;
  };

  var get_SumDenitrification = function () {
    return vo_SumDenitrification * 10000.0;
  };

  var get_Denitrification = function () {
    return vo_TotalDenitrification * 10000.0;
  };

  var get_NH3_Volatilised = function () {
    return vo_Total_NH3_Volatilised * 10000.0;
  };

  var get_SumNH3_Volatilised = function () {
    return vo_SumNH3_Volatilised * 10000.0;
  };

  var get_N2O_Produced = function () {
    return vo_N2O_Produced * 10000.0;
  };

  var get_SumN2O_Produced = function () {
    return vo_SumN2O_Produced * 10000.0;
  };

  var get_DecomposerRespiration = function () {
    return vo_DecomposerRespiration * 10000.0;
  };

  var get_NetEcosystemProduction = function () {
    return vo_NetEcosystemProduction;
  };

  var get_NetEcosystemExchange = function () {
    return vo_NetEcosystemExchange;
  };

  var put_Crop = function (c) {
    crop = c;
  };

  var remove_Crop = function () {
    crop = null;
  };

  return {
      step: step
    , addOrganicMatter: addOrganicMatter
    , addIrrigationWater: addIrrigationWater
    , setIncorporation: function (incorp) { incorporation = incorp; }
    , put_Crop: put_Crop
    , remove_Crop: remove_Crop
    , get_SoilOrganicC: get_SoilOrganicC
    , get_AOM_FastSum: get_AOM_FastSum
    , get_AOM_SlowSum: get_AOM_SlowSum
    , get_SMB_Fast: get_SMB_Fast
    , get_SMB_Slow: get_SMB_Slow
    , get_SOM_Fast: get_SOM_Fast
    , get_SOM_Slow: get_SOM_Slow
    , get_CBalance: get_CBalance
    , get_SMB_CO2EvolutionRate: get_SMB_CO2EvolutionRate
    , get_ActDenitrificationRate: get_ActDenitrificationRate
    , get_NetNMineralisationRate: get_NetNMineralisationRate
    , get_NH3_Volatilised: get_NH3_Volatilised
    , get_SumNH3_Volatilised: get_SumNH3_Volatilised
    , get_N2O_Produced: get_N2O_Produced
    , get_SumN2O_Produced: get_SumN2O_Produced
    , get_NetNMineralisation: get_NetNMineralisation
    , get_SumNetNMineralisation: get_SumNetNMineralisation
    , get_SumDenitrification: get_SumDenitrification
    , get_Denitrification: get_Denitrification
    , get_DecomposerRespiration: get_DecomposerRespiration
    , get_NetEcosystemProduction: get_NetEcosystemProduction
    , get_NetEcosystemExchange: get_NetEcosystemExchange
  };

};


var FrostComponent = function (sc, cpp) {
    
  var soilColumn = sc,
      centralParameterProvider = cpp,
      vm_FrostDepth = 0.0,
      vm_accumulatedFrostDepth = 0.0,
      vm_NegativeDegreeDays = 0.0,
      vm_ThawDepth = 0.0,
      vm_FrostDays = 0,
      vm_LambdaRedux = new Float64Array(sc.vs_NumberOfLayers() + 1),
      pt_TimeStep = centralParameterProvider.userEnvironmentParameters.p_timeStep,
      vm_HydraulicConductivityRedux = centralParameterProvider.userSoilMoistureParameters.pm_HydraulicConductivityRedux;

    for (var i = 0, is = vm_LambdaRedux.length; i < is; i++)
      vm_LambdaRedux[i] = 1.0;

  var calcSoilFrost = function (mean_air_temperature, snow_depth) {

    if (DEBUG) debug(arguments);

    // calculation of mean values
    var mean_field_capacity = getMeanFieldCapacity();
    var mean_bulk_density = getMeanBulkDensity();

    // heat conductivity for frozen and unfrozen soil
    var sii = calcSii(mean_field_capacity);
    var heat_conductivity_frozen = calcHeatConductivityFrozen(mean_bulk_density, sii);
    var heat_conductivity_unfrozen = calcHeatConductivityUnfrozen(mean_bulk_density, mean_field_capacity);

    // temperature under snow
    var temperature_under_snow = calcTemperatureUnderSnow(mean_air_temperature, snow_depth);

    // frost depth
    vm_FrostDepth = calcFrostDepth(mean_field_capacity, heat_conductivity_frozen, temperature_under_snow);
    if (isNaN(vm_FrostDepth))
      throw vm_FrostDepth;
    vm_accumulatedFrostDepth+=vm_FrostDepth;


    // thaw depth
    vm_ThawDepth = calcThawDepth(temperature_under_snow, heat_conductivity_unfrozen, mean_field_capacity);

    updateLambdaRedux();

  };

  var getMeanBulkDensity = function () {

    // in case of sensitivity analysis, this parameter would not be undefined
    // so return fix value instead of calculating mean bulk density
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_MeanBulkDensity != UNDEFINED) {
    //   return centralParameterProvider.sensitivityAnalysisParameters.p_MeanBulkDensity;
    // }

    var vs_number_of_layers = soilColumn.vs_NumberOfLayers();
    var bulk_density_accu = 0.0;
    for (var i_Layer = 0; i_Layer < vs_number_of_layers; i_Layer++) {
      bulk_density_accu += soilColumn[i_Layer].vs_SoilBulkDensity();
    }
    return (bulk_density_accu / vs_number_of_layers / 1000.0); // [Mg m-3]
  };

  var getMeanFieldCapacity = function () {

    // in case of sensitivity analysis, this parameter would not be undefined
    // so return fix value instead of calculating mean bulk density
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_MeanFieldCapacity != UNDEFINED) {
    //   return centralParameterProvider.sensitivityAnalysisParameters.p_MeanFieldCapacity;
    // }

    var vs_number_of_layers = soilColumn.vs_NumberOfLayers();
    var mean_field_capacity_accu = 0.0;
    for (var i_Layer = 0; i_Layer < vs_number_of_layers; i_Layer++) {
      mean_field_capacity_accu += soilColumn[i_Layer].get_FieldCapacity();
    }
    return (mean_field_capacity_accu / vs_number_of_layers);
  };

  var calcSii = function (mean_field_capacity) {

    if (DEBUG) debug(arguments);

    /** @TODO Parameters to be supplied from outside */
    var pt_F1 = 13.05; // Hansson et al. 2004
    var pt_F2 = 1.06; // Hansson et al. 2004

    var sii = (mean_field_capacity + (1.0 + (pt_F1 * pow(mean_field_capacity, pt_F2)) *
                        mean_field_capacity)) * 100.0;
    return sii;
  };


  /*
    mean_bulk_density [g m-3]

  */
  var calcHeatConductivityFrozen = function (mean_bulk_density, sii) {

    if (DEBUG) debug(arguments);
    
    // in case of sensitivity analysis, this parameter would not be undefined
    // so return fix value instead of calculating heat conductivity
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_HeatConductivityFrozen != UNDEFINED) {
    //   return centralParameterProvider.sensitivityAnalysisParameters.p_HeatConductivityFrozen;
    // }

    var cond_frozen = ((3.0 * mean_bulk_density - 1.7) * 0.001) / (1.0
        + (11.5 - 5.0 * mean_bulk_density) * exp((-50.0) * pow((sii / mean_bulk_density), 1.5))) * // [cal cm-1 K-1 s-1]
        86400.0 * pt_TimeStep * // [cal cm-1 K-1 d-1]
        4.184 / // [J cm-1 K-1 d-1]
        1000000.0 * 100;//  [MJ m-1 K-1 d-1]

    return cond_frozen;
  };

  /*
    mean_bulk_density [g m-3]

  */
  var calcHeatConductivityUnfrozen = function (mean_bulk_density, mean_field_capacity) {

    if (DEBUG) debug(arguments);

    // in case of sensitivity analysis, this parameter would not be undefined
    // so return fix value instead of calculating heat conductivity
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_HeatConductivityUnfrozen != UNDEFINED) {
    //   return centralParameterProvider.sensitivityAnalysisParameters.p_HeatConductivityUnfrozen;
    // }

    var cond_unfrozen = ((3.0 * mean_bulk_density - 1.7) * 0.001) / (1.0 + (11.5 - 5.0
          * mean_bulk_density) * exp((-50.0) * pow(((mean_field_capacity * 100.0) / mean_bulk_density), 1.5)))
          * pt_TimeStep * // [cal cm-1 K-1 s-1]
          4.184 * // [J cm-1 K-1 s-1]
          100.0; // [W m-1 K-1]

    return cond_unfrozen;
  };

  var calcThawDepth = function (temperature_under_snow, heat_conductivity_unfrozen, mean_field_capacity) {

    if (DEBUG) debug(arguments);

    var thaw_helper1 = 0.0;
    var thaw_helper2 = 0.0;
    var thaw_helper3 = 0.0;
    var thaw_helper4 = 0.0;

    var thaw_depth = 0.0;

    if (temperature_under_snow < 0.0) {
      thaw_helper1 = temperature_under_snow * -1.0;
    } else {
      thaw_helper1 = temperature_under_snow;
    }

    if (vm_FrostDepth == 0.0) {
      thaw_helper2 = 0.0;
    } else {
      /** @todo Claas: check that heat conductivity is in correct unit! */
      thaw_helper2 = sqrt(2.0 * heat_conductivity_unfrozen * thaw_helper1 / (1000.0 * 79.0
          * (mean_field_capacity * 100.0) / 100.0));
    }

    if (temperature_under_snow < 0.0) {
      thaw_helper3 = thaw_helper2 * -1.0;
    } else {
      thaw_helper3 = thaw_helper2;
    }

    thaw_helper4 = vm_ThawDepth + thaw_helper3;

    if (thaw_helper4 < 0.0){
      thaw_depth = 0.0;
    } else {
      thaw_depth = thaw_helper4;
    }
    return thaw_depth;
  };

  var calcFrostDepth = function (mean_field_capacity, heat_conductivity_frozen, temperature_under_snow) {

    if (DEBUG) debug(arguments);

    var frost_depth=0.0;

    // Heat released/absorbed on freezing/thawing
    var latent_heat = 1000.0 * (mean_field_capacity * 100.0) / 100.0 * 0.335;

    // Summation of number of days with frost
    if (vm_FrostDepth > 0.0) {
      vm_FrostDays++;
    }

    // Ratio of energy sum from subsoil to vm_LatentHeat
    var latent_heat_transfer = 0.3 * vm_FrostDays / latent_heat;

    // in case of sensitivity analysis, this parameter would not be undefined
    // so return fix value instead of calculating heat conductivity
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_LatentHeatTransfer != UNDEFINED) {
    //   latent_heat_transfer = centralParameterProvider.sensitivityAnalysisParameters.p_LatentHeatTransfer;
    // }

    // Calculate temperature under snowpack
    /** @todo Claas: At a later stage temperature under snow to pass on to soil
     * surface temperature calculation in temperature module */
    if (temperature_under_snow < 0.0) {
      vm_NegativeDegreeDays -= temperature_under_snow;
    }

    if (vm_NegativeDegreeDays < 0.01) {
      frost_depth = 0.0;
    }
    else {
      frost_depth = sqrt(((latent_heat_transfer / 2.0) * (latent_heat_transfer / 2.0)) + (2.0
          * heat_conductivity_frozen * vm_NegativeDegreeDays / latent_heat)) - (latent_heat_transfer / 2.0);
    }

    return isNaN(frost_depth) ? 0.0 : frost_depth;
  };

  var calcTemperatureUnderSnow = function (mean_air_temperature, snow_depth) {

    if (DEBUG) debug(arguments);

    var temperature_under_snow = 0.0;
    if (snow_depth / 100.0 < 0.01) {
      temperature_under_snow = mean_air_temperature;
    } else if (vm_FrostDepth < 0.01) {
      temperature_under_snow = mean_air_temperature;
    } else {
      temperature_under_snow = mean_air_temperature / (1.0 + (10.0 * snow_depth / 100.0) / vm_FrostDepth);
    }

    return temperature_under_snow;
  };

  var updateLambdaRedux = function () {

    var vs_number_of_layers = soilColumn.vs_NumberOfLayers();

    for (var i_Layer = 0; i_Layer < vs_number_of_layers; i_Layer++) {

      if (i_Layer < (int(floor((vm_FrostDepth / soilColumn[i_Layer].vs_LayerThickness) + 0.5)))) {

        // soil layer is frozen
        soilColumn[i_Layer].vs_SoilFrozen = true;
        vm_LambdaRedux[i_Layer] = 0.0;

        if (i_Layer == 0) {
          vm_HydraulicConductivityRedux = 0.0;
        }
      }


      if (i_Layer < (int(floor((vm_ThawDepth / soilColumn[i_Layer].vs_LayerThickness) + 0.5)))) {
        // soil layer is thawing

        if (vm_ThawDepth < ((i_Layer + 1) * soilColumn[i_Layer].vs_LayerThickness) && (vm_ThawDepth < vm_FrostDepth)) {
          // soil layer is thawing but there is more frost than thaw
          soilColumn[i_Layer].vs_SoilFrozen = true;
          vm_LambdaRedux[i_Layer] = 0.0;
          if (i_Layer == 0) {
            vm_HydraulicConductivityRedux = 0.0;
          }

        } else {
          // soil is thawing
          soilColumn[i_Layer].vs_SoilFrozen = false;
          vm_LambdaRedux[i_Layer] = 1.0;
          if (i_Layer == 0) {
            vm_HydraulicConductivityRedux = 0.1;
          }
        }
      }

      // no more frost, because all layers are thawing
      if (vm_ThawDepth >= vm_FrostDepth) {
        vm_ThawDepth = 0.0;
        vm_FrostDepth = 0.0;
        vm_NegativeDegreeDays = 0.0;
        vm_FrostDays = 0;

        vm_HydraulicConductivityRedux = centralParameterProvider.userSoilMoistureParameters.pm_HydraulicConductivityRedux;
        for (var i_Layer = 0; i_Layer < vs_number_of_layers; i_Layer++) {
          soilColumn[i_Layer].vs_SoilFrozen = false;
          vm_LambdaRedux[i_Layer] = 1.0;
        }
      }
    }

  };

  var getLambdaRedux = function (layer) {
    return vm_LambdaRedux[layer];
  };

  return {
    calcSoilFrost: calcSoilFrost, 
    getFrostDepth: function () { return vm_FrostDepth; },
    getThawDepth: function () { return vm_ThawDepth; },
    getLambdaRedux: getLambdaRedux,
    getAccumulatedFrostDepth: function () { return vm_accumulatedFrostDepth; }
  };

};


var SnowComponent = function (cpp) {

  var vm_SnowDensity = 0.0,
      vm_SnowDepth = 0.0,
      vm_FrozenWaterInSnow = 0.0,
      vm_LiquidWaterInSnow = 0.0,
      vm_maxSnowDepth = 0.0,
      vm_AccumulatedSnowDepth = 0.0,
      centralParameterProvider = cpp,
      sm_params = centralParameterProvider.userSoilMoistureParameters,
      vm_WaterToInfiltrate = 0,

      vm_SnowmeltTemperature = sm_params.pm_SnowMeltTemperature, // Base temperature for snowmelt [°C]
      vm_SnowAccumulationThresholdTemperature = sm_params.pm_SnowAccumulationTresholdTemperature,
      vm_TemperatureLimitForLiquidWater = sm_params.pm_TemperatureLimitForLiquidWater, // Lower temperature limit of liquid water in snow
      vm_CorrectionRain = sm_params.pm_CorrectionRain, // Correction factor for rain (no correction used here)
      vm_CorrectionSnow = sm_params.pm_CorrectionSnow, // Correction factor for snow (value used in COUP by Lars Egil H.)
      vm_RefreezeTemperature = sm_params.pm_RefreezeTemperature, // Base temperature for refreeze [°C]
      vm_RefreezeP1 = sm_params.pm_RefreezeParameter1, // Refreeze parameter (Karvonen's value)
      vm_RefreezeP2 = sm_params.pm_RefreezeParameter2, // Refreeze exponent (Karvonen's value)
      vm_NewSnowDensityMin = sm_params.pm_NewSnowDensityMin, // Minimum density of new snow
      vm_SnowMaxAdditionalDensity = sm_params.pm_SnowMaxAdditionalDensity, // Maximum additional density of snow (max rho = 0.35, Karvonen)
      vm_SnowPacking = sm_params.pm_SnowPacking, // Snow packing factor (calibrated by Helge Bonesmo)
      vm_SnowRetentionCapacityMin = sm_params.pm_SnowRetentionCapacityMin, // Minimum liquid water retention capacity in snow [mm]
      vm_SnowRetentionCapacityMax = sm_params.pm_SnowRetentionCapacityMax; // Maximum liquid water retention capacity in snow [mm]

  var calcSnowLayer = function (mean_air_temperature, net_precipitation) {

    if (DEBUG) debug(arguments);
      
    // Calcs netto precipitation
    var net_precipitation_snow = 0.0;
    var net_precipitation_water = 0.0;
    var obj = calcNetPrecipitation(mean_air_temperature, net_precipitation, net_precipitation_water, net_precipitation_snow);
    net_precipitation = obj.net_precipitation;
    net_precipitation_snow = obj.net_precipitation_snow;
    net_precipitation_water = obj.net_precipitation_water;

    // Calculate snowmelt
    var vm_Snowmelt = calcSnowMelt(mean_air_temperature);

    // Calculate refreeze in snow
    var vm_Refreeze=calcRefreeze(mean_air_temperature);

    // Calculate density of newly fallen snow
    var vm_NewSnowDensity = calcNewSnowDensity(mean_air_temperature,net_precipitation_snow);

    // Calculate average density of whole snowpack
    vm_SnowDensity = calcAverageSnowDensity(net_precipitation_snow, vm_NewSnowDensity);


    // Calculate amounts of water in frozen snow and liquid form
    vm_FrozenWaterInSnow = vm_FrozenWaterInSnow + net_precipitation_snow - vm_Snowmelt + vm_Refreeze;
    vm_LiquidWaterInSnow = vm_LiquidWaterInSnow + net_precipitation_water + vm_Snowmelt - vm_Refreeze;
    var vm_SnowWaterEquivalent = vm_FrozenWaterInSnow + vm_LiquidWaterInSnow; // snow water equivalent [mm]

    // Calculate snow's capacity to retain liquid
    var vm_LiquidWaterRetainedInSnow = calcLiquidWaterRetainedInSnow(vm_FrozenWaterInSnow, vm_SnowWaterEquivalent);

    // Calculate water release from snow
    var vm_SnowLayerWaterRelease = 0.0;
    if (vm_Refreeze > 0.0) {
      vm_SnowLayerWaterRelease = 0.0;
    } else if (vm_LiquidWaterInSnow <= vm_LiquidWaterRetainedInSnow) {
      vm_SnowLayerWaterRelease = 0;
    } else {
      vm_SnowLayerWaterRelease = vm_LiquidWaterInSnow - vm_LiquidWaterRetainedInSnow;
      vm_LiquidWaterInSnow -= vm_SnowLayerWaterRelease;
      vm_SnowWaterEquivalent = vm_FrozenWaterInSnow + vm_LiquidWaterInSnow;
    }

    // Calculate snow depth from snow water equivalent
    calcSnowDepth(vm_SnowWaterEquivalent);

    // Calculate potential infiltration to soil
    vm_WaterToInfiltrate = calcPotentialInfiltration(net_precipitation, vm_SnowLayerWaterRelease, vm_SnowDepth);
  };

  var calcSnowMelt = function (vw_MeanAirTemperature) {

    if (DEBUG) debug(arguments);

    var vm_MeltingFactor = 1.4 * (vm_SnowDensity / 0.1);
    var vm_Snowmelt = 0.0;

    if (vm_MeltingFactor > 4.7) {
      vm_MeltingFactor = 4.7;
    }

    if (vm_FrozenWaterInSnow <= 0.0) {
      vm_Snowmelt = 0.0;
    } else if (vw_MeanAirTemperature < vm_SnowmeltTemperature) {
      vm_Snowmelt = 0.0;
    } else {
      vm_Snowmelt = vm_MeltingFactor * (vw_MeanAirTemperature - vm_SnowmeltTemperature);
      if (vm_Snowmelt > vm_FrozenWaterInSnow) {
        vm_Snowmelt = vm_FrozenWaterInSnow;
      }
    }

    return vm_Snowmelt;
  };

  var calcNetPrecipitation = function (
    mean_air_temperature,
    net_precipitation,
    net_precipitation_water, // return values
    net_precipitation_snow // return values
    ) {

    if (DEBUG) debug(arguments);
    
    var liquid_water_precipitation = 0.0;

    // Calculate forms and proportions of precipitation
    if (mean_air_temperature >= vm_SnowAccumulationThresholdTemperature) {
      liquid_water_precipitation = 1.0;
    } else if (mean_air_temperature <= vm_TemperatureLimitForLiquidWater) {
      liquid_water_precipitation = 0.0;
    } else {
      liquid_water_precipitation = (mean_air_temperature - vm_TemperatureLimitForLiquidWater)
          / (vm_SnowAccumulationThresholdTemperature - vm_TemperatureLimitForLiquidWater);
    }

    net_precipitation_water = liquid_water_precipitation * vm_CorrectionRain * net_precipitation;
    net_precipitation_snow = (1.0 - liquid_water_precipitation) * vm_CorrectionSnow * net_precipitation;

    // Total net precipitation corrected for snow
    net_precipitation = net_precipitation_snow + net_precipitation_water;

    return {
      net_precipitation: net_precipitation,
      net_precipitation_snow: net_precipitation_snow,
      net_precipitation_water: net_precipitation_water
    };

  };

  var calcRefreeze = function (mean_air_temperature) {

    if (DEBUG) debug(arguments);

    var refreeze = 0.0;
    var refreeze_helper = 0.0;

    // no refreeze if it's too warm
    if (mean_air_temperature > 0) {
      refreeze_helper = 0;
    } else {
      refreeze_helper = mean_air_temperature;
    }

    if (refreeze_helper < vm_RefreezeTemperature) {
      if (vm_LiquidWaterInSnow > 0.0) {
        refreeze = vm_RefreezeP1 * pow((vm_RefreezeTemperature - refreeze_helper), vm_RefreezeP2);
      }
      if (refreeze > vm_LiquidWaterInSnow) {
        refreeze = vm_LiquidWaterInSnow;
      }
    } else {
      refreeze = 0;
    }
    return refreeze;
  };

  var calcNewSnowDensity = function (mean_air_temperature, net_precipitation_snow) {

    if (DEBUG) debug(arguments);
    
    var new_snow_density = 0.0;
    var snow_density_factor = 0.0;

    if (net_precipitation_snow <= 0.0) {
      // no snow
      new_snow_density = 0.0;
    } else {
      //
      snow_density_factor = ( 
        (mean_air_temperature - vm_TemperatureLimitForLiquidWater) / 
        (vm_SnowAccumulationThresholdTemperature - vm_TemperatureLimitForLiquidWater)
      );

      if (snow_density_factor > 1.0) {
        snow_density_factor = 1.0;
      }
      if (snow_density_factor < 0.0) {
        snow_density_factor = 0.0;
      }
      new_snow_density = vm_NewSnowDensityMin + vm_SnowMaxAdditionalDensity * snow_density_factor;
    }
    return new_snow_density;
  };

  var calcAverageSnowDensity = function (net_precipitation_snow, new_snow_density) {

    if (DEBUG) debug(arguments);

    var snow_density = 0.0;
    if ((vm_SnowDepth + net_precipitation_snow) <= 0.0) {
      // no snow
      snow_density = 0.0;
    } else {
      snow_density = (((1.0 + vm_SnowPacking) * vm_SnowDensity * vm_SnowDepth) +
                        (new_snow_density * net_precipitation_snow)) / (vm_SnowDepth + net_precipitation_snow);
      if (snow_density > (vm_NewSnowDensityMin + vm_SnowMaxAdditionalDensity)) {
        snow_density = vm_NewSnowDensityMin + vm_SnowMaxAdditionalDensity;
      }
    }
    return snow_density;
  };

  var calcLiquidWaterRetainedInSnow = function (frozen_water_in_snow, snow_water_equivalent) {

    if (DEBUG) debug(arguments);

    var snow_retention_capacity;
    var liquid_water_retained_in_snow;

    if ((frozen_water_in_snow <= 0.0) || (vm_SnowDensity <= 0.0)) {
      snow_retention_capacity = 0.0;
    } else {
      snow_retention_capacity = vm_SnowRetentionCapacityMax / 10.0 / vm_SnowDensity;

      if (snow_retention_capacity < vm_SnowRetentionCapacityMin)
        snow_retention_capacity = vm_SnowRetentionCapacityMin;
      if (snow_retention_capacity > vm_SnowRetentionCapacityMax)
        snow_retention_capacity = vm_SnowRetentionCapacityMax;
    }

    liquid_water_retained_in_snow = snow_retention_capacity * snow_water_equivalent;
    return liquid_water_retained_in_snow;
  };

  var calcPotentialInfiltration = function (net_precipitation, snow_layer_water_release, snow_depth) {

    if (DEBUG) debug(arguments);
    
    var water_to_infiltrate = net_precipitation;
    if (snow_depth >= 0.01){
      vm_WaterToInfiltrate = snow_layer_water_release;
    }
    return water_to_infiltrate;
  };

  var calcSnowDepth = function (snow_water_equivalent) {

    if (DEBUG) debug(arguments);

    var pm_WaterDensity = 1.0; // [kg dm-3]
    if (snow_water_equivalent <= 0.0) {
      vm_SnowDepth = 0.0;
    } else {
      vm_SnowDepth = snow_water_equivalent * pm_WaterDensity / vm_SnowDensity; // [mm * kg dm-3 kg-1 dm3]

      // check if new snow depth is higher than maximal snow depth
      if (vm_SnowDepth>vm_maxSnowDepth) {
        vm_maxSnowDepth = vm_SnowDepth;
      }

      if (vm_SnowDepth < 0.01) {
        vm_SnowDepth = 0.0;
      }
    }
    if (vm_SnowDepth == 0.0) {
      vm_SnowDensity = 0.0;
      vm_FrozenWaterInSnow = 0.0;
      vm_LiquidWaterInSnow = 0.0;
    }
    vm_AccumulatedSnowDepth+=vm_SnowDepth;
  };

  return {
      calcSnowLayer: calcSnowLayer
    , getVm_SnowDepth: function () { return vm_SnowDepth; }
    , getWaterToInfiltrate: function () { return vm_WaterToInfiltrate; }
    , getMaxSnowDepth: function () { return vm_maxSnowDepth; }
    , accumulatedSnowDepth: function () { return vm_AccumulatedSnowDepth; }
  };

};


var SoilMoisture = function (sc, stps, mm, cpp) {

  var soilColumn = sc,
      siteParameters = stps,
      monica = mm,
      centralParameterProvider = cpp,
      vm_NumberOfLayers = sc.vs_NumberOfLayers() + 1,
      vs_NumberOfLayers = sc.vs_NumberOfLayers(), //extern
      vm_ActualEvapotranspiration = 0.0,
      vm_AvailableWater = new Float64Array(vm_NumberOfLayers), // Soil available water in [mm]
      vm_CapillaryRise = 0,
      pm_CapillaryRiseRate = new Float64Array(vm_NumberOfLayers),
      vm_CapillaryWater = new Float64Array(vm_NumberOfLayers), // soil capillary water in [mm]
      vm_CapillaryWater70 = new Float64Array(vm_NumberOfLayers), // 70% of soil capillary water in [mm]
      vm_Evaporation = new Float64Array(vm_NumberOfLayers), //intern
      vm_Evapotranspiration = new Float64Array(vm_NumberOfLayers), //intern
      vm_FieldCapacity = new Float64Array(vm_NumberOfLayers),
      vm_FluxAtLowerBoundary = 0.0,
      vm_GravitationalWater = new Float64Array(vm_NumberOfLayers), // Gravitational water in [mm d-1] //intern
      vm_GrossPrecipitation = 0.0, //internal
      vm_GroundwaterAdded = 0,
      //vm_GroundwaterDistance = vm_NumberOfLayers, 0), // map  = joachim)
      vm_GroundwaterTable = 0,
      vm_HeatConductivity = new Float64Array(vm_NumberOfLayers),
      vm_Infiltration = 0.0,
      vm_Interception = 0.0,
      vc_KcFactor = 0.6,
      vm_Lambda = new Float64Array(vm_NumberOfLayers),
      vm_LambdaReduced = 0,
      vs_Latitude = stps.vs_Latitude,
      vm_LayerThickness = new Float64Array(vm_NumberOfLayers), //0.01, 
      vw_MaxAirTemperature = 0,
      vw_MeanAirTemperature = 0,
      vw_MinAirTemperature = 0,
      vc_NetPrecipitation = 0.0,
      vw_NetRadiation = 0,
      vm_PermanentWiltingPoint = new Float64Array(vm_NumberOfLayers),
      vc_PercentageSoilCoverage = 0.0,
      vm_PercolationRate = new Float64Array(vm_NumberOfLayers), // Percolation rate in [mm d-1] //intern
      vw_Precipitation = 0,
      vm_ReferenceEvapotranspiration = 6.0, //internal
      vw_RelativeHumidity = 0,
      vm_ResidualEvapotranspiration = new Float64Array(vm_NumberOfLayers),
      vm_SoilMoisture = new Float64Array(vm_NumberOfLayers), //0.20 //result 
      vm_SoilMoisture_crit = 0, 
      vm_SoilMoistureDeficit = 0,
      vm_SoilPoreVolume = new Float64Array(vm_NumberOfLayers),
      vc_StomataResistance = 0,
      vm_SurfaceRunOff = 0.0, //internal
      vm_SumSurfaceRunOff = 0.0, // intern accumulation variable
      vm_SurfaceWaterStorage = 0.0,
      vm_TotalWaterRemoval = 0,
      vm_Transpiration = new Float64Array(vm_NumberOfLayers), //intern
      vm_TranspirationDeficit = 0,
      vm_WaterFlux = new Float64Array(vm_NumberOfLayers),
      vw_WindSpeed = 0,
      vw_WindSpeedHeight = 0,
      vm_XSACriticalSoilMoisture = 0,
      crop = null

      vm_Infiltration = 0.0,
      vm_Interception = 0.0,
      vm_SurfaceRunOff = 0.0,
      vm_CapillaryRise = 0.0,
      vm_GroundwaterAdded = 0.0,
      vm_ActualTranspiration = 0.0,
      vm_ActualEvaporation = 0.0,
      vm_PercolationFactor = 0.0,
      vm_LambdaReduced = 0.0;    

    for (var i = 0; i < vm_NumberOfLayers; i++) {
      vm_SoilMoisture[i] = 0.20;
      vm_LayerThickness[i] = 0.01;
      // vm_AvailableWater[i] = 0.0;
      // pm_CapillaryRiseRate[i] = 0.0;
      // vm_CapillaryWater[i] = 0.0;
      // vm_CapillaryWater70[i] = 0.0;
      // vm_Evaporation[i] = 0.0;
      // vm_Evapotranspiration[i] = 0.0;
      // vm_FieldCapacity[i] = 0.0;
      // vm_GravitationalWater[i] = 0.0;
      // vm_HeatConductivity[i] = 0.0;
      // vm_Lambda[i] = 0.0;
      // vm_PermanentWiltingPoint[i] = 0.0;
      // vm_PercolationRate[i] = 0.0;
      // vm_ResidualEvapotranspiration[i] = 0.0;
      // vm_SoilPoreVolume[i] = 0.0;
      // vm_Transpiration[i] = 0.0;
      // vm_WaterFlux[i] = 0.0;
    }

    logger(MSG.INFO, "Constructor: SoilMoisture");

  var snowComponent = new SnowComponent(centralParameterProvider),
      frostComponent = new FrostComponent(soilColumn, centralParameterProvider),
      sm_params = centralParameterProvider.userSoilMoistureParameters,
      env_params =  centralParameterProvider.userEnvironmentParameters,
      vm_HydraulicConductivityRedux = sm_params.pm_HydraulicConductivityRedux,
      pt_TimeStep = centralParameterProvider.userEnvironmentParameters.p_timeStep,
      vm_SurfaceRoughness = sm_params.pm_SurfaceRoughness,
      vm_GroundwaterDischarge = sm_params.pm_GroundwaterDischarge,
      pm_MaxPercolationRate = sm_params.pm_MaxPercolationRate,
      pm_LeachingDepth = env_params.p_LeachingDepth,
      pm_LayerThickness = env_params.p_LayerThickness,
      pm_LeachingDepthLayer = int(floor(0.5 + (pm_LeachingDepth / pm_LayerThickness))) - 1,
      vm_SaturatedHydraulicConductivity = new Array(vm_NumberOfLayers);

    for (var i=0; i<vm_NumberOfLayers; i++) {
      vm_SaturatedHydraulicConductivity[i] = sm_params.pm_SaturatedHydraulicConductivity; // original [8640 mm d-1]
    }

  var step = function (
    vs_GroundwaterDepth,
    vw_Precipitation,
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vw_RelativeHumidity,
    vw_MeanAirTemperature,
    vw_WindSpeed,
    vw_WindSpeedHeight,
    vw_GlobalRadiation,
    vs_JulianDay
  ) {

    if(DEBUG) debug(arguments);

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      // initialization with moisture values stored in the layer
      vm_SoilMoisture[i_Layer] = soilColumn[i_Layer].get_Vs_SoilMoisture_m3();
      vm_WaterFlux[i_Layer] = 0.0;
      vm_FieldCapacity[i_Layer] = soilColumn[i_Layer].get_FieldCapacity();
      vm_SoilPoreVolume[i_Layer] = soilColumn[i_Layer].get_Saturation();
      vm_PermanentWiltingPoint[i_Layer] = soilColumn[i_Layer].get_PermanentWiltingPoint();
      vm_LayerThickness[i_Layer] = soilColumn[i_Layer].vs_LayerThickness;
      vm_Lambda[i_Layer] = soilColumn[i_Layer].vs_Lambda;
    }

    vm_SoilMoisture[vm_NumberOfLayers - 1] = soilColumn[vm_NumberOfLayers - 2].get_Vs_SoilMoisture_m3();
    vm_WaterFlux[vm_NumberOfLayers - 1] = 0.0;
    vm_FieldCapacity[vm_NumberOfLayers - 1] = soilColumn[vm_NumberOfLayers - 2].get_FieldCapacity();
    vm_SoilPoreVolume[vm_NumberOfLayers - 1] = soilColumn[vm_NumberOfLayers - 2].get_Saturation();
    vm_LayerThickness[vm_NumberOfLayers - 1] = soilColumn[vm_NumberOfLayers - 2].vs_LayerThickness;
    vm_Lambda[vm_NumberOfLayers - 1] = soilColumn[vm_NumberOfLayers - 2].vs_Lambda;

    vm_SurfaceWaterStorage = soilColumn.vs_SurfaceWaterStorage;

    var vc_CropPlanted   = false;
    var vc_CropHeight  = 0.0;
    var vc_DevelopmentalStage = 0;

    if (monica.cropGrowth()) {
      vc_CropPlanted = true;
      vc_PercentageSoilCoverage = monica.cropGrowth().get_SoilCoverage();
      vc_KcFactor = monica.cropGrowth().get_KcFactor();
      vc_CropHeight = monica.cropGrowth().get_CropHeight();
      vc_DevelopmentalStage = monica.cropGrowth().get_DevelopmentalStage();
      if (vc_DevelopmentalStage > 0) {
        vc_NetPrecipitation = monica.cropGrowth().get_NetPrecipitation();
      } else {
        vc_NetPrecipitation = vw_Precipitation;
      }

    } else {
      vc_CropPlanted = false;
      vc_KcFactor = centralParameterProvider.userSoilMoistureParameters.pm_KcFactor;
      vc_NetPrecipitation = vw_Precipitation;
      vc_PercentageSoilCoverage = 0.0;
    }

    // Recalculates current depth of groundwater table
    vm_GroundwaterTable = vs_NumberOfLayers + 2;
    var vm_GroundwaterHelper = vs_NumberOfLayers - 1;
    for (var i_Layer = vs_NumberOfLayers - 1; i_Layer >= 0; i_Layer--) {
      if (vm_SoilMoisture[i_Layer] == vm_SoilPoreVolume[i_Layer] && (vm_GroundwaterHelper == i_Layer)) {
        vm_GroundwaterHelper--;
        vm_GroundwaterTable = i_Layer;
      }
    }
    if ((vm_GroundwaterTable > (int(vs_GroundwaterDepth / soilColumn[0].vs_LayerThickness)))
         && (vm_GroundwaterTable < (vs_NumberOfLayers + 2))) {

      vm_GroundwaterTable = (int(vs_GroundwaterDepth / soilColumn[0].vs_LayerThickness));

    } else if (vm_GroundwaterTable >= (vs_NumberOfLayers + 2)){

      vm_GroundwaterTable = (int(vs_GroundwaterDepth / soilColumn[0].vs_LayerThickness));

    }

    soilColumn.vm_GroundwaterTable = vm_GroundwaterTable;

    // calculates snow layer water storage and release
    snowComponent.calcSnowLayer(vw_MeanAirTemperature, vc_NetPrecipitation);
    var vm_WaterToInfiltrate = snowComponent.getWaterToInfiltrate();
    
    // Calculates frost and thaw depth and switches lambda
    frostComponent.calcSoilFrost(vw_MeanAirTemperature, snowComponent.getVm_SnowDepth());

    // calculates infiltration of water from surface
    fm_Infiltration(vm_WaterToInfiltrate, vc_PercentageSoilCoverage, vm_GroundwaterTable);

    if ((vs_GroundwaterDepth <= 10.0) && (vs_GroundwaterDepth > 0.0)) {

      fm_PercolationWithGroundwater(vs_GroundwaterDepth);
      fm_GroundwaterReplenishment();

    } else {

      fm_PercolationWithoutGroundwater();
      fm_BackwaterReplenishment();

    }

    fm_Evapotranspiration(vc_PercentageSoilCoverage, vc_KcFactor, siteParameters.vs_HeightNN, vw_MaxAirTemperature,
        vw_MinAirTemperature, vw_RelativeHumidity, vw_MeanAirTemperature, vw_WindSpeed, vw_WindSpeedHeight,
        vw_GlobalRadiation, vc_DevelopmentalStage, vs_JulianDay, vs_Latitude);

    fm_CapillaryRise();

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      // debug('vm_SoilMoisture[i_Layer], i_Layer = ' + i_Layer, vm_SoilMoisture[i_Layer]);
      soilColumn[i_Layer].set_Vs_SoilMoisture_m3(vm_SoilMoisture[i_Layer]);
      soilColumn[i_Layer].vs_SoilWaterFlux = vm_WaterFlux[i_Layer];
      soilColumn[i_Layer].calc_vs_SoilMoisture_pF();
    }
    soilColumn.vs_SurfaceWaterStorage = vm_SurfaceWaterStorage;
    soilColumn.vs_FluxAtLowerBoundary = vm_FluxAtLowerBoundary;

  };

  var fm_Infiltration = function (vm_WaterToInfiltrate, vc_PercentageSoilCoverage, vm_GroundwaterTable) {

    // debug(arguments, 'SoilMoisture::fm_Infiltration');

    // For receiving daily precipitation data all variables have to be reset
    var vm_RunOffFactor;
    var vm_PotentialInfiltration;
    var vm_ReducedHydraulicConductivity;
    var vm_PercolationFactor;
    var vm_LambdaReduced;

    vm_Infiltration = 0.0;
    vm_Interception = 0.0;
    vm_SurfaceRunOff = 0.0;
    vm_CapillaryRise = 0.0;
    vm_GroundwaterAdded = 0.0;
    vm_ActualTranspiration = 0.0;
    vm_PercolationFactor = 0.0;
    vm_LambdaReduced = 0.0;

    var vm_SurfaceWaterStorageOld = vm_SurfaceWaterStorage;

    // add the netto precipitation to the virtual surface water storage
    vm_SurfaceWaterStorage += vm_WaterToInfiltrate;

    // Calculating potential infiltration in [mm d-1]
    vm_SoilMoistureDeficit = (vm_SoilPoreVolume[0] - vm_SoilMoisture[0]) / vm_SoilPoreVolume[0];
    vm_ReducedHydraulicConductivity = vm_SaturatedHydraulicConductivity[0] * vm_HydraulicConductivityRedux;

    // in case of sensitivity analysis, this parameter would not be undefined
    // if (centralParameterProvider.sensitivityAnalysisParameters.p_ReducedHydraulicConductivity != UNDEFINED) {
    //   vm_ReducedHydraulicConductivity = centralParameterProvider.sensitivityAnalysisParameters.p_ReducedHydraulicConductivity;
    //   //cout << "p_ReducedHydraulicConductivity:\t" << vm_ReducedHydraulicConductivity << endl;
    // }

    if (vm_ReducedHydraulicConductivity > 0.0) {

      vm_PotentialInfiltration
          = (vm_ReducedHydraulicConductivity * 0.2 * vm_SoilMoistureDeficit * vm_SoilMoistureDeficit);

      // minimum of the availabe amount of water and the amount, soil is able to assimilate water
      // überprüft, dass das zu infiltrierende Wasser nicht größer ist
      // als das Volumnen, welches es aufnehmen kann
      vm_Infiltration = min(vm_SurfaceWaterStorage, vm_PotentialInfiltration);

      /** @todo <b>Claas:</b> Mathematischer Sinn ist zu überprüfen */
      vm_Infiltration = min(vm_Infiltration, ((vm_SoilPoreVolume[0] - vm_SoilMoisture[0]) * 1000.0
          * soilColumn[0].vs_LayerThickness));

      // Limitation of airfilled pore space added to prevent water contents
      // above pore space in layers below (Claas Nendel)
      vm_Infiltration = max(0.0, vm_Infiltration);
    } else {
      vm_Infiltration = 0.0;
    }

    // Updating yesterday's surface water storage
    if (vm_Infiltration > 0.0) {

      // Reduce the water storage with the infiltration amount
      vm_SurfaceWaterStorage -= vm_Infiltration;
    }

    // Calculating overflow due to water level exceeding surface roughness [mm]
    if (vm_SurfaceWaterStorage > (10.0 * vm_SurfaceRoughness / (siteParameters.vs_Slope + 0.001))) {

      // Calculating surface run-off driven by slope and altered by surface roughness and soil coverage
      // minimal slope at which water will be run off the surface
      vm_RunOffFactor = 0.02 + (vm_SurfaceRoughness / 4.0) + (vc_PercentageSoilCoverage / 15.0);
      if (siteParameters.vs_Slope < 0.0 || siteParameters.vs_Slope > 1.0) {

        // no valid slope
        logger(MSG.WARN, "Slope value out ouf boundary");

      } else if (siteParameters.vs_Slope == 0.0) {

        // no slope so there will be no loss of water
        vm_SurfaceRunOff = 0.0;

      } else if (siteParameters.vs_Slope > vm_RunOffFactor) {

        // add all water from the surface to the run-off storage
        vm_SurfaceRunOff += vm_SurfaceWaterStorage;

      } else {

        // some water is running off because of a sloped surface
        /** @todo Claas: Ist die Formel korrekt? vm_RunOffFactor wird einmal reduziert? */
        vm_SurfaceRunOff += ((siteParameters.vs_Slope * vm_RunOffFactor) / (vm_RunOffFactor * vm_RunOffFactor)) * vm_SurfaceWaterStorage;
      }

      // Update surface water storage
      vm_SurfaceWaterStorage -= vm_SurfaceRunOff;
    }

    // Adding infiltrating water to top layer soil moisture
    vm_SoilMoisture[0] += (vm_Infiltration / 1000.0 / vm_LayerThickness[0]);

    // [m3 m-3] += ([mm] - [mm]) / [] / [m]; -. Conversion into volumetric water content [m3 m-3]
    vm_WaterFlux[0] = vm_Infiltration; // Fluss in Schicht 0

    // Calculating excess soil moisture (water content exceeding field capacity) for percolation
    if (vm_SoilMoisture[0] > vm_FieldCapacity[0]) {

      vm_GravitationalWater[0] = (vm_SoilMoisture[0] - vm_FieldCapacity[0]) * 1000.0
          * vm_LayerThickness[0];
      vm_LambdaReduced = vm_Lambda[0] * frostComponent.getLambdaRedux(0);
      vm_PercolationFactor = 1 + vm_LambdaReduced * vm_GravitationalWater[0];
      vm_PercolationRate[0] = (
        (vm_GravitationalWater[0] * vm_GravitationalWater[0] * vm_LambdaReduced) / vm_PercolationFactor
      );
      // debug("1 vm_Lambda[0]", vm_Lambda[0]);
      // debug("1 frostComponent.getLambdaRedux(0)", frostComponent.getLambdaRedux(0));

      if (vm_PercolationRate[0] > pm_MaxPercolationRate)
          vm_PercolationRate[0] = pm_MaxPercolationRate;

      vm_GravitationalWater[0] = vm_GravitationalWater[0] - vm_PercolationRate[0];
      vm_GravitationalWater[0] = max(0.0, vm_GravitationalWater[0]);

      // debug("2 vm_PercolationRate[0]", vm_PercolationRate[0]);


      // Adding the excess water remaining after the percolation event to soil moisture
      vm_SoilMoisture[0] = vm_FieldCapacity[0] + (vm_GravitationalWater[0] / 1000.0 / vm_LayerThickness[0]);
      
      // debug("vm_FieldCapacity[0]", vm_FieldCapacity[0]);
      // debug("3 vm_GravitationalWater[0]", vm_GravitationalWater[0]);
      // debug("vm_LayerThickness[0]", vm_LayerThickness[0]);
      // debug("m_SoilMoisture", vm_SoilMoisture);

      // For groundwater table in first or second top layer no percolation occurs
      if (vm_GroundwaterTable <= 1) {
        vm_PercolationRate[0] = 0.0;
      }

      // For groundwater table at soil surface no percolation occurs
      if (vm_GroundwaterTable == 0) {
        vm_PercolationRate[0] = 0.0;

        // For soil water volume exceeding total pore volume, surface runoff occurs
        if (vm_SoilMoisture[0] > vm_SoilPoreVolume[0]) {
          vm_SurfaceRunOff += (vm_SoilMoisture[0] - vm_SoilPoreVolume[0]) * 1000.0 * vm_LayerThickness[0];
          vm_SoilMoisture[0] = vm_SoilPoreVolume[0];
          return;
        }
      }
    } else if (vm_SoilMoisture[0] <= vm_FieldCapacity[0]) {

      // For soil moisture contents below field capacity no excess water and no fluxes occur
      vm_PercolationRate[0] = 0.0;
      vm_GravitationalWater[0] = 0.0;
    }


    // Check water balance

    if (abs((vm_SurfaceWaterStorageOld + vm_WaterToInfiltrate) - (vm_SurfaceRunOff + vm_Infiltration
        + vm_SurfaceWaterStorage)) > 0.01) {

      logger(MSG.WARN, "water balance wrong!");
    }

    // water flux of next layer equals percolation rate of layer above
    vm_WaterFlux[1] = vm_PercolationRate[0];
    vm_SumSurfaceRunOff+=vm_SurfaceRunOff;
  };

  var get_SoilMoisture = function (layer) {
    return soilColumn[layer].get_Vs_SoilMoisture_m3();
  };

  var get_CapillaryRise = function (layer) {
    return vm_CapillaryWater[layer];
  };

  var get_PercolationRate = function (layer) {
    return vm_PercolationRate[layer];
  };

  var fm_CapillaryRise = function () {

    var vc_RootingDepth;
    var vm_GroundwaterDistance;
    var vm_WaterAddedFromCapillaryRise;

    vc_RootingDepth = crop ? crop.get_RootingDepth() : 0;

    vm_GroundwaterDistance = vm_GroundwaterTable - vc_RootingDepth;// []

    if (vm_GroundwaterDistance < 1) vm_GroundwaterDistance = 1;

    if ((vm_GroundwaterDistance * vm_LayerThickness[0]) <= 2.70) { // [m]
    // Capillary rise rates in table defined only until 2.70 m

      for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      // Define capillary water and available water

        vm_CapillaryWater[i_Layer] = vm_FieldCapacity[i_Layer]
    - vm_PermanentWiltingPoint[i_Layer];

        vm_AvailableWater[i_Layer] = vm_SoilMoisture[i_Layer] - vm_PermanentWiltingPoint[i_Layer];

        if (vm_AvailableWater[i_Layer] < 0.0) {
          vm_AvailableWater[i_Layer] = 0.0;
        }

        vm_CapillaryWater70[i_Layer] = 0.7 * vm_CapillaryWater[i_Layer];
      }

      var vm_CapillaryRiseRate = 0.01; //[m d-1]
      var pm_CapillaryRiseRate = 0.01; //[m d-1]
      // Find first layer above groundwater with 70% available water
      var vm_StartLayer = min(vm_GroundwaterTable,(vs_NumberOfLayers - 1));
      for (var i_Layer = vm_StartLayer; i_Layer >= 0; i_Layer--) {

        var vs_SoilTexture = soilColumn[i_Layer].vs_SoilTexture;
        pm_CapillaryRiseRate = centralParameterProvider.capillaryRiseRates.getRate(vs_SoilTexture, vm_GroundwaterDistance);

        if(pm_CapillaryRiseRate < vm_CapillaryRiseRate){
          vm_CapillaryRiseRate = pm_CapillaryRiseRate;
        }

        if (vm_AvailableWater[i_Layer] < vm_CapillaryWater70[i_Layer]) {

          vm_WaterAddedFromCapillaryRise = vm_CapillaryRiseRate; //[m3 m-2 d-1]

          vm_SoilMoisture[i_Layer] += vm_WaterAddedFromCapillaryRise;

          for (var j_Layer = vm_StartLayer; j_Layer >= i_Layer; j_Layer--) {
            vm_WaterFlux[j_Layer] -= vm_WaterAddedFromCapillaryRise;
          }
          break;
        }
      }
    } // if((double (vm_GroundwaterDistance) * vm_LayerThickness[0]) <= 2.70)
  };

  var fm_PercolationWithGroundwater = function (vs_GroundwaterDepth) {

    var vm_PercolationFactor;
    var vm_LambdaReduced;
    vm_GroundwaterAdded = 0.0;

    for (var i_Layer = 0; i_Layer < vm_NumberOfLayers - 1; i_Layer++) {

      if (i_Layer < vm_GroundwaterTable - 1) {

        // well above groundwater table
        vm_SoilMoisture[i_Layer + 1] += vm_PercolationRate[i_Layer] / 1000.0 / vm_LayerThickness[i_Layer];
        vm_WaterFlux[i_Layer + 1] = vm_PercolationRate[i_Layer];

        if (vm_SoilMoisture[i_Layer + 1] > vm_FieldCapacity[i_Layer + 1]) {

          // Soil moisture exceeding field capacity
          vm_GravitationalWater[i_Layer + 1] = (
            (vm_SoilMoisture[i_Layer + 1] - vm_FieldCapacity[i_Layer + 1]) * 
            1000.0 * vm_LayerThickness[i_Layer + 1]
          );

          vm_LambdaReduced = vm_Lambda[i_Layer + 1] * frostComponent.getLambdaRedux(i_Layer + 1);
          vm_PercolationFactor = 1 + vm_LambdaReduced * vm_GravitationalWater[i_Layer + 1];
          vm_PercolationRate[i_Layer + 1] = ((vm_GravitationalWater[i_Layer + 1] * vm_GravitationalWater[i_Layer + 1]
              * vm_LambdaReduced) / vm_PercolationFactor);

          vm_GravitationalWater[i_Layer + 1] = vm_GravitationalWater[i_Layer + 1] - vm_PercolationRate[i_Layer + 1];

          if (vm_GravitationalWater[i_Layer + 1] < 0) {
            vm_GravitationalWater[i_Layer + 1] = 0.0;
          }

          vm_SoilMoisture[i_Layer + 1] = (
            vm_FieldCapacity[i_Layer + 1] + (vm_GravitationalWater[i_Layer + 1] / 
            1000.0 / 
            vm_LayerThickness[i_Layer + 1])
          );

          if (vm_SoilMoisture[i_Layer + 1] > vm_SoilPoreVolume[i_Layer + 1]) {

            // Soil moisture exceeding soil pore volume
            vm_GravitationalWater[i_Layer + 1] = (
              (vm_SoilMoisture[i_Layer + 1] - vm_SoilPoreVolume[i_Layer + 1]) * 
              1000.0 * 
              vm_LayerThickness[i_Layer + 1]
            );
            vm_SoilMoisture[i_Layer + 1] = vm_SoilPoreVolume[i_Layer + 1];
            vm_PercolationRate[i_Layer + 1] += vm_GravitationalWater[i_Layer + 1];
          }
        } else {
          // Soil moisture below field capacity
          vm_PercolationRate[i_Layer + 1] = 0.0;
          vm_GravitationalWater[i_Layer + 1] = 0.0;
        }
      } // if (i_Layer < vm_GroundwaterTable - 1) {

      // when the layer directly above ground water table is reached
      if (i_Layer == vm_GroundwaterTable - 1) {

        // groundwater table shall not undermatch the oscillating groundwater depth
        // which is generated within the outer framework
        if (vm_GroundwaterTable >= int(vs_GroundwaterDepth / vm_LayerThickness[i_Layer])) {
          vm_SoilMoisture[i_Layer + 1] += (
            (vm_PercolationRate[i_Layer]) / 1000.0 / vm_LayerThickness[i_Layer]
          );
          vm_PercolationRate[i_Layer + 1] = vm_GroundwaterDischarge;
          vm_WaterFlux[i_Layer + 1] = vm_PercolationRate[i_Layer];
        } else {
          vm_SoilMoisture[i_Layer + 1] += (
            (vm_PercolationRate[i_Layer] - vm_GroundwaterDischarge) / 
            1000.0 / 
            vm_LayerThickness[i_Layer]
          );
          vm_PercolationRate[i_Layer + 1] = vm_GroundwaterDischarge;
          vm_WaterFlux[i_Layer + 1] = vm_GroundwaterDischarge;
        }

        if (vm_SoilMoisture[i_Layer + 1] >= vm_SoilPoreVolume[i_Layer + 1]) {

          //vm_GroundwaterTable--; // Rising groundwater table if vm_SoilMoisture > soil pore volume

          // vm_GroundwaterAdded is the volume of water added to the groundwater body.
          // It does not correspond to groundwater replenishment in the technical sense !!!!!
          vm_GroundwaterAdded = (
            (vm_SoilMoisture[i_Layer + 1] - vm_SoilPoreVolume[i_Layer + 1]) * 1000.0 * vm_LayerThickness[i_Layer + 1]
          );

          vm_SoilMoisture[i_Layer + 1] = vm_SoilPoreVolume[i_Layer + 1];

          if (vm_GroundwaterAdded <= 0.0) {
            vm_GroundwaterAdded = 0.0;
          }
        }

      } // if (i_Layer == vm_GroundwaterTable - 1)

      // when the groundwater table is reached
      if (i_Layer > vm_GroundwaterTable - 1) {

        vm_SoilMoisture[i_Layer + 1] = vm_SoilPoreVolume[i_Layer + 1];

        if (vm_GroundwaterTable >= int(vs_GroundwaterDepth / vm_LayerThickness[i_Layer])) {
          vm_PercolationRate[i_Layer + 1] = vm_PercolationRate[i_Layer];
          vm_WaterFlux[i_Layer] = vm_PercolationRate[i_Layer + 1];
        } else {
          vm_PercolationRate[i_Layer + 1] = vm_GroundwaterDischarge;
          vm_WaterFlux[i_Layer] = vm_GroundwaterDischarge;
        }
      } // if (i_Layer > vm_GroundwaterTable - 1)

    } // for

    vm_FluxAtLowerBoundary = vm_WaterFlux[pm_LeachingDepthLayer];

  };

  var fm_GroundwaterReplenishment = function () {

    // Auffuellschleife von GW-Oberflaeche in Richtung Oberflaeche
    var vm_StartLayer = vm_GroundwaterTable;

    if (vm_StartLayer > vm_NumberOfLayers - 2) {
      vm_StartLayer = vm_NumberOfLayers - 2;
    }

    for (var i_Layer = vm_StartLayer; i_Layer >= 0; i_Layer--) {

      vm_SoilMoisture[i_Layer] += vm_GroundwaterAdded / 1000.0 / vm_LayerThickness[i_Layer + 1];

      if (i_Layer == vm_StartLayer){
        vm_PercolationRate[i_Layer] = vm_GroundwaterDischarge;
      } else {
        vm_PercolationRate[i_Layer] -= vm_GroundwaterAdded; // Fluss_u durch Grundwasser
        vm_WaterFlux[i_Layer + 1] = vm_PercolationRate[i_Layer]; // Fluss_u durch Grundwasser
      }

      if (vm_SoilMoisture[i_Layer] > vm_SoilPoreVolume[i_Layer]) {

        vm_GroundwaterAdded = (vm_SoilMoisture[i_Layer] - vm_SoilPoreVolume[i_Layer]) * 1000.0 * vm_LayerThickness[i_Layer + 1];
        vm_SoilMoisture[i_Layer] = vm_SoilPoreVolume[i_Layer];
        vm_GroundwaterTable--; // Groundwater table rises

        if (i_Layer == 0 && vm_GroundwaterTable == 0) {

          // if groundwater reaches surface
          vm_SurfaceWaterStorage += vm_GroundwaterAdded;
          vm_GroundwaterAdded = 0.0;
        }
      } else {
        vm_GroundwaterAdded = 0.0;
      }

    } // for

    if (pm_LeachingDepthLayer>vm_GroundwaterTable-1) {
      if (vm_GroundwaterTable-1 < 0){
        vm_FluxAtLowerBoundary = 0.0;
      } else {
        vm_FluxAtLowerBoundary = vm_WaterFlux[vm_GroundwaterTable-1];
      }
    } else {
      vm_FluxAtLowerBoundary = vm_WaterFlux[pm_LeachingDepthLayer];
    }
    //cout << "GWN: " << vm_FluxAtLowerBoundary << endl;
  };

  var fm_PercolationWithoutGroundwater = function () {
    
    var vm_PercolationFactor;
    var vm_LambdaReduced;

    for (var i_Layer = 0; i_Layer < vm_NumberOfLayers - 1; i_Layer++) {

      vm_SoilMoisture[i_Layer + 1] += vm_PercolationRate[i_Layer] / 1000.0 / vm_LayerThickness[i_Layer];

      if ((vm_SoilMoisture[i_Layer + 1] > vm_FieldCapacity[i_Layer + 1])) {

        // too much water for this layer so some water is released to layers below
        vm_GravitationalWater[i_Layer + 1] = (
          (vm_SoilMoisture[i_Layer + 1] - vm_FieldCapacity[i_Layer + 1]) * 1000.0 * vm_LayerThickness[0]
        );
        vm_LambdaReduced = vm_Lambda[i_Layer + 1] * frostComponent.getLambdaRedux(i_Layer + 1);
        vm_PercolationFactor = 1.0 + (vm_LambdaReduced * vm_GravitationalWater[i_Layer + 1]);
        vm_PercolationRate[i_Layer + 1] = (vm_GravitationalWater[i_Layer + 1] * vm_GravitationalWater[i_Layer + 1]
            * vm_LambdaReduced) / vm_PercolationFactor;

        if (vm_PercolationRate[i_Layer + 1] > pm_MaxPercolationRate) {
          vm_PercolationRate[i_Layer + 1] = pm_MaxPercolationRate;
        }

        vm_GravitationalWater[i_Layer + 1] = vm_GravitationalWater[i_Layer + 1] - vm_PercolationRate[i_Layer + 1];

        if (vm_GravitationalWater[i_Layer + 1] < 0.0) {
          vm_GravitationalWater[i_Layer + 1] = 0.0;
        }

        vm_SoilMoisture[i_Layer + 1] = (
          vm_FieldCapacity[i_Layer + 1] + (vm_GravitationalWater[i_Layer + 1] / 1000.0 / vm_LayerThickness[i_Layer + 1])
        );
      } else {

        // no water will be released in other layers
        vm_PercolationRate[i_Layer + 1] = 0.0;
        vm_GravitationalWater[i_Layer + 1] = 0.0;
      }

      vm_WaterFlux[i_Layer + 1] = vm_PercolationRate[i_Layer];
      vm_GroundwaterAdded = vm_PercolationRate[i_Layer + 1];

    } // for

    if ((pm_LeachingDepthLayer > 0) && (pm_LeachingDepthLayer < (vm_NumberOfLayers - 1))) {
      vm_FluxAtLowerBoundary = vm_WaterFlux[pm_LeachingDepthLayer];
    } else {
      vm_FluxAtLowerBoundary = vm_WaterFlux[vm_NumberOfLayers - 2];
    }
  };

  var fm_BackwaterReplenishment = function () {

    var vm_StartLayer = vm_NumberOfLayers - 1;
    var vm_BackwaterTable = vm_NumberOfLayers - 1;
    var vm_BackwaterAdded = 0.0;

    // find first layer from top where the water content exceeds pore volume
    for (var i_Layer = 0; i_Layer < vm_NumberOfLayers - 1; i_Layer++) {
      if (vm_SoilMoisture[i_Layer] > vm_SoilPoreVolume[i_Layer]) {
        vm_StartLayer = i_Layer;
        vm_BackwaterTable = i_Layer;
      }
    }

    // if there is no such thing nothing will happen
    if (vm_BackwaterTable == 0)
      return;

    // Backwater replenishment upwards
    for (var i_Layer = vm_StartLayer; i_Layer >= 0; i_Layer--) {

      //!TODO check loop and whether it really should be i_Layer + 1 or the loop should start one layer higher ????!!!!
      vm_SoilMoisture[i_Layer] += vm_BackwaterAdded / 1000.0 / vm_LayerThickness[i_Layer];// + 1];
      if (i_Layer > 0) {
        vm_WaterFlux[i_Layer - 1] -= vm_BackwaterAdded;
      }

      if (vm_SoilMoisture[i_Layer] > vm_SoilPoreVolume[i_Layer]) {

        //!TODO check also i_Layer + 1 here for same reason as above
        vm_BackwaterAdded = (vm_SoilMoisture[i_Layer] - vm_SoilPoreVolume[i_Layer]) * 1000.0 * vm_LayerThickness[i_Layer];// + 1];
        vm_SoilMoisture[i_Layer] = vm_SoilPoreVolume[i_Layer];
        vm_BackwaterTable--; // Backwater table rises

        if (i_Layer == 0 && vm_BackwaterTable == 0) {
          // if backwater reaches surface
          vm_SurfaceWaterStorage += vm_BackwaterAdded;
          vm_BackwaterAdded = 0.0;
        }
      } else {
        vm_BackwaterAdded = 0.0;
      }
    } // for
  };

  var fm_Evapotranspiration = function (
    vc_PercentageSoilCoverage,
    vc_KcFactor,
    vs_HeightNN,
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vw_RelativeHumidity,
    vw_MeanAirTemperature,
    vw_WindSpeed,
    vw_WindSpeedHeight,
    vw_GlobalRadiation,
    vc_DevelopmentalStage,
    vs_JulianDay,
    vs_Latitude
  ) {

    var vm_EReducer_1 = 0.0;
    var vm_EReducer_2 = 0.0;
    var vm_EReducer_3 = 0.0;
    var pm_EvaporationZeta = 0.0;
    var pm_MaximumEvaporationImpactDepth = 0.0; // Das ist die Tiefe, bis zu der maximal die Evaporation vordringen kann
    var vm_EReducer = 0.0;
    var vm_PotentialEvapotranspiration = 0.0;
    var vc_EvaporatedFromIntercept = 0.0;
    var vm_EvaporatedFromSurface = 0.0;
    var vm_EvaporationFromSurface = false;

    var vm_SnowDepth = snowComponent.getVm_SnowDepth();

    // Berechnung der Bodenevaporation bis max. 4dm Tiefe
    var sm_params = centralParameterProvider.userSoilMoistureParameters;
    pm_EvaporationZeta = sm_params.pm_EvaporationZeta; // Parameterdatei

    // Das sind die Steuerungsparameter für die Steigung der Entzugsfunktion
    vm_XSACriticalSoilMoisture = sm_params.pm_XSACriticalSoilMoisture;

    /** @todo <b>Claas:</b> pm_MaximumEvaporationImpactDepth ist aber Abhängig von der Bodenart,
     * da muss was dran gemacht werden */
    pm_MaximumEvaporationImpactDepth = sm_params.pm_MaximumEvaporationImpactDepth; // Parameterdatei


    // If a crop grows, ETp is taken from crop module
    if (vc_DevelopmentalStage > 0) {
      // Reference evapotranspiration is only grabbed here for consistent
      // output in monica.cpp
      vm_ReferenceEvapotranspiration = monica.cropGrowth().get_ReferenceEvapotranspiration();

      // Remaining ET from crop module already includes Kc factor and evaporation
      // from interception storage
      vm_PotentialEvapotranspiration = monica.cropGrowth().get_RemainingEvapotranspiration();
      vc_EvaporatedFromIntercept = monica.cropGrowth().get_EvaporatedFromIntercept();

    } else { // if no crop grows ETp is calculated from ET0 * kc
      vm_ReferenceEvapotranspiration = ReferenceEvapotranspiration(vs_HeightNN, vw_MaxAirTemperature,
          vw_MinAirTemperature, vw_RelativeHumidity, vw_MeanAirTemperature, vw_WindSpeed, vw_WindSpeedHeight,
          vw_GlobalRadiation, vs_JulianDay, vs_Latitude);
      vm_PotentialEvapotranspiration = vm_ReferenceEvapotranspiration * vc_KcFactor; // - vm_InterceptionReference;
    }

    vm_ActualEvaporation = 0.0;
    vm_ActualTranspiration = 0.0;

    // from HERMES:
    if (vm_PotentialEvapotranspiration > 6.5) vm_PotentialEvapotranspiration = 6.5;

    if (vm_PotentialEvapotranspiration > 0.0) {
      // If surface is water-logged, subsequent evaporation from surface water sources
      if (vm_SurfaceWaterStorage > 0.0) {
        vm_EvaporationFromSurface = true;
        // Water surface evaporates with Kc = 1.1.
        vm_PotentialEvapotranspiration = vm_PotentialEvapotranspiration * (1.1 / vc_KcFactor);

        // If a snow layer is present no water evaporates from surface water sources
        if (vm_SnowDepth > 0.0) {
          vm_EvaporatedFromSurface = 0.0;
        } else {
          if (vm_SurfaceWaterStorage < vm_PotentialEvapotranspiration) {
            vm_PotentialEvapotranspiration -= vm_SurfaceWaterStorage;
            vm_EvaporatedFromSurface = vm_SurfaceWaterStorage;
            vm_SurfaceWaterStorage = 0.0;
          } else {
            vm_SurfaceWaterStorage -= vm_PotentialEvapotranspiration;
            vm_EvaporatedFromSurface = vm_PotentialEvapotranspiration;
            vm_PotentialEvapotranspiration = 0.0;
          }
        }
        vm_PotentialEvapotranspiration = vm_PotentialEvapotranspiration * (vc_KcFactor / 1.1);
      }


      if (vm_PotentialEvapotranspiration > 0) { // Evaporation from soil

        for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

          vm_EReducer_1 = get_EReducer_1(i_Layer, vc_PercentageSoilCoverage,
      vm_PotentialEvapotranspiration);


          if (i_Layer >= pm_MaximumEvaporationImpactDepth) {
            // layer is too deep for evaporation
            vm_EReducer_2 = 0.0;
          } else {
            // 2nd factor to reduce actual evapotranspiration by
            // MaximumEvaporationImpactDepth and EvaporationZeta
            vm_EReducer_2 = get_DeprivationFactor(i_Layer + 1, pm_MaximumEvaporationImpactDepth,
          pm_EvaporationZeta, vm_LayerThickness[i_Layer]);
          }

          if (i_Layer > 0) {
            if (vm_SoilMoisture[i_Layer] < vm_SoilMoisture[i_Layer - 1]) {
      // 3rd factor to consider if above layer contains more water than
      // the adjacent layer below, evaporation will be significantly reduced
              vm_EReducer_3 = 0.1;
            } else {
              vm_EReducer_3 = 1.0;
            }
          } else {
            vm_EReducer_3 = 1.0;
          }
          // EReducer. factor to reduce evaporation
          vm_EReducer = vm_EReducer_1 * vm_EReducer_2 * vm_EReducer_3;

          if (vc_DevelopmentalStage > 0) {
            // vegetation is present

            //Interpolation between [0,1]
            if (vc_PercentageSoilCoverage >= 0.0 && vc_PercentageSoilCoverage < 1.0) {
              vm_Evaporation[i_Layer] = ((1.0 - vc_PercentageSoilCoverage) * vm_EReducer)
                  * vm_PotentialEvapotranspiration;
            } else {
              if (vc_PercentageSoilCoverage >= 1.0) {
                vm_Evaporation[i_Layer] = 0.0;
              }
            }

            if (vm_SnowDepth > 0.0)
              vm_Evaporation[i_Layer] = 0.0;

            // Transpiration is derived from ET0; Soil coverage and Kc factors
            // already considered in crop part!
            vm_Transpiration[i_Layer] = monica.cropGrowth().get_Transpiration(i_Layer);


            // Transpiration is capped in case potential ET after surface
            // and interception evaporation has occurred on same day
            if (vm_EvaporationFromSurface) {
              vm_Transpiration[i_Layer] = vc_PercentageSoilCoverage * vm_EReducer * vm_PotentialEvapotranspiration;
            }

          } else {
            // no vegetation present
            if (vm_SnowDepth > 0.0) {
              vm_Evaporation[i_Layer] = 0.0;
            } else {
              vm_Evaporation[i_Layer] = vm_PotentialEvapotranspiration * vm_EReducer;
            }
            vm_Transpiration[i_Layer] = 0.0;

          } // if(vc_DevelopmentalStage > 0)

          vm_Evapotranspiration[i_Layer] = vm_Evaporation[i_Layer] + vm_Transpiration[i_Layer];
          vm_SoilMoisture[i_Layer] -= (vm_Evapotranspiration[i_Layer] / 1000.0 / vm_LayerThickness[i_Layer]);

          //  Generelle Begrenzung des Evaporationsentzuges
          if (vm_SoilMoisture[i_Layer] < 0.01) {
            vm_SoilMoisture[i_Layer] = 0.01;
          }

          vm_ActualTranspiration += vm_Transpiration[i_Layer];
          vm_ActualEvaporation += vm_Evaporation[i_Layer];
        } // for
      } // vm_PotentialEvapotranspiration > 0
    } // vm_PotentialEvapotranspiration > 0.0
    vm_ActualEvapotranspiration = vm_ActualTranspiration + vm_ActualEvaporation + vc_EvaporatedFromIntercept + vm_EvaporatedFromSurface;

    if (crop) {
      crop.accumulateEvapotranspiration(vm_ActualEvapotranspiration);
    }
  };

  var ReferenceEvapotranspiration = function (
    vs_HeightNN,
    vw_MaxAirTemperature,
    vw_MinAirTemperature,
    vw_RelativeHumidity,
    vw_MeanAirTemperature,
    vw_WindSpeed,
    vw_WindSpeedHeight,
    vw_GlobalRadiation,
    vs_JulianDay,
    vs_Latitude
  ) {

    var vc_Declination;
    var vc_DeclinationSinus; // old SINLD
    var vc_DeclinationCosinus; // old COSLD
    var vc_AstronomicDayLenght;
    var vc_EffectiveDayLenght ;
    var vc_PhotoperiodicDaylength ;
    var vc_PhotActRadiationMean;
    var vc_ClearDayRadiation;
    var vc_OvercastDayRadiation ;

    var vm_AtmosphericPressure; //[kPA]
    var vm_PsycrometerConstant; //[kPA °C-1]
    var vm_SaturatedVapourPressureMax; //[kPA]
    var vm_SaturatedVapourPressureMin; //[kPA]
    var vm_SaturatedVapourPressure; //[kPA]
    var vm_VapourPressure; //[kPA]
    var vm_SaturationDeficit; //[kPA]
    var vm_SaturatedVapourPressureSlope; //[kPA °C-1]
    var vm_WindSpeed_2m; //[m s-1]
    var vm_AerodynamicResistance ; //[s m-1]
    var vm_SurfaceResistance; //[s m-1]
    var vc_ExtraterrestrialRadiation;
    var vm_ReferenceEvapotranspiration; //[mm]
    var pc_ReferenceAlbedo = centralParameterProvider.userCropParameters.pc_ReferenceAlbedo; // FAO Green gras reference albedo from Allen et al. (1998)
    var PI = 3.14159265358979323;

    vc_Declination = -23.4 * cos(2.0 * PI * ((vs_JulianDay + 10.0) / 365.0));
    vc_DeclinationSinus = sin(vc_Declination * PI / 180.0) * sin(vs_Latitude * PI / 180.0);
    vc_DeclinationCosinus = cos(vc_Declination * PI / 180.0) * cos(vs_Latitude * PI / 180.0);
    vc_AstronomicDayLenght = 12.0 * (PI + 2.0 * asin(vc_DeclinationSinus / vc_DeclinationCosinus)) / PI;
    vc_EffectiveDayLenght = 12.0 * (PI + 2.0 * asin((-sin(8.0 * PI / 180.0) + vc_DeclinationSinus)
        / vc_DeclinationCosinus)) / PI;
    vc_PhotoperiodicDaylength = 12.0 * (PI + 2.0 * asin((-sin(-6.0 * PI / 180.0) + vc_DeclinationSinus)
        / vc_DeclinationCosinus)) / PI;
    vc_PhotActRadiationMean = 3600.0 * (vc_DeclinationSinus * vc_AstronomicDayLenght + 24.0 / PI * vc_DeclinationCosinus
        * sqrt(1.0 - ((vc_DeclinationSinus / vc_DeclinationCosinus) * (vc_DeclinationSinus / vc_DeclinationCosinus))));
    vc_ClearDayRadiation = 0.5 * 1300.0 * vc_PhotActRadiationMean * exp(-0.14 / (vc_PhotActRadiationMean
        / (vc_AstronomicDayLenght * 3600.0)));
    vc_OvercastDayRadiation = 0.2 * vc_ClearDayRadiation;
    var SC = 24.0 * 60.0 / PI * 8.20 *(1.0 + 0.033 * cos(2.0 * PI * vs_JulianDay / 365.0));
    var SHA = acos(-tan(vs_Latitude * PI / 180.0) * tan(vc_Declination * PI / 180.0));
    vc_ExtraterrestrialRadiation = SC * (SHA * vc_DeclinationSinus + vc_DeclinationCosinus * sin(SHA)) / 100.0; // [J cm-2] -. [MJ m-2]

    // Calculation of atmospheric pressure
    vm_AtmosphericPressure = 101.3 * pow(((293.0 - (0.0065 * vs_HeightNN)) / 293.0), 5.26);

    // Calculation of psychrometer constant - Luchtfeuchtigkeit
    vm_PsycrometerConstant = 0.000665 * vm_AtmosphericPressure;

    // Calc. of saturated water vapour pressure at daily max temperature
    vm_SaturatedVapourPressureMax = 0.6108 * exp((17.27 * vw_MaxAirTemperature) / (237.3 + vw_MaxAirTemperature));

    // Calc. of saturated water vapour pressure at daily min temperature
    vm_SaturatedVapourPressureMin = 0.6108 * exp((17.27 * vw_MinAirTemperature) / (237.3 + vw_MinAirTemperature));

    // Calculation of the saturated water vapour pressure
    vm_SaturatedVapourPressure = (vm_SaturatedVapourPressureMax + vm_SaturatedVapourPressureMin) / 2.0;

    // Calculation of the water vapour pressure
    if (vw_RelativeHumidity <= 0.0){
      // Assuming Tdew = Tmin as suggested in FAO56 Allen et al. 1998
      vm_VapourPressure = vm_SaturatedVapourPressureMin;
    } else {
      vm_VapourPressure = vw_RelativeHumidity * vm_SaturatedVapourPressure;
    }

    // Calculation of the air saturation deficit
    vm_SaturationDeficit = vm_SaturatedVapourPressure - vm_VapourPressure;

    // Slope of saturation water vapour pressure-to-temperature relation
    vm_SaturatedVapourPressureSlope = (4098.0 * (0.6108 * exp((17.27 * vw_MeanAirTemperature) / (vw_MeanAirTemperature
        + 237.3)))) / ((vw_MeanAirTemperature + 237.3) * (vw_MeanAirTemperature + 237.3));

    // Calculation of wind speed in 2m height
    vm_WindSpeed_2m = vw_WindSpeed * (4.87 / (log(67.8 * vw_WindSpeedHeight - 5.42)));

    // Calculation of the aerodynamic resistance
    vm_AerodynamicResistance = 208.0 / vm_WindSpeed_2m;

    vc_StomataResistance = 100; // FAO default value [s m-1]

    vm_SurfaceResistance = vc_StomataResistance / 1.44;

    var vc_ClearSkySolarRadiation = (0.75 + 0.00002 * vs_HeightNN) * vc_ExtraterrestrialRadiation;
    var vc_RelativeShortwaveRadiation = vw_GlobalRadiation / vc_ClearSkySolarRadiation;

    if (vc_RelativeShortwaveRadiation > 1.0) vc_RelativeShortwaveRadiation = 1.0;

    var pc_BolzmannConstant = 0.0000000049;
    var vc_ShortwaveRadiation = (1.0 - pc_ReferenceAlbedo) * vw_GlobalRadiation;
    var vc_LongwaveRadiation = pc_BolzmannConstant
          * ((pow((vw_MinAirTemperature + 273.16), 4.0)
          + pow((vw_MaxAirTemperature + 273.16), 4.0)) / 2.0)
          * (1.35 * vc_RelativeShortwaveRadiation - 0.35)
          * (0.34 - 0.14 * sqrt(vm_VapourPressure));
    vw_NetRadiation = vc_ShortwaveRadiation - vc_LongwaveRadiation;

    // Calculation of the reference evapotranspiration
    // Penman-Monteith-Methode FAO
    vm_ReferenceEvapotranspiration = ((0.408 * vm_SaturatedVapourPressureSlope * vw_NetRadiation)
        + (vm_PsycrometerConstant * (900.0 / (vw_MeanAirTemperature + 273.0))
        * vm_WindSpeed_2m * vm_SaturationDeficit))
        / (vm_SaturatedVapourPressureSlope + vm_PsycrometerConstant
        * (1.0 + (vm_SurfaceResistance / 208.0) * vm_WindSpeed_2m));

    if (vm_ReferenceEvapotranspiration < 0.0){
      vm_ReferenceEvapotranspiration = 0.0;
    }

    return vm_ReferenceEvapotranspiration;
  };

  var get_EReducer_1 = function (
    i_Layer,
    vm_PercentageSoilCoverage,
    vm_ReferenceEvapotranspiration
  ) {
    
    var vm_EReductionFactor;
    var vm_EvaporationReductionMethod = 1;
    var vm_SoilMoisture_m3 = soilColumn[i_Layer].get_Vs_SoilMoisture_m3();
    var vm_PWP = soilColumn[i_Layer].get_PermanentWiltingPoint();
    var vm_FK = soilColumn[i_Layer].get_FieldCapacity();
    var vm_RelativeEvaporableWater;
    var vm_CriticalSoilMoisture;
    var vm_XSA;
    var vm_Reducer;

    if (vm_SoilMoisture_m3 < (0.33 * vm_PWP)) vm_SoilMoisture_m3 = 0.33 * vm_PWP;

    vm_RelativeEvaporableWater = (vm_SoilMoisture_m3 -(0.33 * vm_PWP)) / (vm_FK - (0.33 * vm_PWP));

    if (vm_RelativeEvaporableWater > 1.0) vm_RelativeEvaporableWater = 1.0;

    if (vm_EvaporationReductionMethod == 0){
      // THESEUS
      vm_CriticalSoilMoisture = 0.65 * vm_FK;
      if (vm_PercentageSoilCoverage > 0) {
        if (vm_ReferenceEvapotranspiration > 2.5) {
          vm_XSA = (0.65 * vm_FK - vm_PWP) * (vm_FK - vm_PWP);
          vm_Reducer = vm_XSA + (((1 - vm_XSA) / 17.5)
       * (vm_ReferenceEvapotranspiration - 2.5));
        } else {
          vm_Reducer = vm_XSACriticalSoilMoisture / 2.5 * vm_ReferenceEvapotranspiration;
        }
        vm_CriticalSoilMoisture = soilColumn[i_Layer].get_FieldCapacity() * vm_Reducer;
      }

      // Calculation of an evaporation-reducing factor in relation to soil water content
      if (vm_SoilMoisture_m3 > vm_CriticalSoilMoisture) {
        // Moisture is higher than critical value so there is a
        // normal evaporation and nothing must be reduced
        vm_EReductionFactor = 1.0;

      } else {
        // critical value is reached, actual evaporation is below potential

        if (vm_SoilMoisture_m3 > (0.33 * vm_PWP)) {
          // moisture is higher than 30% of permanent wilting point
          vm_EReductionFactor = vm_RelativeEvaporableWater;
        } else {
          // if moisture is below 30% of wilting point nothing can be evaporated
          vm_EReductionFactor = 0.0;
        }
      }

    } else if (vm_EvaporationReductionMethod == 1){
      // HERMES
      vm_EReductionFactor = 0.0;
      if (vm_RelativeEvaporableWater > 0.33) {
        vm_EReductionFactor = 1.0 - (0.1 * (1.0 - vm_RelativeEvaporableWater) / (1.0 - 0.33));
      } else if (vm_RelativeEvaporableWater > 0.22) {
        vm_EReductionFactor = 0.9 - (0.625 * (0.33 - vm_RelativeEvaporableWater) / (0.33-0.22));
      } else if (vm_RelativeEvaporableWater > 0.2) {
        vm_EReductionFactor = 0.275 - (0.225 * (0.22 - vm_RelativeEvaporableWater) / (0.22 - 0.2));
      } else {
        vm_EReductionFactor = 0.05 - (0.05 * (0.2 - vm_RelativeEvaporableWater) / 0.2);
      } // end if
    }
    return vm_EReductionFactor;
  };

  var get_DeprivationFactor = function (
    layerNo,
    deprivationDepth,
    zeta,
    vs_LayerThickness
  ) {
    // factor (f(depth)) to distribute the PET along the soil profil/rooting zone

    var deprivationFactor;

    // factor to introduce layer thickness in this algorithm,
    // to allow layer thickness scaling (Claas Nendel)
    var layerThicknessFactor = deprivationDepth / (vs_LayerThickness * 10.0);

    if ((abs(zeta)) < 0.0003) {

      deprivationFactor = (2.0 / layerThicknessFactor) - (1.0 / (layerThicknessFactor * layerThicknessFactor)) * (2
          * layerNo - 1);
      return deprivationFactor;

    } else {

      var c2 = 0.0;
      var c3 = 0.0;
      c2 = log((layerThicknessFactor + zeta * layerNo) / (layerThicknessFactor + zeta * (layerNo - 1)));
      c3 = zeta / (layerThicknessFactor * (zeta + 1.0));
      deprivationFactor = (c2 - c3) / (log(zeta + 1.0) - zeta / (zeta + 1.0));
      return deprivationFactor;
    }
  };

  var meanWaterContent = function (depth_m) {

    if (arguments.length === 1) {

      var lsum = 0.0; 
      var sum = 0.0;
      var count = 0;

      for (var i = 0; i < vs_NumberOfLayers; i++)
      {
        count++;
        var smm3 = soilColumn[i].get_Vs_SoilMoisture_m3();
        var fc = soilColumn[i].get_FieldCapacity();
        var pwp = soilColumn[i].get_PermanentWiltingPoint();
        sum += smm3 / (fc - pwp); //[%nFK]
        lsum += soilColumn[i].vs_LayerThickness;
        if (lsum >= depth_m)
          break;
      }

      return sum / count;
    } 

    var layer = arguments[0], 
        number_of_layers = arguments[1],
        sum = 0.0,
        count = 0;

    if (layer + number_of_layers > vs_NumberOfLayers) {
        return -1;
    }

    for (var i = layer; i < layer + number_of_layers; i++)
    {
      count++;
      var smm3 = soilColumn[i].get_Vs_SoilMoisture_m3();
      var fc = soilColumn[i].get_FieldCapacity();
      var pwp = soilColumn[i].get_PermanentWiltingPoint();
      sum += smm3 / (fc - pwp); //[%nFK]
    }

    return sum / count;

  };

  var get_SnowDepth = function () {
    return snowComponent.getVm_SnowDepth();
  };

  var getMaxSnowDepth = function () {
    return snowComponent.getMaxSnowDepth();
  };

  var accumulatedSnowDepth = function () {
    return snowComponent.accumulatedSnowDepth();
  };

  var getAccumulatedFrostDepth = function () {
    return frostComponent.getAccumulatedFrostDepth();
  };

  var put_Crop = function (c) {
    crop = c;
  };

  var remove_Crop = function () {
    crop = null;
  };

  var get_Infiltration = function () { 
    return vm_Infiltration; 
  };

  var get_SurfaceWaterStorage = function () { 
    return vm_SurfaceWaterStorage; 
  };

  var get_SurfaceRunOff = function () { 
    return vm_SurfaceRunOff; 
  };

  var get_Evapotranspiration = function () { 
    return vm_ActualEvapotranspiration; 
  };

  var get_ActualEvaporation = function () { 
    return vm_ActualEvaporation; 
  };

  var get_ET0  = function () { 
    return vm_ReferenceEvapotranspiration; 
  };

  var get_PercentageSoilCoverage = function () { 
    return vc_PercentageSoilCoverage; 
  };

  var get_StomataResistance = function () { 
    return vc_StomataResistance; 
  };

  var get_FrostDepth = function () { 
    return frostComponent.getFrostDepth(); 
  };

  var get_ThawDepth = function () { 
    return frostComponent.getThawDepth(); 
  };

  var get_GroundwaterRecharge = function () { 
    return vm_FluxAtLowerBoundary; 
  };

  var get_SumSurfaceRunOff = function () { 
    return vm_SumSurfaceRunOff; 
  };

  var get_KcFactor = function () { 
    return vc_KcFactor; 
  };

  var get_TranspirationDeficit = function () { 
    return vm_TranspirationDeficit; 
  };

  return {
      step: step
    , get_SnowDepth: get_SnowDepth
    , get_SoilMoisture: get_SoilMoisture
    , get_CapillaryRise: get_CapillaryRise
    , get_PercolationRate: get_PercolationRate
    , get_Infiltration: get_Infiltration
    , get_SurfaceWaterStorage: get_SurfaceWaterStorage
    , get_SurfaceRunOff: get_SurfaceRunOff
    , get_Evapotranspiration: get_Evapotranspiration
    , get_ActualEvaporation: get_ActualEvaporation
    , get_ET0: get_ET0
    , get_PercentageSoilCoverage: get_PercentageSoilCoverage
    , get_StomataResistance: get_StomataResistance
    , get_FrostDepth: get_FrostDepth
    , get_ThawDepth: get_ThawDepth
    , get_GroundwaterRecharge: get_GroundwaterRecharge
    , get_SumSurfaceRunOff: get_SumSurfaceRunOff
    , get_KcFactor: get_KcFactor
    , get_TranspirationDeficit: get_TranspirationDeficit
    , get_CapillaryRise: get_CapillaryRise
    , getMaxSnowDepth: getMaxSnowDepth
    , accumulatedSnowDepth: accumulatedSnowDepth
    , getAccumulatedFrostDepth: getAccumulatedFrostDepth
    , get_EReducer_1: get_EReducer_1
    , put_Crop: put_Crop
    , remove_Crop: remove_Crop
    , fm_Infiltration: fm_Infiltration
    , get_DeprivationFactor: get_DeprivationFactor
    , fm_CapillaryRise: fm_CapillaryRise
    , fm_PercolationWithGroundwater: fm_PercolationWithGroundwater
    , fm_GroundwaterReplenishment: fm_GroundwaterReplenishment
    , fm_PercolationWithoutGroundwater: fm_PercolationWithoutGroundwater
    , fm_BackwaterReplenishment: fm_BackwaterReplenishment
    , fm_Evapotranspiration: fm_Evapotranspiration
    , ReferenceEvapotranspiration: ReferenceEvapotranspiration
    , meanWaterContent: meanWaterContent
  } 

};


var SoilTransport = function (sc, sps, cpp) {

  var soilColumn = sc
    , centralParameterProvider = cpp
    , vs_NumberOfLayers = sc.vs_NumberOfLayers() // extern
    , vq_Convection = new Float64Array(vs_NumberOfLayers)
    , vq_CropNUptake = 0.0
    , vq_DiffusionCoeff = new Float64Array(vs_NumberOfLayers)
    , vq_Dispersion = new Float64Array(vs_NumberOfLayers)
    , vq_DispersionCoeff = new Float64Array(vs_NumberOfLayers)
    , vq_FieldCapacity = new Float64Array(vs_NumberOfLayers)
    , vq_LayerThickness = new Float64Array(vs_NumberOfLayers)
    , vq_LeachingAtBoundary = 0.0
    , vs_NDeposition = sps.vq_NDeposition
    , vc_NUptakeFromLayer = new Float64Array(vs_NumberOfLayers)
    , vq_PoreWaterVelocity = new Float64Array(vs_NumberOfLayers)
    , vq_SoilMoisture = new Float64Array(vs_NumberOfLayers)
    , vq_SoilNO3 = new Float64Array(vs_NumberOfLayers)
    , vq_SoilNO3_aq = new Float64Array(vs_NumberOfLayers)
    , vq_TimeStep = 1.0
    , vq_TotalDispersion = new Float64Array(vs_NumberOfLayers)
    , vq_PercolationRate = new Float64Array(vs_NumberOfLayers)
    , crop = null
    ;

  // JS! init arrays
  for (var i = 0; i < vs_NumberOfLayers; i++) {
    vq_DispersionCoeff[i] = 1.0;
    vq_LayerThickness[i] = 0.1;
    vq_SoilMoisture[i] = 0.2;
  }    

  logger(MSG.INFO, "N deposition: " + vs_NDeposition);
  var vs_LeachingDepth = centralParameterProvider.userEnvironmentParameters.p_LeachingDepth;
  var vq_TimeStep = centralParameterProvider.userEnvironmentParameters.p_timeStep;

  var step = function () {

    var vq_TimeStepFactor = 1.0; // [t t-1]

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      vq_FieldCapacity[i_Layer] = soilColumn[i_Layer].get_FieldCapacity();
      vq_SoilMoisture[i_Layer] = soilColumn[i_Layer].get_Vs_SoilMoisture_m3();
      vq_SoilNO3[i_Layer] = soilColumn[i_Layer].vs_SoilNO3;

      vq_LayerThickness[i_Layer] = soilColumn[0].vs_LayerThickness;
      vc_NUptakeFromLayer[i_Layer] = crop ? crop.get_NUptakeFromLayer(i_Layer) : 0;
      if (i_Layer == (vs_NumberOfLayers - 1)){
        vq_PercolationRate[i_Layer] = soilColumn.vs_FluxAtLowerBoundary ; //[mm]
      } else {
        vq_PercolationRate[i_Layer] = soilColumn[i_Layer + 1].vs_SoilWaterFlux; //[mm]
      }
      // Variable time step in case of high water fluxes to ensure stable numerics
      if ((vq_PercolationRate[i_Layer] <= 5.0) && (vq_TimeStepFactor >= 1.0))
        vq_TimeStepFactor = 1.0;
      else if ((vq_PercolationRate[i_Layer] > 5.0) && (vq_PercolationRate[i_Layer] <= 10.0) && (vq_TimeStepFactor >= 1.0))
        vq_TimeStepFactor = 0.5;
      else if ((vq_PercolationRate[i_Layer] > 10.0) && (vq_PercolationRate[i_Layer] <= 15.0) && (vq_TimeStepFactor >= 0.5))
        vq_TimeStepFactor = 0.25;
      else if ((vq_PercolationRate[i_Layer] > 15.0) && (vq_TimeStepFactor >= 0.25))
        vq_TimeStepFactor = 0.125;
    }
  //  cout << "vq_SoilNO3[0]: " << vq_SoilNO3[0] << endl;

  //  if (isnan(vq_SoilNO3[0])) {
  //      cout << "vq_SoilNO3[0]: " << "NAN" << endl;
  //  }

    fq_NDeposition(vs_NDeposition);
    fq_NUptake();

    // Nitrate transport is called according to the set time step
    for (var i_TimeStep = 0; i_TimeStep < (1.0 / vq_TimeStepFactor); i_TimeStep++) {
      fq_NTransport(vs_LeachingDepth, vq_TimeStepFactor);
    }

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

      vq_SoilNO3[i_Layer] = vq_SoilNO3_aq[i_Layer] * vq_SoilMoisture[i_Layer];

      if (vq_SoilNO3[i_Layer] < 0.0) {
        vq_SoilNO3[i_Layer] = 0.0;
      }

      soilColumn[i_Layer].vs_SoilNO3 = vq_SoilNO3[i_Layer];
    } // for

  };

  /**
   * @brief Calculation of N deposition
   * Transformation of annual N Deposition into a daily value,
   * that can be used in MONICAs calculations. Addition of this
   * transformed N deposition to ammonium pool of top soil layer.
   *
   * @param vs_NDeposition
   *
   * Kersebaum 1989
   */
  var fq_NDeposition = function (vs_NDeposition) {
    //Daily N deposition in [kg N ha-1 d-1]
    var vq_DailyNDeposition = vs_NDeposition / 365.0;

    // Addition of N deposition to top layer [kg N m-3]
    vq_SoilNO3[0] += vq_DailyNDeposition / (10000.0 * soilColumn[0].vs_LayerThickness);

  };

  /**
   * @brief Calculation of crop N uptake
   * @param
   *
   * Kersebaum 1989
   */
  var fq_NUptake = function () {
    var vq_CropNUptake = 0.0;
    var pc_MinimumAvailableN = centralParameterProvider.userCropParameters.pc_MinimumAvailableN; // kg m-2

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

      // Lower boundary for N exploitation per layer
      if (vc_NUptakeFromLayer[i_Layer] > ((vq_SoilNO3[i_Layer] * vq_LayerThickness[i_Layer]) - pc_MinimumAvailableN)) {

        // Crop N uptake from layer i [kg N m-2]
        vc_NUptakeFromLayer[i_Layer] = ((vq_SoilNO3[i_Layer] * vq_LayerThickness[i_Layer]) - pc_MinimumAvailableN);
      }

      if (vc_NUptakeFromLayer[i_Layer] < 0) {
        vc_NUptakeFromLayer[i_Layer] = 0;
      }

      vq_CropNUptake += vc_NUptakeFromLayer[i_Layer];

      // Subtracting crop N uptake
      vq_SoilNO3[i_Layer] -= vc_NUptakeFromLayer[i_Layer] / vq_LayerThickness[i_Layer];

      // Calculation of solute NO3 concentration on the basis of the soil moisture
      // content before movement of current time step (kg m soil-3 --> kg m solute-3)
      vq_SoilNO3_aq[i_Layer] = vq_SoilNO3[i_Layer] / vq_SoilMoisture[i_Layer];
      if (vq_SoilNO3_aq[i_Layer] < 0) {
  //        cout << "vq_SoilNO3_aq[i_Layer] < 0 " << endl;
      }

    } // for

    // debug('vc_NUptakeFromLayer', vc_NUptakeFromLayer);

    soilColumn.vq_CropNUptake = vq_CropNUptake; // [kg m-2]

  };


  /**
   * @brief Calculation of N transport
   * @param vs_LeachingDepth
   *
   * Kersebaum 1989
   */
  var fq_NTransport = function (vs_LeachingDepth, vq_TimeStepFactor) {

    var user_trans = centralParameterProvider.userSoilTransportParameters;
    var vq_DiffusionCoeffStandard = user_trans.pq_DiffusionCoefficientStandard;// [m2 d-1]; old D0
    var AD = user_trans.pq_AD; // Factor a in Kersebaum 1989 p.24 for Loess soils
    var vq_DispersionLength = user_trans.pq_DispersionLength; // [m]
    var vq_SoilProfile = 0.0;
    var vq_LeachingDepthLayerIndex = 0;
    vq_LeachingAtBoundary = 0.0;

    var vq_SoilMoistureGradient = new Array(vs_NumberOfLayers);

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
      vq_SoilProfile += vq_LayerThickness[i_Layer];

      if ((vq_SoilProfile - 0.001) < vs_LeachingDepth) {
        vq_LeachingDepthLayerIndex = i_Layer;
      }
    }

    // Caluclation of convection for different cases of flux direction
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

      var wf0 = soilColumn[0].vs_SoilWaterFlux;
      var lt = soilColumn[i_Layer].vs_LayerThickness;
      var NO3 = vq_SoilNO3_aq[i_Layer];

      if (i_Layer == 0) {
        var pr = vq_PercolationRate[i_Layer] / 1000.0 * vq_TimeStepFactor; // [mm t-1 --> m t-1]
        var NO3_u = vq_SoilNO3_aq[i_Layer + 1];

        if (pr >= 0.0 && wf0 >= 0.0) {

          // old KONV = Konvektion Diss S. 23
          vq_Convection[i_Layer] = (NO3 * pr) / lt; //[kg m-3] * [m t-1] / [m]

        } else if (pr >= 0 && wf0 < 0) {

          vq_Convection[i_Layer] = (NO3 * pr) / lt;

        } else if (pr < 0 && wf0 < 0) {
          vq_Convection[i_Layer] = (NO3_u * pr) / lt;

        } else if (pr < 0 && wf0 >= 0) {

          vq_Convection[i_Layer] = (NO3_u * pr) / lt;
        }

      } else if (i_Layer < vs_NumberOfLayers - 1) {

        // layer > 0 && < bottom
        var pr_o = vq_PercolationRate[i_Layer - 1] / 1000.0 * vq_TimeStepFactor; //[mm t-1 --> m t-1] * [t t-1]
        var pr = vq_PercolationRate[i_Layer] / 1000.0 * vq_TimeStepFactor; // [mm t-1 --> m t-1] * [t t-1]
        var NO3_u = vq_SoilNO3_aq[i_Layer + 1];

        if (pr >= 0.0 && pr_o >= 0.0) {
          var NO3_o = vq_SoilNO3_aq[i_Layer - 1];

          // old KONV = Konvektion Diss S. 23
          vq_Convection[i_Layer] = ((NO3 * pr) - (NO3_o * pr_o)) / lt;

        } else if (pr >= 0 && pr_o < 0) {

          vq_Convection[i_Layer] = ((NO3 * pr) - (NO3 * pr_o)) / lt;

        } else if (pr < 0 && pr_o < 0) {

          vq_Convection[i_Layer] = ((NO3_u * pr) - (NO3 * pr_o)) / lt;

        } else if (pr < 0 && pr_o >= 0) {
          var NO3_o = vq_SoilNO3_aq[i_Layer - 1];
          vq_Convection[i_Layer] = ((NO3_u * pr) - (NO3_o * pr_o)) / lt;
        }

      } else {

        // bottom layer
        var pr_o = vq_PercolationRate[i_Layer - 1] / 1000.0 * vq_TimeStepFactor; // [m t-1] * [t t-1]
        var pr = soilColumn.vs_FluxAtLowerBoundary / 1000.0 * vq_TimeStepFactor; // [m t-1] * [t t-1]

        if (pr >= 0.0 && pr_o >= 0.0) {
          var NO3_o = vq_SoilNO3_aq[i_Layer - 1];

          // KONV = Konvektion Diss S. 23
          vq_Convection[i_Layer] = ((NO3 * pr) - (NO3_o * pr_o)) / lt;

        } else if (pr >= 0 && pr_o < 0) {

          vq_Convection[i_Layer] = ((NO3 * pr) - (NO3 * pr_o)) / lt;

        } else if (pr < 0 && pr_o < 0) {

          vq_Convection[i_Layer] = (-(NO3 * pr_o)) / lt;

        } else if (pr < 0 && pr_o >= 0) {
          var NO3_o = vq_SoilNO3_aq[i_Layer - 1];
          vq_Convection[i_Layer] = (-(NO3_o * pr_o)) / lt;
        }

      }// else
    } // for


    // Calculation of dispersion depending of pore water velocity
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

      var pr = vq_PercolationRate[i_Layer] / 1000.0 * vq_TimeStepFactor; // [mm t-1 --> m t-1] * [t t-1]
      var pr0 = soilColumn[0].vs_SoilWaterFlux / 1000.0 * vq_TimeStepFactor; // [mm t-1 --> m t-1] * [t t-1]
      var lt = soilColumn[i_Layer].vs_LayerThickness;
      var NO3 = vq_SoilNO3_aq[i_Layer];


      // Original: W(I) --> um Steingehalt korrigierte Feldkapazität
      /** @todo Claas: generelle Korrektur der Feldkapazität durch den Steingehalt */
      if (i_Layer == vs_NumberOfLayers - 1) {
        vq_PoreWaterVelocity[i_Layer] = abs((pr) / vq_FieldCapacity[i_Layer]); // [m t-1]
        vq_SoilMoistureGradient[i_Layer] = (vq_SoilMoisture[i_Layer]); //[m3 m-3]
      } else {
        vq_PoreWaterVelocity[i_Layer] = abs((pr) / ((vq_FieldCapacity[i_Layer]
                + vq_FieldCapacity[i_Layer + 1]) * 0.5)); // [m t-1]
        vq_SoilMoistureGradient[i_Layer] = ((vq_SoilMoisture[i_Layer])
           + (vq_SoilMoisture[i_Layer + 1])) * 0.5; //[m3 m-3]
      }

      vq_DiffusionCoeff[i_Layer] = vq_DiffusionCoeffStandard
           * (AD * exp(vq_SoilMoistureGradient[i_Layer] * 2.0 * 5.0)
           / vq_SoilMoistureGradient[i_Layer]) * vq_TimeStepFactor; //[m2 t-1] * [t t-1]

      // Dispersion coefficient, old DB
      if (i_Layer == 0) {

        vq_DispersionCoeff[i_Layer] = vq_SoilMoistureGradient[i_Layer] * (vq_DiffusionCoeff[i_Layer] // [m2 t-1]
    + vq_DispersionLength * vq_PoreWaterVelocity[i_Layer]) // [m] * [m t-1]
    - (0.5 * lt * abs(pr)) // [m] * [m t-1]
    + ((0.5 * vq_TimeStep * vq_TimeStepFactor * abs((pr + pr0) / 2.0))  // [t] * [t t-1] * [m t-1]
    * vq_PoreWaterVelocity[i_Layer]); // * [m t-1]
    //-->[m2 t-1]
      } else {
        var pr_o = vq_PercolationRate[i_Layer - 1] / 1000.0 * vq_TimeStepFactor; // [m t-1]

        vq_DispersionCoeff[i_Layer] = vq_SoilMoistureGradient[i_Layer] * (vq_DiffusionCoeff[i_Layer]
    + vq_DispersionLength * vq_PoreWaterVelocity[i_Layer]) - (0.5 * lt * abs(pr))
    + ((0.5 * vq_TimeStep * vq_TimeStepFactor * abs((pr + pr_o) / 2.0)) * vq_PoreWaterVelocity[i_Layer]);
      }

      //old DISP = Gesamt-Dispersion (D in Diss S. 23)
      if (i_Layer == 0) {
        var NO3_u = vq_SoilNO3_aq[i_Layer + 1];
        // vq_Dispersion = Dispersion upwards or downwards, depending on the position in the profile [kg m-3]
        vq_Dispersion[i_Layer] = -vq_DispersionCoeff[i_Layer] * (NO3 - NO3_u) / (lt * lt); // [m2] * [kg m-3] / [m2]

      } else if (i_Layer < vs_NumberOfLayers - 1) {
        var NO3_o = vq_SoilNO3_aq[i_Layer - 1];
        var NO3_u = vq_SoilNO3_aq[i_Layer + 1];
        vq_Dispersion[i_Layer] = (vq_DispersionCoeff[i_Layer - 1] * (NO3_o - NO3) / (lt * lt))
    - (vq_DispersionCoeff[i_Layer] * (NO3 - NO3_u) / (lt * lt));
      } else {
        var NO3_o = vq_SoilNO3_aq[i_Layer - 1];
        vq_Dispersion[i_Layer] = vq_DispersionCoeff[i_Layer - 1] * (NO3_o - NO3) / (lt * lt);
      }
    } // for

    // Update of NO3 concentration
    // including transfomation back into [kg NO3-N m soil-3]
    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {


      vq_SoilNO3_aq[i_Layer] += (vq_Dispersion[i_Layer] - vq_Convection[i_Layer]) / vq_SoilMoisture[i_Layer];
  //    double no3 = vq_SoilNO3_aq[i_Layer];
  //    double disp = vq_Dispersion[i_Layer];
  //    double conv = vq_Convection[i_Layer];
  //    double sm = vq_SoilMoisture[i_Layer];
  //    cout << i_Layer << "\t" << no3 << "\t" << disp << "\t" << conv << "\t" <<  sm << endl;
    }



    if (vq_PercolationRate[vq_LeachingDepthLayerIndex] > 0.0) {

      //vq_LeachingDepthLayerIndex = gewählte Auswaschungstiefe
      var lt = soilColumn[vq_LeachingDepthLayerIndex].vs_LayerThickness;
      var NO3 = vq_SoilNO3_aq[vq_LeachingDepthLayerIndex];

      if (vq_LeachingDepthLayerIndex < vs_NumberOfLayers - 1) {
        var pr_u = vq_PercolationRate[vq_LeachingDepthLayerIndex + 1] / 1000.0 * vq_TimeStepFactor;// [m t-1]
        var NO3_u = vq_SoilNO3_aq[vq_LeachingDepthLayerIndex + 1]; // [kg m-3]
        //vq_LeachingAtBoundary: Summe für Auswaschung (Diff + Konv), old OUTSUM
        vq_LeachingAtBoundary += ((pr_u * NO3) / lt * 10000.0 * lt) + ((vq_DispersionCoeff[vq_LeachingDepthLayerIndex]
    * (NO3 - NO3_u)) / (lt * lt) * 10000.0 * lt); //[kg ha-1]
      } else {
        var pr_u = soilColumn.vs_FluxAtLowerBoundary / 1000.0 * vq_TimeStepFactor; // [m t-1]
        vq_LeachingAtBoundary += pr_u * NO3 / lt * 10000.0 * lt; //[kg ha-1]
      }

    } else {

      var pr_u = vq_PercolationRate[vq_LeachingDepthLayerIndex] / 1000.0 * vq_TimeStepFactor;
      var lt = soilColumn[vq_LeachingDepthLayerIndex].vs_LayerThickness;
      var NO3 = vq_SoilNO3_aq[vq_LeachingDepthLayerIndex];

      if (vq_LeachingDepthLayerIndex < vs_NumberOfLayers - 1) {
        var NO3_u = vq_SoilNO3_aq[vq_LeachingDepthLayerIndex + 1];
        vq_LeachingAtBoundary += ((pr_u * NO3_u) / (lt * 10000.0 * lt)) + vq_DispersionCoeff[vq_LeachingDepthLayerIndex]
    * (NO3 - NO3_u) / ((lt * lt) * 10000.0 * lt); //[kg ha-1]
      }
    }

  //  cout << "vq_LeachingAtBoundary: " << vq_LeachingAtBoundary << endl;
  }

  /**
   * @brief Returns Nitrate content for each layer [i]
   * @return Soil NO3 content
   */
  var get_SoilNO3 = function (i_Layer) {
    return vq_SoilNO3[i_Layer];
  };

  /**
   * @brief Returns N leaching at leaching depth [kg ha-1]
   * @return Soil NO3 content
   */
  var get_NLeaching = function () {
    return vq_LeachingAtBoundary;
  };

  var put_Crop = function (c) {
    crop = c;
  };

  var remove_Crop = function () {
    crop = null;
  };

  return {
      step: step
    , fq_NDeposition: fq_NDeposition  // calculates daily N deposition
    , fq_NUptake: fq_NUptake // puts crop N uptake into effect
    , fq_NTransport: fq_NTransport  // calcuates N transport in soil
    , put_Crop: put_Crop
    , remove_Crop: remove_Crop
    , get_SoilNO3: get_SoilNO3
    , get_NLeaching: get_NLeaching
  };

};




var SoilTemperature = function (sc, mm, cpp) {

  var _soilColumn = sc,
      monica = mm,
      centralParameterProvider = cpp,
      _soilColumn_vt_GroundLayer = new SoilLayer(),
      _soilColumn_vt_BottomLayer = new SoilLayer(),
      soilColumn = {
        sc: sc,
        gl: _soilColumn_vt_GroundLayer,
        bl: _soilColumn_vt_BottomLayer,
        vs_nols: sc.vs_NumberOfLayers(),
        at: function (i) { 
          if (i < this.vs_nols){
            return this[i];
          } else {
            if (i < this.vs_nols + 1)
                return this.gl;
            return this.bl;
          }
        }
      };

  for (var i = 0; i < sc.vs_NumberOfLayers(); i++)
    soilColumn[i] = sc[i];

  soilColumn[sc.vs_NumberOfLayers()] = soilColumn.gl;
  soilColumn[sc.vs_NumberOfLayers() + 1] = soilColumn.bl;


  var vt_NumberOfLayers = sc.vs_NumberOfLayers() + 2,
      vs_NumberOfLayers = sc.vs_NumberOfLayers(),  //extern
      vs_SoilMoisture_const = new Array(vt_NumberOfLayers),   //intern
      vt_SoilTemperature = new Array(vt_NumberOfLayers),      //result = vs_soiltemperature
      vt_V = new Array(vt_NumberOfLayers),                    //intern
      vt_VolumeMatrix = new Array(vt_NumberOfLayers),         //intern
      vt_VolumeMatrixOld = new Array(vt_NumberOfLayers),      //intern
      vt_B = new Array(vt_NumberOfLayers),                    //intern
      vt_MatrixPrimaryDiagonal = new Array(vt_NumberOfLayers),//intern
      vt_MatrixSecundaryDiagonal = new Array(vt_NumberOfLayers + 1),   //intern
      vt_HeatConductivity = new Array(vt_NumberOfLayers),              //intern
      vt_HeatConductivityMean = new Array(vt_NumberOfLayers),          //intern
      vt_HeatCapacity = new Array(vt_NumberOfLayers),                    //intern
      dampingFactor = 0.8,
      vt_HeatFlow = 0.0;


    for (var i = 0; i < vt_NumberOfLayers; i++) {
      vs_SoilMoisture_const[i] = 0.0;   
      vt_SoilTemperature[i] = 0.0;    
      vt_V[i] = 0.0;                    
      vt_VolumeMatrix[i] = 0.0;         
      vt_VolumeMatrixOld[i] = 0.0;      
      vt_B[i] = 0.0;                    
      vt_MatrixPrimaryDiagonal[i] = 0.0;
      vt_MatrixSecundaryDiagonal[i] = 0.0;   
      vt_HeatConductivity[i] = 0.0;              
      vt_HeatConductivityMean[i] = 0.0;          
      vt_HeatCapacity[i] = 0.0;                        
    }

    vt_MatrixPrimaryDiagonal[i + 1] = 0.0;

  logger(MSG.INFO, "Constructor: SoilTemperature");

  var user_temp = cpp.userSoilTemperatureParameters;

  var pt_BaseTemperature           = user_temp.pt_BaseTemperature;  // temp für unterste Schicht (durch. Jahreslufttemp-)
  var pt_InitialSurfaceTemperature = user_temp.pt_InitialSurfaceTemperature; // Replace by Mean air temperature
  var pt_Ntau                      = user_temp.pt_NTau;
  var pt_TimeStep                  = centralParameterProvider.userEnvironmentParameters.p_timeStep;  // schon in soil_moisture in DB extrahiert
  var ps_QuartzRawDensity          = user_temp.pt_QuartzRawDensity;
  var pt_SpecificHeatCapacityWater = user_temp.pt_SpecificHeatCapacityWater;   // [J kg-1 K-1]
  var pt_SpecificHeatCapacityQuartz = user_temp.pt_SpecificHeatCapacityQuartz; // [J kg-1 K-1]
  var pt_SpecificHeatCapacityAir = user_temp.pt_SpecificHeatCapacityAir;       // [J kg-1 K-1]
  var pt_SpecificHeatCapacityHumus = user_temp.pt_SpecificHeatCapacityHumus;   // [J kg-1 K-1]
  var pt_DensityWater = user_temp.pt_DensityWater;   // [kg m-3]
  var pt_DensityAir = user_temp.pt_DensityAir;       // [kg m-3]
  var pt_DensityHumus = user_temp.pt_DensityHumus;   // [kg m-3]


  //  cout << "Monica: pt_BaseTemperature: " << pt_BaseTemperature << endl;
  //  cout << "Monica: pt_InitialSurfaceTemperature: " << pt_InitialSurfaceTemperature << endl;
  //  cout << "Monica: NTau: " << pt_Ntau << endl;

    // according to sensitivity tests, soil moisture has minor
    // influence to the temperature and thus can be set as constant
    // by xenia
  var ps_SoilMoisture_const = user_temp.pt_SoilMoisture;
  //  cout << "Monica: ps_SoilMoisture_const: " << ps_SoilMoisture_const << endl;

  // Initialising the soil properties until a database feed is realised
  for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

    // Initialising the soil temperature
    vt_SoilTemperature[i_Layer] =  (  (1.0 - ((i_Layer) / vs_NumberOfLayers))
              * pt_InitialSurfaceTemperature)
           +( ((i_Layer) / vs_NumberOfLayers) * pt_BaseTemperature);

    // Initialising the soil moisture content
    // Soil moisture content is held constant for numeric stability.
    // If dynamic soil moisture should be used, the energy balance
    // must be extended by latent heat flow.
    vs_SoilMoisture_const[i_Layer] = ps_SoilMoisture_const;

  }

  // Determination of the geometry parameters for soil temperature calculation
  // with Cholesky-Verfahren

  vt_V[0] = soilColumn[0].vs_LayerThickness;
  vt_B[0] = 2.0 / soilColumn[0].vs_LayerThickness;

  var vt_GroundLayer = vt_NumberOfLayers - 2;
  var vt_BottomLayer = vt_NumberOfLayers - 1;

  soilColumn[vt_GroundLayer].vs_LayerThickness = 2.0 * soilColumn[vt_GroundLayer - 1].vs_LayerThickness;
  soilColumn[vt_BottomLayer].vs_LayerThickness = 1.0;
  vt_SoilTemperature[vt_GroundLayer] = (vt_SoilTemperature[vt_GroundLayer - 1] + pt_BaseTemperature) * 0.5;
  vt_SoilTemperature[vt_BottomLayer] = pt_BaseTemperature;

  var vt_h0 = soilColumn[0].vs_LayerThickness;

  for (var i_Layer = 1; i_Layer < vt_NumberOfLayers; i_Layer++) {

    var vt_h1 = soilColumn[i_Layer].vs_LayerThickness; // [m]
    vt_B[i_Layer] = 2.0 / (vt_h1 + vt_h0); // [m]
    vt_V[i_Layer] = vt_h1 * pt_Ntau; // [m3]
    vt_h0 = vt_h1;
  }

  // End determination of the geometry parameters for soil temperature calculation


  // initialising heat state variables
  for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {
    // logger(MSG.INFO, "layer: " + i_Layer);

    ///////////////////////////////////////////////////////////////////////////////////////
    // Calculate heat conductivity following Neusypina 1979
    // Neusypina, T.A. (1979): Rascet teplovo rezima pocvi v modeli formirovanija urozaja.
    // Teoreticeskij osnovy i kolicestvennye metody programmirovanija urozaev. Leningrad,
    // 53 -62.
    // Note: in this original publication lambda is calculated in cal cm-1 s-1 K-1!
    ///////////////////////////////////////////////////////////////////////////////////////
    var sbdi = soilColumn.at(i_Layer).vs_SoilBulkDensity();
    var smi = vs_SoilMoisture_const[i_Layer];

    // logger(MSG.INFO, "sbdi: " + sbdi);  
    // logger(MSG.INFO, "smi: " + smi);  

    vt_HeatConductivity[i_Layer] = ((3.0 * (sbdi / 1000.0) - 1.7) * 0.001) /
           (1.0 + (11.5 - 5.0 * (sbdi / 1000.0)) *
            exp((-50.0) * pow((smi / (sbdi / 1000.0)), 1.5))) *
           86400.0 * (pt_TimeStep) * //  gives result in [days]
           100.0  //  gives result in [m]
           * 4.184; // gives result in [J]
           // --> [J m-1 d-1 K-1]

    // logger(MSG.INFO, "vt_HeatConductivity");       
    // logger(MSG.INFO, vt_HeatConductivity);      

    ///////////////////////////////////////////////////////////////////////////////////////
    // Calculate specific heat capacity following DAISY
    // Abrahamsen, P, and S. Hansen (2000): DAISY - An open soil-crop-atmosphere model
    // system. Environmental Modelling and Software 15, 313-330
    ///////////////////////////////////////////////////////////////////////////////////////

    var cw = pt_SpecificHeatCapacityWater;
    var cq = pt_SpecificHeatCapacityQuartz;
    var ca = pt_SpecificHeatCapacityAir;
    var ch = pt_SpecificHeatCapacityHumus;
    var dw = pt_DensityWater;
    var dq = ps_QuartzRawDensity;
    var da = pt_DensityAir;
    var dh = pt_DensityHumus;
    var spv = soilColumn[i_Layer].get_Saturation();
    var som = soilColumn.at(i_Layer).vs_SoilOrganicMatter() / da * sbdi; // Converting [kg kg-1] to [m3 m-3]


    vt_HeatCapacity[i_Layer] = (smi * dw * cw)
       +((spv-smi) * da * ca)
       + (som * dh * ch)
       + ( (1.0 - spv - som) * dq * cq);
       // --> [J m-3 K-1]
  } // for


  vt_HeatCapacity[vt_GroundLayer] = vt_HeatCapacity[vt_GroundLayer - 1];
  vt_HeatCapacity[vt_BottomLayer] = vt_HeatCapacity[vt_GroundLayer];
  vt_HeatConductivity[vt_GroundLayer] = vt_HeatConductivity[vt_GroundLayer - 1];
  vt_HeatConductivity[vt_BottomLayer] = vt_HeatConductivity[vt_GroundLayer];

  // Initialisation soil surface temperature
  vt_SoilSurfaceTemperature = pt_InitialSurfaceTemperature;


  ///////////////////////////////////////////////////////////////////////////////////////
  // Initialising Numerical Solution
  // Suckow,F. (1985): A model serving the calculation of soil
  // temperatures. Zeitschrift für Meteorologie 35 (1), 66 -70.
  ///////////////////////////////////////////////////////////////////////////////////////

  // Calculation of the mean heat conductivity per layer
  vt_HeatConductivityMean[0] = vt_HeatConductivity[0];
  // logger(MSG.INFO, vt_HeatConductivityMean);

  for (var i_Layer = 1; i_Layer < vt_NumberOfLayers; i_Layer++) {

    var lti_1 = soilColumn.at(i_Layer - 1).vs_LayerThickness;
    var lti = soilColumn.at(i_Layer).vs_LayerThickness;
    var hci_1 = vt_HeatConductivity[i_Layer - 1];
    var hci = vt_HeatConductivity[i_Layer];

    // @todo <b>Claas: </b>Formel nochmal durchgehen
    vt_HeatConductivityMean[i_Layer] = ((lti_1 * hci_1) + (lti * hci)) / (lti + lti_1);
    // logger(MSG.INFO, vt_HeatConductivityMean);

  } // for

  // Determination of the volume matrix
  for (var i_Layer = 0; i_Layer < vt_NumberOfLayers; i_Layer++) {

    vt_VolumeMatrix[i_Layer] = vt_V[i_Layer] * vt_HeatCapacity[i_Layer]; // [J K-1]

    // If initial entry, rearrengement of volume matrix
    vt_VolumeMatrixOld[i_Layer] = vt_VolumeMatrix[i_Layer];

    // Determination of the matrix secundary diagonal
    vt_MatrixSecundaryDiagonal[i_Layer] = -vt_B[i_Layer] * vt_HeatConductivityMean[i_Layer]; //[J K-1]

  }




  vt_MatrixSecundaryDiagonal[vt_BottomLayer + 1] = 0.0;

  // Determination of the matrix primary diagonal
  for (var i_Layer = 0; i_Layer < vt_NumberOfLayers; i_Layer++) {

    vt_MatrixPrimaryDiagonal[i_Layer] =   vt_VolumeMatrix[i_Layer]
          - vt_MatrixSecundaryDiagonal[i_Layer]
          - vt_MatrixSecundaryDiagonal[i_Layer + 1]; //[J K-1]
  }

  /**
   * @brief Single calculation step
   * @param tmin
   * @param tmax
   * @param globrad
   */
  var step = function (tmin, tmax, globrad) {

    if (DEBUG) debug(arguments);

    var vt_GroundLayer = vt_NumberOfLayers - 2;
    var vt_BottomLayer = vt_NumberOfLayers - 1;

    var vt_Solution = new Array(vt_NumberOfLayers);//                = new double [vt_NumberOfLayers];
    var vt_MatrixDiagonal = new Array(vt_NumberOfLayers);//          = new double [vt_NumberOfLayers];
    var vt_MatrixLowerTriangle = new Array(vt_NumberOfLayers);//     = new double [vt_NumberOfLayers];

    for (var i = 0; i < vt_NumberOfLayers; i++) {
      vt_Solution[i] = 0.0;
      vt_MatrixDiagonal[i] = 0.0;
      vt_MatrixLowerTriangle[i] = 0.0;
    }

    /////////////////////////////////////////////////////////////
    // Internal Subroutine Numerical Solution - Suckow,F. (1986)
    /////////////////////////////////////////////////////////////

    vt_HeatFlow = f_SoilSurfaceTemperature(tmin, tmax, globrad) * vt_B[0] * vt_HeatConductivityMean[0]; //[J]

    // Determination of the equation's right side
    vt_Solution[0] =  (vt_VolumeMatrixOld[0]
       + (vt_VolumeMatrix[0] - vt_VolumeMatrixOld[0]) / soilColumn[0].vs_LayerThickness)
        * vt_SoilTemperature[0] + vt_HeatFlow;

    // logger(MSG.INFO, "f_SoilSurfaceTemperature(tmin, tmax, globrad): " + f_SoilSurfaceTemperature(tmin, tmax, globrad));
    // logger(MSG.INFO, "vt_B[0]: " + vt_B[0]);
    // logger(MSG.INFO, "vt_HeatConductivityMean[0]: " + vt_HeatConductivityMean[0]);
    // logger(MSG.INFO, "vt_HeatFlow: " + vt_HeatFlow);
    // logger(MSG.INFO, "vt_Solution[0]: " + vt_Solution[0]);

    for (var i_Layer = 1; i_Layer < vt_NumberOfLayers; i_Layer++) {

      vt_Solution[i_Layer] =   (vt_VolumeMatrixOld[i_Layer]
        + (vt_VolumeMatrix[i_Layer] - vt_VolumeMatrixOld[i_Layer])
        / soilColumn[i_Layer].vs_LayerThickness)
          * vt_SoilTemperature[i_Layer];
    } // for

      // logger(MSG.INFO, vt_Solution);

    // end subroutine NumericalSolution

    /////////////////////////////////////////////////////////////
    // Internal Subroutine Cholesky Solution Method
    //
    // Solution of EX=Z with E tridiagonal and symmetric
    // according to CHOLESKY (E=LDL')
    /////////////////////////////////////////////////////////////

    // Determination of the lower matrix triangle L and the diagonal matrix D
    vt_MatrixDiagonal[0] = vt_MatrixPrimaryDiagonal[0];

    for (var i_Layer = 1; i_Layer < vt_NumberOfLayers; i_Layer++) {

      vt_MatrixLowerTriangle[i_Layer] = vt_MatrixSecundaryDiagonal[i_Layer] / vt_MatrixDiagonal[i_Layer - 1];
      vt_MatrixDiagonal[i_Layer] =   vt_MatrixPrimaryDiagonal[i_Layer]
             - (vt_MatrixLowerTriangle[i_Layer] * vt_MatrixSecundaryDiagonal[i_Layer]);
    }

    // Solution of LY=Z
    for (var i_Layer = 1; i_Layer < vt_NumberOfLayers; i_Layer++) {

      vt_Solution[i_Layer] =   vt_Solution[i_Layer]
               - (vt_MatrixLowerTriangle[i_Layer] * vt_Solution[i_Layer - 1]);
    }

    // Solution of L'X=D(-1)Y
    vt_Solution[vt_BottomLayer] = vt_Solution[vt_BottomLayer] / vt_MatrixDiagonal[vt_BottomLayer];


    for (var i_Layer = 0; i_Layer < vt_BottomLayer; i_Layer++) {

      var j_Layer = (vt_BottomLayer - 1) - i_Layer;
      var j_Layer1 = j_Layer + 1;
      vt_Solution[j_Layer] =   (vt_Solution[j_Layer] / vt_MatrixDiagonal[j_Layer])
               - (vt_MatrixLowerTriangle[j_Layer1] * vt_Solution[j_Layer1]);
    }

    // end subroutine CholeskyMethod

    // Internal Subroutine Rearrangement
    for(var i_Layer = 0; i_Layer < vt_NumberOfLayers; i_Layer++) {
      vt_SoilTemperature[i_Layer] = vt_Solution[i_Layer];
    }

    for (var i_Layer = 0; i_Layer < vs_NumberOfLayers; i_Layer++) {

      vt_VolumeMatrixOld[i_Layer] = vt_VolumeMatrix[i_Layer];
      soilColumn[i_Layer].set_Vs_SoilTemperature(vt_SoilTemperature[i_Layer]);
    }

    vt_VolumeMatrixOld[vt_GroundLayer] = vt_VolumeMatrix[vt_GroundLayer];
    vt_VolumeMatrixOld[vt_BottomLayer] = vt_VolumeMatrix[vt_BottomLayer];

  };


  /**
   * @brief  Soil surface temperature [B0C]
   *
   * Soil surface temperature caluclation following Williams 1984
   *
   * @param tmin
   * @param tmax
   * @param globrad
   */
  var f_SoilSurfaceTemperature = function (tmin, tmax, globrad) {

    if (DEBUG) debug(arguments);

    var shading_coefficient = dampingFactor;

    var soil_coverage = 0.0;
    if (monica.cropGrowth()) {
      soil_coverage = monica.cropGrowth().get_SoilCoverage();
    }
    shading_coefficient =  0.1 + ((soil_coverage * dampingFactor) + ((1-soil_coverage) * (1-dampingFactor)));


    // Soil surface temperature caluclation following Williams 1984
    var vt_SoilSurfaceTemperatureOld = vt_SoilSurfaceTemperature;

    // corrected for very low radiation in winter
    if (globrad < 8.33) {
      globrad = 8.33;
    }

    vt_SoilSurfaceTemperature =   (1.0 - shading_coefficient)
          * (tmin + ((tmax - tmin) * pow((0.03 * globrad),0.5)))
          + shading_coefficient * vt_SoilSurfaceTemperatureOld;

    // damping negative temperatures due to heat loss for freezing water
    if (vt_SoilSurfaceTemperature < 0.0){
      vt_SoilSurfaceTemperature = vt_SoilSurfaceTemperature * 0.5;
    }
    return vt_SoilSurfaceTemperature;
  };

  /**
   * @brief Returns soil surface temperature.
   * @param
   * @return Soil surface temperature
   */
  var get_SoilSurfaceTemperature = function () {
    return vt_SoilSurfaceTemperature;
  };

  /**
   * @brief Returns soil temperature of a layer.
   * @param layer Index of layer
   * @return Soil temperature
   */
  get_SoilTemperature = function (layer) {
    return soilColumn[layer].get_Vs_SoilTemperature();
  };

  /**
   * @brief Returns heat conductivity of a layer.
   * @param layer Index of layer
   * @return Soil heat conductivity
   */
  var get_HeatConductivity = function (layer) {
    return vt_HeatConductivity[layer];
  };

  /**
   * @brief Returns mean soil temperature.
   * @param sumLT
   * @return Temperature
   */
  var get_AvgTopSoilTemperature = function (sumLT) {
    if (arguments.length === 0)
      sumLT = 0.3;
    var lsum = 0;
    var tempSum = 0;
    var count = 0;

    for (var i = 0; i < vs_NumberOfLayers; i++) {
      count++;
      tempSum += soilColumn[i].get_Vs_SoilTemperature();
      lsum += soilColumn[i].vs_LayerThickness;
      if(lsum >= sumLT) {
        break;
      }
    }

    return count < 1 ? 0 : tempSum / (count);
  };

  return {
      step: step
    , f_SoilSurfaceTemperature: f_SoilSurfaceTemperature
    , get_SoilSurfaceTemperature: get_SoilSurfaceTemperature
    , get_SoilTemperature: get_SoilTemperature
    , get_HeatConductivity: get_HeatConductivity
    , get_AvgTopSoilTemperature: get_AvgTopSoilTemperature
    , getDampingFactor: function () { return dampingFactor; }
    , setDampingFactor: function (factor) { dampingFactor = factor; }
    , vt_SoilSurfaceTemperature: vt_SoilSurfaceTemperature
  };

};


var Configuration = function (outPath, climate, doDebug) {

  DEBUG = (doDebug === true) ? true : false;

  /* no output if null */ 
  var _outPath = outPath; 

  var run = function run(simObj, siteObj, cropObj) {

    logger(MSG.INFO, 'Fetching parameters from database.');
    
    var sp = new SiteParameters();
    var cpp = readUserParameterFromDatabase();
    var gp = new GeneralParameters(
      cpp.userEnvironmentParameters.p_LayerThickness,
      cpp.userEnvironmentParameters.p_LayerThickness * cpp.userEnvironmentParameters.p_NumberOfLayers
    );

    /* fetch soil horizon array */
    var horizonsArr = siteObj.horizons;
    /* fetch crop array */
    var cropsArr = cropObj.crops;

    /* sim */
    var startYear = new Date(Date.parse(simObj.time.startDate)).getFullYear();
    var endYear = new Date(Date.parse(simObj.time.endDate)).getFullYear();

    cpp.userEnvironmentParameters.p_UseSecondaryYields = simObj.switch.useSecondaryYieldOn === true ? true : false;
    gp.pc_NitrogenResponseOn = simObj.switch.nitrogenResponseOn === true ? true : false;
    gp.pc_WaterDeficitResponseOn = simObj.switch.waterDeficitResponseOn === true ? true : false;
    gp.pc_EmergenceMoistureControlOn = simObj.switch.emergenceMoistureControlOn === true ? true : false;
    gp.pc_EmergenceFloodingControlOn = simObj.switch.emergenceFloodingControlOn === true ? true : false;

    cpp.userInitValues.p_initPercentageFC = simObj.init.percentageFC;
    cpp.userInitValues.p_initSoilNitrate = simObj.init.soilNitrate;
    cpp.userInitValues.p_initSoilAmmonium = simObj.init.soilAmmonium;

    logger(MSG.INFO, 'Fetched sim data.');
    
    /* site */
    sp.vq_NDeposition = siteObj.NDeposition;
    sp.vs_Latitude = siteObj.latitude;
    sp.vs_Slope = siteObj.slope;
    sp.vs_HeightNN = siteObj.heightNN;
    sp.vs_Soil_CN_Ratio = 10; //TODO: per layer?
    sp.vs_DrainageCoeff = -1; //TODO: ?

    cpp.userEnvironmentParameters.p_AthmosphericCO2 = siteObj.atmosphericCO2;
    // if (siteObj.groundwaterDepthMin)
    //   cpp.userEnvironmentParameters.p_MinGroundwaterDepth = siteObj.groundwaterDepthMin;
    // if (siteObj.groundwaterDepthMax)
    //   cpp.userEnvironmentParameters.p_MaxGroundwaterDepth = siteObj.groundwaterDepthMax;
    // if (siteObj.groundwaterDepthMinMonth)
    //   cpp.userEnvironmentParameters.p_MinGroundwaterDepthMonth = siteObj.groundwaterDepthMinMonth;
    cpp.userEnvironmentParameters.p_WindSpeedHeight = siteObj.windSpeedHeight;  
    cpp.userEnvironmentParameters.p_LeachingDepth = siteObj.leachingDepth;  
    // cpp.userEnvironmentParameters.p_NumberOfLayers = horizonsArr.numberOfLayers; // JV! currently not present in json 

    // TODO: maxMineralisationDepth? (gp ps_MaxMineralisationDepth und ps_MaximumMineralisationDepth?)
    gp.ps_MaxMineralisationDepth = 0.4;

    logger(MSG.INFO, 'Fetched site data.');

    /* soil */
    var lThicknessCm = 100.0 * cpp.userEnvironmentParameters.p_LayerThickness;
    var maxDepthCm =  200.0;
    var maxNoOfLayers = int(maxDepthCm / lThicknessCm);

    var layers = [];
    if (!createLayers(layers, horizonsArr, lThicknessCm, maxNoOfLayers)) {
      logger(MSG.ERROR, 'Error fetching soil data.');
      return;
    }
    
    logger(MSG.INFO, 'Fetched soil data.');

    /* weather */
    var da = new DataAccessor(new Date(startYear, 0, 1), new Date(endYear, 11, 31));
    if (!createClimate(da, cpp, sp.vs_Latitude)) {
      logger(MSG.ERROR, 'Error fetching climate data.');
      return;
    }
    
    logger(MSG.INFO, 'Fetched climate data.');

    /* crops */
    var pps = [];
    if (!createProcesses(pps, cropsArr)) {
      logger(MSG.ERROR, 'Error fetching crop data.');
      return;
    }
    
    logger(MSG.INFO, 'Fetched crop data.');

    var env = new Environment(layers, cpp);
    env.general = gp;
    env.pathToOutputDir = _outPath;
    // env.setMode(1); // JS! not implemented
    env.site = sp;
    env.da = da;
    env.cropRotation = pps;

    logger(MSG.INFO, 'Start monica model.');

    return runMonica(env, setProgress);
  };


  var createLayers = function createLayers(layers, horizonsArr, lThicknessCm, maxNoOfLayers) {

    var ok = true;
    var hs = horizonsArr.length;
    var depth = 0;
    
    logger(MSG.INFO, 'Fetching ' + hs + ' horizons.');

    for (var h = 0; h < hs; ++h ) {

      debug('lThicknessCm', lThicknessCm);
      debug('maxNoOfLayers', maxNoOfLayers);
      debug('depth', depth);
      
      var horizonObj = horizonsArr[h];

      // var hLoBoundaryCm = 100 * horizonObj.lowerBoundary;
      // var hUpBoundaryCm = layers.length * lThicknessCm;
      // var hThicknessCm = max(0, hLoBoundaryCm - hUpBoundaryCm);
      var hThicknessCm = horizonObj.thickness * 100;
      var lInHCount = int(round(hThicknessCm / lThicknessCm));

      /* fill all (maxNoOfLayers) layers if available horizons depth < lThicknessCm * maxNoOfLayers */
      if (h == (hs - 1) && (int(layers.length) + lInHCount) < maxNoOfLayers)
        lInHCount += maxNoOfLayers - layers.length - lInHCount;

      for (var l = 0; l < lInHCount; l++) {

        /* stop if we reach max. depth */
        if (depth === maxNoOfLayers * lThicknessCm) {
          logger(MSG.WARN, 'Maximum soil layer depth (' + (maxNoOfLayers * lThicknessCm) + ' cm) reached. Remaining layers in horizon ' + h + ' ignored.');
          break;
        }

        depth += lThicknessCm;

        var layer = new SoilParameters();
        layer.set_vs_SoilOrganicCarbon(horizonObj.Corg);
        if (horizonObj.bulkDensity)
          layer.set_vs_SoilBulkDensity(horizonObj.bulkDensity);
        layer.vs_SoilSandContent = horizonObj.sand;
        layer.vs_SoilClayContent = horizonObj.clay;
        layer.vs_SoilStoneContent = horizonObj.sceleton; //TODO: / 100 ?
        layer.vs_Lambda = Tools.texture2lambda(layer.vs_SoilSandContent, layer.vs_SoilClayContent);
        // TODO: Wo wird textureClass verwendet?
        layer.vs_SoilTexture = horizonObj.textureClass;
        layer.vs_SoilpH = horizonObj.pH;
        /* TODO: ? lambda = drainage_coeff ? */
        layer.vs_Lambda = Tools.texture2lambda(layer.vs_SoilSandContent, layer.vs_SoilClayContent);
        layer.vs_FieldCapacity = horizonObj.fieldCapacity;
        /* TODO: name? */
        layer.vs_Saturation = horizonObj.poreVolume;
        layer.vs_PermanentWiltingPoint = horizonObj.permanentWiltingPoint;

        /* TODO: hinter readJSON verschieben */ 
        if (!layer.isValid()) {
          ok = false;
          logger(MSG.ERROR, 'Error in soil parameters.');
        }

        layers.push(layer);
        logger(MSG.INFO, 'Fetched layer ' + layers.length + ' in horizon ' + h + '.');

      }

      logger(MSG.INFO, 'Fetched horizon ' + h + '.');
    }  

    return ok;
  };

  function createProcesses(pps, cropsArr) {
    
    var ok = true;
    var cs = cropsArr.length;
    
    logger(MSG.INFO, 'Fetching ' + cs + ' crops.');

    for (var c = 0; c < cs; c++) {

      var cropObj = cropsArr[c];
      var cropId = cropObj.name.id;

      // var nameAndGenType = cropObj.nameAndGenType;

      // var res = db.exec(
      //  "SELECT crop_id \
      //   FROM view_crop \
      //   WHERE name_and_gentype='" + nameAndGenType + "'"
      // );

      // if (res.length > 0)
      //   cropId = res[0].values[0][0];

      if (!cropId || cropId < 0 || isNaN(cropId)) {
        ok = false;
        logger(MSG.ERROR, 'Invalid crop id: ' + cropId + '.');
      }

      var sd = new Date(Date.parse(cropObj.sowingDate));
      var hd = new Date(Date.parse(cropObj.finalHarvestDate));

      debug(sd, 'sd');
      debug(hd, 'hd');

      if (!sd.isValid() || !hd.isValid()) {
        ok = false;
        logger(MSG.ERROR, 'Invalid sowing or harvest date.');
      }

      var crop = new Crop(cropId, cropObj.name.name + ', ' + cropObj.name.gen_type /*TODO: hermesCropId?*/);
      crop.setSeedAndHarvestDate(sd, hd);
      crop.setCropParameters(getCropParameters(crop.id()));
      crop.setResidueParameters(getResidueParameters(crop.id()));

      pps[c] = new ProductionProcess(cropObj.name.name + ', ' + cropObj.name.gen_type, crop);

      /* tillage */
      var tillArr = cropObj.tillageOperations;
      if (tillArr) { /* in case no tillage has been added */
        if (!addTillageOperations(pps[c], tillArr)) {
          ok = false;
          logger(MSG.ERROR, 'Error adding tillages.');
        }
      }

      /* mineral fertilizer */
      var minFertArr = cropObj.mineralFertilisers;
      if (minFertArr) { /* in case no min fertilizer has been added */
        if (!addFertilizers(pps[c], minFertArr, false)) {
          ok = false;
          logger(MSG.ERROR, 'Error adding mineral fertilisers.');
        }
      }

      /* organic fertilizer */ 
      var orgFertArr = cropObj.organicFertilisers;
      if (orgFertArr) { /* in case no org fertilizer has been added */ 
        if (!addFertilizers(pps[c], orgFertArr, true)) {
          ok = false;
          logger(MSG.ERROR, 'Error adding organic fertilisers.');
        }
      }

      /* irrigations */
      var irriArr = cropObj.irrigations;
      if (irriArr) {  /* in case no irrigation has been added */
        if (!addIrrigations(pps[c], irriArr)) {
          ok = false;
          logger(MSG.ERROR, 'Error adding irrigations.');
        }
      }

      /* cutting */
      var cutArr = cropObj.cuttings;
      if (cutArr) { /* in case no tillage has been added */
        if (!addCuttings(pps[c], cutArr)) {
          ok = false;
          logger(MSG.ERROR, 'Error adding cuttings.');
        }
      }

      logger(MSG.INFO, 'Fetched crop ' + c + ', name: ' + cropObj.name.name + ', id: ' + cropId + '.');

    }

    return ok;
  };

  function addTillageOperations(pp, tillArr) {

    var ok = true;
    var ts = tillArr.length;

    logger(MSG.INFO, 'Fetching ' + ts + ' tillages.');

    for (var t = 0; t < ts; ++t) {

      var tillObj = tillArr[t];

      /* ignore if any value is null */
      if (tillObj.date === null || tillObj.depth === null || tillObj.method === null) {
        logger(MSG.WARN, 'At least one tillage parameter null: tillage ' + t + ' ignored.');
        continue;
      }

      var tDate = new Date(Date.parse(tillObj.date));
      var depth = tillObj.depth / 100; // cm to m
      var method = tillObj.method;

      if (!tDate.isValid()) {
        ok = false;
        logger(MSG.ERROR, 'Invalid tillage date in tillage no. ' + t + '.');
      }

      pp.addApplication(new TillageApplication(tDate, depth));

      logger(MSG.INFO, 'Fetched tillage ' + t + '.');

    }

    return ok;
  };

  function addFertilizers(pp, fertArr, isOrganic) {
    // TODO: implement in JS
    /*
    //get data parsed and to use leap years if the crop rotation uses them
    Date fDateate = parseDate(sfDateate).toDate(it->crop()->seedDate().useLeapYears());

    if (!fDateate.isValid())
    {
      debug() << 'Error - Invalid date in \'' << pathToFile << '\'' << endl;
      debug() << 'Line: ' << s << endl;
      ok = false;
    }

   //if the currently read fertiliser date is after the current end
    //of the crop, move as long through the crop rotation as
    //we find an end date that lies after the currently read fertiliser date
    while (fDateate > currentEnd)
    {
      //move to next crop and possibly exit at the end
      it++;
      if (it == cr.end())
        break;

      currentEnd = it->end();

      //cout << 'new PP start: ' << it->start().toString()
      //<< ' new PP end: ' << it->end().toString() << endl;
      //cout << 'new currentEnd: ' << currentEnd.toString() << endl;
    }
    */
    var ok = true;
    var fs = fertArr.length;

    logger(MSG.INFO, 'Fetching ' + fs + ' ' + (isOrganic ? 'organic' : 'mineral') + ' fertilisers.');

    for (var f = 0; f < fs; ++f) {
      
      var fertObj = fertArr[f];

      /* ignore if any value is null */
      if (fertObj.date === null || fertObj.method === null || fertObj.type === null || fertObj.amount === null) {
        logger(MSG.WARN, 'At least one fertiliser parameter null: ' + (isOrganic ? 'organic' : 'mineral') + ' fertiliser ' + f + 'ignored.');
        continue;
      }

      var fDate = new Date(Date.parse(fertObj.date));
      var method = fertObj.method;
      var type = fertObj.type;
      var amount = fertObj.amount;
      var min = fertObj.min;
      var max = fertObj.max;
      var delayInDays = fertObj.delayInDays;

      if (!fDate.isValid()) {
        ok = false;
        logger(MSG.ERROR, 'Invalid fertilization date in ' + f + '.');
      }

      if (method == "Automated"){
        pp.crop().setUseNMinMethod(true);
        logger(MSG.INFO, "Using NMin method for fertilizing crop " + pp.crop().name());
      }

      if (isOrganic)  {

        var orgId = type.id;

        // var res = db.exec(
        //  "SELECT id \
        //   FROM organic_fertiliser \
        //   WHERE om_type='" + type + "'"
        // );

        // if (res.length > 0)
        //   orgId = res[0].values[0][0]; 
    
        if (orgId < 0) {
          logger(MSG.ERROR, 'Organic fertilser ' + type.id + ' not found.');
          ok = false;
        }

        pp.addApplication(new OrganicFertiliserApplication(fDate, getOrganicFertiliserParameters(orgId), amount, true));
      
      } else { // not organic

        var minId = type.id;

        // var res = db.exec(
        //  "SELECT id \
        //   FROM mineral_fertilisers \
        //   WHERE name='" + type + "'"
        // );
 
        // if (res.length > 0)
        //   minId = res[0].values[0][0]; 
        
        if (minId < 0) {
          logger(MSG.ERROR, 'Mineral fertilser ' + type.id + ' not found.');
          ok = false;
        }

        if(method == "Automated"){
          pp.crop().setNMinFertiliserPartition(getMineralFertiliserParameters(minId));
          pp.crop().setNMinUserParams(new NMinUserParameters(min, max, delayInDays));
        } else {
          pp.addApplication(new MineralFertiliserApplication(fDate, getMineralFertiliserParameters(minId), amount));
        }

      
      }

      logger(MSG.INFO, 'Fetched ' + (isOrganic ? 'organic' : 'mineral') + ' fertiliser ' + f + '.');

    }
     
    return ok;
    
  };


  function addIrrigations(pp, irriArr) {
    
    var ok = true;

    // TODO: implement in JS
    //get data parsed and to use leap years if the crop rotation uses them
    /*Date idate = parseDate(irrDate).toDate(it->crop()->seedDate().useLeapYears());
    if (!idate.isValid())
    {
      debug() << 'Error - Invalid date in \'' << pathToFile << '\'' << endl;
      debug() << 'Line: ' << s << endl;
      debug() << 'Aborting simulation now!' << endl;
      exit(-1);
    }

    //cout << 'PP start: ' << it->start().toString()
    //<< ' PP end: ' << it->end().toString() << endl;
    //cout << 'irrigationDate: ' << idate.toString()
    //<< ' currentEnd: ' << currentEnd.toString() << endl;

    //if the currently read irrigation date is after the current end
    //of the crop, move as long through the crop rotation as
    //we find an end date that lies after the currently read irrigation date
    while (idate > currentEnd)
    {
      //move to next crop and possibly exit at the end
      it++;
      if (it == cr.end())
        break;

      currentEnd = it->end();

      //cout << 'new PP start: ' << it->start().toString()
      //<< ' new PP end: ' << it->end().toString() << endl;
      //cout << 'new currentEnd: ' << currentEnd.toString() << endl;
    }*/

    var is = irriArr.length;
    
    logger(MSG.INFO, 'Fetching ' + is + ' irrigations.');

    for (var i = 0; i < is; ++i) {
      
      var irriObj = irriArr[i];

      /* ignore if any value is null */
      if (irriObj.date === null || irriObj.method  === null || irriObj.eventType  === null || irriObj.threshold  === null
          || irriObj.amount === null || irriObj.NConc === null) {
        logger(MSG.WARN, 'At least one irrigation parameter null: irrigation ' + i + ' ignored.');
        continue;
      }

      var method = irriObj.method;
      var eventType = irriObj.eventType;
      var threshold = irriObj.threshold;
      var area = irriObj.area;
      var amount = irriObj.amount;
      var NConc = irriObj.NConc;
      var iDate = new Date(Date.parse(irriObj.date));

      if (!iDate.isValid()) {
        ok = false;
        logger(MSG.ERROR, 'Invalid irrigation date in ' + i + '.');
      }

      if (eventType == "Content"){
        pp.crop().setUseAutomaticIrrigation(true);
        pp.crop().setAutoIrrigationParams(new AutomaticIrrigationParameters(amount, threshold, NConc, 0));
        logger(MSG.INFO, "Using automatic irrigation for crop " + pp.crop().name());
      } else {
        pp.addApplication(new IrrigationApplication(iDate, amount, new IrrigationParameters(NConc, 0.0)));
      }

      logger(MSG.INFO, 'Fetched irrigation ' + i + '.');

    }

    return ok;
  };

  /*
    JV: test new function
  */

  function addCuttings(pp, cutArr) {

    var ok = true;
    var cs = cutArr.length;

    logger(MSG.INFO, 'Fetching ' + cs + ' cuttings.');

    for (var c = 0; c < cs; ++c) {
      var cutObj = cutArr[c];
      var cDate = new Date(Date.parse(cutObj.date));
      pp.addApplication(new Cutting(cDate, pp.crop(), pp.cropResult()));
    }

    return ok;
  };


  function createClimate(da, cpp, latitude, useLeapYears) {

    var ok = false;

    if (climate) {

      da.addClimateData(Climate.tmin, new Float64Array(climate.tmin));
      da.addClimateData(Climate.tmax, new Float64Array(climate.tmax));
      da.addClimateData(Climate.tavg, new Float64Array(climate.tavg));
      da.addClimateData(Climate.globrad, new Float64Array(climate.globrad)); /* MJ m-2 */
      da.addClimateData(Climate.wind, new Float64Array(climate.wind));
      da.addClimateData(Climate.precip, new Float64Array(climate.precip));

      if(climate.sunhours.length > 0)
        da.addClimateData(Climate.sunhours, new Float64Array(climate.sunhours));

      if (climate.relhumid.length > 0)
        da.addClimateData(Climate.relhumid, new Float64Array(climate.relhumid));

      /* TODO: add additional checks */
      ok = true;
    }

    return ok;

    /* we dont use hermes MET files anymore */
    // var tmin = [];
    // var tavg = [];
    // var tmax = [];
    // var globrad = [];
    // var relhumid = [];
    // var wind = [];
    // var precip = [];
    // var sunhours = [];

    // var date = new Date(da.startDate().getFullYear(), 0, 1);

    // var idx_t_av = data.met.columns.indexOf('t_av');
    // var idx_t_min = data.met.columns.indexOf('t_min');
    // var idx_t_max = data.met.columns.indexOf('t_max');
    // var idx_t_s10 = data.met.columns.indexOf('t_s10');
    // var idx_t_s20 = data.met.columns.indexOf('t_s20');
    // var idx_vappd = data.met.columns.indexOf('vappd');
    // var idx_wind = data.met.columns.indexOf('wind');
    // var idx_sundu = data.met.columns.indexOf('sundu');
    // var idx_radia = data.met.columns.indexOf('radia');
    // var idx_prec = data.met.columns.indexOf('prec');
    // var idx_day = data.met.columns.indexOf('day');
    // var idx_year = data.met.columns.indexOf('year');
    // var idx_rf = data.met.columns.indexOf('rf');

    // for (var y = da.startDate().getFullYear(), ys = da.endDate().getFullYear(); y <= ys; y++) {

    //   var daysCount = 0;
    //   var allowedDays = ceil((new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / (24 * 60 * 60 * 1000));

    //   console.log('allowedDays: ' + allowedDays + ' ' + y+ '\t' + useLeapYears + '\tlatitude:\t' + latitude);

    //   for (var r = 0, rs = data.met.rows.length; r < rs; r++) {

    //     var row = data.met.rows[r];
    //     if (row[idx_year] != y)
    //       continue;

    //     if (row[idx_radia] >= 0) {
    //       // use globrad
    //       // HERMES weather files deliver global radiation as [J cm-2]
    //       // Here, we push back [MJ m-2 d-1]
    //       var globradMJpm2pd = row[idx_radia] * 100.0 * 100.0 / 1000000.0;
    //       globrad.push(globradMJpm2pd);        
    //     } else if (row[idx_sundu] >= 0.0) {
    //       // invalid globrad use sunhours
    //       // convert sunhours into globrad
    //       // debug() << 'Invalid globrad - use sunhours instead' << endl;
    //       globrad.push(Tools.sunshine2globalRadiation(r + 1, sunhours, latitude, true));    
    //       sunhours.push(row[idx_sundu]);
    //     } else {
    //       // error case
    //       console.log('Error: No global radiation or sunhours specified for day ' + date);
    //       ok = false;
    //     }

    //     if (row[idx_rf] >= 0.0)
    //       relhumid.push(row[idx_rf]);

    //     tavg.push(row[idx_t_av]);
    //     tmin.push(row[idx_t_min]);
    //     tmax.push(row[idx_t_max]);
    //     wind.push(row[idx_wind]);
    //     precip.push(row[idx_prec]);

    //     daysCount++;
    //     date = new Date(date.getFullYear, date.getMonth(), date.getDate() + 1);
    //   }
    // }

    // da.addClimateData(Climate.tmin, new Float64Array(tmin));
    // da.addClimateData(Climate.tmax, new Float64Array(tmax));
    // da.addClimateData(Climate.tavg, new Float64Array(tavg));
    // da.addClimateData(Climate.globrad, new Float64Array(globrad));
    // da.addClimateData(Climate.wind, new Float64Array(wind));
    // da.addClimateData(Climate.precip, new Float64Array(precip));

    // if(sunhours.length > 0)
    //   da.addClimateData(Climate.sunhours, new Float64Array(sunhours));

    // if (relhumid.length > 0)
    //   da.addClimateData(Climate.relhumid, new Float64Array(relhumid));

    // return ok;

  };

  var setProgress = function (date, model) {

    var progress = {};

    /* if both null we are done */
    if (!date && !model) {
      progress = null;
    } else {

      var isCropPlanted = model.isCropPlanted()
        , mcg = model.cropGrowth()
        , mst = model.soilTemperature()
        , msm = model.soilMoisture()
        , mso = model.soilOrganic()
        , msc = model.soilColumn()
        /* TODO: (from cpp) work-around. Hier muss was eleganteres hin! */
        , msa = model.soilColumnNC()
        , msq = model.soilTransport()
        ;

      progress = {
          date: { value: date.toISOString(), unit: '[date]' }
        , CropName: { value: isCropPlanted ? mcg.get_CropName() : '', unit: '-' }
        , TranspirationDeficit: { value: isCropPlanted ? mcg.get_TranspirationDeficit() : 0, unit: '[0;1]' }
        , ActualTranspiration: { value: isCropPlanted ? mcg.get_ActualTranspiration() : 0, unit: '[mm]' } 
        , CropNRedux: { value: isCropPlanted ? mcg.get_CropNRedux() : 0, unit: '[0;1]' }
        , HeatStressRedux: { value: isCropPlanted ? mcg.get_HeatStressRedux() : 0, unit: '[0;1]' }
        , OxygenDeficit: { value: isCropPlanted ? mcg.get_OxygenDeficit() : 0, unit: '[0;1]' }
        , DevelopmentalStage: { value: isCropPlanted ? mcg.get_DevelopmentalStage() + 1 : 0, unit: '[#]' }
        , CurrentTemperatureSum: { value: isCropPlanted ? mcg.get_CurrentTemperatureSum() : 0, unit: '°C' }
        , VernalisationFactor: { value: isCropPlanted ? mcg.get_VernalisationFactor() : 0, unit: '[0;1]' }
        , DaylengthFactor: { value: isCropPlanted ? mcg.get_DaylengthFactor() : 0, unit: '[0;1]' }
        , OrganGrowthIncrementRoot: { value: isCropPlanted ? mcg.get_OrganGrowthIncrement(0) : 0, unit: '[kg (DM) ha-1]' }
        , OrganGrowthIncrementLeaf: { value: isCropPlanted ? mcg.get_OrganGrowthIncrement(1) : 0, unit: '[kg (DM) ha-1]' }
        , OrganGrowthIncrementShoot: { value: isCropPlanted ? mcg.get_OrganGrowthIncrement(2) : 0, unit: '[kg (DM) ha-1]' }
        , OrganGrowthIncrementFruit: { value: isCropPlanted ? mcg.get_OrganGrowthIncrement(3) : 0, unit: '[kg (DM) ha-1]' }
        , RelativeTotalDevelopment: { value: isCropPlanted ? mcg.get_RelativeTotalDevelopment() : 0, unit: '[0;1]' }
        , OrganBiomassRoot: { value: isCropPlanted ? mcg.get_OrganBiomass(0) : 0, unit: '[kg (DM) ha-1]' }
        , OrganBiomassLeaf: { value: isCropPlanted ? mcg.get_OrganBiomass(1) : 0, unit: '[kg (DM) ha-1]' }
        , OrganBiomassShoot: { value: isCropPlanted ? mcg.get_OrganBiomass(2) : 0, unit: '[kg (DM) ha-1]' }
        , OrganBiomassFruit: { value: isCropPlanted ? mcg.get_OrganBiomass(3) : 0, unit: '[kg (DM) ha-1]' }
        , PrimaryCropYield: { value: isCropPlanted ? mcg.get_PrimaryCropYield() : 0, unit: '[kg (DM) ha-1]' }
        , LeafAreaIndex: { value:  isCropPlanted ? mcg.get_LeafAreaIndex() : 0, unit: '[m-2 m-2]' }
        , GrossPhotosynthesisHaRate: { value: isCropPlanted ? mcg.get_GrossPhotosynthesisHaRate() : 0, unit: '[kg (CH2O) ha-1 d-1]' }
        , NetPhotosynthesis: { value: isCropPlanted ? mcg.get_NetPhotosynthesis() : 0, unit: '[kg (CH2O) ha-1 d-1]' }
        , MaintenanceRespirationAS: { value: isCropPlanted ? mcg.get_MaintenanceRespirationAS() : 0, unit: '[kg (CH2O) ha-1 d-1]' }
        , GrowthRespirationAS: { value: isCropPlanted ? mcg.get_GrowthRespirationAS() : 0, unit: '[kg (CH2O) ha-1 d-1]' }
        , StomataResistance: { value: isCropPlanted ? mcg.get_StomataResistance() : 0, unit: '[s m-1]' }
        , CropHeight: { value: isCropPlanted ? mcg.get_CropHeight() : 0, unit: '[m]' }
        , LeafAreaIndex: { value: isCropPlanted ? mcg.get_LeafAreaIndex() : 0, unit: '[m2 m-2]' }
        , RootingDepth: { value: isCropPlanted ? mcg.get_RootingDepth() : 0, unit: '[layer #]' }
        , AbovegroundBiomass: { value: isCropPlanted ? mcg.get_AbovegroundBiomass() : 0, unit: '[kg ha-1]' }
        , TotalBiomassNContent: { value: isCropPlanted ? mcg.get_TotalBiomassNContent() : 0, unit: '[?]' }
        , SumTotalNUptake: { value: isCropPlanted ? mcg.get_SumTotalNUptake() : 0, unit: '[kg (N) ha-1]' }
        , ActNUptake: { value: isCropPlanted ? mcg.get_ActNUptake() : 0, unit: '[kg (N) ha-1]' }
        , PotNUptake: { value: isCropPlanted ? mcg.get_PotNUptake() : 0, unit: '[kg (N) ha-1]' }
        , TargetNConcentration: { value: isCropPlanted ? mcg.get_TargetNConcentration() : 0, unit: '[kg (N) ha-1]' }
        , CriticalNConcentration: { value: isCropPlanted ? mcg.get_CriticalNConcentration() : 0, unit: '[kg (N) ha-1]' }
        , AbovegroundBiomassNConcentration: { value: isCropPlanted ? mcg.get_AbovegroundBiomassNConcentration() : 0, unit: '[kg (N) ha-1]' }
        , NetPrimaryProduction: { value: isCropPlanted ? mcg.get_NetPrimaryProduction() : 0, unit: '[kg (N) ha-1]' }
        , GrossPrimaryProduction: { value: isCropPlanted ? mcg.get_GrossPrimaryProduction() : 0, unit: '[kg (N) ha-1]' }
        , AutotrophicRespiration: { value: isCropPlanted ? mcg.get_AutotrophicRespiration() : 0, unit: '[kg (C) ha-1]' }
      };

      var outLayers = 20;

      for (var i_Layer = 0; i_Layer < outLayers; i_Layer++)
        progress['SoilMoisture_' + i_Layer] = { value: msm.get_SoilMoisture(i_Layer), unit: '[m-3 m-3]' };

      progress['dailySumIrrigationWater'] = { value: model.dailySumIrrigationWater(), unit: '[mm]' };
      progress['Infiltration'] = { value: msm.get_Infiltration(), unit: '[mm]' };
      progress['SurfaceWaterStorage'] = { value: msm.get_SurfaceWaterStorage(), unit: '[mm]' };
      progress['SurfaceRunOff'] = { value: msm.get_SurfaceRunOff(), unit: '[mm]' };
      progress['SnowDepth'] = { value: msm.get_SnowDepth(), unit: '[mm]' }; 
      progress['FrostDepth'] = { value: msm.get_FrostDepth(), unit: '[mm]' };
      progress['ThawDepth'] = { value: msm.get_ThawDepth(), unit: '[mm]' };

      for (var i_Layer = 0; i_Layer < outLayers; i_Layer++)
       progress['PASW_' + i_Layer] = { value: msm.get_SoilMoisture(i_Layer) - msa[i_Layer].get_PermanentWiltingPoint(), unit: '[m-3 m-3]' };

      progress['SoilSurfaceTemperature'] = { value: mst.get_SoilSurfaceTemperature(), unit: '[°C]' };

      for(var i_Layer = 0; i_Layer < 5; i_Layer++)
        progress['SoilTemperature_' + i_Layer] = { value: mst.get_SoilTemperature(i_Layer), unit: '[°C]' };

      progress['ActualEvaporation'] = { value: msm.get_ActualEvaporation(), unit: '[mm]' };
      progress['Evapotranspiration'] = { value: msm.get_Evapotranspiration(), unit: '[mm]' };
      progress['ET0'] = { value: msm.get_ET0(), unit: '[mm]' };
      progress['KcFactor'] = { value: msm.get_KcFactor(), unit: '[?]' };
      progress['AtmosphericCO2Concentration'] = { value: model.get_AtmosphericCO2Concentration(), unit: '[ppm]' };
      progress['GroundwaterDepth'] = { value: model.get_GroundwaterDepth(), unit: '[m]' };
      progress['GroundwaterRecharge'] = { value: msm.get_GroundwaterRecharge(), unit: '[mm]' };
      progress['NLeaching'] = { value: msq.get_NLeaching(), unit: '[kg (N) ha-1]' };

      for(var i_Layer = 0; i_Layer < outLayers; i_Layer++)
        progress['SoilNO3_' + i_Layer] = { value: msc.soilLayer(i_Layer).get_SoilNO3(), unit: '[kg (N) m-3]' };

      progress['SoilCarbamid'] = { value: msc.soilLayer(0).get_SoilCarbamid(), unit: '[kg (N) m-3]' };

      for(var i_Layer = 0; i_Layer < outLayers; i_Layer++)
        progress['SoilNH4_' + i_Layer] = { value: msc.soilLayer(i_Layer).get_SoilNH4(), unit: '[kg (N) m-3]' };

      for(var i_Layer = 0; i_Layer < 4; i_Layer++)
        progress['SoilNO2_' + i_Layer] = { value: msc.soilLayer(i_Layer).get_SoilNO2(), unit: '[kg (N) m-3]' };

      for(var i_Layer = 0; i_Layer < 6; i_Layer++)
        progress['SoilOrganicCarbon_' + i_Layer] = { value: msc.soilLayer(i_Layer).vs_SoilOrganicCarbon(), unit: '[kg (C) kg-1]' };

      progress["tmin"] = { value: model.dataAccessor().dataForTimestep(Climate.tmin, model.currentStepNo()), unit: "[°C]" };
      progress["tavg"] = { value: model.dataAccessor().dataForTimestep(Climate.tavg, model.currentStepNo()), unit: "[°C]" };
      progress["tmax"] = { value: model.dataAccessor().dataForTimestep(Climate.tmax, model.currentStepNo()), unit: "[°C]" };
      progress["precip"] = { value: model.dataAccessor().dataForTimestep(Climate.precip, model.currentStepNo()), unit: "[mm]" };
      progress["wind"] = { value: model.dataAccessor().dataForTimestep(Climate.wind, model.currentStepNo()), unit: "[m s-1]" };
      progress["globrad"] = { value: model.dataAccessor().dataForTimestep(Climate.globrad, model.currentStepNo()), unit: "[MJ m-2 d-1]" };
      progress["relhumid"] = { value: model.dataAccessor().dataForTimestep(Climate.relhumid, model.currentStepNo()), unit: "[m3 m-3]" };
      progress["sunhours"] = { value: model.dataAccessor().dataForTimestep(Climate.sunhours, model.currentStepNo()), unit: "[h]" };
    }
  
    if (ENVIRONMENT_IS_WORKER)
      postMessage({ progress: progress });
    else
      logger(MSG.INFO, (progress ? progress.date.value : 'done'));
  
  };  

  return {
    run: run 
  };


};


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
  var db = null;
  var req = new XMLHttpRequest();
  req.open('GET', './monica.sqlite', true);
  req.responseType = "arraybuffer";
  req.onload = function (evt) {
    var arrayBuffer = req.response;
    if (arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      db = new SQL.Database(byteArray);  
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
    } else if (evt.data.hasOwnProperty('run')) {
      var config = evt.data.run;
      var cfg = new Configuration(null, config.weather, config.debug);
      postMessage(cfg.run(config.sim, config.site, config.crop));
    } else {
      postMessage(null);
    }
  };

} else {

  /* we expect that window.SQL is available */
  var db = null;
  var req = new XMLHttpRequest();
  req.open('GET', './monica.sqlite', true);
  req.responseType = "arraybuffer";
  req.onload = function (evt) {
    var arrayBuffer = req.response;
    if (arrayBuffer) {
      var byteArray = new Uint8Array(arrayBuffer);
      db = new SQL.Database(byteArray);  
      monica.db = db;
    }
  };
  req.send(null);

  monica.Configuration = Configuration;
  monica.config = example_config;
  var fs = null;

}



}());
