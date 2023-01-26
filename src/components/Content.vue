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
            if (!/<img[^>]*src[^>]+>$/.test(a)) {
              return <p style={style} domPropsInnerHTML={a} />;
            }
            return <img class="full" v-lazy={this.getImageSrc(a)} />;
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
      let imgPattern = /<img[^>]*src="([^"]*(?:"[^>]+\})?)"[^>]*>/;
      return content.match(imgPattern)[1];
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
}
img.full {
  margin-left:auto;
  margin-right:auto;
  display:block;
  width:100%;
}
</style>
