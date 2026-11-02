import manifest from "./downloads.json";
export interface DownloadFile { file: string; title: string; description: string; bytes: number; sha256: string }
export const DOWNLOADS = manifest as DownloadFile[];
export const downloadHref = (f: string) => `/downloads/${f}`;
