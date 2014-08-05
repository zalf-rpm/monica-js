Check/Fix:
  - PASW should not be negative (just an output?)
  - SoilTemperatur at layer x > 0 if FrostDepth >= x ? 
  - meta.site.horizons[].Corg min, max > 1 ?

Refactor
 - SoilTexture vs. SoilTextureClass vs. Soiltype: e.g. use texture for fractions and TextureClass for names.

Questions
 - crop2ods_dependent_param: What is it?
