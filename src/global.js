/* math, constants and helper functions */

var abs   = Math.abs
  , acos  = Math.acos
  , asin  = Math.asin
  , atan  = Math.atan
  , ceil  = Math.ceil
  , cos   = Math.cos
  , exp   = Math.exp
  , floor = Math.floor
  , int   = function (x) {
      return x | 0;
    }
  , log   = Math.log
  , log10 = function (x) { 
      return Math.log(x) / Math.LN10; 
    }
  , max   = Math.max
  , min   = Math.min
  , pow   = Math.pow
  , round = Math.round
  , fixed = function (n, x) { 
      return x.toFixed(n);
    }
  , roundN  = function (n, x) { 
      return parseFloat(x.toFixed(n));
    }
  , sin   = Math.sin
  , sqrt  = Math.sqrt
  , tan   = Math.tan
  , PI    = Math.PI
  ;

var UNDEFINED = -9999.9,
    UNDEFINED_INT = -9999;

var ROOT = 0
  , LEAF = 1
  , SHOOT = 2
  , STORAGE_ORGAN = 3
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

var Tools = {

    texture2KA5: function (sand, clay) {

      var silt = 1.0 - sand - clay
        , soilTextureClass = ''
        ;

      if(silt < 0.1 && clay < 0.05)
        soilTextureClass = "Ss";
      else if(silt < 0.25 && clay < 0.05)
        soilTextureClass = "Su2";
      else if(silt < 0.25 && clay < 0.08)
        soilTextureClass = "Sl2";
      else if(silt < 0.40 && clay < 0.08)
        soilTextureClass = "Su3";
      else if(silt < 0.50 && clay < 0.08)
        soilTextureClass = "Su4";
      else if(silt < 0.8 && clay < 0.08)
        soilTextureClass = "Us";
      else if(silt >= 0.8 && clay < 0.08)
        soilTextureClass = "Uu";
      else if(silt < 0.1 && clay < 0.17)
        soilTextureClass = "St2";
      else if(silt < 0.4 && clay < 0.12)
        soilTextureClass = "Sl3";
      else if(silt < 0.4 && clay < 0.17)
        soilTextureClass = "Sl4";
      else if(silt < 0.5 && clay < 0.17)
        soilTextureClass = "Slu";
      else if(silt < 0.65 && clay < 0.17)
        soilTextureClass = "Uls";
      else if(silt >= 0.65 && clay < 0.12)
        soilTextureClass = "Ut2";
      else if(silt >= 0.65 && clay < 0.17)
        soilTextureClass = "Ut3";
      else if(silt < 0.15 && clay < 0.25)
        soilTextureClass = "St3";
      else if(silt < 0.30 && clay < 0.25)
        soilTextureClass = "Ls4";
      else if(silt < 0.40 && clay < 0.25)
        soilTextureClass = "Ls3";
      else if(silt < 0.50 && clay < 0.25)
        soilTextureClass = "Ls2";
      else if(silt < 0.65 && clay < 0.30)
        soilTextureClass = "Lu";
      else if(silt >= 0.65 && clay < 0.25)
        soilTextureClass = "Ut4";
      else if(silt < 0.15 && clay < 0.35)
        soilTextureClass = "Ts4";
      else if(silt < 0.30 && clay < 0.45)
        soilTextureClass = "Lts";
      else if(silt < 0.50 && clay < 0.35)
        soilTextureClass = "Lt2";
      else if(silt < 0.65 && clay < 0.45)
        soilTextureClass = "Tu3";
      else if(silt >= 0.65 && clay >= 0.25)
        soilTextureClass = "Tu4";
      else if(silt < 0.15 && clay < 0.45)
        soilTextureClass = "Ts3";
      else if(silt < 0.50 && clay < 0.45)
        soilTextureClass = "Lt3";
      else if(silt < 0.15 && clay < 0.65)
        soilTextureClass = "Ts2";
      else if(silt < 0.30 && clay < 0.65)
        soilTextureClass = "Tl";
      else if(silt >= 0.30 && clay < 0.65)
        soilTextureClass = "Tu2";
      else if(clay >= 0.65)
        soilTextureClass = "Tt";
      else soilTextureClass = "";

      return soilTextureClass;
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

// TODO: do not change JS types. Instead create own type.

Date.prototype.isValid = function () { 
  return (this.toDateString() !== 'Invalid Date'); 
};

Date.prototype.isLeapYear = function () { 
  return (ceil((new Date(this.getFullYear() + 1, 0, 1) - new Date(this.getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000)) === 366); 
};

