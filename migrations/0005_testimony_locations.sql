-- Where each person first published, from the request's approximate (IP-based) location, for the world map.
-- Coordinates are rounded to one decimal place (about 10 km) before they are stored.
-- statement
CREATE TABLE testimony_locations (
  person_id TEXT PRIMARY KEY REFERENCES testimony_people(id),
  city TEXT NOT NULL DEFAULT '' CHECK(length(city)<=80), region TEXT NOT NULL DEFAULT '' CHECK(length(region)<=80),
  country TEXT NOT NULL DEFAULT '' CHECK(length(country)<=2),
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90), longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  recorded_at INTEGER NOT NULL DEFAULT(unixepoch())
);
