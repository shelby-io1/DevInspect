import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const BACKEND_URL = env.BACKEND_URL;

const DOC_TYPES = ["readme", "api-docs", "architecture", "folder-explanation", "developer-notes", "tests"] as const;
type DocType = (typeof DOC_TYPES)[number];

const BACKEND_ENDPOINTS: Record<DocType, string> = {
  readme: "/generate/readme",
  "api-docs": "/generate/api-docs",
  architecture: "/generate/architecture",
  "folder-explanation": "/generate/folder-explanation",
  "developer-notes": "/generate/developer-notes",
  tests: "/generate/tests",
};

const DB_DOC_TYPES: Record<DocType, string | null> = {
  readme: "readme",
  "api-docs": "api_docs",
  architecture: "architecture",
  "folder-explanation": "folder_explanation",
  "developer-notes": "developer_notes",
  tests: null,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { docType: rawDocType, analysisId, repositoryId, files, repoName, language, folderStructure, filePath } = body;

    if (!rawDocType || !DOC_TYPES.includes(rawDocType)) {
      return NextResponse.json({ error: "Invalid docType. Must be one of: " + DOC_TYPES.join(", ") }, { status: 400 });
    }

    const docType = rawDocType as DocType;
    const backendPayload: Record<string, unknown> = {};
    if (files) backendPayload.files = files;
    if (repoName) backendPayload.repo_name = repoName;
    if (language) backendPayload.language = language;
    if (folderStructure) backendPayload.folder_structure = folderStructure;
    if (filePath) backendPayload.file_path = filePath;

    const res = await fetch(`${BACKEND_URL}${BACKEND_ENDPOINTS[docType]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Backend error (${res.status}): ${errText}` }, { status: 502 });
    }

    const result = await res.json();

    if (analysisId && (docType === "tests" || DB_DOC_TYPES[docType])) {
      if (docType === "tests") {
        await supabase.from("generated_tests").insert({
          analysis_id: analysisId,
          file_path: filePath || body.files?.[0]?.path || "unknown",
          file_content: body.files?.[0]?.content || null,
          test_framework: result.framework || "pytest",
          test_code: result.test_code || "",
          test_file_path: result.test_file_path || null,
        });
      } else {
        await supabase.from("generated_documentation").insert({
          analysis_id: analysisId,
          file_path: null,
          doc_type: DB_DOC_TYPES[docType],
          content: result.content || JSON.stringify(result),
          format: result.format || "markdown",
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Generation failed",
    }, { status: 500 });
  }
}
