-- Add illustrative Miami / South Florida imagery to the demo plans.
-- These editorial photos provide visual context and are not guaranteed to depict
-- the exact venue or activity described by each plan.
update public.plans
set image_key = case id
  when '10000000-0000-4000-8000-000000000001' then 'https://images.unsplash.com/photo-1728324584417-271bdc5dde4f?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000002' then 'https://images.unsplash.com/photo-1574167630074-8221b69f8b98?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000003' then 'https://images.unsplash.com/photo-1759352642380-8340b846c45d?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000004' then 'https://images.unsplash.com/photo-1594336422995-76c2f7aff7f0?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000005' then 'https://images.unsplash.com/photo-1748380868276-6faae7e27b94?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000006' then 'https://images.unsplash.com/photo-1717537905970-f5d4ece98ef8?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000007' then 'https://images.unsplash.com/photo-1749342235844-98f55c5ed87b?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000008' then 'https://images.unsplash.com/photo-1748380868276-6faae7e27b94?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000009' then 'https://images.unsplash.com/photo-1719422244246-93f887d610fc?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000010' then 'https://images.unsplash.com/photo-1574167630074-8221b69f8b98?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000011' then 'https://images.unsplash.com/photo-1748380868276-6faae7e27b94?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000012' then 'https://images.unsplash.com/photo-1719422244246-93f887d610fc?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000013' then 'https://images.unsplash.com/photo-1594336422995-76c2f7aff7f0?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000014' then 'https://images.unsplash.com/photo-1659107732030-bcd2ad5f62fc?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000015' then 'https://images.unsplash.com/photo-1759352642380-8340b846c45d?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000016' then 'https://images.unsplash.com/photo-1719422244246-93f887d610fc?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000017' then 'https://images.unsplash.com/photo-1748380868276-6faae7e27b94?auto=format&fit=crop&w=1200&q=80'
  when '10000000-0000-4000-8000-000000000018' then 'https://images.unsplash.com/photo-1574167630074-8221b69f8b98?auto=format&fit=crop&w=1200&q=80'
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
