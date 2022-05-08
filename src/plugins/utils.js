function getImageFromLegado(src) {
  if (/cover\?path=|data:/.test(src)) {
    return null
  }
  return (
    "../../image?path=" +
    encodeURIComponent(src) +
    "&url=" +
    encodeURIComponent(sessionStorage.getItem("bookUrl")) +
    "&width=" +
    this.$store.state.config.readWidth
 );
}

export default getImageFromLegado
