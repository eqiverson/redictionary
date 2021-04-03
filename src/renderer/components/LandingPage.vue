<template>
  <section>
    <div class="tile is-ancestor">
      <div class="tile is-12 is-vertical">
        <div
          class="tile tile1"
          @keyup="update"
          @keydown="keydown"
          @focus="
            typing = true;
            fromClipboard = false;
          "
          @blur="typing = false"
        >
          <b-field>
            <b-autocomplete
              rounded
              :data="filteredDataArray"
              placeholder="Search"
              icon="magnify"
              clearable
              v-bind:loading="loading"
              @select="select"
              v-model="query"
              expanded
              autofocus
            >
              <template #empty>No results found</template>
            </b-autocomplete>
            <p class="control">
              <b-checkbox-button v-model="hotkey" native-value="hotkey">
                Clipboard
              </b-checkbox-button>
            </p>
          </b-field>
          <!-- Top tile -->
        </div>
        <div class="tile tile2">
          <card
            v-for="item in items"
            :key="item.id"
            :dictName="item.dictName"
            :rawHtml="item.rawHtml"
          >
          </card>
          <b-notification type="is-warning" role="alert" v-model="nores">
            No results
          </b-notification>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import Card from "./LandingPage/card.vue";
const electron = window.require("electron");
import { matchSorter } from "match-sorter";
let lastWord, lastQuery;
let selected, fromServer, hovered;

export default {
  methods: {
    update() {
      if (
        this.query != "" &&
        this.query !== lastWord &&
        typeof this.query === "string"
      ) {
        console.log(this.query);
        electron.ipcRenderer.send("lookup", this.query);
        lastWord = this.query;
      }
    },
    select(option) {
      if (option && typeof option === "string" && option !== lastQuery) {
        console.log(option);
        selected = option;
        this.loading = true;
        electron.ipcRenderer.send("word", selected);
        lastQuery = option;
        this.loading = false;
      }
    },
    keydown(e) {
      this.typing = true;
      this.fromClipboard = false;
      if (e.code === "ArrowUp" || e.code === "ArrowDown") hovered = true;
      if (e.code === "Enter" && this.filteredDataArray) {
        console.log(e.code);
        if (!hovered) window.document.querySelector("a.dropdown-item").click();
      }
    },
  },
  data() {
    return {
      items: [],
      loading: false,
      filteredDataArray: [],
      query: "",
      nores: true,
      hotkey: [],
      typing: false,
      fromClipboard: false,
    };
  },
  components: {
    Card,
  },
  watch: {
    hotkey(val) {
      electron.ipcRenderer.send(
        "setHotkey",
        this.hotkey.length === 1 ? true : false
      );
    },
  },
  mounted() {
    electron.ipcRenderer.on("hotkey", (e, msg) => {
      console.log("hotkey" + msg);
      if (msg) this.hotkey = ["hotkey"];
      else this.hotkey = [];
    });
    electron.ipcRenderer.on("lookupResult", (e, msg) => {
      this.filteredDataArray = matchSorter(msg, this.query);
      hovered = false;
      console.log(this.filteredDataArray);
      if (fromServer === true) {
        if (
          this.filteredDataArray[0] &&
          this.filteredDataArray[0].length - this.query.length <= 2
        ) {
          this.nores = false;
          this.query = this.filteredDataArray[0];
          this.select(this.query);
        } else {
          // No result
          this.nores = true;
          this.items = [];
        }
        fromServer = false;
      }
      if (
        (this.filteredDataArray.length === 0 ||
          (this.filteredDataArray.length >= 1 &&
            this.filteredDataArray[0].length - this.query.length >= 2)) &&
        !this.typing &&
        this.fromClipboard
      ) {
        this.query = this.query.trim();
        if (this.query.match(/[A-Za-z]+/g)) {
          // simple inflection, for most cases, since i didn't see any good inflection lib on npmjs
          if (this.query.endsWith("ed"))
            setQuery(this.query.substr(0, this.query.length - 2));
          else if (this.query.endsWith("ied"))
            setQuery(this.query.substr(0, this.query.length - 3) + "y");
          else if (this.query.endsWith("s"))
            setQuery(this.query.substr(0, this.query.length - 1));
          else if (this.query.endsWith("ses"))
            setQuery(this.query.substr(0, this.query.length - 2));
        }
      }
    });
    let setQuery = (msg) => {
      console.log("set query: " + msg);

      fromServer = true;

      let input = window.document.querySelector(".is-rounded.input");
      input.focus();
      input.click();
      this.query = msg;
      this.update();
    };
    electron.ipcRenderer.on("begin", (e, msg) => {
      this.fromClipboard = true;
      setQuery(msg);
    });
    electron.ipcRenderer.on("words", (e, msg) => {
      console.log(msg);
      this.nores = false;
      this.items = [];
      let c = 0;
      for (let name in msg) {
        for (let def of msg[name]) {
          let dx = def.replace(
            /(href=\")(.*\/)?([^/"]+)css\"/g,
            '$1static/$2$3css"'
          );
          if (name === "汉语大词典(简体精排)")
            dx = dx
              .replace(/`1`([^`]+)`6`/g, '<a class="word">$1</a>')
              .replace(/`2`([^`]+)`3`/g, '<a class="num">$1</a>')
              .replace(/`5`([^`]+)`7`/g, '<a class="quote">$1</a>')
              .replace(
                /&nbsp;([\u4e00-\u9fa5]{1,2}词)。?/g,
                '<span class="tag is-info">$1</span>'
              )
              .replace(/`7`/g, "")
              .replace(/〕/, "〕<br/>");
          if (name === "古汉语常用字字典")
            dx = dx
              .replace(/(“[^“”]*”)/g, '<a class="quote">$1</a>')
              .replace(
                /[\u2400-\u32bf]&lt;(.{1,4})&gt;/g,
                '<br/><span class="tag is-info">$1</span>'
              )
              .replace(/`1`([^`]+)`2`/g, '<a class="word">$1</a>')
              .replace(/&quot;+/g, "");
          console.log(dx);
          this.items.push({ dictName: name, rawHtml: dx, id: c++ });
          window.document.querySelector("div.container").scrollIntoView();
        }
      }
      // this.$nextTick((x) => {
      //   const styles = window.document.querySelectorAll(
      //     "div.card-content link"
      //   );
      //   console.log(styles);
      //   if (styles)
      //     for (let s of styles)
      //       s.href = s.href.replace(/(.*)\/([^/]+)css/g, "$1/static/$2css");
      // });
    });
    window.setTimeout(() => {
      console.log("capture");
      document.addEventListener("keydown", (e) => {
        console.log(e);
        let ele = window.document.querySelector(".is-rounded.input");
        if (ele == document.activeElement || e.ctrlKey) return;
        if (e.key.length == 1) {
          this.query = "";
          ele.click();
          ele.focus();
        }
      });
      electron.ipcRenderer.send("getHotkey");
    }, 10);
  },
};
</script>

<style scoped>
.tile1 {
  max-height: fit-content;
  margin: 10px;
}
.tile1 .field {
  width: 100%;
}
.tile2 {
  margin: 10px;
  flex-flow: column;
}
.tile.is-ancestor {
  max-width: 100%;
}
div.card {
  margin: 10px 0px 10px 0px;
}
div.tile.is-ancestor {
  margin: 0 10px 0 10px;
}
</style>
