/** Metro resolves bundled font files to asset module ids. */
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
