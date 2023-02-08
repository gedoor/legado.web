import Vue from "vue";
import Vuex from "vuex";
import ajax from "./ajax";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    connectStatus: "正在连接后端服务器……",
    connectType: "",
    newConnect: true,
    shelf: [],
    catalog: [],
    readingBook: {},
    popCataVisible: false,
    contentLoading: true,
    showContent: false,
    config: {
      theme: 0,
      font: 0,
      fontSize: 18,
      readWidth: 800,
      infiniteLoading: false,
    },
    miniInterface: false,
    readSettingsVisible: false,
  },
  mutations: {
    setConnectStatus(state, connectStatus) {
      state.connectStatus = connectStatus;
    },
    setConnectType(state, connectType) {
      state.connectType = connectType;
    },
    setNewConnect(state, newConnect) {
      state.newConnect = newConnect;
    },
    addBooks(state, books) {
      state.shelf = books;
    },
    setCatalog(state, catalog) {
      state.catalog = catalog;
    },
    setPopCataVisible(state, visible) {
      state.popCataVisible = visible;
    },
    setContentLoading(state, loading) {
      state.contentLoading = loading;
    },
    setReadingBook(state, readingBook) {
      state.readingBook = readingBook;
    },
    setConfig(state, config) {
      state.config = config;
    },
    setReadSettingsVisible(state, visible) {
      state.readSettingsVisible = visible;
    },
    setShowContent(state, visible) {
      state.showContent = visible;
    },
    setMiniInterface(state, mini) {
      state.miniInterface = mini;
    },
    clearReadingBook(state) {
      state.catalog = [];
      state.readingBook = {};
    },
  },
  actions: {
    //保存进度到app
    saveBookProcess({ state }) {
      return new Promise((resolve, reject) => {
        if (state.catalog.length == 0) return resolve();
        const { index, chapterPos, bookName, bookAuthor } = state.readingBook.index;
        let title = state.catalog[index].title;

        ajax
          .post("/saveBookProgress", {
            name: bookName,
            author: bookAuthor,
            durChapterIndex: index,
            durChapterPos: chapterPos,
            durChapterTime: new Date().getTime(),
            durChapterTitle: title,
          })
          .then(() => resolve())
          .catch(error => reject(error))
      });
    },
  },
});
