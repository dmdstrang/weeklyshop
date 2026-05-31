-- Update all meals to serve 3 as standard
update meal_library set serves = 3;

-- Also fix the default for future inserts
alter table meal_library alter column serves set default 3;
