-- AleTrail Platform Database Schema
-- This was already executed in Supabase, keeping here for documentation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TRAILS TABLE
CREATE TABLE trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(100) DEFAULT 'Vietnam',
  description TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#DC2626',
  secondary_color VARCHAR(7) DEFAULT '#FBBF24',
  font_family VARCHAR(100) DEFAULT 'Impact',
  reward_text VARCHAR(255) DEFAULT 'Collect all stamps and earn a FREE prize!',
  total_breweries INTEGER DEFAULT 9,
  hashtags TEXT[],
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'active',
  plan VARCHAR(20) DEFAULT 'starter',
  subscription_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- BREWERIES TABLE
CREATE TABLE breweries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  district VARCHAR(100),
  address TEXT,
  tagline TEXT,
  description TEXT,
  secret_code VARCHAR(50) NOT NULL,
  facebook_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  google_maps_url TEXT,
  logo_url TEXT,
  beer_menu JSONB DEFAULT '[]'::jsonb,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT true,
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- STAMPS TABLE
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brewery_id UUID REFERENCES breweries(id) ON DELETE CASCADE,
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  validated_at TIMESTAMP DEFAULT NOW(),
  validation_method VARCHAR(20) DEFAULT 'code',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  UNIQUE(user_id, brewery_id)
);

-- RATINGS TABLE
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brewery_id UUID REFERENCES breweries(id) ON DELETE CASCADE,
  beer_id VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  flavors_enjoyed TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, brewery_id, beer_id)
);

-- ANALYTICS TABLE
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  brewery_id UUID REFERENCES breweries(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_trails_subdomain ON trails(subdomain);
CREATE INDEX idx_breweries_trail_id ON breweries(trail_id);
CREATE INDEX idx_breweries_position ON breweries(trail_id, position);
CREATE INDEX idx_users_trail_id ON users(trail_id);
CREATE INDEX idx_stamps_user_id ON stamps(user_id);
CREATE INDEX idx_stamps_brewery_id ON stamps(brewery_id);
CREATE INDEX idx_stamps_trail_id ON stamps(trail_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_brewery_id ON ratings(brewery_id);
CREATE INDEX idx_analytics_trail_id ON analytics_events(trail_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- ROW LEVEL SECURITY
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE breweries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active trails" ON trails FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active breweries" ON breweries FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own stamps" ON stamps FOR SELECT USING (true);
CREATE POLICY "Users can insert own stamps" ON stamps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own ratings" ON ratings FOR INSERT WITH CHECK (true);
