import vuex from "./vuex";

export function getImageFromLegado(src) {
  //返回阅读代理的图片链接 已经代理的或者dataurl返回传入值
  if (/cover\?path=|image\?path|data:/.test(src)) {
    return src;
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
