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
    return "amount: " + this.amount + " treshold: " + this.treshold + " " + this.prototype.toString();
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
    s  + "pc_InitialOrganBiomass:" + endl;
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
  this._vs_SoilRawDensity = 0;
  this._vs_SoilOrganicCarbon = -1;
  this._vs_SoilOrganicMatter = -1;
  this.vs_SoilAmmonium = -1;
  this.vs_SoilNitrate = -1;
  // TODO: neuer Parameter g cm-3
  this._vs_BulkDensity = -1;

  this.isValid = function () {

    var is_valid = true;

    if (this.vs_FieldCapacity <= 0) {
        console.log("SoilParameters::Error: No field capacity defined in database for " + this.vs_SoilTexture + " , RawDensity: "+ this._vs_SoilRawDensity);
        is_valid = false;
    }
    if (this.vs_Saturation <= 0) {
        console.log("SoilParameters::Error: No saturation defined in database for " + this.vs_SoilTexture + " , RawDensity: " + this._vs_SoilRawDensity);
        is_valid = false;
    }
    if (this.vs_PermanentWiltingPoint <= 0) {
        console.log("SoilParameters::Error: No saturation defined in database for " + this.vs_SoilTexture + " , RawDensity: " + this._vs_SoilRawDensity);
        is_valid = false;
    }

    if (this.vs_SoilSandContent<0) {
        console.log("SoilParameters::Error: Invalid soil sand content: "+ this.vs_SoilSandContent);
        is_valid = false;
    }

    if (this.vs_SoilClayContent<0) {
        console.log("SoilParameters::Error: Invalid soil clay content: "+ this.vs_SoilClayContent);
        is_valid = false;
    }

    if (this.vs_SoilpH<0) {
        console.log("SoilParameters::Error: Invalid soil ph value: "+ this.vs_SoilpH);
        is_valid = false;
    }

    if (this.vs_SoilStoneContent<0) {
        console.log("SoilParameters::Error: Invalid soil stone content: "+ this.vs_SoilStoneContent);
        is_valid = false;
    }

    if (this.vs_Saturation<0) {
        console.log("SoilParameters::Error: Invalid value for saturation: "+ this.vs_Saturation);
        is_valid = false;
    }

    if (this.vs_PermanentWiltingPoint<0) {
        console.log("SoilParameters::Error: Invalid value for permanent wilting point: "+ this.vs_PermanentWiltingPoint);
        is_valid = false;
    }

    if (this._vs_SoilRawDensity<0) {
        console.log("SoilParameters::Error: Invalid soil raw density: "+ this._vs_SoilRawDensity);
        is_valid = false;
    }

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
    if (this._vs_BulkDensity <= 0)
      return (this._vs_SoilRawDensity + (0.009 * 100 * this.vs_SoilClayContent)) * 1000;
    else
      return this._vs_BulkDensity * 1000;
  };

  /**
   * @brief Setter for soil bulk density.
   * @param soilBulkDensity [g cm-3]
   */
  this.set_vs_SoilBulkDensity = function (soilBulkDensity) {
    this._vs_BulkDensity = soilBulkDensity;
  };

  /**
   * @brief Returns lambda from soil texture
   *
   * @param lambda
   *
   * @return
   */
  this.texture2lambda = function (sand, clay) {
    return conversion.texture2lambda(sand, clay);
  };

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
      console.log("Error. No capillary rise rates in data structure available.");

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
