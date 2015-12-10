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
    , _nMinFertiliserPartition
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
