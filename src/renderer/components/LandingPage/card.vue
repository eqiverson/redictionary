<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">
        {{ dictName }}
      </p>
      <a href="#" class="card-header-icon" aria-label="more options">
        <span class="icon">
          <v-icon name="angle-down" />
        </span>
      </a>
    </header>
    <div class="card-content">
      <div class="content">
        <div v-html="rawHtml"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["rawHtml", "dictName"],
};
</script>

<style>
span.tag {
  margin: 0 5px 0 0px !important;
  padding: 0 5px 0px 5px !important;
}
.num {
  background-color: #effaf5 !important;
  color: #257953 !important;
  border: none !important;
  font-size: small !important;;
}
</style>
