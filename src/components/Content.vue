<script>
import config from "../plugins/config";
import { getImageFromLegado } from "./plugins/utils";

export default {
  name: "pcontent",
  data() {
    return {};
  },
  props: ["carray"],
  render() {
    const { fontFamily, fontSize } = this;
    let style = fontFamily;
    style.fontSize = fontSize;
    if (this.show) {
      return (
        <div>
          {this.carray.map((a) => {
            if (/^\s*<img[^>]*src[^>]+>$/.test(a)) {
              //段落只有一个img标签 视为大图
              return <img class="full" v-lazy={this.getImageSrc(a)} />;
            }
            //其余情况的图片视为内嵌文字
            const html = this.parseHtml(a);
            return <p style={style} domPropsInnerHTML={html} />;
          })}
        </div>
      );
    } else {
      return <div />;
    }
  },
  computed: {
    show() {
      return this.$store.state.showContent;
    },
    fontFamily() {
      if (this.$store.state.config.font >= 0) {
        return config.fonts[this.$store.state.config.font];
      }
      return { fontFamily: this.$store.state.config.customFontName };
    },
    fontSize() {
      return this.$store.state.config.fontSize + "px";
    },
  },
  methods: {
    getImageSrc(content) {
      const imgPattern = /<img[^>]*src="([^"]*(?:"[^>]+\})?)"[^>]*>/;
      const src = content.match(imgPattern)[1];
      return this.replaceImgSrcWithLegado(src);
    },
    replaceImgSrcWithLegado(src) {
      //相对链接 | 显示带有urlOption 先替换，隐式带有的通过onerror替换
      if (!/^http/.test(src) || /,\s*\{.*\}$/.test(src)) return getImageFromLegado(src);
      return src;
    },
    parseHtml(content) {
      //段落内可能含有多个img标签 并且来源可能不是网络资源，正则替换
      const imgPattern = /<img[^>]*src="([^"]*(?:"[^>]+\})?)"[^>]*>/g;
      for (let [match, src] of content.matchAll(imgPattern)) {
        const img = `<img src="${this.replaceImgSrcWithLegado(src)}" onerror="this.src='${getImageFromLegado(src)}';this.onerror=null">`;
        content = content.replace(match, img);
      }
      return content;
    },
  },
  watch: {
    fontSize() {
      let that = this;
      that.$store.commit("setShowContent", false);
      this.$nextTick(() => {
        that.$store.commit("setShowContent", true);
      });
    },
  },
};
</script>

<style lang="stylus" scoped>
p {
  display: block;
  word-wrap: break-word;
  word-break: break-all;
  >>> img {
    height: 1em;
  }
}
img.full {
  margin-left:auto;
  margin-right:auto;
  display:block;
  width:100%;
}
</style>
