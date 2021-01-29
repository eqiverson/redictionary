<template>
  <section>
    <b-message title="提示" type="is-info">
      程序自带几个词典，有针对性的调整。
    </b-message>
    <nav class="panel">
      <p class="panel-heading">Dictionaries</p>
      <div class="panel-block" v-for="dict in dicts" key="dict.i">
        {{ dict.name }}
      </div>
    </nav>
  </section>
</template>

<script>
let dictNum = 0;
export default {
  data() {
    return {
      dicts: [{ i: 0, name: "None" }],
    };
  },
  created() {
    Object.assign(this.dicts, window.dicts);
  },
};
</script>

<style scoped>
section {
  margin: 8px 20px 0 20px;
}
</style>
