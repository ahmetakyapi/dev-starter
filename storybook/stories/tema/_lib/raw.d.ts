/* Vite `?raw`: dosyanın metni. Tipografi sayfası font presetlerini
   snippets/fonts/fonts.ts'ten okur (kopya tutmamak için). */
declare module "*fonts.ts?raw" {
  const source: string;
  export default source;
}
