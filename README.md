### Snake game using Svelte

## In this workshop we're going to work with Sveltejs

we'll be using the following concepts:

- responding to keyboard events
- passing data between components

**_Tools_**  
VS Code for Linux
[Starter Template]("")
[SvelteJs]("https://svelte.dev/")

Extensions I used:

- Svelte for VS Code
- Prettier - Code formatter

## How to get started:

Make sure you have npm installed  
Clone the snake starter repo  
Navigate to the starter folder and run **_npm install_**  
To start the application use **_npm run dev_**

## Components

You'll see that there are 4 seperate components:

- Food component

- Snake component
- SnakeBodies component

- App component

## Food Component

1.0 In Food.svelte create two props named foodLeft & foodTop  
1.1 Use these two props to control the location of food component  
1.2 In App.svelte create two vars also called foodLeft & foodTop  
1.3 Pass those vars as props to the food component  
1.4 Play around with the values to confirm you control the location

## Snake Body Component

2.0 Use the same logic to control the location of the body component  
2.1 add a prop that confirms wich body component will show the eyes  
2.2 add a prop that points the eyes in the right direction  
2.3 use the direction prop to control the snake eyes  
2.4 use an [if statement]("https://svelte.dev/tutorial/if-blocks")to display the eyes

## Creating Snake Bodies(tail,body,head)

3.0 A snakebody part is 50px x 50px  
3.1 add a snakeBodies prop to the Snake.svelte component  
3.2 create a snakeBodies array in the App.svelte component  
3.3 loop trough the array to render the snakeBodies  
3.4 use an index variable to determine wich part should be the head

## KeyBoard Events

4.0 Every key on the keyboard has a code. Try to find out how to log it to the console.  
4.1 Make sure you have a function that controls the direction using the keycodes  
4.2 If done correctly, the snake eyes should move on your keyboard input

## Moving the Snake

5.0 Remove the last element from the array  
5.1 Extract the top & left values from the first element in the array  
5.2 Adjust those values based on the direction  
5.3 Create a new Head object using the top & left variables  
5.4 Set snake bodies array to new array  
5.5 Make sure the array keeps updating

## OMNOM NOM NOM

6.0 Determine when the snake collides with the apple  
6.1 Randomise the position of the food  
6.2 Make sure the snake grows after eating the apple

## GAME OVER

7.0 Track if the head collides with the body  
7.1 Test your logic using an alert  
7.2 Add the logic that checks if the snake is in the container

## EXTRA

8.0 Reset the game on game over  
8.1 Display the score using a reactive variable  
8.2 Change the [background]("http://www.heropatterns.com/") and go ham on the styling

## Sources/Tips:

Be sure to check out https://svelte.dev/  
Find out what a spread operator is.  
Dont forget to remove the hardcoded css values.  
Read up on [setInterval()]("https://www.w3schools.com/jsref/met_win_setinterval.asp")  
CTRL - S  
Will update with excercise source after workshop:)
