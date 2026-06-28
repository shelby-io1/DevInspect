CREATE TABLE IF NOT EXISTS generated_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    file_path TEXT,
    doc_type TEXT NOT NULL CHECK (doc_type IN (
        'readme', 'api_docs', 'architecture', 'folder_explanation', 'developer_notes'
    )),
    content TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'markdown',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated documentation"
    ON generated_documentation FOR SELECT
    USING (
        analysis_id IN (
            SELECT id FROM analyses WHERE repository_id IN (
                SELECT id FROM repositories WHERE user_id = auth.uid()
            )
        )
    );
