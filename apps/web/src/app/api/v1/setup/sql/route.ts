import { NextResponse } from "next/server";

const SQL = `-- START
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_name TEXT,
  url TEXT,
  description TEXT,
  language TEXT,
  default_branch TEXT DEFAULT 'main',
  stars INTEGER DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('github', 'upload')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'importing', 'ready', 'error')),
  metadata JSONB DEFAULT '{}',
  score INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repository_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT,
  language TEXT,
  size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE repositories ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own repositories" ON repositories;
CREATE POLICY "Users can manage own repositories"
  ON repositories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team members can view shared repositories" ON repositories;
CREATE POLICY "Team members can view shared repositories"
  ON repositories FOR SELECT
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

DROP POLICY IF EXISTS "Users can manage own repository files" ON repository_files;
CREATE POLICY "Users can manage own repository files"
  ON repository_files FOR ALL
  USING (repository_id IN (SELECT id FROM repositories WHERE user_id = auth.uid()))
  WITH CHECK (repository_id IN (SELECT id FROM repositories WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view shared repository files" ON repository_files;
CREATE POLICY "Team members can view shared repository files"
  ON repository_files FOR SELECT
  USING (repository_id IN (SELECT id FROM repositories WHERE team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_team_id ON repositories(team_id);
CREATE INDEX IF NOT EXISTS idx_repository_files_repository_id ON repository_files(repository_id);

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
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own analyses" ON analyses;
CREATE POLICY "Users can manage own analyses"
  ON analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team members can view shared analyses" ON analyses;
CREATE POLICY "Team members can view shared analyses"
  ON analyses FOR SELECT
  USING (repository_id IN (SELECT id FROM repositories WHERE team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE INDEX IF NOT EXISTS idx_analyses_repository_id ON analyses(repository_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

CREATE TABLE IF NOT EXISTS analysis_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  rule_id TEXT,
  severity TEXT,
  category TEXT,
  file_path TEXT,
  line_start INTEGER,
  line_end INTEGER,
  message TEXT,
  recommendation TEXT,
  code_snippet TEXT
);

ALTER TABLE analysis_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own analysis issues" ON analysis_issues;
CREATE POLICY "Users can manage own analysis issues"
  ON analysis_issues FOR ALL
  USING (analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid()))
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view shared analysis issues" ON analysis_issues;
CREATE POLICY "Team members can view shared analysis issues"
  ON analysis_issues FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE repository_id IN (SELECT id FROM repositories WHERE team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()))));

CREATE INDEX IF NOT EXISTS idx_analysis_issues_analysis_id ON analysis_issues(analysis_id);

CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('bugs', 'security', 'refactoring', 'score')),
  summary TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own AI reports" ON ai_reports;
CREATE POLICY "Users can manage own AI reports"
  ON ai_reports FOR ALL
  USING (analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid()))
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view shared AI reports" ON ai_reports;
CREATE POLICY "Team members can view shared AI reports"
  ON ai_reports FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE repository_id IN (SELECT id FROM repositories WHERE team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()))));

CREATE INDEX IF NOT EXISTS idx_ai_reports_analysis_id ON ai_reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_report_type ON ai_reports(report_type);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own analysis history" ON analysis_history;
CREATE POLICY "Users can manage own analysis history"
  ON analysis_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_repository_id ON analysis_history(repository_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_analysis_id ON analysis_history(analysis_id);

CREATE TABLE IF NOT EXISTS generated_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  file_path TEXT,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('readme','api_docs','architecture','folder_explanation','developer_notes')),
  content TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'markdown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_documentation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generated documentation" ON generated_documentation;
CREATE POLICY "Users can view own generated documentation"
  ON generated_documentation FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE repository_id IN (SELECT id FROM repositories WHERE user_id = auth.uid())));

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

DROP POLICY IF EXISTS "Users can view own generated tests" ON generated_tests;
CREATE POLICY "Users can view own generated tests"
  ON generated_tests FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE repository_id IN (SELECT id FROM repositories WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE OR REPLACE FUNCTION public.is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = $1 AND team_members.user_id = $2);
$$;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team owners can manage their teams" ON teams;
CREATE POLICY "Team owners can manage their teams" ON teams FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
CREATE POLICY "Team members can view their teams" ON teams FOR SELECT USING (public.is_team_member(id, auth.uid()));
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
CREATE POLICY "Team admins can manage members" ON team_members FOR ALL USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())) WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS "Members can view team members" ON team_members;
CREATE POLICY "Members can view team members" ON team_members FOR SELECT USING (public.is_team_member(team_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('analysis_complete','analysis_failed','invitation','mention','pr_review_complete','team_update','system')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_files TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own chat history" ON chat_history;
CREATE POLICY "Users can manage own chat history" ON chat_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_repository_id ON chat_history(repository_id);

CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can read messages" ON team_messages;
CREATE POLICY "Team members can read messages" ON team_messages FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

DROP POLICY IF EXISTS "Team members can insert messages" ON team_messages;
CREATE POLICY "Team members can insert messages" ON team_messages FOR INSERT
  WITH CHECK (public.is_team_member(team_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at);
-- END`;

export async function GET() {
  return new NextResponse(SQL, {
    headers: { "Content-Type": "text/plain" },
  });
}
