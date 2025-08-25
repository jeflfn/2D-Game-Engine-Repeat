// Import Kaboom.js library.
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// Initialize Kaboom context with canvas dimensions and properties.
kaboom({
  // Set the background color to white.
  background: [255, 255, 255],
  // Set canvas width to full window width.
  width: window.innerWidth,
  // Set canvas height to full window height.
  height: window.innerHeight,
  // Make the game fullscreen.
  fullscreen: true,
});

// A class for utility functions.
class GameUtils {
  /**
   * Formats seconds into a "minutes:seconds" string.
   * @param {number} seconds - The total number of seconds.
   * @returns {string} The formatted time string.
   */
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Generates a random spawn position and velocity on the left or right side of the screen.
   * @param {number} headerHeight - The height of the top UI.
   * @param {number} gameHeight - The height of the game area.
   * @returns {{x: number, y: number, velocity: vec2}} Position and initial velocity.
   */
  static getRandomSpawnPosition(headerHeight, gameHeight) {
    const spawnSide = choose([0, 1]); // 0 = left, 1 = right
    const spawnX = spawnSide === 0 ? 100 : width() - 100;
    const spawnY = headerHeight + 100 + rand(0, gameHeight - headerHeight - 200);
    const direction = spawnSide === 0 ? 1 : -1;
    
    return {
      x: spawnX,
      y: spawnY,
      velocity: vec2(direction * 1, rand(-0.5, 0.5)).unit()
    };
  }
}