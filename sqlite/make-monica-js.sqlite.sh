#!/bin/bash
#set -x

# tables we need in monica-js
TABLES=(
crop
dev_stage
yield_parts
cutting_parts
organ
crop2ods_dependent_param
ods_dependent_param
residue_table 
capillary_rise_rate 
soil_aggregation_values 
soil_characteristic_data
mineral_fertilisers 
organic_fertiliser
organic_matter_classes
user_parameter
)

# dump everything
sqlite3 monica.sqlite .dump > sql/monica.sql

# create inserts for each table
for TABLE in ${TABLES[*]}
do
  rm -f sql/temp.sql
  echo .mode insert $TABLE > sql/temp.sql
  echo .output sql/$TABLE.sql >> sql/temp.sql
  echo .echo ON >> sql/temp.sql
  echo "PRAGMA foreign_keys=1;" >> sql/temp.sql
  echo "BEGIN;" >> sql/temp.sql
  echo .echo OFF >> sql/temp.sql
  echo "SELECT * FROM" $TABLE";" >> sql/temp.sql
  echo .echo ON >> sql/temp.sql
  echo "COMMIT;" >> sql/temp.sql
  echo .echo OFF >> sql/temp.sql
  sqlite3 monica.sqlite < sql/temp.sql
done
rm -f sql/temp.sql

# create new db with monica-js schema
rm -f monica-js.sqlite
sqlite3 monica-js.sqlite < sql/monica-js.schema.sql

# insert data from monica.sqlite into new monica-js.sqlite
for TABLE in ${TABLES[*]}
do
  sqlite3 monica-js.sqlite < sql/$TABLE.sql
done

# dump everything
sqlite3 monica-js.sqlite .dump > sql/monica-js.sql
