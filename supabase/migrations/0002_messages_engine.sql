-- Which engine wrote each message: 'claude', or 'site' for the quick answers. Paste into the Supabase SQL editor and run it once.
-- Databases set up from the first version of 0001 have no messages.engine, and every log insert fails with
-- "column messages.engine does not exist". Safe to run on a database that already has the column.

alter table messages add column if not exists engine text check (engine in ('claude', 'site'));
