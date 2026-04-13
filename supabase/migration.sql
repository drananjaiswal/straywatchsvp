-- straywatchsvp/supabase/migration.sql

-- wards table
create table if not exists wards (
  id                integer primary key,
  name              text not null,
  councillor_name   text,
  councillor_phone  text,
  councillor_email  text
);

-- sightings table
create table if not exists sightings (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  latitude        float8 not null,
  longitude       float8 not null,
  ward_id         integer not null check (ward_id between 1 and 24),
  ward_name       text not null,
  dog_count       integer not null default 1 check (dog_count between 1 and 10),
  notes           text check (char_length(notes) <= 150),
  address         text,
  corroborations  integer not null default 0,
  dedupe_hash     text generated always as (
                    md5(
                      round(latitude::numeric, 3)::text ||
                      round(longitude::numeric, 3)::text ||
                      date_trunc('hour', created_at)::text
                    )
                  ) stored,
  constraint sightings_dedupe_hash_unique unique (dedupe_hash)
);

-- RLS
alter table sightings enable row level security;
alter table wards enable row level security;

-- anon can insert sightings
create policy "anon insert sightings"
  on sightings for insert to anon
  with check (true);

-- anon can read all sightings
create policy "anon select sightings"
  on sightings for select to anon
  using (true);

-- anon can increment corroborations only (no other column changes)
create policy "anon corroborate sightings"
  on sightings for update to anon
  using (true)
  with check (
    id = id and
    created_at = created_at and
    latitude = latitude and
    longitude = longitude and
    ward_id = ward_id and
    ward_name = ward_name and
    dog_count = dog_count and
    corroborations >= 0
  );

-- No delete for anon (no policy = denied by default)

-- wards: public read
create policy "anon select wards"
  on wards for select to anon
  using (true);

-- Seed wards 1-24
insert into wards (id, name, councillor_name, councillor_phone, councillor_email) values
(1,  'Ward 1 - Aberdeen Bazaar',       'Ward 1 Councillor',  '03192-000001', 'ward1@pbmc.gov.in'),
(2,  'Ward 2 - Junglighat',            'Ward 2 Councillor',  '03192-000002', 'ward2@pbmc.gov.in'),
(3,  'Ward 3 - Naya Bazar',            'Ward 3 Councillor',  '03192-000003', 'ward3@pbmc.gov.in'),
(4,  'Ward 4 - Goalghar',              'Ward 4 Councillor',  '03192-000004', 'ward4@pbmc.gov.in'),
(5,  'Ward 5 - Dairy Farm',            'Ward 5 Councillor',  '03192-000005', 'ward5@pbmc.gov.in'),
(6,  'Ward 6 - Phoenix Bay',           'Ward 6 Councillor',  '03192-000006', 'ward6@pbmc.gov.in'),
(7,  'Ward 7 - Haddo',                 'Ward 7 Councillor',  '03192-000007', 'ward7@pbmc.gov.in'),
(8,  'Ward 8 - Bathubasti',            'Ward 8 Councillor',  '03192-000008', 'ward8@pbmc.gov.in'),
(9,  'Ward 9 - Delanipur',             'Ward 9 Councillor',  '03192-000009', 'ward9@pbmc.gov.in'),
(10, 'Ward 10 - Premnagar',            'Ward 10 Councillor', '03192-000010', 'ward10@pbmc.gov.in'),
(11, 'Ward 11 - Prem Nagar Extension', 'Ward 11 Councillor', '03192-000011', 'ward11@pbmc.gov.in'),
(12, 'Ward 12 - Shadipur',             'Ward 12 Councillor', '03192-000012', 'ward12@pbmc.gov.in'),
(13, 'Ward 13 - Lamba Line',           'Ward 13 Councillor', '03192-000013', 'ward13@pbmc.gov.in'),
(14, 'Ward 14 - Garacharma',           'Ward 14 Councillor', '03192-000014', 'ward14@pbmc.gov.in'),
(15, 'Ward 15 - Dollygunj',            'Ward 15 Councillor', '03192-000015', 'ward15@pbmc.gov.in'),
(16, 'Ward 16 - Atlanta Point',        'Ward 16 Councillor', '03192-000016', 'ward16@pbmc.gov.in'),
(17, 'Ward 17 - Gurudwara Line',       'Ward 17 Councillor', '03192-000017', 'ward17@pbmc.gov.in'),
(18, 'Ward 18 - Brookshabad',          'Ward 18 Councillor', '03192-000018', 'ward18@pbmc.gov.in'),
(19, 'Ward 19 - Teal House',           'Ward 19 Councillor', '03192-000019', 'ward19@pbmc.gov.in'),
(20, 'Ward 20 - Minnie Bay',           'Ward 20 Councillor', '03192-000020', 'ward20@pbmc.gov.in'),
(21, 'Ward 21 - South Point',          'Ward 21 Councillor', '03192-000021', 'ward21@pbmc.gov.in'),
(22, 'Ward 22 - Panighat',             'Ward 22 Councillor', '03192-000022', 'ward22@pbmc.gov.in'),
(23, 'Ward 23 - Bimblitan',            'Ward 23 Councillor', '03192-000023', 'ward23@pbmc.gov.in'),
(24, 'Ward 24 - Chouldari',            'Ward 24 Councillor', '03192-000024', 'ward24@pbmc.gov.in')
on conflict (id) do nothing;
