export function getImageFromLegado(src, width) {
  if (/cover\?path=|data:/.test(src)) {
    return null;
  }
  return (
    "../../image?path=" + encodeURIComponent(src) +
    "&url=" + encodeURIComponent(sessionStorage.getItem("bookUrl")) +
    "&width=" + width
  );
}
