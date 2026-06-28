CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('bugs', 'security', 'refactoring', 'score')),
  summary TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI reports"
  ON ai_reports FOR ALL
  USING (
    analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_ai_reports_analysis_id ON ai_reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_report_type ON ai_reports(report_type);
