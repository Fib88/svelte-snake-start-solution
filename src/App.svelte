<script>
  import Snake from "./Snake.svelte";
  import Food from "./Food.svelte";
  import SnakeBody from "./SnakeBody.svelte";

  $: score = snakeBodies.length - 3;
  let foodLeft = 50;
  let foodTop = 200;
  let direction = "right";
  let snakeBodies = [
    { left: 100, top: 0 },
    { left: 50, top: 0 },
    { left: 0, top: 0 },
  ];

  //checks if snake is colliding with element
  function isCollide(a, b) {
    return !(
      a.top < b.top ||
      a.top > b.top ||
      a.left < b.left ||
      a.left > b.left
    );
  }

  function isGameOver() {
    const snakeBodiesNoHead = snakeBodies.slice(1);

    const snakeCollisions = snakeBodiesNoHead.filter((sb) =>
      isCollide(sb, snakeBodies[0])
    );
    if (snakeCollisions.length > 0) {
      return true;
    }
    const { top, left } = snakeBodies[0];
    if (top >= 700 || top < 0 || left < 0 || left >= 1000) {
      return true;
    }
    return false;
  }
  //checks for keyboard events
  function getDirectionFromKeyCode(keyCode) {
    if (keyCode === 38) {
      return "up";
    } else if (keyCode === 39) {
      return "right";
    } else if (keyCode === 37) {
      return "left";
    } else if (keyCode === 40) {
      return "down";
    }

    return false;
  }

  function onKeyDown(e) {
    const newDirection = getDirectionFromKeyCode(e.keyCode);
    if (newDirection) {
      direction = newDirection;
    }
  }

  setInterval(() => {
    snakeBodies.pop();
    let { top, left } = snakeBodies[0];

    if (direction === "up") {
      top -= 50;
    } else if (direction === "down") {
      top += 50;
    } else if (direction === "left") {
      left -= 50;
    } else if (direction === "right") {
      left += 50;
    }
    const newHead = { left, top };

    snakeBodies = [newHead, ...snakeBodies];

    if (isCollide(newHead, { left: foodLeft, top: foodTop })) {
      moveFood();
      snakeBodies = [...snakeBodies, snakeBodies[snakeBodies.length - 1]];
    }

    if (isGameOver()) {
      //alert("GAEME OVA");
      resetGame();
    }
  }, 200);

  function moveFood() {
    foodTop = Math.floor(Math.random() * 14) * 50;
    foodLeft = Math.floor(Math.random() * 20) * 50;
  }

  function resetGame() {
    moveFood();
    direction = "right";
    snakeBodies = [
      { left: 100, top: 0 },
      { left: 50, top: 0 },
      { left: 0, top: 0 },
    ];
  }

  resetGame();
</script>

<h1>Snake Game</h1>
<main>
  <Snake {snakeBodies} {direction} />
  <Food {foodLeft} {foodTop} />
</main>
<h2>Score: {score}</h2>
<svelte:window on:keydown={onKeyDown} />

<style>
  main {
    width: 1000px;
    height: 700px;
    border: solid black 1px;
    position: relative;
    margin: 20px auto;
    background-color: #dfdbe5;
    background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
    background-size: auto;
  }
  h2,
  h1 {
    text-align: center;
  }
</style>
