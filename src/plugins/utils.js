import vuex from "./plugins/vuex";

export function getImageFromLegado(src) {
  if (/cover\?path=|data:/.test(src)) {
    return null;
  }
  return (
    "../../image?path=" +
    encodeURIComponent(src) +
    "&url=" +
    encodeURIComponent(sessionStorage.getItem("bookUrl")) +
    "&width=" +
    vuex.state.config.readWidth
  );
}
