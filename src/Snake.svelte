<script>
  import SnakeBody from "./SnakeBody.svelte";

  export let direction;
  export let snakeBodies = [];
</script>

{#each snakeBodies as snakeBody, i}
  <SnakeBody
    isHead={i == 0}
    top={snakeBody.top}
    left={snakeBody.left}
    {direction}
  />
{/each}
