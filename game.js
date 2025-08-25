// Import Kaboom.js library from CDN
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// Initialize Kaboom context with canvas dimensions and properties
kaboom({
  background: [255, 255, 255], // Set background color to white
  width: window.innerWidth,    // Canvas width: full window width
  height: window.innerHeight,  // Canvas height: full window height
  fullscreen: true,            // Enable fullscreen mode
});

// Utility class for game-related helper functions
class GameUtils {
  /**
   * Converts seconds to "minutes:seconds" format.
   * @param {number} seconds - Total seconds to format.
   * @returns {string} - Formatted time string.
   */
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Returns a random spawn position and velocity for game objects.
   * Spawns on left or right side of the screen.
   * @param {number} headerHeight - Height of the header UI.
   * @param {number} gameHeight - Height of the game area.
   * @returns {{x: number, y: number, velocity: vec2}} - Position and velocity.
   */
  static getRandomSpawnPosition(headerHeight, gameHeight) {
    const spawnSide = choose([0, 1]); // 0: left, 1: right
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
   * Restricts paddle movement within vertical bounds.
   * @param {number} mouseY - Mouse Y position.
   * @param {number} headerHeight - Height of header UI.
   * @param {number} screenHeight - Height of the screen.
   * @returns {number} - Constrained Y position.
   */
  static constrainPaddlePosition(mouseY, headerHeight, screenHeight) {
    const responsive = GameUtils.getResponsiveDimensions();
    // Paddle height based on device breakpoint
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
   * Returns responsive UI dimensions and breakpoint info.
   * @returns {object} - Responsive configuration object.
   */
  static getResponsiveDimensions() {
    const screenWidth = width();
    const screenHeight = height();
    // Device breakpoints
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
    // Breakpoint-specific UI configs
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

// UI Manager class for handling UI elements
class UIManager {
  static headerHeight = 60; // Height of the top header bar

  /**
   * Creates the top header UI with title, mode, and timer.
   * @param {string} gameMode - Current game mode.
   * @param {object} gameInstance - Game state object.
   */
  static createHeader(gameMode, gameInstance) {
    const responsive = GameUtils.getResponsiveDimensions();

    // Header background bar
    add([
      pos(0, 0),
      rect(width(), this.headerHeight),
      color(50, 50, 50),
      z(10),
      "header",
    ]);

    // Game title text
    add([
      text("PONG GAME", { size: responsive.headerSize }),
      pos(20, this.headerHeight / 2),
      anchor("left"),
      color(255, 255, 255),
      z(20),
      "header",
    ]);

    // Game mode display
    add([
      text(`Mode: ${gameMode.toUpperCase()}`, { size: responsive.headerSize * 0.7 }),
      pos(center().x, this.headerHeight / 2),
      anchor("center"),
      color(255, 255, 0),
      z(20),
      "header",
    ]);

    // Timer display (updates in real-time)
    add([
      text("Time: 0:00", { size: responsive.headerSize * 0.8 }),
      pos(width() - 20, this.headerHeight / 2),
      anchor("right"),
      color(255, 255, 255),
      z(20),
      "header",
      {
        update() {
          if (gameInstance && gameInstance.gameState === "playing") {
            this.text = `Time: ${GameUtils.formatTime(gameInstance.gameTime)}`;
          }
        },
      },
    ]);

    // Separator line below header
    add([
      pos(0, this.headerHeight),
      rect(width(), 2),
      color(100, 100, 100),
      z(15),
      "header",
    ]);
  }

  /**
   * Displays instructions for controlling the game.
   * @param {object} responsive - Responsive UI config.
   */
  static createInstructions(responsive) {
    add([
      text("Move your mouse to control the paddles", { size: responsive.buttonSize * 0.8 }),
      pos(center().x, center().y + responsive.modalHeight * 0.15),
      anchor("center"),
      color(100, 100, 100),
      z(40),
      "menu",
    ]);
  }

  /**
   * Creates the "START GAME" button.
   * @param {object} responsive - Responsive UI config.
   */
  static createStartButton(responsive) {
    add([
      text("START GAME", { size: responsive.subtitleSize }),
      pos(center().x, center().y + responsive.modalHeight * 0.28),
      anchor("center"),
      color(0, 150, 0),
      area(),
      z(40),
      "menu",
      "startButton",
    ]);
  }

  /**
   * Displays the game over screen with score and time.
   * @param {number} score - Final score.
   * @param {string} finalTime - Final time played.
   */
  static createGameOverScreen(score, finalTime) {
    const responsive = GameUtils.getResponsiveDimensions();

    // Modal background for game over
    add([
      pos(center().x, center().y),
      rect(responsive.modalWidth, responsive.modalHeight),
      color(240, 240, 240),
      outline(4),
      anchor("center"),
      z(30),
      "gameOver",
    ]);

    // "GAME OVER!" title
    add([
      text("GAME OVER!", { size: responsive.titleSize }),
      pos(center().x, center().y - responsive.modalHeight * 0.35),
      anchor("center"),
      color(200, 50, 50),
      z(40),
      "gameOver",
    ]);

    // Final score display
    add([
      text(`Final Score: ${score}`, { size: responsive.subtitleSize }),
      pos(center().x, center().y - responsive.modalHeight * 0.15),
      anchor("center"),
      color(50, 50, 50),
      z(40),
      "gameOver",
    ]);

    // Final time display
    add([
      text(`Time Played: ${GameUtils.formatTime(finalTime)}`, { size: responsive.subtitleSize }),
      pos(center().x, center().y - responsive.modalHeight * 0.05),
      anchor("center"),
      color(50, 50, 50),
      z(40),
      "gameOver",
    ]);

    // Add game over buttons
    this.createGameOverButtons(responsive);
  }

  /**
   * Adds "PLAY AGAIN" and "MAIN MENU" buttons to the game over screen.
   * @param {object} responsive - Responsive UI config.
   */
  static createGameOverButtons(responsive) {
    // "PLAY AGAIN" button
    add([
      text("PLAY AGAIN", { size: responsive.buttonSize }),
      pos(center().x, center().y + responsive.modalHeight * 0.12),
      anchor("center"),
      color(0, 150, 0),
      area(),
      z(40),
      "gameOver",
      "playAgainButton",
    ]);

    // "MAIN MENU" button
    add([
      text("MAIN MENU", { size: responsive.buttonSize }),
      pos(center().x, center().y + responsive.modalHeight * 0.25),
      anchor("center"),
      color(100, 100, 100),
      area(),
      z(40),
      "gameOver",
      "menuButton",
    ]);
  }
}

// Ball Manager Class
class BallManager {
  constructor() {
    this.balls = [];
  }

  createBall(x, y, velocity, speed) {
    // Breakpoint-based ball size
    const responsive = GameUtils.getResponsiveDimensions();
    const ballConfigs = {
      mobile: { radius: 10 },
      tablet: { radius: 12 },
      laptop: { radius: 14 },
      desktop: { radius: 16 }
    };
    
    const ballRadius = ballConfigs[responsive.breakpoint].radius;
    
    const ball = add([
      pos(x, y),
      circle(ballRadius),
      color(255, 100, 100),
      outline(4),
      area({ shape: new Rect(vec2(-ballRadius), ballRadius * 2, ballRadius * 2) }),
      { vel: velocity, speed: speed },
      "ball",
      "game",
    ]);

    this.balls.push(ball);
    return ball;
  }

  createInitialBall(headerHeight) {
    // Create ball with more predictable starting angle
    const startDirection = choose([-1, 1]); // Random left or right
    const startAngle = rand(-30, 30); // Angle between -30 and 30 degrees
    const initialVelocity = Vec2.fromAngle(startAngle).scale(vec2(startDirection, 1)).unit();
    
    return this.createBall(
      center().x,
      headerHeight + (height() - headerHeight) / 2,
      initialVelocity,
      600
    );
  }

  spawnNewBall(headerHeight, gameHeight) {
    const spawnInfo = GameUtils.getRandomSpawnPosition(headerHeight, gameHeight);
    return this.createBall(spawnInfo.x, spawnInfo.y, spawnInfo.velocity, 600);
  }

  updateBalls(headerHeight, gameHeight, onGameOver) {
    const ballsCopy = [...this.balls];

    ballsCopy.forEach((ball) => {
      if (ball && ball.exists()) {
        ball.move(ball.vel.scale(ball.speed));

        // Ball goes off screen horizontally - game over
        if (ball.pos.x < 0 || ball.pos.x > width()) {
          onGameOver();
          return;
        }

        // Ball bounces off top/bottom walls with proper physics
        if (ball.pos.y <= headerHeight || ball.pos.y >= gameHeight) {
          // Reflect the Y velocity but keep X velocity the same
          ball.vel.y = -ball.vel.y;
          
          // Ensure ball doesn't get stuck in walls
          if (ball.pos.y <= headerHeight) {
            ball.pos.y = headerHeight + 1;
          } else if (ball.pos.y >= gameHeight) {
            ball.pos.y = gameHeight - 1;
          }
        }
      }
    });
  }

  reset() {
    this.balls = [];
  }

  get count() {
    return this.balls.length;
  }
}