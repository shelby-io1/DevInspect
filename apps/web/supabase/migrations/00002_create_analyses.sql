CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  score INTEGER,
  security_score INTEGER,
  performance_score INTEGER,
  maintainability_score INTEGER,
  total_issues INTEGER DEFAULT 0,
  summary TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category TEXT NOT NULL CHECK (category IN ('security', 'performance', 'maintainability', 'complexity', 'duplication', 'code_style', 'potential_bug')),
  file_path TEXT NOT NULL,
  line_start INTEGER,
  line_end INTEGER,
  message TEXT NOT NULL,
  recommendation TEXT,
  code_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses"
  ON analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own analysis issues"
  ON analysis_issues FOR ALL
  USING (
    analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_analyses_repository_id ON analyses(repository_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_analysis_id ON analysis_issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_severity ON analysis_issues(severity);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_category ON analysis_issues(category);
