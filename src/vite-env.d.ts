/// <reference types="vite/client" />

// ✏️ TEAM GUIDE: typed environment variables (see .env.example).
interface ImportMetaEnv {
  readonly VITE_LLM_API_URL?: string;
  readonly VITE_LLM_API_KEY?: string;
  readonly VITE_LLM_MODEL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
