-- Initial Vibe catalog for local development.
insert into public.vibes (id, name, slug, description, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 'Pepsi Original', 'pepsi-original', 'Classic, iconic and culturally recognizable experiences.', 1),
  ('20000000-0000-4000-8000-000000000002', 'Pepsi Zero Sugar', 'pepsi-zero-sugar', 'Active, daytime and exploratory experiences.', 2),
  ('20000000-0000-4000-8000-000000000003', 'Pepsi Wild Cherry', 'pepsi-wild-cherry', 'Expressive, social and unexpected experiences.', 3)
on conflict (id) do nothing;

-- Small local catalog for development and UI integration.
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
  ('10000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', 'Board games and bites', 'food', 'Brickell', '$$', 'Easygoing plans for a close-knit group', 'Choose a board game cafe or casual spot and settle in for a few rounds.')
on conflict (id) do nothing;
