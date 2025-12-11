-- Remove internal_code column from product_catalog table
ALTER TABLE product_catalog DROP COLUMN IF EXISTS internal_code;
