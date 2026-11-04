/* Vite `?raw`: referans arşivi markdown'ı metin olarak (kopya tutulmaz). */
declare module "*.md?raw" {
  const source: string;
  export default source;
}
