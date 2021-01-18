<script>
  export let foodLeft;
  export let foodTop;
</script>

<div class="food" style="left: {foodLeft}px; top:{foodTop}px" />

<style>
  .food {
    width: 48px;
    height: 48px;
    position: absolute;
    border: solid black 1px;
    background-color: red;
    border-radius: 50%;
    z-index: 0;
  }
</style>
