// Lets TypeScript treat `import styles from "./x.css?inline"` as a string.
// Vite resolves the `?inline` query to the file's CSS text at build time.
declare module "*.css?inline" {
  const css: string;
  export default css;
}
