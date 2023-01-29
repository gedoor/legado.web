<template>
  <div
    class="chapter-wrapper"
    :style="bodyTheme"
    :class="{ night: isNight, day: !isNight }"
    @click="showToolBar = !showToolBar"
  >
    <div class="tool-bar" :style="leftBarTheme">
      <div class="tools">
        <el-popover
          placement="right"
          :width="popupWidth"
          trigger="click"
          :visible-arrow="false"
          v-model="popCataVisible"
          popper-class="pop-cata"
        >
          <PopCata @getContent="getContent" ref="popCata" class="popup" />

          <div
            class="tool-icon"
            :class="{ 'no-point': noPoint }"
            slot="reference"
          >
            <div class="iconfont">&#58905;</div>
            <div class="icon-text">目录</div>
          </div>
        </el-popover>
        <el-popover
          placement="right"
          :width="popupWidth"
          trigger="click"
          :visible-arrow="false"
          v-model="readSettingsVisible"
          popper-class="pop-setting"
        >
          <ReadSettings class="popup" />

          <div
            class="tool-icon"
            :class="{ 'no-point': noPoint }"
            slot="reference"
          >
            <div class="iconfont">&#58971;</div>
            <div class="icon-text">设置</div>
          </div>
        </el-popover>
        <div class="tool-icon" @click="toShelf">
          <div class="iconfont">&#58892;</div>
          <div class="icon-text">书架</div>
        </div>
        <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toTop">
          <div class="iconfont">&#58914;</div>
          <div class="icon-text">顶部</div>
        </div>
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toBottom"
        >
          <div class="iconfont">&#58915;</div>
          <div class="icon-text">底部</div>
        </div>
      </div>
    </div>
    <div class="read-bar" :style="rightBarTheme">
      <div class="tools">
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toPreChapter"
        >
          <div class="iconfont">&#58920;</div>
          <span v-if="$store.state.miniInterface">上一章</span>
        </div>
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toNextChapter"
        >
          <span v-if="$store.state.miniInterface">下一章</span>
          <div class="iconfont">&#58913;</div>
        </div>
      </div>
    </div>
    <div class="chapter-bar"></div>
    <div class="chapter" ref="content" :style="chapterTheme">
      <div class="content">
        <div class="top-bar" ref="top"></div>
        <div v-for="data in chapterData" :key="data.index" ref="chapter">
          <div class="title" ref="title" :index="data.index" v-if="show">
            {{ data.title }}
          </div>
          <Pcontent :carray="data.content" />
        </div>
        <div class="loading" ref="loading"></div>
        <div class="bottom-bar" ref="bottom"></div>
      </div>
    </div>
  </div>
</template>

<script>
import PopCata from "../components/PopCatalog.vue";
import ReadSettings from "../components/ReadSettings.vue";
import Pcontent from "../components/Content.vue";
import jump from "../plugins/jump";
import config from "../plugins/config";
import ajax from "../plugins/ajax";

