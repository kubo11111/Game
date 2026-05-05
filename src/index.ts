import { Game } from './core/Game';

// Initialize the game when the page loads
window.onload = () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const game = new Game(canvas);
  game.start();
};