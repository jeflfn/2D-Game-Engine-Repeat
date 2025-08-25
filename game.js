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
  /**
   * Constrains the paddle position within the allowed vertical bounds.
   * @param {number} mouseY - The current mouse Y position.
   * @param {number} headerHeight - The height of the header UI.
   * @param {number} screenHeight - The height of the screen.
   * @returns {number} The constrained Y position for the paddle.
   */
  static constrainPaddlePosition(mouseY, headerHeight, screenHeight) {
    // Get breakpoint-based paddle height
    const responsive = GameUtils.getResponsiveDimensions();
    const paddleConfigs = {
      mobile: { height: 100 },
      tablet: { height: 120 },
      laptop: { height: 140 },
      desktop: { height: 160 }
    };
    
    const paddleHeight = paddleConfigs[responsive.breakpoint].height;
    const minY = headerHeight + paddleHeight / 2;
    const maxY = screenHeight - paddleHeight / 2;
    return Math.max(minY, Math.min(maxY, mouseY));
  }
  /**
   * Detects the current device breakpoint and returns a corresponding configuration object.
   * @returns {{modalWidth: number, modalHeight: number, titleSize: number, subtitleSize: number, buttonSize: number, headerSize: number, spacing: {large: number, medium: number, small: number}, breakpoint: string}}
   */
  static getResponsiveDimensions() {
    const screenWidth = width();
    const screenHeight = height();
    
    // Define breakpoints
    const breakpoints = {
      mobile: { width: 768, height: 600 },
      tablet: { width: 1024, height: 768 },
      laptop: { width: 1366, height: 900 },
      desktop: { width: 1920, height: 1080 }
    };
    
    // Determine current breakpoint
    let currentBreakpoint = 'desktop';
    if (screenWidth <= breakpoints.mobile.width || screenHeight <= breakpoints.mobile.height) {
      currentBreakpoint = 'mobile';
    } else if (screenWidth <= breakpoints.tablet.width || screenHeight <= breakpoints.tablet.height) {
      currentBreakpoint = 'tablet';
    } else if (screenWidth <= breakpoints.laptop.width || screenHeight <= breakpoints.laptop.height) {
      currentBreakpoint = 'laptop';
    }
    
    // Breakpoint-specific configurations
    const configs = {
      mobile: {
        modalWidth: 300,
        modalHeight: 280,
        titleSize: 18,
        subtitleSize: 14,
        buttonSize: 12,
        headerSize: 12,
        spacing: { large: 20, medium: 12, small: 8 }
      },
      tablet: {
        modalWidth: 400,
        modalHeight: 320,
        titleSize: 22,
        subtitleSize: 16,
        buttonSize: 14,
        headerSize: 14,
        spacing: { large: 25, medium: 15, small: 10 }
      },
      laptop: {
        modalWidth: 450,
        modalHeight: 350,
        titleSize: 24,
        subtitleSize: 18,
        buttonSize: 16,
        headerSize: 16,
        spacing: { large: 30, medium: 18, small: 12 }
      },
      desktop: {
        modalWidth: 500,
        modalHeight: 400,
        titleSize: 32,
        subtitleSize: 20,
        buttonSize: 18,
        headerSize: 18,
        spacing: { large: 40, medium: 24, small: 16 }
      }
    };
    
    return {
      ...configs[currentBreakpoint],
      breakpoint: currentBreakpoint
    };
  }
}
xcsdfasf