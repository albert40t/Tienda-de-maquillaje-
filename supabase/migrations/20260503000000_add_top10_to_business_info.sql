-- Add top10 column to business_info table
alter table business_info add column if not exists top10 text[] default '{}';
