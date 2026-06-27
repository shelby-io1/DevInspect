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

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own repositories"
  ON repositories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own repository files"
  ON repository_files FOR ALL
  USING (
    repository_id IN (
      SELECT id FROM repositories WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    repository_id IN (
      SELECT id FROM repositories WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repository_files_repository_id ON repository_files(repository_id);