export default {
  components: {
    PopCata,
    Pcontent,
    ReadSettings,
  },
  created() {
    var config = JSON.parse(localStorage.getItem("config"));
    if (config != null) this.$store.commit("setConfig", config);
  },
  beforeCreate() {
    let config = JSON.parse(localStorage.getItem("config"));
    if (config != null) this.$store.commit("setConfig", config);
  },
  mounted() {
    this.loading = this.$loading({
      target: this.$refs.content,
      lock: true,
      text: "正在获取内容",
      spinner: "el-icon-loading",
      background: "rgba(0,0,0,0)",
    });
    //获取书籍数据
    const that = this;
    let bookUrl = sessionStorage.getItem("bookUrl");
    let bookName = sessionStorage.getItem("bookName");
    let bookAuthor = sessionStorage.getItem("bookAuthor");
    let chapterIndex = Number(sessionStorage.getItem("chapterIndex") || 0);
    let chapterPos = Number(sessionStorage.getItem("chapterPos") || 0);
    var book = JSON.parse(localStorage.getItem(bookUrl));
    if (book == null || chapterIndex != book.index || chapterPos != book.chapterPos) {
      book = {
        bookName: bookName,
        bookAuthor: bookAuthor,
        bookUrl: bookUrl,
        index: chapterIndex,
        chapterPos: chapterPos,
      };
      localStorage.setItem(bookUrl, JSON.stringify(book));
    }

    this.getCatalog(bookUrl).then(
      (res) => {
        book.catalog = res.data.data;
        that.$store.commit("setReadingBook", book);
        var index = that.$store.state.readingBook.index || 0;
        this.getContent(index, true, chapterPos);
        window.addEventListener("keyup", this.handleKeyPress);
        //监听底部加载
        this.scrollObserve = new IntersectionObserver(
          this.handleIScrollObserve,
          { rootMargin: "-100% 0% 20% 0%" }
        );
        this.enableInfiniteLoading &&
          this.scrollObserve.observe(this.$refs.loading);
        //监听当前阅读章节
        this.readingObserve = new IntersectionObserver(
          this.handleIReadingObserve
        );
        //第二次点击同一本书 页面标题不会变化
        document.title = null;
        document.title = bookName + " | " + book.catalog[index].title;
      },
      (err) => {
        that.loading.close();
        that.$message.error("获取书籍目录失败");
        throw err;
      }
    );
  },
  beforeRouteLeave(to, from, next) {
    this.computeChapterPos();
    this.saveReadingBookProgress(this.chapterIndex);
    next();
  },
  destroyed() {
    window.removeEventListener("keyup", this.handleKeyPress);
    this.readSettingsVisible = false;
    this.popCataVisible = false;
    this.scrollObserve && this.scrollObserve.disconnect();
    this.readingObserve && this.readingObserve.disconnect();
  },
  watch: {
    chapterData() {
      this.$store.commit("setContentLoading", false);
      //添加章节内容到observe
      this.addReadingObserve();
    },
    chapterIndex(index) {
      document.title = sessionStorage.getItem("bookName") + " | " + this.$store.state.readingBook.catalog[index].title;
      //this.saveReadingBookProgress(index);
    },
    theme(theme) {
      this.isNight = theme == 6;
    },
    bodyColor(color) {
      this.bodyTheme.background = color;
    },
    chapterColor(color) {
      this.chapterTheme.background = color;
    },
    readWidth(width) {
      this.chapterTheme.width = width;
      let leftToolMargin = -((parseInt(width) + 130) / 2 + 68) + "px";
      let rightToolMargin = -((parseInt(width) + 130) / 2 + 52) + "px";
      this.leftBarTheme.marginLeft = leftToolMargin;
      this.rightBarTheme.marginRight = rightToolMargin;
    },
    popupColor(color) {
      this.leftBarTheme.background = color;
      this.rightBarTheme.background = color;
    },
    readSettingsVisible(visible) {
      /*
      if (!visible) {
        let configText = JSON.stringify(this.$store.state.config);
        localStorage.setItem("config", configText);
      }
      */
    },
    enableInfiniteLoading(enable) {
      if (!enable) {
        this.scrollObserve.disconnect();
      } else {
        this.scrollObserve.observe(this.$refs.loading);
      }
    },
  },
  data() {
    return {
      noPoint: true,
      showToolBar: false,
      chapterData: [],
      scrollObserve: null,
      readingObserve: null,
      chapterIndex: null,
      chapterPos: null,
    };
  },
  computed: {
    catalog() {
      return this.$store.state.catalog;
    },
    windowHeight() {
      return window.innerHeight;
    },
    contentHeight() {
      return this.$refs.content.offsetHeight;
    },
    popCataVisible: {
      get() {
        return this.$store.state.popCataVisible;
      },
      set(value) {
        this.$store.commit("setPopCataVisible", value);
      },
    },
    readSettingsVisible: {
      get() {
        return this.$store.state.readSettingsVisible;
      },
      set(value) {
        this.$store.commit("setReadSettingsVisible", value);
      },
    },
    config() {
      return this.$store.state.config;
    },
    theme() {
      return this.config.theme;
    },
    bodyColor() {
      return config.themes[this.config.theme].body;
    },
    chapterColor() {
      return config.themes[this.config.theme].content;
    },
    popupColor() {
      return config.themes[this.config.theme].popup;
    },
    isNight() {
      return this.$store.state.config.theme == 6;
    },
    readWidth() {
      if (!this.$store.state.miniInterface) {
        return this.$store.state.config.readWidth - 130 + "px";
      } else {
        return window.innerWidth + "px";
      }
    },
    popupWidth() {
      if (!this.$store.state.miniInterface) {
        return this.$store.state.config.readWidth - 33;
      } else {
        return window.innerWidth - 33;
      }
    },
    bodyTheme() {
      return {
        background: config.themes[this.$store.state.config.theme].body,
      };
    },
    chapterTheme() {
      return {
        background: config.themes[this.$store.state.config.theme].content,
        width: this.readWidth,
      };
    },
    leftBarTheme() {
      return {
        background: config.themes[this.$store.state.config.theme].popup,
        marginLeft: this.$store.state.miniInterface
          ? 0
          : -(this.$store.state.config.readWidth / 2 + 68) + "px",
        display:
          this.$store.state.miniInterface && !this.showToolBar
            ? "none"
            : "block",
      };
    },
    rightBarTheme() {
      return {
        background: config.themes[this.$store.state.config.theme].popup,
        marginRight: this.$store.state.miniInterface
          ? 0
          : -(this.$store.state.config.readWidth / 2 + 52) + "px",
        display:
          this.$store.state.miniInterface && !this.showToolBar
            ? "none"
            : "block",
      };
    },
    show() {
      return this.$store.state.showContent;
    },
    enableInfiniteLoading() {
      return this.$store.state.config.infiniteLoading;
    },
  },
  methods: {
    getCatalog(bookUrl) {
      return ajax.get("/getChapterList?url=" + encodeURIComponent(bookUrl));
    },
    getContent(index, reloadChapter = true, chapterPos = 0) {
      if (reloadChapter) {
        //展示进度条
        this.$store.commit("setShowContent", false);
        if (!this.loading.visible) {
          this.loading = this.$loading({
            target: this.$refs.content,
            lock: true,
            text: "正在获取内容",
            spinner: "el-icon-loading",
            background: "rgba(0,0,0,0)",
          });
        }
        //强制滚回顶层
        jump(this.$refs.top, { duration: 0 });
        //保存进度
        //this.saveReadingBookProgress(index, chapterPos);
        this.chapterPos = chapterPos;
        this.chapterIndex = index;
      }
      let bookUrl = sessionStorage.getItem("bookUrl");
      let title = this.$store.state.readingBook.catalog[index].title;
      let chapterIndex = this.$store.state.readingBook.catalog[index].index;
      let that = this;
      ajax
        .get(
          "/getBookContent?url=" +
            encodeURIComponent(bookUrl) +
            "&index=" +
            chapterIndex
        )
        .then(
          (res) => {
            if (res.data.isSuccess) {
              let data = res.data.data;
              let content = data.split(/\n+/);
              that.updateChapterData({ index, content, title }, reloadChapter);
              //跳到合适位置
              this.toChapterPos(chapterPos);
            } else {
              that.$message.error("书源正文解析错误！");
              let content = ["书源正文解析失败！"];
              that.updateChapterData({ index, content, title }, reloadChapter);
            }
            that.$store.commit("setContentLoading", true);
            that.loading.close();
            that.noPoint = false;
            that.$store.commit("setShowContent", true);
            if (!res.data.isSuccess) {
              throw res.data;
            }
          },
          (err) => {
            that.$message.error("获取章节内容失败");
            let content = ["获取章节内容失败！"];
            that.updateChapterData({ index, content, title }, reloadChapter);
            that.loading.close();
            that.$store.commit("setShowContent", true);
            throw err;
          }
        );
    },
    toChapterPos(chapterPos) {
      if (!chapterPos) return;
      this.$nextTick(() => {
        //计算chapterPos对应的段落行数
        let wordCount = 0;
        let index = this.chapterData[0].content.findIndex(paragraph => {
          wordCount += paragraph.length;
          return wordCount >= this.chapterPos;
        });
        if (index == -1) index = this.chapterData[0].content.length -1;
        //跳转
        jump(
          this.$refs.chapter[0].children[1].children[index],
          { duration: 0 }
        );
      });
    },
    //计算当前章节阅读的字数
    computeChapterPos() {
      //dom没渲染时再nextTick中调用
      if (!this.$refs.chapter[0]) return this.$nextTick(this.computeChapterPos);
      //计算当前阅读进度对应的element
      let index = this.chapterData.findIndex(chapter => chapter.index == this.chapterIndex);
      if (index == -1) return;
      let element = this.$refs.chapter[index].children[1].children;
      //计算已读字数
      let chapterPos = 0;
      for (let paragraph of element) {
        let text = paragraph.innerText;
        chapterPos += text.length;
        if (paragraph.getBoundingClientRect().top >= 0) {
          this.chapterPos = chapterPos;
          break;
        }
      }
    },
    toTop() {
      jump(this.$refs.top);
    },
    toBottom() {
      jump(this.$refs.bottom);
    },
    toNextChapter() {
      this.$store.commit("setContentLoading", true);
      let index = this.$store.state.readingBook.index;
      index++;
      if (typeof this.$store.state.readingBook.catalog[index] !== "undefined") {
        this.$message.info("下一章");
        this.getContent(index);
      } else {
        this.$message.error("本章是最后一章");
      }
    },
    toPreChapter() {
      this.$store.commit("setContentLoading", true);
      let index = this.$store.state.readingBook.index;
      index--;
      if (typeof this.$store.state.readingBook.catalog[index] !== "undefined") {
        this.$message.info("上一章");
        this.getContent(index);
      } else {
        this.$message.error("本章是第一章");
      }
    },
    saveReadingBookProgress(index, chapterPos = this.chapterPos) {
      let bookUrl = sessionStorage.getItem("bookUrl");
      let book = JSON.parse(localStorage.getItem(bookUrl));
      book.index = index;
      book.chapterPos = chapterPos;
      localStorage.setItem(bookUrl, JSON.stringify(book));
      this.$store.state.readingBook.index = index;
      this.$store.state.readingBook.chapterPos = chapterPos;
      sessionStorage.setItem("chapterIndex", index);
      sessionStorage.setItem("chapterPos", chapterPos);
      let title = this.$store.state.readingBook.catalog[index].title;
      ajax.post("/saveBookProgress", {
        name: this.$store.state.readingBook.bookName,
        author: this.$store.state.readingBook.bookAuthor,
        durChapterIndex: index,
        durChapterPos: chapterPos,
        durChapterTime: new Date().getTime(),
        durChapterTitle: title,
      });
    },
    updateChapterData(data, reloadChapter) {
      if (reloadChapter) {
        this.chapterData.splice(0);
      }
      this.chapterData.push(data);
    },
    loadMore() {
      let index = this.chapterData.slice(-1)[0].index;
      if (this.$store.state.readingBook.catalog.length - 1 > index) {
        this.getContent(index + 1, false);
      }
    },
    toShelf() {
      this.$router.push("/");
    },
    //监听方向键
    handleKeyPress(event) {
      switch (event.key) {
        case "ArrowLeft":
          event.stopPropagation();
          event.preventDefault();
          this.toPreChapter();
          break;
        case "ArrowRight":
          event.stopPropagation();
          event.preventDefault();
          this.toNextChapter();
          break;
        case "ArrowUp":
          event.stopPropagation();
          event.preventDefault();
          if (document.documentElement.scrollTop === 0) {
            this.$message.warning("已到达页面顶部");
          } else {
            jump(0 - document.documentElement.clientHeight + 100);
          }
          break;
        case "ArrowDown":
          event.stopPropagation();
          event.preventDefault();
          if (
            document.documentElement.clientHeight +
              document.documentElement.scrollTop ===
            document.documentElement.scrollHeight
          ) {
            this.$message.warning("已到达页面底部");
          } else {
            jump(document.documentElement.clientHeight - 100);
          }
          break;
      }
    },
    //IntersectionObserver回调 底部加载
    handleIScrollObserve(entries) {
      if (this.loading.visible) return;
      for (let { isIntersecting } of entries) {
        if (!isIntersecting) return;
        this.loadMore();
      }
    },
    //IntersectionObserver回调 当前阅读章节序号
    handleIReadingObserve(entries) {
      this.$nextTick(() => {
        for (let { isIntersecting, target, boundingClientRect } of entries) {
          let titleElement = target.querySelector(".title");
          let chapterTitleIndex = parseInt(titleElement.getAttribute("index"));
          if (isIntersecting) {
            this.chapterIndex = chapterTitleIndex;
          } else {
            if (boundingClientRect.top < 0) {
              this.chapterIndex = chapterTitleIndex + 1;
            } else {
              this.chapterIndex = chapterTitleIndex - 1;
            }
          }
        }
      })
    },
    //添加所有章节到observe
    addReadingObserve() {
      this.$nextTick(() => {
        let chapterElements = this.$refs.chapter;
        if (!chapterElements) return;
        chapterElements.forEach((el) => this.readingObserve.observe(el));
      });
    },
  },
};
</script>

