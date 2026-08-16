ALTER TABLE "religious_settings" ADD COLUMN "prayer_history" jsonb DEFAULT '[]'::jsonb NOT NULL;
