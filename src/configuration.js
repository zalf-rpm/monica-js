
var Configuration = function (outPath, climate, doDebug) {

  DEBUG = (doDebug === true) ? true : false;

  /* no output if null */ 
  var _outPath = outPath; 

  var run = function run(simObj, siteObj, cropObj) {
    
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

    console.log("fetched sim data");
    
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

    console.log("fetched site data");

    /* soil */
    var lThicknessCm = 100.0 * cpp.userEnvironmentParameters.p_LayerThickness;
    var maxDepthCm =  200.0;
    var maxNoOfLayers = int(maxDepthCm / lThicknessCm);

    var layers = [];
    if (!createLayers(layers, horizonsArr, lThicknessCm, maxNoOfLayers)) {
      console.log("Error fetching soil data");
      return;
    }
    
    console.log("fetched soil data");

    /* weather */
    var da = new DataAccessor(new Date(startYear, 0, 1), new Date(endYear, 11, 31));
    if (!createClimate(da, cpp, sp.vs_Latitude)) {
      console.log("Error fetching climate data");
      return;
    }
    
    console.log("fetched climate data");

    /* crops */
    var pps = [];
    if (!createProcesses(pps, cropsArr)) {
      console.log("Error fetching crop data");
      return;
    }
    
    console.log("fetched crop data");

    var env = new Environment(layers, cpp);
    env.general = gp;
    env.pathToOutputDir = _outPath;
    // env.setMode(1); // JS! not implemented
    env.site = sp;
    env.da = da;
    env.cropRotation = pps;
   
    // TODO: implement and test useAutomaticIrrigation & useNMinFertiliser
    // if (hermes_config->useAutomaticIrrigation()) {
    //   env.useAutomaticIrrigation = true;
    //   env.autoIrrigationParams = hermes_config->getAutomaticIrrigationParameters();
    // }

    // if (hermes_config->useNMinFertiliser()) {
    //   env.useNMinMineralFertilisingMethod = true;
    //   env.nMinUserParams = hermes_config->getNMinUserParameters();
    //   env.nMinFertiliserPartition = getMineralFertiliserParametersFromMonicaDB(hermes_config->getMineralFertiliserID());
    // }

    console.log("run monica");

    return runMonica(env, setProgress);
  };


  var createLayers = function createLayers(layers, horizonsArr, lThicknessCm, maxNoOfLayers) {

    var ok = true;
    var hs = horizonsArr.length;
    
    console.log("fetching " + hs + " horizons");

    for (var h = 0; h < hs; ++h ) {
      
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

        var layer = new SoilParameters();
        layer.set_vs_SoilOrganicCarbon(horizonObj.Corg); //TODO: / 100 ?
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
          console.log("Error in soil parameters.");
        }

        layers.push(layer);
        console.log("fetched layer " + layers.length + " in horizon " + h);

      }

      console.log("fetched horizon " + h);
    }  

    return ok;
  };

  function createProcesses(pps, cropsArr) {
    
    var ok = true;
    var cs = cropsArr.length;
    
    console.log("fetching " + cs + " crops");

    for (var c = 0; c < cs; c++) {

      var cropObj = cropsArr[c];
      var cropId = -1;

      var nameAndGenType = cropObj.nameAndGenType;

      var res = db.exec(
       "SELECT crop_id \
        FROM view_crop \
        WHERE name_and_gentype='" + nameAndGenType + "'"
      );

      if (res[0].values.length != 1)
        throw 'crop (' + nameAndGenType + ') not available in table crop';  

      var columns = res[0].columns;
      var row = res[0].values[0]; /* only one row */   

      cropId = row[columns.indexOf('crop_id')];

      if (cropId < 0 || isNaN(cropId)) {
        ok = false;
        console.log("Invalid crop id: " + nameAndGenType);
      }

      var sd = new Date(Date.parse(cropObj.sowingDate));
      var hd = new Date(Date.parse(cropObj.finalHarvestDate));

      debug(nameAndGenType, 'nameAndGenType');
      debug(sd, 'sd');
      debug(hd, 'hd');

      if (!sd.isValid() || !hd.isValid()) {
        ok = false;
        console.log("Invalid sowing or harvest date");
      }

      var crop = new Crop(cropId, nameAndGenType /*TODO: hermesCropId?*/);
      crop.setSeedAndHarvestDate(sd, hd);
      crop.setCropParameters(getCropParameters(crop.id()));
      crop.setResidueParameters(getResidueParameters(crop.id()));

      pps[c] = new ProductionProcess(nameAndGenType, crop);

      /* tillage */
      var tillArr = cropObj.tillageOperations;
      if (tillArr) { /* in case no tillage has been added */
        if (!addTillageOperations(pps[c], tillArr)) {
          ok = false;
          console.log("Error adding tillages");
        }
      }

      /* mineral fertilizer */
      var minFertArr = cropObj.mineralFertilisers;
      if (minFertArr) { /* in case no min fertilizer has been added */
        if (!addFertilizers(pps[c], minFertArr, false)) {
          ok = false;
          console.log("Error adding mineral fertilisers");
        }
      }

      /* organic fertilizer */ 
      var orgFertArr = cropObj.organicFertilisers;
      if (orgFertArr) { /* in case no org fertilizer has been added */ 
        if (!addFertilizers(pps[c], orgFertArr, true)) {
          ok = false;
          console.log("Error adding organic fertilisers");
        }
      }

      /* irrigations */
      var irriArr = cropObj.irrigations;
      if (irriArr) {  /* in case no irrigation has been added */
        if (!addIrrigations(pps[c], irriArr)) {
          ok = false;
          console.log("Error adding irrigations");
        }
      }

      /* cutting */
      var cutArr = cropObj.cuttings;
      if (cutArr) { /* in case no tillage has been added */
        if (!addCuttings(pps[c], cutArr)) {
          ok = false;
          console.log("Error adding cuttings");
        }
      }

      console.log("fetched crop " + c + ", nameAndGenType: " + nameAndGenType + ", id: " + cropId);
    }

    return ok;
  };

  function addTillageOperations(pp, tillArr) {

    var ok = true;
    var ts = tillArr.length;

    console.log("fetching " + ts + " tillages");

    for (var t = 0; t < ts; ++t) {

      var tillObj = tillArr[t];

      /* ignore if any value is null */
      if (tillObj.date === null || tillObj.depth === null || tillObj.method === null) {
        console.log("tillage parameters null: tillage ignored");
        continue;
      }

      var tDate = new Date(Date.parse(tillObj.date));
      var depth = tillObj.depth / 100; // cm to m
      var method = tillObj.method;

      if (!tDate.isValid()) {
        ok = false;
        console.log("Invalid tillage date " + method);
      }

      pp.addApplication(new TillageApplication(tDate, depth));
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
      debug() << "Error - Invalid date in \"" << pathToFile << "\"" << endl;
      debug() << "Line: " << s << endl;
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

      //cout << "new PP start: " << it->start().toString()
      //<< " new PP end: " << it->end().toString() << endl;
      //cout << "new currentEnd: " << currentEnd.toString() << endl;
    }
    */
    var ok = true;
    var fs = fertArr.length;

    console.log("fetching " + fs + " fertilizers");

    for (var f = 0; f < fs; ++f) {
      
      var fertObj = fertArr[f];

      /* ignore if any value is null */
      if (fertObj.date === null || fertObj.method === null || fertObj.type === null || fertObj.amount === null) {
        console.log("fertiliser parameters null: fertiliser ignored");
        continue;
      }

      var fDate = new Date(Date.parse(fertObj.date));
      var method = fertObj.method;
      var type = fertObj.type;
      var amount = fertObj.amount;

      if (!fDate.isValid()) {
        ok = false;
        console.log("Invalid fertilization date " + type + ", " + method);
      }

      if (isOrganic)  {

        var orgId = -1;

        var res = db.exec(
         "SELECT id \
          FROM organic_fertiliser \
          WHERE om_type='" + type + "'"
        );

        var columns = res[0].columns;
        var row = res[0].values[0]; /* only one row */   

        orgId = row[0]; 
    
        if (orgId < 0) {
          console.log("Error: " + type + " not found.");
          ok = false;
        }

        pp.addApplication(new OrganicFertiliserApplication(fDate, getOrganicFertiliserParameters(orgId), amount, true));
      
      } else { // not organic

        var minId = -1;

        var res = db.exec(
         "SELECT id \
          FROM mineral_fertilisers \
          WHERE name='" + type + "'"
        );

        var columns = res[0].columns;
        var row = res[0].values[0]; /* only one row */   

        minId = row[0];
        
        if (minId < 0) {
          console.log("Error: " + type + " not found.");
          ok = false;
        }
        
        pp.addApplication(new MineralFertiliserApplication(fDate, getMineralFertiliserParameters(minId), amount));
      
      }

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
      debug() << "Error - Invalid date in \"" << pathToFile << "\"" << endl;
      debug() << "Line: " << s << endl;
      debug() << "Aborting simulation now!" << endl;
      exit(-1);
    }

    //cout << "PP start: " << it->start().toString()
    //<< " PP end: " << it->end().toString() << endl;
    //cout << "irrigationDate: " << idate.toString()
    //<< " currentEnd: " << currentEnd.toString() << endl;

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

      //cout << "new PP start: " << it->start().toString()
      //<< " new PP end: " << it->end().toString() << endl;
      //cout << "new currentEnd: " << currentEnd.toString() << endl;
    }*/

    var is = irriArr.length;
    
    console.log("fetching " + is + " irrigations");

    for (var i = 0; i < is; ++i) {
      
      var irriObj = irriArr[i];

      /* ignore if any value is null */
      if (irriObj.date === null || irriObj.method  === null || irriObj.eventType  === null || irriObj.threshold  === null
          || irriObj.amount === null || irriObj.NConc === null) {
        console.log("irrigation parameters null: irrigation ignored");
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
        console.log("Invalid irrigation date " + method + ", " + eventType);
      }

      pp.addApplication(new IrrigationApplication(iDate, amount, new IrrigationParameters(NConc, 0.0)));
    }

    return ok;
  };

  /*
    JV: test new function
  */

  function addCuttings(pp, cutArr) {

    var ok = true;
    var cs = cutArr.length;

    console.log("fetching " + cs + " cuttings");

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
    // var idx_t_min = data.met.columns.indexOf("t_min");
    // var idx_t_max = data.met.columns.indexOf("t_max");
    // var idx_t_s10 = data.met.columns.indexOf("t_s10");
    // var idx_t_s20 = data.met.columns.indexOf("t_s20");
    // var idx_vappd = data.met.columns.indexOf("vappd");
    // var idx_wind = data.met.columns.indexOf("wind");
    // var idx_sundu = data.met.columns.indexOf("sundu");
    // var idx_radia = data.met.columns.indexOf("radia");
    // var idx_prec = data.met.columns.indexOf("prec");
    // var idx_day = data.met.columns.indexOf("day");
    // var idx_year = data.met.columns.indexOf("year");
    // var idx_rf = data.met.columns.indexOf("rf");

    // for (var y = da.startDate().getFullYear(), ys = da.endDate().getFullYear(); y <= ys; y++) {

    //   var daysCount = 0;
    //   var allowedDays = ceil((new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / (24 * 60 * 60 * 1000));

    //   console.log("allowedDays: " + allowedDays + " " + y+ "\t" + useLeapYears + "\tlatitude:\t" + latitude);

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
    //       // debug() << "Invalid globrad - use sunhours instead" << endl;
    //       globrad.push(Tools.sunshine2globalRadiation(r + 1, sunhours, latitude, true));    
    //       sunhours.push(row[idx_sundu]);
    //     } else {
    //       // error case
    //       console.log("Error: No global radiation or sunhours specified for day " + date);
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

  var setProgress = function (progress) {
  
    if (ENVIRONMENT_IS_WORKER)
      postMessage({ progress: progress });
    else
      console.log(progress);
  
  };  

  return {
    run: run 
  };


};
