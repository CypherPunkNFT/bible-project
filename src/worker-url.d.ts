// Vite: "?worker&url" bundles a web worker (with its imports) and gives back its URL. Used by the street atlas.
declare module "*?worker&url" {
  const url: string;
  export default url;
}
