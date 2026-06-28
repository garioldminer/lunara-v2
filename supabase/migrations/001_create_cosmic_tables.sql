-- ============================================
-- LUNARA - COSMIC DATABASE SCHEMA
-- ყველა ცხრილი ერთ სკრიპტში
-- ============================================

-- 1. დღის მთავარი მონაცემები
CREATE TABLE IF NOT EXISTS cosmic_daily_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- მთვარე
  moon_phase TEXT NOT NULL,
  moon_illumination DECIMAL(5,2) NOT NULL,
  moon_sign TEXT NOT NULL,
  moon_degree DECIMAL(7,4) NOT NULL,
  moon_house INTEGER,
  
  -- მზე
  sun_sign TEXT NOT NULL,
  sun_degree DECIMAL(7,4) NOT NULL,
  
  -- დღის ენერგია
  energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 100),
  dominant_element TEXT,
  
  -- AI გენერირებული
  daily_theme TEXT,
  key_advice TEXT,
  best_ritual TEXT,
  lucky_color TEXT,
  lucky_number INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cosmic_date ON cosmic_daily_data(date);

-- 2. პლანეტების პოზიციები
CREATE TABLE IF NOT EXISTS planet_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  planet_name TEXT NOT NULL,
  sign TEXT NOT NULL,
  degree DECIMAL(7,4) NOT NULL,
  retrograde BOOLEAN DEFAULT FALSE,
  house INTEGER,
  speed DECIMAL(10,6),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date, planet_name)
);

CREATE INDEX IF NOT EXISTS idx_planet_date ON planet_positions(date);
CREATE INDEX IF NOT EXISTS idx_planet_name ON planet_positions(planet_name);

-- 3. ასპექტები (პლანეტებს შორის კუთხეები)
CREATE TABLE IF NOT EXISTS aspects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  planet1 TEXT NOT NULL,
  planet2 TEXT NOT NULL,
  aspect_type TEXT NOT NULL,
  degree DECIMAL(7,4) NOT NULL,
  orb DECIMAL(5,2) NOT NULL,
  influence TEXT NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aspects_date ON aspects(date);

-- 4. AI რჩევები
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sign TEXT NOT NULL,
  category TEXT NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  source_data JSONB,
  
  feedback_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date, sign, category)
);

CREATE INDEX IF NOT EXISTS idx_insights_date_sign ON ai_insights(date, sign);

-- 5. მომხმარებლის უკუკავშირი
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  
  insight_id UUID REFERENCES ai_insights(id),
  
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  was_helpful BOOLEAN,
  user_comment TEXT,
  
  user_sign TEXT,
  moon_sign_at_time TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON user_feedback(date);

-- 6. სწავლის კანონზომიერებები
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  condition JSONB NOT NULL,
  effect JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  sample_size INTEGER NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) პოლიტიკები
-- ============================================

-- cosmic_daily_data - ყველას შეუძლია წაკითხვა
ALTER TABLE cosmic_daily_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON cosmic_daily_data FOR SELECT USING (true);

-- planet_positions - ყველას შეუძლია წაკითხვა
ALTER TABLE planet_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON planet_positions FOR SELECT USING (true);

-- aspects - ყველას შეუძლია წაკითხვა
ALTER TABLE aspects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON aspects FOR SELECT USING (true);

-- ai_insights - ყველას შეუძლია წაკითხვა
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON ai_insights FOR SELECT USING (true);

-- user_feedback - მომხმარებელს შეუძლია თავისი ჩაწერა და წაკითხვა
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for authenticated" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow read own" ON user_feedback FOR SELECT USING (auth.uid() = user_id);

-- learning_patterns - ყველას შეუძლია წაკითხვა
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON learning_patterns FOR SELECT USING (true);

-- ============================================
-- სატესტო მონაცემები (დემოსთვის)
-- ============================================

INSERT INTO cosmic_daily_data (
  date, moon_phase, moon_illumination, moon_sign, moon_degree,
  sun_sign, sun_degree, energy_level, dominant_element,
  daily_theme, key_advice, best_ritual, lucky_color, lucky_number
) VALUES (
  CURRENT_DATE,
  'Waxing Gibbous',
  78.5,
  'Leo',
  15.2345,
  'Cancer',
  28.1234,
  78,
  'Fire',
  'Creative Expression & Leadership',
  'Trust your creative instincts today. The universe supports bold action.',
  'Meditation & Journaling',
  'Royal Purple',
  7
) ON CONFLICT (date) DO NOTHING;

INSERT INTO planet_positions (date, planet_name, sign, degree, retrograde) VALUES
  (CURRENT_DATE, 'Sun', 'Cancer', 28.1234, FALSE),
  (CURRENT_DATE, 'Moon', 'Leo', 15.2345, FALSE),
  (CURRENT_DATE, 'Mercury', 'Cancer', 22.5678, FALSE),
  (CURRENT_DATE, 'Venus', 'Gemini', 10.9876, FALSE),
  (CURRENT_DATE, 'Mars', 'Leo', 5.4321, FALSE),
  (CURRENT_DATE, 'Jupiter', 'Cancer', 18.7654, FALSE)
ON CONFLICT (date, planet_name) DO NOTHING;

INSERT INTO aspects (date, planet1, planet2, aspect_type, degree, orb, influence) VALUES
  (CURRENT_DATE, 'Sun', 'Moon', 'sextile', 60.0, 2.5, 'harmonious'),
  (CURRENT_DATE, 'Moon', 'Venus', 'trine', 120.0, 1.8, 'harmonious'),
  (CURRENT_DATE, 'Mars', 'Jupiter', 'conjunction', 0.0, 3.2, 'neutral')
ON CONFLICT DO NOTHING;

-- ============================================
-- შენიშვნა: ყველაფერი წარმატებით შეიქმნა!
-- ============================================