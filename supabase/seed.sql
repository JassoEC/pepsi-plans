-- Initial Vibe catalog for local development.
insert into public.vibes (id, name, slug, description, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 'Pepsi Original', 'pepsi-original', 'Classic, iconic and culturally recognizable experiences.', 1),
  ('20000000-0000-4000-8000-000000000002', 'Pepsi Zero Sugar', 'pepsi-zero-sugar', 'Active, daytime and exploratory experiences.', 2),
  ('20000000-0000-4000-8000-000000000003', 'Pepsi Wild Cherry', 'pepsi-wild-cherry', 'Expressive, social and unexpected experiences.', 3)
on conflict (id) do nothing;

-- Local catalog with enough plans to exercise server-side pagination.
-- Each plan belongs to exactly one Vibe in the current MVP.
insert into public.plans (
  id, vibe_id, title, category, neighborhood, budget_label, short_insight, description
) values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Sunset picnic at South Pointe Park', 'outdoors', 'South Beach', '$', 'Golden-hour views by the water', 'Pick up snacks and enjoy the sunset with a view of the ocean and cruise channel.'),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Little Havana food crawl', 'food', 'Little Havana', '$$', 'A casual walk with plenty to taste', 'Explore Cuban coffee, small bites and the lively streets around Calle Ocho.'),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Wynwood murals and coffee', 'culture', 'Wynwood', '$$', 'Art, photos and a relaxed cafe stop', 'Walk through the mural district and choose a nearby coffee shop for a break.'),
  ('10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Kayaking in Oleta River State Park', 'outdoors', 'North Miami', '$', 'Get outside and explore the mangroves', 'Rent kayaks and paddle through calm waterways surrounded by mangroves.'),
  ('10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'Arcade night with the group', 'entertainment', 'Downtown Miami', '$$', 'A little friendly competition', 'Meet for arcade games, shared snacks and a few rounds of group challenges.'),
  ('10000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'Beach volleyball at Lummus Park', 'outdoors', 'South Beach', '$', 'Move around and meet by the beach', 'Bring a ball or find an open court for a casual game near the sand.'),
  ('10000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000003', 'Live music in the Design District', 'nightlife', 'Design District', '$$', 'Discover a new sound together', 'Find a live music event and make an evening of exploring the neighborhood.'),
  ('10000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', 'Board games and bites', 'food', 'Brickell', '$$', 'Easygoing plans for a close-knit group', 'Choose a board game cafe or casual spot and settle in for a few rounds.'),
  ('10000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001', 'Outdoor movie night at SoundScape Park', 'entertainment', 'Miami Beach', '$', 'A relaxed movie night under the stars', 'Bring a blanket and enjoy an outdoor film screening together.'),
  ('10000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001', 'Cuban coffee and dominoes', 'culture', 'Little Havana', '$', 'A classic neighborhood hangout', 'Meet for Cuban coffee and a friendly game of dominoes.'),
  ('10000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000001', 'Dinner by the Miami River', 'food', 'Downtown Miami', '$$', 'Good food with a waterfront backdrop', 'Pick a casual riverside restaurant and catch up over dinner.'),
  ('10000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'Bike ride along the Venetian Causeway', 'outdoors', 'Miami Beach', '$', 'Take in the bay at your own pace', 'Rent bikes and ride across the causeway for open-water views.'),
  ('10000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000002', 'Explore the trails at Matheson Hammock', 'outdoors', 'Coral Gables', '$', 'A nature break close to the city', 'Walk the waterfront trails and explore the tropical landscape.'),
  ('10000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000002', 'Paddleboard on Biscayne Bay', 'outdoors', 'Key Biscayne', '$$', 'Get moving out on the water', 'Try a beginner-friendly paddleboarding session on the bay.'),
  ('10000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000002', 'Street art photo challenge', 'culture', 'Wynwood', '$', 'Turn a neighborhood walk into a game', 'Explore murals in small teams and see who captures the best photos.'),
  ('10000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000003', 'Karaoke night with friends', 'nightlife', 'Brickell', '$$', 'Pick the songs everyone knows', 'Find a karaoke spot and take turns choosing the next group anthem.'),
  ('10000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000003', 'Late-night dessert crawl', 'food', 'South Beach', '$$', 'Make dessert the main event', 'Visit a couple of dessert spots and share something sweet at each stop.'),
  ('10000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000003', 'Sunset salsa social', 'nightlife', 'Little Havana', '$', 'Music and movement after golden hour', 'Find an open salsa social and enjoy the music together.')
on conflict (id) do nothing;


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
