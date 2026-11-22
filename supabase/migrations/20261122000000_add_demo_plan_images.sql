-- Editorial demo imagery for the Miami plans catalog.
-- These are illustrative Miami/South Florida lifestyle photos, not exact venue photos.
update public.plans
set image_key = case id
  when '10000000-0000-4000-8000-000000000001' then 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000002' then 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000003' then 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000004' then 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000005' then 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000006' then 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000007' then 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000008' then 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000009' then 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000010' then 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000011' then 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000012' then 'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000013' then 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000014' then 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000015' then 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000016' then 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000017' then 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&auto=format&fit=crop&q=80'
  when '10000000-0000-4000-8000-000000000018' then 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
  else image_key
end
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-000000000009',
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000011',
  '10000000-0000-4000-8000-000000000012',
  '10000000-0000-4000-8000-000000000013',
  '10000000-0000-4000-8000-000000000014',
  '10000000-0000-4000-8000-000000000015',
  '10000000-0000-4000-8000-000000000016',
  '10000000-0000-4000-8000-000000000017',
  '10000000-0000-4000-8000-000000000018'
);
