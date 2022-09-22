<template>
  <div class="index-wrapper">
    <!-- <div class="navigation-wrapper" :style="navigationClass"> -->
    <!-- 之前的 style 备份 -->
    <div class="navigation-wrapper">
      <div class="navigation-title-wrapper">
        <div class="navigation-title">阅读</div>
        <div class="navigation-sub-title">清风不识字，何故乱翻书</div>
      </div>
      <div class="search-wrapper">
        <el-input
          size="mini"
          placeholder="搜索书架书籍"
          v-model="search"
          class="search-input"
        >
          <i slot="prefix" class="el-input__icon el-icon-search"></i>
        </el-input>
      </div>
      <div class="bottom-wrapper">
        <div class="recent-wrapper">
          <div class="recent-title">最近阅读</div>
          <div class="reading-recent">
            <el-tag
              :type="readingRecent.name == '尚无阅读记录' ? 'warning' : 'tip'"
              class="recent-book"
              @click="
                toDetail(
                  readingRecent.url,
                  readingRecent.name,
                  readingRecent.author,
                  readingRecent.chapterIndex
                )
              "
              :class="{ 'no-point': readingRecent.url == '' }"
            >
              {{ readingRecent.name }}
            </el-tag>
          </div>
        </div>
        <div class="setting-wrapper">
          <div class="setting-title">基本设定</div>
          <div class="setting-item">
            <el-tag
              :type="connectType"
              class="setting-connect"
              :class="{ 'no-point': newConnect }"
              @click="setIP"
            >
              {{ connectStatus }}
            </el-tag>
          </div>
        </div>
      </div>
      <div class="bottom-icons">
        <a
          href="https://github.com/gedoor/legado_web_bookshelf"
          target="_blank"
        >
          <div class="bottom-icon">
            <img :src="require('../assets/imgs/github.png')" alt="" />
          </div>
        </a>
      </div>
    </div>
    <div class="shelf-wrapper" ref="shelfWrapper">
      <div class="books-wrapper">
        <div class="wrapper">
          <div
            class="book"
            v-for="book in shelf"
            :key="book.noteUrl"
            @click="
              toDetail(
                book.bookUrl,
                book.name,
                book.author,
                book.durChapterIndex
              )
            "
          >
            <div class="cover-img">
              <img
                class="cover"
                v-lazy="getCover(book.coverUrl)"
                :key="book.coverUrl"
                alt=""
              />
            </div>
            <div
              class="info"
              @click="
                toDetail(
                  book.bookUrl,
                  book.name,
                  book.author,
                  book.durChapterIndex
                )
              "
            >
              <div class="name">{{ book.name }}</div>
              <div class="sub">
                <div class="author">
                  {{ book.author }}
                </div>
                <div class="dot">•</div>
                <div class="size">共{{ book.totalChapterNum }}章</div>
                <div class="dot">•</div>
                <div class="date">{{ dateFormat(book.lastCheckTime) }}</div>
              </div>
              <div class="dur-chapter">已读：{{ book.durChapterTitle }}</div>
              <div class="last-chapter">
                最新：{{ book.latestChapterTitle }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "../assets/fonts/shelffont.css";
import ajax from "../plugins/ajax";

export default {
  data() {
    return {
      search: "",
      readingRecent: {
        name: "尚无阅读记录",
        author: "",
        url: "",
        chapterIndex: 0,
      },
    };
  },
  mounted() {
    //获取最近阅读书籍
    let readingRecentStr = localStorage.getItem("readingRecent");
    if (readingRecentStr != null) {
      this.readingRecent = JSON.parse(readingRecentStr);
      if (typeof this.readingRecent.chapterIndex == "undefined") {
        this.readingRecent.chapterIndex = 0;
      }
    }
    this.loading = this.$loading({
      target: this.$refs.shelfWrapper,
      lock: true,
      text: "正在获取书籍信息",
      spinner: "el-icon-loading",
      background: "rgb(247,247,247)",
    });
    const that = this;
    ajax
      .get("/getBookshelf", {
        timeout: 5000,
      })
      .then(function (response) {
        that.loading.close();
        that.$store.commit("setConnectType", "success");
        if (response.data.isSuccess) {
          //that.$store.commit("increaseBookNum", response.data.data.length);
          that.$store.commit(
            "addBooks",
            response.data.data.sort(function (a, b) {
              var x = a["durChapterTime"] || 0;
              var y = b["durChapterTime"] || 0;
              return y - x;
            })
          );
        } else {
          that.$message.error(response.data.errorMsg);
        }
        that.$store.commit("setConnectStatus", "已连接 ");
        that.$store.commit("setNewConnect", false);
      })
      .catch(function (error) {
        that.loading.close();
        that.$store.commit("setConnectType", "danger");
        that.$store.commit("setConnectStatus", "连接失败");
        that.$message.error("后端连接失败");
        that.$store.commit("setNewConnect", false);
        throw error;
      });
  },
  methods: {
    setIP() {},
    toDetail(bookUrl, bookName, bookAuthor, chapterIndex) {
      sessionStorage.setItem("bookUrl", bookUrl);
      sessionStorage.setItem("bookName", bookName);
      sessionStorage.setItem("bookAuthor", bookAuthor);
      sessionStorage.setItem("chapterIndex", chapterIndex);
      this.readingRecent = {
        name: bookName,
        author: bookAuthor,
        url: bookUrl,
        chapterIndex: chapterIndex,
      };
      localStorage.setItem("readingRecent", JSON.stringify(this.readingRecent));
      this.$router.push({
        path: "/chapter",
      });
    },
    dateFormat(t) {
      let time = new Date().getTime();
      let int = parseInt((time - t) / 1000);
      let str = "";
      Date.prototype.format = function (fmt) {
        var o = {
          "M+": this.getMonth() + 1, //月份
          "d+": this.getDate(), //日
          "h+": this.getHours(), //小时
          "m+": this.getMinutes(), //分
          "s+": this.getSeconds(), //秒
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度
          S: this.getMilliseconds(), //毫秒
        };
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(
            RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length)
          );
        }
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
              RegExp.$1,
              RegExp.$1.length == 1
                ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length)
            );
          }
        }
        return fmt;
      };
      if (int <= 30) {
        str = "刚刚";
      } else if (int < 60) {
        str = int + "秒前";
      } else if (int < 3600) {
        str = parseInt(int / 60) + "分钟前";
      } else if (int < 86400) {
        str = parseInt(int / 3600) + "小时前";
      } else if (int < 2592000) {
        str = parseInt(int / 86400) + "天前";
      } else {
        str = new Date(t).format("yyyy-MM-dd");
      }
      return str;
    },
    getCover(coverUrl) {
      return /^data:/.test(coverUrl)
        ? coverUrl
        : (process.env.NODE_ENV !== "production"
            ? `${process.env.VUE_APP_BASE_URL}:${process.env.VUE_APP_PORT}`
            : "..") +
            "/cover?path=" +
            encodeURIComponent(coverUrl);
    },
  },
  computed: {
    shelf() {
      let shelf = this.$store.state.shelf;
      return shelf.filter(book => {
        if (this.search == "") return true
        return book.name.includes(this.search) ||
        book.author.includes(this.search)
      });
    },
    connectStatus() {
      return this.$store.state.connectStatus;
    },
    connectType() {
      return this.$store.state.connectType;
    },
    newConnect() {
      return this.$store.state.newConnect;
    },
    showMenu() {
      return this.$store.state.miniInterface;
    },
    navigationClass() {
      return !this.showMenu || (this.showMenu && this.showNavigation)
        ? {
            display: "block",
          }
        : {
            display: "none",
          };
    },
  },
};
</script>

