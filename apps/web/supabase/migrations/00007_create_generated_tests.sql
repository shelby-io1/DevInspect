CREATE TABLE IF NOT EXISTS generated_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_content TEXT,
    test_framework TEXT NOT NULL DEFAULT 'pytest',
    test_code TEXT NOT NULL,
    test_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated tests"
    ON generated_tests FOR SELECT
    USING (
        analysis_id IN (
            SELECT id FROM analyses WHERE repository_id IN (
                SELECT id FROM repositories WHERE user_id = auth.uid()
            )
        )
    );
