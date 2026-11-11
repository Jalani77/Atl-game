import { Game } from './game/Game';

const container = document.getElementById('game-container');
if (!container) throw new Error('Game container not found');

const game = new Game(container);
game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.dispose();
  });
}