<style lang="stylus" scoped>
.index-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;

  .navigation-wrapper {
    width: 260px;
    min-width: 260px;
    padding: 48px 36px;
    background-color: #F7F7F7;

    .navigation-title {
      font-size: 24px;
      font-weight: 500;
      font-family: FZZCYSK;
    }

    .navigation-sub-title {
      font-size: 16px;
      font-weight: 300;
      font-family: FZZCYSK;
      margin-top: 16px;
      color: #b1b1b1;
    }

    .search-wrapper {
      .search-input {
        border-radius: 50%;
        margin-top: 24px;

        >>> .el-input__inner {
          border-radius: 50px;
          border-color: #E3E3E3;
        }
      }
    }

    .recent-wrapper {
      margin-top: 36px;

      .recent-title {
        font-size: 14px;
        color: #b1b1b1;
        font-family: FZZCYSK;
      }

      .reading-recent {
        margin: 18px 0;

        .recent-book {
          font-size: 10px;
          // font-weight: 400;
          // margin: 12px 0;
          // font-weight: 500;
          // color: #6B7C87;
          cursor: pointer;
          // padding: 6px 18px;
        }
      }
    }

    .setting-wrapper {
      margin-top: 36px;

      .setting-title {
        font-size: 14px;
        color: #b1b1b1;
        font-family: FZZCYSK;
      }

      .no-point {
        pointer-events: none;
      }

      .setting-connect {
        font-size: 8px;
        margin-top: 16px;
        // color: #6B7C87;
        cursor: pointer;
      }
    }

    .bottom-icons {
      position: fixed;
      bottom: 0;
      height: 120px;
      width: 260px;
      align-items: center;
      display: flex;
      flex-direction: row;
    }
  }

  .shelf-wrapper {
    padding: 48px 48px;
    width: 100%;
    display: flex;
    flex-direction: column;

    >>> .el-icon-loading {
      font-size: 36px;
      color: #B5B5B5;
    }

    >>> .el-loading-text {
      font-weight: 500;
      color: #B5B5B5;
    }

    .books-wrapper {
      overflow: scroll;

      .wrapper {
        display: grid;
        grid-template-columns: repeat(auto-fill, 380px);
        justify-content: space-around;
        grid-gap: 10px;

        .book {
          user-select: none;
          display: flex;
          cursor: pointer;
          margin-bottom: 18px;
          padding: 24px 24px;
          width: 360px;
          flex-direction: row;
          justify-content: space-around;

          .cover-img {
            width: 84px;
            height: 112px;

            .cover {
              width: 84px;
              height: 112px;
            }
          }

          .info {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            align-items: left;
            height: 112px;
            margin-left: 20px;
            flex: 1;

            .name {
              width: fit-content;
              font-size: 16px;
              font-weight: 700;
              color: #33373D;
            }

            .sub {
              display: flex;
              flex-direction: row;
              font-size: 12px;
              font-weight: 600;
              color: #6b6b6b;

              .dot {
                margin: 0 7px;
              }
            }

            .intro, .dur-chapter, .last-chapter {
              color: #969ba3;
              font-size: 13px;
              margin-top: 3px;
              font-weight: 500;
              word-wrap: break-word;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 1;
              text-align: left;
            }
          }
        }

        .book:hover {
          background: rgba(0, 0, 0, 0.1);
          transition-duration: 0.5s;
        }
      }

      .wrapper:last-child {
        margin-right: auto;
      }
    }

    .books-wrapper::-webkit-scrollbar {
      width: 0 !important;
    }
  }
}

@media screen and (max-width: 750px) {
  .index-wrapper {
    overflow-x: hidden;
    flex-direction: column;

    >>> .navigation-title-wrapper {
      white-space: nowrap;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    >>> .bottom-wrapper {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
    }

    >>> .navigation-wrapper {
      padding: 20px 24px;
      box-sizing: border-box;
      width: 100%;

      .bottom-wrapper {
        .recent-wrapper, .setting-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      }

      .bottom-icons {
        display: none;
      }
    }

    >>> .shelf-wrapper {
      padding: 0;

      .shelf-title {
        padding: 20px 24px 0 24px;
      }

      .books-wrapper {
        .wrapper {
          display: flex;
          flex-direction: column;

          .book {
            box-sizing: border-box;
            width: 100%;
            margin-bottom: 0;
            padding: 10px 20px;
          }
        }
      }
    }
  }
}
</style>
