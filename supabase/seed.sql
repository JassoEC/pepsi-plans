-- Small local catalog for development and UI integration.
insert into public.plans (
  id, title, category, neighborhood, budget_label, short_insight, description, vibe_tags
) values
  ('10000000-0000-4000-8000-000000000001', 'Sunset picnic at South Pointe Park', 'outdoors', 'South Beach', '$', 'Golden-hour views by the water', 'Pick up snacks and enjoy the sunset with a view of the ocean and cruise channel.', array['chill', 'outdoors', 'low-key']),
  ('10000000-0000-4000-8000-000000000002', 'Little Havana food crawl', 'food', 'Little Havana', '$$', 'A casual walk with plenty to taste', 'Explore Cuban coffee, small bites and the lively streets around Calle Ocho.', array['foodie', 'culture', 'social']),
  ('10000000-0000-4000-8000-000000000003', 'Wynwood murals and coffee', 'culture', 'Wynwood', '$$', 'Art, photos and a relaxed cafe stop', 'Walk through the mural district and choose a nearby coffee shop for a break.', array['creative', 'chill', 'culture']),
  ('10000000-0000-4000-8000-000000000004', 'Kayaking in Oleta River State Park', 'outdoors', 'North Miami', '$', 'Get outside and explore the mangroves', 'Rent kayaks and paddle through calm waterways surrounded by mangroves.', array['adventurous', 'outdoors', 'active']),
  ('10000000-0000-4000-8000-000000000005', 'Arcade night with the group', 'entertainment', 'Downtown Miami', '$$', 'A little friendly competition', 'Meet for arcade games, shared snacks and a few rounds of group challenges.', array['playful', 'social', 'night-out']),
  ('10000000-0000-4000-8000-000000000006', 'Beach volleyball at Lummus Park', 'outdoors', 'South Beach', '$', 'Move around and meet by the beach', 'Bring a ball or find an open court for a casual game near the sand.', array['active', 'outdoors', 'social']),
  ('10000000-0000-4000-8000-000000000007', 'Live music in the Design District', 'nightlife', 'Design District', '$$', 'Discover a new sound together', 'Find a live music event and make an evening of exploring the neighborhood.', array['night-out', 'music', 'social']),
  ('10000000-0000-4000-8000-000000000008', 'Board games and bites', 'food', 'Brickell', '$$', 'Easygoing plans for a close-knit group', 'Choose a board game cafe or casual spot and settle in for a few rounds.', array['chill', 'playful', 'foodie'])
on conflict (id) do nothing;
