/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_SHEETS_SCRIPT_URL?: string;
  readonly VITE_GOOGLE_FORM_BASE?: string;
  readonly VITE_ENTRY_NAME?: string;
  readonly VITE_ENTRY_AGE?: string;
  readonly VITE_ENTRY_GENDER?: string;
  readonly VITE_ENTRY_DATE?: string;
  readonly VITE_ENTRY_HIGHEST_LEVEL?: string;
  readonly VITE_ENTRY_ACCURACY?: string;
  readonly VITE_ENTRY_MEAN_RT?: string;
  readonly VITE_ENTRY_LEVEL_PASSED_COUNT?: string;
  readonly VITE_ENTRY_TOTAL_CORRECT?: string;
  readonly VITE_ENTRY_TOTAL_TARGETS?: string;
  readonly VITE_GMT22_OVERLOAD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
