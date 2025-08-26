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
   * Creates the main menu UI, including mode selection and instructions.
   * @param {string} gameMode - Current game mode.
   */
  static createMenu(gameMode) {
    const responsive = GameUtils.getResponsiveDimensions();
    const isSmallScreen = height() <= 800 || width() <= 1400;
    
    // Menu background (responsive)
    add([
      pos(center().x, center().y),
      rect(responsive.modalWidth, responsive.modalHeight),
      color(240, 240, 240),
      outline(4),
      anchor("center"),
      z(30),
      "menu",
    ]);

    // Title (responsive positioning)
    add([
      text("WELCOME TO PONG!", { size: responsive.titleSize }),
      pos(center().x, center().y - responsive.modalHeight * 0.35),
      anchor("center"),
      color(50, 50, 50),
      z(40),
      "menu",
    ]);

    // Mode selection title (responsive positioning)
    add([
      text("SELECT GAME MODE:", { size: responsive.subtitleSize }),
      pos(center().x, center().y - responsive.modalHeight * 0.2),
      anchor("center"),
      color(50, 50, 50),
      z(40),
      "menu",
    ]);

    this.createModeButtons(gameMode, responsive);
    this.createModeDescriptions(responsive);
    this.createInstructions(responsive);
    this.createStartButton(responsive);
  }

  static createModeButtons(gameMode, responsive) {
    const buttonSpacing = responsive.modalWidth * 0.25;
    
    // Speed Mode button
    add([
      text("SPEED MODE", { size: responsive.buttonSize }),
      pos(center().x - buttonSpacing, center().y - responsive.modalHeight * 0.05),
      anchor("center"),
      color(
        gameMode === "speed" ? 0 : 0,
        gameMode === "speed" ? 150 : 0,
        gameMode === "speed" ? 0 : 0
      ),
      area(),
      z(40),
      "menu",
      "speedModeButton",
    ]);

    // Agility Mode button
    add([
      text("AGILITY MODE", { size: responsive.buttonSize }),
      pos(center().x + buttonSpacing, center().y - responsive.modalHeight * 0.05),
      anchor("center"),
      color(
        gameMode === "agility" ? 0 : 0,
        gameMode === "agility" ? 150 : 0,
        gameMode === "agility" ? 0 : 0
      ),
      area(),
      z(40),
      "menu",
      "agilityModeButton",
    ]);
  }

  static createModeDescriptions(responsive) {
    const buttonSpacing = responsive.modalWidth * 0.25;
    
    add([
      text("Ball gets faster", { size: responsive.buttonSize * 0.7 }),
      pos(center().x - buttonSpacing, center().y + responsive.modalHeight * 0.05),
      anchor("center"),
      color(100, 100, 100),
      z(40),
      "menu",
    ]);

    add([
      text("New ball every 10s", { size: responsive.buttonSize * 0.7 }),
      pos(center().x + buttonSpacing, center().y + responsive.modalHeight * 0.05),
      anchor("center"),
      color(100, 100, 100),
      z(40),
      "menu",
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
    this.balls = []; // Array to keep track of all balls in play
  }

  /**
   * Creates a new ball entity and adds it to the game.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {vec2} velocity - Initial velocity vector.
   * @param {number} speed - Initial speed.
   * @returns {KaboomGameObj} - The created ball object.
   */
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

  /**
   * Creates the first ball at the center of the play area.
   * @param {number} headerHeight - Height of the header UI.
   * @returns {KaboomGameObj} - The created ball object.
   */
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

  /**
   * Spawns a new ball at a random position (used in agility mode).
   * @param {number} headerHeight - Height of the header UI.
   * @param {number} gameHeight - Height of the game area.
   * @returns {KaboomGameObj} - The created ball object.
   */
  spawnNewBall(headerHeight, gameHeight) {
    const spawnInfo = GameUtils.getRandomSpawnPosition(headerHeight, gameHeight);
    return this.createBall(spawnInfo.x, spawnInfo.y, spawnInfo.velocity, 600);
  }

  /**
   * Updates all balls: moves them, checks for wall bounces and game over.
   * @param {number} headerHeight - Height of the header UI.
   * @param {number} gameHeight - Height of the game area.
   * @param {Function} onGameOver - Callback for when a ball goes off screen.
   */
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

  /**
   * Removes all balls from the manager (used when restarting).
   */
  reset() {
    this.balls = [];
  }

  /**
   * Returns the current number of balls in play.
   */
  get count() {
    return this.balls.length;
  }
}

// Game Object Manager Class
class GameObjectManager {
  /**
   * Creates two paddles for the game (left and right).
   * @param {number} headerHeight - Height of the header UI.
   * @returns {Array<KaboomGameObj>} - Array of paddle objects.
   */
  static createPaddles(headerHeight) {
    // Breakpoint-based paddle dimensions
    const responsive = GameUtils.getResponsiveDimensions();
    const paddleConfigs = {
      mobile: { width: 15, height: 100, offset: 25 },
      tablet: { width: 18, height: 120, offset: 30 },
      laptop: { width: 20, height: 140, offset: 35 },
      desktop: { width: 22, height: 160, offset: 40 }
    };
    
    const config = paddleConfigs[responsive.breakpoint];
    
    const paddle1 = add([
      pos(config.offset, headerHeight + config.height / 2 + 20),
      rect(config.width, config.height),
      outline(4),
      anchor("center"),
      area(),
      "paddle",
      "game",
    ]);

    const paddle2 = add([
      pos(width() - config.offset, headerHeight + config.height / 2 + 20),
      rect(config.width, config.height),
      outline(4),
      anchor("center"),
      area(),
      "paddle",
      "game",
    ]);

    return [paddle1, paddle2];
  }

  /**
   * Creates the score display in the center of the play area.
   * @param {object} gameInstance - The main game instance.
   * @param {number} headerHeight - Height of the header UI.
   * @returns {KaboomGameObj} - The score display object.
   */
  static createScoreDisplay(gameInstance, headerHeight) {
    return add([
      text(gameInstance.score),
      pos(center().x, headerHeight + (height() - headerHeight) / 2),
      anchor("center"),
      z(50),
      "game",
      {
        update() {
          this.text = gameInstance.score;
        },
      },
    ]);
  }
}

// Main Game Class
class PongGame {
  constructor() {
    // Game state variables
    this.gameState = "menu";      // Current state: menu, playing, or gameOver
    this.gameMode = "speed";      // Game mode: speed or agility
    this.gameTime = 0;            // Elapsed game time (seconds)
    this.finalTime = 0;           // Time at game over
    this.score = 0;               // Player score
    this.lastBallSpawnTime = 0;   // Last time a ball was spawned (agility mode)
    this.ballManager = new BallManager(); // Handles ball creation and updates
    this.paddles = [];            // Array of paddle objects

    this.initializeGame();        // Set up initial game state
    this.setupEventHandlers();    // Register all event handlers
  }

  /**
   * Initializes the game and shows the main menu.
   */
  initializeGame() {
    this.showMenu();
  }

  /**
   * Shows the main menu and resets game objects.
   */
  showMenu() {
    this.gameState = "menu";
    destroyAll("game");    // Remove all game objects
    destroyAll("header");  // Remove header UI
    UIManager.createMenu(this.gameMode); // Show menu UI
  }

  /**
   * Starts a new game session.
   */
  startGame() {
    this.gameState = "playing";
    this.gameTime = 0;
    this.lastBallSpawnTime = 0;
    this.score = 0;
    this.ballManager.reset(); // Remove all balls

    destroyAll("menu");      // Remove menu UI
    destroyAll("gameOver");  // Remove game over UI

    UIManager.createHeader(this.gameMode, this); // Show header UI
    this.createGameObjects();                    // Create paddles, score, and initial ball
  }

  /**
   * Creates paddles, score display, and the initial ball.
   */
  createGameObjects() {
    this.paddles = GameObjectManager.createPaddles(UIManager.headerHeight);
    GameObjectManager.createScoreDisplay(this, UIManager.headerHeight);
    this.ballManager.createInitialBall(UIManager.headerHeight);
  }

  /**
   * Shows the game over screen and final stats.
   */
  showGameOver() {
    this.gameState = "gameOver";
    this.finalTime = this.gameTime;

    destroyAll("game");    // Remove game objects
    destroyAll("header");  // Remove header UI

    UIManager.createGameOverScreen(this.score, this.finalTime); // Show game over UI
  }

  /**
   * Main game update loop, called every frame.
   */
  updateGame() {
    if (this.gameState === "playing" && this.ballManager.count > 0) {
      this.gameTime += dt(); // Increment game time

      // In agility mode, spawn new balls every 10 seconds (up to 10 balls)
      if (this.gameMode === "agility" && this.gameTime - this.lastBallSpawnTime >= 10 && this.ballManager.count < 10) {
        this.ballManager.spawnNewBall(UIManager.headerHeight, height());
        this.lastBallSpawnTime = this.gameTime;
      }

      // Update all balls (movement, collisions, game over check)
      this.ballManager.updateBalls(UIManager.headerHeight, height(), () => {
        this.showGameOver(); // End game if ball goes off screen
      });
    }
  }

  /**
   * Updates paddle positions based on mouse Y position.
   */
  updatePaddles() {
    if (this.gameState === "playing") {
      this.paddles.forEach((paddle) => {
        if (paddle && paddle.exists()) {
          const constrainedY = GameUtils.constrainPaddlePosition(
            mousePos().y,
            UIManager.headerHeight,
            height()
          );
          paddle.pos.y = constrainedY; // Move paddle to constrained position
        }
      });
    }
  }

  /**
   * Handles collision between a ball and a paddle.
   * @param {KaboomGameObj} ball - The ball object.
   * @param {KaboomGameObj} paddle - The paddle object.
   */
  handleBallPaddleCollision(ball, paddle) {
    if (this.gameState === "playing") {
      this.score++; // Increase score on hit

      // Calculate where the ball hit the paddle (normalized between -1 and 1)
      const paddleCenter = paddle.pos.y;
      const ballHitPos = ball.pos.y;
      const paddleHeight = paddle.height || 140; // Use actual paddle height or default
      const hitOffset = (ballHitPos - paddleCenter) / (paddleHeight / 2);

      // Clamp the hit offset to prevent extreme angles
      const clampedOffset = Math.max(-0.8, Math.min(0.8, hitOffset));

      // Calculate new velocity based on hit position
      // Ball reflects horizontally and gets vertical component based on hit position
      const newVelX = ball.pos.x < center().x ? 1 : -1; // Reflect horizontally
      const newVelY = clampedOffset; // Vertical component based on hit position

      // Normalize the velocity vector
      const newVelocity = vec2(newVelX, newVelY).unit();
      ball.vel = newVelocity;

      // Increase ball speed for added challenge
      ball.speed += 80;
    }
  }

  /**
   * Registers all event handlers for UI and game logic.
   */
  setupEventHandlers() {
    // Menu button handlers
    onClick("startButton", () => {
      this.startGame();
    });

    onClick("speedModeButton", () => {
      if (this.gameMode !== "speed") {
        this.gameMode = "speed";
        this.showMenu();
      }
    });

    onClick("agilityModeButton", () => {
      if (this.gameMode !== "agility") {
        this.gameMode = "agility";
        this.showMenu();
      }
    });

    onClick("playAgainButton", () => {
      this.startGame();
    });

    onClick("menuButton", () => {
      destroyAll("gameOver");
      this.showMenu();
    });

    // Paddle update handler (move paddles with mouse)
    onUpdate("paddle", (p) => {
      if (this.gameState === "playing") {
        const constrainedY = GameUtils.constrainPaddlePosition(
          mousePos().y,
          UIManager.headerHeight,
          height()
        );
        p.pos.y = constrainedY;
      }
    });

    // Main game update handler (called every frame)
    onUpdate(() => {
      this.updateGame();
    });

    // Ball and paddle collision handler
    onCollide("ball", "paddle", (b, p) => {
      this.handleBallPaddleCollision(b, p);
    });
  }
}

// Initialize the game by creating a PongGame instance
const game = new PongGame();
