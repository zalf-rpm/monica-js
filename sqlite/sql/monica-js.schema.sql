CREATE TABLE capillary_rise_rate (
  id int(10) NOT NULL ,
  soil_type varchar(10) DEFAULT NULL,
  distance tinyint(4) DEFAULT NULL,
  capillary_rate double DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE crop2ods_dependent_param (
  crop_id int(11) NOT NULL,
  organ_id int(11) NOT NULL,
  dev_stage_id int(11) NOT NULL,
  ods_dependent_param_id int(11) NOT NULL,
  value double DEFAULT NULL,
  PRIMARY KEY (crop_id, organ_id, dev_stage_id, ods_dependent_param_id)
);

CREATE TABLE cutting_parts (
  crop_id tinyint(4) NOT NULL,
  organ_id tinyint(4) NOT NULL,
  is_primary tinyint(4) DEFAULT NULL,
  percentage int(11) DEFAULT NULL,
  dry_matter double DEFAULT NULL,
  PRIMARY KEY (crop_id, organ_id)
);

CREATE TABLE ods_dependent_param (
  id int(11) NOT NULL,
  name varchar(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE organic_matter_classes (
  class varchar(2) NOT NULL,
  value double NOT NULL ,
  PRIMARY KEY (class)
);

CREATE TABLE residue_table (
  ID smallint(5)  NOT NULL ,
  crop_id int(11) DEFAULT -1,
  residue_type varchar(45) DEFAULT NULL,
  dm double NOT NULL DEFAULT 1,
  nh4 double NOT NULL DEFAULT 0,
  no3 double NOT NULL DEFAULT 0.001,
  nh2 double NOT NULL DEFAULT 0,
  k_slow double NOT NULL DEFAULT 0.012,
  k_fast double NOT NULL DEFAULT 0.05,
  part_s double NOT NULL DEFAULT 0.38,
  part_f double NOT NULL DEFAULT 0.62,
  cn_s double NOT NULL DEFAULT 47.7,
  cn_f double NOT NULL DEFAULT 0,
  smb_s double NOT NULL DEFAULT 0.5,
  smb_f double NOT NULL DEFAULT 0.5,
  comment varchar(200) NOT NULL DEFAULT 'Partition and C:N ratio according to SCD data (Jensen 2005); DAISY standard rate coefficients',
  PRIMARY KEY (ID)
);

CREATE TABLE soil_aggregation_values (
  id int(11) NOT NULL ,
  soil_type varchar(10) NOT NULL,
  organic_matter double DEFAULT NULL,
  air_capacity int(11) DEFAULT NULL,
  n_field_capacity int(11) DEFAULT NULL,
  field_capacity int(11) DEFAULT NULL,
  PRIMARY KEY (id)
);
CREATE TABLE soil_characteristic_data (
  soil_type varchar(20) NOT NULL,
  soil_raw_density double NOT NULL,
  air_capacity int(11) DEFAULT NULL,
  field_capacity int(11) DEFAULT NULL,
  n_field_capacity int(11) DEFAULT NULL,
  id int(11) NOT NULL ,
  PRIMARY KEY (id)
);
CREATE TABLE yield_parts (
  crop_id int(11) NOT NULL,
  organ_id int(11) NOT NULL,
  is_primary tinyint(1) NOT NULL DEFAULT 1,
  percentage int(11) NOT NULL DEFAULT 100,
  dry_matter double NOT NULL DEFAULT 1,
  PRIMARY KEY (crop_id, organ_id)
);

CREATE INDEX ods_dependent_param_id ON ods_dependent_param (id);
CREATE INDEX crop2ods_dependent_param_crop_id ON crop2ods_dependent_param (crop_id);
CREATE INDEX crop2ods_dependent_param_organ_id ON crop2ods_dependent_param (organ_id);
CREATE INDEX crop2ods_dependent_param_dev_stage_id ON crop2ods_dependent_param (dev_stage_id);
CREATE INDEX crop2ods_dependent_param_ods_dependent_param_id ON crop2ods_dependent_param (ods_dependent_param_id);

CREATE TABLE user_parameter (
  NAME varchar(50) NOT NULL,
  MODUL varchar(20) DEFAULT (NULL),
  DESCRIPTION varchar(200) DEFAULT (NULL),
  VALUE_HERMES double DEFAULT (NULL),
  VALUE_EVA2 double DEFAULT (NULL),
  VALUE_MACSUR_SCALING double DEFAULT (NULL),
  PRIMARY KEY (NAME)
);

CREATE TABLE dev_stage (
  crop_id int(11) NOT NULL, 
  id int(11) NOT NULL, 
  name varchar(255) NOT NULL, 
  stage_temperature_sum double DEFAULT (NULL), 
  base_temperature double DEFAULT (NULL), 
  vernalisation_requirement FLOAT(11) DEFAULT (NULL), 
  day_length_requirement FLOAT(11) DEFAULT (NULL), 
  base_day_length FLOAT(11) DEFAULT (NULL), 
  drought_stress_threshold double DEFAULT (NULL), 
  critical_oxygen_content double DEFAULT (NULL), 
  specific_leaf_area double DEFAULT (NULL), 
  stage_max_root_n_content double DEFAULT (NULL), 
  stage_kc_factor double DEFAULT (NULL), 
  stage_description varchar(255) DEFAULT (NULL), 
  BBCH_start tinyint(4) DEFAULT (NULL), 
  BBCH_end tinyint(4) DEFAULT (NULL), 
  Info varchar(250) DEFAULT (NULL), 
  opt_temperature DOUBLE NOT NULL DEFAULT (30), 
  PRIMARY KEY (crop_id, id)
);
CREATE INDEX dev_stage_crop_id ON dev_stage (crop_id);
CREATE INDEX dev_stage_id ON dev_stage (id);

CREATE TABLE mineral_fertilisers (
  ID smallint(5) NOT NULL,
  type varchar(5) NOT NULL UNIQUE,
  name varchar(80) DEFAULT NULL,
  no3 double DEFAULT NULL,
  nh4 double DEFAULT NULL,
  carbamid double DEFAULT NULL,
  eom_DMNr smallint(5) NOT NULL,
  PRIMARY KEY (ID)
);

CREATE TABLE organic_fertiliser (
  ID smallint(5) NOT NULL,
  type char(5) NOT NULL UNIQUE,
  om_type varchar(60) DEFAULT NULL,
  dm double DEFAULT NULL,
  nh4_n double DEFAULT NULL,
  no3_n double DEFAULT NULL,
  nh2_n double DEFAULT NULL,
  k_slow double DEFAULT NULL,
  k_fast double DEFAULT NULL,
  part_s double DEFAULT NULL,
  part_f double DEFAULT NULL,
  cn_s double DEFAULT NULL,
  cn_f double DEFAULT NULL,
  smb_s double DEFAULT NULL,
  smb_f double DEFAULT NULL,
  PRIMARY KEY (ID)
);

CREATE TABLE crop (
  id int(11) NOT NULL, 
  name varchar(255) NOT NULL, 
  gen_type varchar(255) NOT NULL DEFAULT (''), 
  perennial BOOL(1) DEFAULT (0), 
  permanent_crop_id INT(11) DEFAULT (NULL), 
  max_assimilation_rate double DEFAULT (NULL), 
  carboxylation_pathway int(11) DEFAULT (NULL), 
  minimum_temperature_for_assimilation double DEFAULT (NULL), 
  crop_specific_max_rooting_depth double DEFAULT (NULL), 
  min_n_content double DEFAULT (NULL), 
  n_content_pn double DEFAULT (NULL), 
  n_content_b0 double DEFAULT (NULL), 
  n_content_above_ground_biomass double DEFAULT (NULL), 
  n_content_root double DEFAULT (NULL), 
  initial_kc_factor double DEFAULT (NULL), 
  development_acceleration_by_nitrogen_stress tinyint(1) DEFAULT (NULL), 
  fixing_n DOUBLE(1) DEFAULT (NULL), 
  luxury_n_coeff double DEFAULT (NULL), 
  max_crop_height double DEFAULT (NULL), 
  residue_n_ratio double DEFAULT (NULL), 
  sampling_depth double DEFAULT (NULL), 
  target_n_sampling_depth double DEFAULT (NULL), 
  target_n30 double DEFAULT (NULL), 
  DEFAULT_radiation_use_efficiency double DEFAULT (NULL), 
  crop_height_P1 double DEFAULT (NULL), 
  crop_height_P2 double DEFAULT (NULL), 
  stage_at_max_height int(11) DEFAULT (NULL), 
  max_stem_diameter double DEFAULT (NULL), 
  stage_at_max_diameter double DEFAULT (NULL), 
  heat_sum_irrigation_start double DEFAULT (NULL), 
  heat_sum_irrigation_end double DEFAULT (NULL), 
  max_N_uptake_p double DEFAULT (NULL), 
  root_distribution_p double DEFAULT (NULL), 
  plant_density double DEFAULT (NULL), 
  root_growth_lag double DEFAULT (NULL), 
  min_temperature_root_growth double DEFAULT (NULL), 
  initial_rooting_depth double DEFAULT (NULL), 
  root_penetration_rate double DEFAULT (NULL), 
  root_form_factor double DEFAULT (NULL), 
  specific_root_length double DEFAULT (NULL), 
  stage_after_cut tinyint(4) DEFAULT ('0'), 
  crit_temperature_heat_stress double DEFAULT (NULL), 
  lim_temperature_heat_stress double DEFAULT (NULL), 
  begin_sensitive_phase_heat_stress double DEFAULT (NULL), 
  end_sensitive_phase_heat_stress double DEFAULT (NULL), 
  drought_impact_on_fertility_factor DOUBLE NOT NULL DEFAULT (0), 
  cutting_delay_days INTEGER DEFAULT (0), 
  field_condition_modifier FLOAT DEFAULT (1), 
  assimilate_reallocation DOUBLE DEFAULT (0),
  PRIMARY KEY (id)
);

CREATE TABLE organ (
  crop_id int(11) NOT NULL, 
  id int(11) NOT NULL, 
  name varchar(255) DEFAULT (NULL), 
  initial_organ_biomass double DEFAULT (NULL), 
  organ_maintainance_respiration double DEFAULT (NULL), 
  is_above_ground tinyint(1) DEFAULT (NULL), 
  organ_growth_respiration double DEFAULT (NULL), 
  is_storage_organ tinyint(1) DEFAULT (NULL), 
  is_perennial TINYINT(1) DEFAULT (NULL), 
  PRIMARY KEY (crop_id, id)
);

CREATE INDEX organ_crop_id ON organ (crop_id);
CREATE INDEX organ_id ON organ (id);

CREATE VIEW view_texture_class AS 
SELECT DISTINCT soil_type 
FROM soil_characteristic_data 
ORDER BY soil_type ASC;
