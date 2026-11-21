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

-- Editorial imagery for the demo catalog.
-- Photos are illustrative Miami / South Florida context, not venue-specific guarantees.
-- Source: Unsplash (free under the Unsplash License).
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
where id between '10000000-0000-4000-8000-000000000001' and '10000000-0000-4000-8000-000000000018';
