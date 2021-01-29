<template>
  <div id="app">
    <div class="container is-max-desktop">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
const electron = window.require("electron");
window.dicts = [];
export default {
  name: "redictionary",
  mounted: function() {
    electron.ipcRenderer.on("nav", (e, msg) => {
      if (msg === "main") this.$router.push("/");
      else if (msg == "settings") this.$router.push("/settings");
    });
    electron.ipcRenderer.on("dictList", (e, op, arg) => {
      console.log(op, arg);
      if (op == "reset") {
        window.dicts = [{ i: 0, name: "None" }];
        window.dictNum = 0;
      } else if (op == "add") {
        if (dictNum == 0) window.dicts = [];
        window.dicts.push({ i: ++dictNum, name: arg });
      }
    });
  },
};
</script>

<style>
/* CSS */
html,
body {
  min-height: 100vh;
  overflow: auto;
}
#app {
  height: calc(100vh - 15px);
}
#app > section,
div.container,
div.is-ancestor {
  height: 100%;
}
div.container {
  padding-top: 10px;
}
html {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
</style>
