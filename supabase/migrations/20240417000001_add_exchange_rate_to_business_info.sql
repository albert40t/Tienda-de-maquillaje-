-- Add exchange_rate column to business_info table
alter table business_info add column if not exists exchange_rate numeric default 38.50;

-- Update the initial record with preferred default if needed
update business_info set exchange_rate = 38.50 where id = 1;
