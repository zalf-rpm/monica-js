Check/Fix:
  - PASW should not be negative (just an output?)
  - dif. in rmout (JS vs C++): params related to groundwaterdepth
  - init C&N related parameters (CN, COrg) from json per soil layer
  - fix org. fertilizer amout unit and N-concentration. 

Refactor
 - SoilTexture vs. SoilTextureClass vs. Soiltype: e.g. use texture for fractions and TextureClass for names.

Questions
 - crop2ods_dependent_param: What is it?
