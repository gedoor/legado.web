<script>
import config from "../plugins/config";

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
            //先替换src为data-src 使用v-lazy-container实现懒加载
            const html = this.replaceImageSrc(a);
            return (
              <p v-lazy-container style={style} domPropsInnerHTML={html} />
            );
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
      return content.match(imgPattern)[1];
    },
    replaceImageSrc(content) {
      //段落内可能含有多个img标签 替换src为data-src
      const imgPattern = /<img[^>]*src="([^"]*(?:"[^>]+\})?)"[^>]*>/g;
      for (let [match, src] of content.matchAll(imgPattern)) {
        const img = `<img data-src="${src}" />`;
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
img[lazy=loading] {
  transform: scale(0.1);
}
</style>