<style lang="stylus" scoped>
>>> .pop-setting {
  margin-left: 68px;
  top: 0;
}

>>> .pop-cata {
  margin-left: 10px;
}

.chapter-wrapper {
  padding: 0 4%;
  flex-direction: column;
  align-items: center;

  >>> .no-point {
    pointer-events: none;
  }

  .tool-bar {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 100;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 58px;
        height: 48px;
        text-align: center;
        padding-top: 12px;
        cursor: pointer;
        outline: none;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }

        .icon-text {
          font-size: 12px;
        }
      }
    }
  }

  .read-bar {
    position: fixed;
    bottom: 0;
    right: 50%;
    z-index: 100;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 42px;
        height: 31px;
        padding-top: 12px;
        text-align: center;
        align-items: center;
        cursor: pointer;
        outline: none;
        margin-top: -1px;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }
      }
    }
  }

  .chapter-bar {
    .el-breadcrumb {
      .item {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .chapter {
    font-family: 'Microsoft YaHei', PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', sans-serif;
    text-align: left;
    padding: 0 65px;
    min-height: 100vh;
    width: 670px;
    margin: 0 auto;

    >>> .el-icon-loading {
      font-size: 36px;
      color: #B5B5B5;
    }

    >>> .el-loading-text {
      font-weight: 500;
      color: #B5B5B5;
    }

    .content {
      font-size: 18px;
      line-height: 1.8;
      overflow: hidden;
      font-family: 'Microsoft YaHei', PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', sans-serif;

      .title {
        margin-bottom: 57px;
        font: 24px / 32px PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', 'Microsoft YaHei', sans-serif;
      }

      .bottom-bar, .top-bar {
        height: 64px;
      }
    }
  }
}

.day {
  >>> .popup {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  }

  >>> .tool-icon {
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-top: -1px;
    color: #000;

    .icon-text {
      color: rgba(0, 0, 0, 0.4);
    }
  }

  >>> .chapter {
    border: 1px solid #d8d8d8;
    color: #262626;
  }
}

.night {
  >>> .popup {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.48), 0 0 6px rgba(0, 0, 0, 0.16);
  }

  >>> .tool-icon {
    border: 1px solid #444;
    margin-top: -1px;
    color: #666;

    .icon-text {
      color: #666;
    }
  }

  >>> .chapter {
    border: 1px solid #444;
    color: #666;
  }

  >>> .popper__arrow {
    background: #666;
  }
}

@media screen and (max-width: 750px) {
  .chapter-wrapper {
    padding: 0;

    .tool-bar {
      left: 0;
      width: 100vw;
      margin-left: 0 !important;

      .tools {
        flex-direction: row;
        justify-content: space-between;

        .tool-icon {
          border: none;
        }
      }
    }

    .read-bar {
      right: 0;
      width: 100vw;
      margin-right: 0 !important;

      .tools {
        flex-direction: row;
        justify-content: space-between;
        padding: 0 15px;

        .tool-icon {
          border: none;
          width: auto;

          .iconfont {
            display: inline-block;
          }
        }
      }
    }

    .chapter {
      width: 100vw !important;
      padding: 0 20px;
      box-sizing: border-box;
    }
  }
}
</style>
