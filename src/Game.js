// src/Game.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GiWreckingBall, GiCornerExplosion, GiStoneWall, GiCannon } from "react-icons/gi";
import { renderToStaticMarkup } from 'react-dom/server';

function Game({ onGameOver }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const startTimeRef = useRef();

  const scoreRef = useRef(0);
  const elapsedTimeRef = useRef(0);

  const gameStateRef = useRef({
    WIDTH: 1200,
    HEIGHT: 600,
    wallWidth: 50,
    wallHeight: 100,
    gravity: 0.6,
    
    // Cannon variables
    cannonAngle: 45, // degrees
    minAngle: -45,
    maxAngle: 80,
    cannonAngleSpeed: 2,
    power: 0,
    minPower: 3,
    maxPower: 30,
    powerIncrement: 0.3,
    cannonPos: { x: 30, y: 490 },
    cannonSize: 60, // size of the cannon icon
    cannonBalls: 1,
    pierce: 1,
    
    // Game objects
    cannonballs: [],
    attackers: [],
    explosions: [],
    
    // Input flags
    angleUp: false,
    angleDown: false,
    spacePressed: false,
    
    // Timing variables
    lastShotTime: 0,
    reloadTime: 750, // milliseconds
    
    // Spawning variables
    gameTime: 0,
    spawnInterval: 3000,
    minSpawnInterval: 100,
    spawnDecreaseRate: 0.97,
    lastAttackerSpawnTime: performance.now(),
    initialBaseSpeed: 0.5,
    maxBaseSpeed: 5.0,
    baseSpeedIncreaseRate: 0.0001,
    maxTimeForTwoColumns: 180000, // milliseconds
  });

  const [activePowerUps, setActivePowerUps] = useState([]);
  const flashingPowerUpRef = useRef(null);
  const flashStartTimeRef = useRef(0);

  const powerUps = [
    { name: "+5 base cannon power", effect: () => { gameStateRef.current.minPower += 5; } },
    { name: "Faster reload", effect: () => { gameStateRef.current.reloadTime -= 50; } },
    { name: "Faster power build", effect: () => { gameStateRef.current.powerIncrement += 0.1; } },
    { name: "+1 cannon ball", effect: () => { gameStateRef.current.cannonBalls += 1; } },
    { name: "+1 pierce", effect: () => { gameStateRef.current.pierce += 1; } },
  ];

  const grantRandomPowerUp = () => {
    const randomPowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    randomPowerUp.effect();
    setActivePowerUps(prev => [...prev, randomPowerUp.name]);
    flashingPowerUpRef.current = randomPowerUp.name;
    flashStartTimeRef.current = performance.now();
    console.log("Power-up granted:", randomPowerUp.name);
    setTimeout(() => {
      flashingPowerUpRef.current = null;
      console.log("Flashing ended");
    }, 3000);
  };

  const [flashingEvent, setFlashingEvent] = useState(null);
  const specialEventRef = useRef(null);

  const specialEvents = [
    { 
      name: "Antigravity", 
      effect: () => { gameStateRef.current.gravity *= -1; },
      revert: () => { gameStateRef.current.gravity *= -1; }
    },
    { 
      name: "Moon gravity", 
      effect: () => { gameStateRef.current.gravity /= 2; },
      revert: () => { gameStateRef.current.gravity *= 2; }
    },
    { 
      name: "Super gravity", 
      effect: () => { gameStateRef.current.gravity *= 2; },
      revert: () => { gameStateRef.current.gravity /= 2; }
    },
    { 
      name: "Slow reload", 
      effect: () => { gameStateRef.current.reloadTime *= 2; },
      revert: () => { gameStateRef.current.reloadTime /= 2; }
    },
    { 
      name: "Attacker superspeed", 
      effect: () => { gameStateRef.current.attackers.forEach(attacker => attacker.speed *= 2); },
      revert: () => { gameStateRef.current.attackers.forEach(attacker => attacker.speed /= 2); }
    },
    { 
      name: "Super spawn", 
      effect: () => { gameStateRef.current.spawnInterval *= 0.5; },
      revert: () => { gameStateRef.current.spawnInterval *= 2; }
    },
  ];

  const triggerSpecialEvent = () => {
    if (specialEventRef.current) {
      specialEventRef.current.revert();
    }
    const randomEvent = specialEvents[Math.floor(Math.random() * specialEvents.length)];
    randomEvent.effect();
    specialEventRef.current = randomEvent;
    setFlashingEvent(randomEvent.name);
    setTimeout(() => setFlashingEvent(null), 3000); // Flash for 3 seconds
    setTimeout(() => {
      if (specialEventRef.current === randomEvent) {
        randomEvent.revert();
        specialEventRef.current = null;
      }
    }, 10000); // Revert after 10 seconds
  };

  useEffect(() => {
    const specialEventInterval = setInterval(() => {
      triggerSpecialEvent();
    }, 60000); // Trigger every 60 seconds

    const powerUpInterval = setInterval(() => {
      grantRandomPowerUp();
    }, 60000); // Grant power-up every 60 seconds

    // Offset special events by 5 seconds
    setTimeout(() => {
      triggerSpecialEvent();
    }, 5000);

    return () => {
      clearInterval(specialEventInterval);
      clearInterval(powerUpInterval);
    };
  }, []);

  const cannonballImageRef = useRef(null);
  const explosionImageRef = useRef(null);
  const wallImageRef = useRef(null);
  const cannonImageRef = useRef(null);

  useEffect(() => {
    // Create cannonball image
    const cannonballSvgString = encodeURIComponent(renderToStaticMarkup(<GiWreckingBall />));
    const cannonballImg = new Image();
    cannonballImg.src = `data:image/svg+xml,${cannonballSvgString}`;
    cannonballImg.onload = () => {
      cannonballImageRef.current = cannonballImg;
    };

    // Create explosion image
    const explosionSvgString = encodeURIComponent(renderToStaticMarkup(<GiCornerExplosion />));
    const explosionImg = new Image();
    explosionImg.src = `data:image/svg+xml,${explosionSvgString}`;
    explosionImg.onload = () => {
      explosionImageRef.current = explosionImg;
    };

    // Create wall image
    const wallSvgString = encodeURIComponent(renderToStaticMarkup(<GiStoneWall />));
    const wallImg = new Image();
    wallImg.src = `data:image/svg+xml,${wallSvgString}`;
    wallImg.onload = () => {
      wallImageRef.current = wallImg;
    };

    // Create cannon image
    const cannonSvgString = encodeURIComponent(renderToStaticMarkup(<GiCannon />));
    const cannonImg = new Image();
    cannonImg.src = `data:image/svg+xml,${cannonSvgString}`;
    cannonImg.onload = () => {
      cannonImageRef.current = cannonImg;
    };
  }, []);

  class Explosion {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 30;
      this.duration = 10; // Number of frames the explosion lasts
      this.frame = 0;
    }

    update() {
      this.frame++;
    }

    isFinished() {
      return this.frame >= this.duration;
    }

    draw(context) {
      if (explosionImageRef.current) {
        const opacity = 1 - (this.frame / this.duration);
        context.globalAlpha = opacity;
        context.drawImage(explosionImageRef.current, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        context.globalAlpha = 1;
      }
    }
  }

  class CannonBall {
    constructor(x, y, angle, power) {
      this.radius = 10;
      this.x = x;
      this.y = y;
      const angleRad = (-angle * Math.PI) / 180;
      this.vx = power * Math.cos(angleRad);
      this.vy = power * Math.sin(angleRad);
    }
    
    update() {
      this.vy += gameStateRef.current.gravity;
      this.x += this.vx;
      this.y += this.vy;
    }
    
    isOffScreen() {
      const { WIDTH, HEIGHT } = gameStateRef.current;
      return this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT;
    }
    
    draw(context) {
      if (cannonballImageRef.current) {
        const size = this.radius * 2;
        context.drawImage(cannonballImageRef.current, this.x - this.radius, this.y - this.radius, size, size);
      } else {
        // Fallback to drawing a circle if the image hasn't loaded yet
        context.fillStyle = 'black';
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  
  class Attacker {
    constructor(speed, columns, height) {
      const { WIDTH, HEIGHT } = gameStateRef.current;
      this.columns = columns;
      this.width = 20 * columns;
      this.height = height;
      this.x = WIDTH;
      // Fix: Align the bottom of the attacker with the bottom of the canvas
      this.y = HEIGHT - this.height;
      this.speed = speed;
      this.hitsSinceLastReduction = 0;
    }
    
    update() {
      this.x -= this.speed;
    }
    
    isAtWall() {
      return this.x <= gameStateRef.current.wallWidth;
    }
    
    draw(context) {
      context.fillStyle = 'black';
      context.fillRect(this.x, this.y, this.width, this.height);
    }
    
    reduceHeight() {
      this.height = Math.floor(this.height / 2);
      // Fix: Update y-position when height is reduced
      this.y = gameStateRef.current.HEIGHT - this.height;
    }
    
    isDestroyed() {
      return this.height < 0.5 * gameStateRef.current.wallHeight;
    }
  }

  const updateCannonballs = () => {
    const cannonballs = gameStateRef.current.cannonballs;
    for (let i = cannonballs.length - 1; i >= 0; i--) {
      const cannonball = cannonballs[i];
      cannonball.update();
      if (cannonball.isOffScreen()) {
        cannonballs.splice(i, 1);
      }
    }
  };

  const updateAttackers = () => {
    const attackers = gameStateRef.current.attackers;
    for (let i = attackers.length - 1; i >= 0; i--) {
      const attacker = attackers[i];
      attacker.update();
      if (attacker.isAtWall()) {
        // Game over
        onGameOver(scoreRef.current, elapsedTimeRef.current);
        return;
      }
    }
  };

  const updateScore = (increment) => {
    setScore((prevScore) => {
      const newScore = prevScore + increment;
      scoreRef.current = newScore;
      return newScore;
    });
  };

  const handleCollisions = () => {
    const cannonballs = gameStateRef.current.cannonballs;
    const attackers = gameStateRef.current.attackers;
    
    for (let i = cannonballs.length - 1; i >= 0; i--) {
      const cannonball = cannonballs[i];
      for (let j = attackers.length - 1; j >= 0; j--) {
        const attacker = attackers[j];
        if (isColliding(cannonball, attacker)) {
          // Create an explosion at the point of impact
          gameStateRef.current.explosions.push(new Explosion(cannonball.x, cannonball.y));

          if (attacker.columns === 1) {
            attacker.reduceHeight();
            if (attacker.isDestroyed()) {
              attackers.splice(j, 1);
              updateScore(10);
            }
          } else if (attacker.columns === 2) {
            attacker.hitsSinceLastReduction += 1;
            if (attacker.hitsSinceLastReduction >= 2) {
              attacker.hitsSinceLastReduction = 0;
              attacker.reduceHeight();
              if (attacker.isDestroyed()) {
                attackers.splice(j, 1);
                updateScore(10);
              }
            }
          }
          // Remove the cannonball
          cannonballs.splice(i, 1);
          break;
        }
      }
    }
  };

  const isColliding = (cannonball, attacker) => {
    return (
      cannonball.x + cannonball.radius > attacker.x &&
      cannonball.x - cannonball.radius < attacker.x + attacker.width &&
      cannonball.y + cannonball.radius > attacker.y &&
      cannonball.y - cannonball.radius < attacker.y + attacker.height
    );
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const gameState = gameStateRef.current;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw wall
    if (wallImageRef.current) {
      const wallPattern = context.createPattern(wallImageRef.current, 'repeat');
      context.save();
      context.fillStyle = wallPattern;
      context.fillRect(0, gameState.HEIGHT - gameState.wallHeight, gameState.wallWidth, gameState.wallHeight);
      context.restore();
    } else {
      // Fallback to a solid color if the image hasn't loaded
      context.fillStyle = 'gray';
      context.fillRect(0, gameState.HEIGHT - gameState.wallHeight, gameState.wallWidth, gameState.wallHeight);
    }
    
    // Draw cannon
    if (cannonImageRef.current) {
      context.save();
      context.translate(gameState.cannonPos.x, gameState.cannonPos.y);
      context.rotate((-gameState.cannonAngle * Math.PI) / 180);
      context.drawImage(
        cannonImageRef.current, 
        -gameState.cannonSize / 2, 
        -gameState.cannonSize / 2, 
        gameState.cannonSize, 
        gameState.cannonSize
      );
      context.restore();
    } else {
      // Fallback to drawing a simple cannon if the image hasn't loaded
      const angleRad = (-gameState.cannonAngle * Math.PI) / 180;
      const endX = gameState.cannonPos.x + gameState.cannonSize * Math.cos(angleRad);
      const endY = gameState.cannonPos.y + gameState.cannonSize * Math.sin(angleRad);
      context.strokeStyle = 'black';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(gameState.cannonPos.x, gameState.cannonPos.y);
      context.lineTo(endX, endY);
      context.stroke();
    }
    
    // Draw cannonballs
    gameState.cannonballs.forEach((cannonball) => {
      cannonball.draw(context);
    });
    
    // Draw attackers
    gameState.attackers.forEach((attacker) => {
      attacker.draw(context);
    });
    
    // Draw power bar only when space is pressed
    if (gameState.spacePressed) {
      context.fillStyle = 'black';
      context.fillRect(
        gameState.wallWidth + 10,
        gameState.HEIGHT - gameState.wallHeight - 50,
        gameState.power * 5,
        10
      );
    }
    
    // Draw score and timer
    context.fillStyle = 'black';
    context.font = '24px Arial';
    context.fillText(`Score: ${scoreRef.current}`, 10, 30);
    context.fillText(`Time: ${elapsedTimeRef.current}s`, gameState.WIDTH - 150, 30);
    
    // Render active power-ups
    context.font = '16px Arial';
    activePowerUps.forEach((powerUp, index) => {
      context.fillText(`Active: ${powerUp}`, 10, gameState.HEIGHT - 20 - (index * 20));
    });
    
    // Render flashing power-up notification
    if (flashingPowerUpRef.current) {
      const flashElapsedTime = performance.now() - flashStartTimeRef.current;
      const flashOpacity = Math.sin(flashElapsedTime / 100) * 0.5 + 0.5;
      
      context.save();
      context.fillStyle = `rgba(255, 0, 0, ${flashOpacity})`;
      context.font = 'bold 36px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(flashingPowerUpRef.current, gameState.WIDTH / 2, gameState.HEIGHT / 2);
      context.restore();
    }
    
    // Render flashing special event notification
    if (flashingEvent) {
      context.save();
      context.fillStyle = `rgba(255, 165, 0, ${0.5 + 0.5 * Math.sin(Date.now() / 100)})`; // Bright orange
      context.font = 'bold 36px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(flashingEvent, gameState.WIDTH / 2, gameState.HEIGHT / 2 + 50); // Position below power-up notification
      context.restore();
    }
    
    // Draw explosions
    gameState.explosions.forEach(explosion => {
      explosion.draw(context);
    });
  };

  const spawnAttacker = () => {
    const gameState = gameStateRef.current;
    const currentTime = performance.now();
    
    if (currentTime - gameState.lastAttackerSpawnTime >= gameState.spawnInterval) {
      // Increase base speed over time
      const currentBaseSpeed = Math.min(
        gameState.initialBaseSpeed + gameState.gameTime * gameState.baseSpeedIncreaseRate,
        gameState.maxBaseSpeed
      );
      
      // Calculate probability of 2-column attacker
      const probTwoColumns = Math.min(gameState.gameTime / gameState.maxTimeForTwoColumns, 1.0);
      const columns = Math.random() < probTwoColumns ? 2 : 1;
      const height = gameState.wallHeight * (Math.random() * 2.5 + 0.5);
      const speed = Math.max(
        0.5,
        Math.min(currentBaseSpeed + Math.random() * 2 - 1, gameState.maxBaseSpeed)
      );
      
      const attacker = new Attacker(speed, columns, height);
      gameState.attackers.push(attacker);
      
      // Decrease spawn interval over time
      gameState.spawnInterval = Math.max(
        gameState.minSpawnInterval,
        gameState.spawnInterval * gameState.spawnDecreaseRate
      );
      
      gameState.lastAttackerSpawnTime = currentTime;
    }
  };

  const fireCannonball = (power) => {
    const gameState = gameStateRef.current;
    const angleRad = (-gameState.cannonAngle * Math.PI) / 180;
    
    // Calculate the cannon's "muzzle" position
    const muzzleLength = gameState.cannonSize * 0.7; // Adjust this factor as needed
    const muzzleX = gameState.cannonPos.x + muzzleLength * Math.cos(angleRad);
    const muzzleY = gameState.cannonPos.y + muzzleLength * Math.sin(angleRad);
    
    const baseAngle = gameState.cannonAngle;
    const angleDecrement = 5; // Decrease angle by 5 degrees for each subsequent ball

    for (let i = 0; i < gameState.cannonBalls; i++) {
      const currentAngle = baseAngle - (i * angleDecrement);
      const angleRad = (-currentAngle * Math.PI) / 180;
      const endX = muzzleX + gameState.cannonSize * Math.cos(angleRad)*0.5;
      const endY = muzzleY + gameState.cannonSize * Math.sin(angleRad)*0.5;
      
      // Create the original cannonball
      const cannonball = new CannonBall(endX, endY, currentAngle, power);
      gameState.cannonballs.push(cannonball);
      
      // Create additional copies if pierce is greater than 1
      for (let j = 0; j < gameState.pierce - 1; j++) {
        const copyCannonball = new CannonBall(endX, endY, currentAngle, power);
        gameState.cannonballs.push(copyCannonball);
      }
    }
  };

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        gameStateRef.current.spacePressed = true;
      } else if (e.code === 'ArrowUp') {
        gameStateRef.current.angleUp = true;
      } else if (e.code === 'ArrowDown') {
        gameStateRef.current.angleDown = true;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        gameStateRef.current.spacePressed = false;
        // Fire cannonball logic here, using the current power
        if (gameStateRef.current.power >= gameStateRef.current.minPower) {
          fireCannonball(gameStateRef.current.power);
        }
        gameStateRef.current.power = gameStateRef.current.minPower; // Reset power to minPower after firing
      } else if (e.code === 'ArrowUp') {
        gameStateRef.current.angleUp = false;
      } else if (e.code === 'ArrowDown') {
        gameStateRef.current.angleDown = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkGameOver = () => {
    const attackers = gameStateRef.current.attackers;
    for (let i = attackers.length - 1; i >= 0; i--) {
      const attacker = attackers[i];
      if (attacker.isAtWall()) {
        // Game over
        onGameOver(scoreRef.current, elapsedTimeRef.current);
        return true;
      }
    }
    return false;
  };

  const updateExplosions = () => {
    const explosions = gameStateRef.current.explosions;
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].update();
      if (explosions[i].isFinished()) {
        explosions.splice(i, 1);
      }
    }
  };

  const gameLoop = (time) => {
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;
    
    const gameState = gameStateRef.current;

    const elapsedTime = Math.floor((time - startTimeRef.current) / 1000);
    if (elapsedTime !== elapsedTimeRef.current) {
        elapsedTimeRef.current = elapsedTime;
        setElapsedTime(elapsedTime);
    }

    
    // Update game time
    gameState.gameTime += deltaTime;
    
    // Adjust cannon angle
    if (gameState.angleUp) {
      gameState.cannonAngle += gameState.cannonAngleSpeed;
      if (gameState.cannonAngle > gameState.maxAngle) {
        gameState.cannonAngle = gameState.maxAngle;
      }
    }
    if (gameState.angleDown) {
      gameState.cannonAngle -= gameState.cannonAngleSpeed;
      if (gameState.cannonAngle < gameState.minAngle) {
        gameState.cannonAngle = gameState.minAngle;
      }
    }
    
    // Update power build
    if (gameState.spacePressed) {
      gameState.power += gameState.powerIncrement;
      if (gameState.power > gameState.maxPower) {
        gameState.power = gameState.maxPower;
      }
    }
    
    // Spawn attackers
    spawnAttacker();
    
    // Update game objects
    updateCannonballs();
    updateAttackers();
    
    // Handle collisions
    handleCollisions();
    updateExplosions();
    
    // Render the game
    renderGame();
    
    // Update score in the game loop
    setScore(scoreRef.current);
    
    // Check for game over
    if (checkGameOver()) {
      cancelAnimationFrame(requestRef.current);
      return;
    }
    
    // Continue the loop
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Start the game loop
    startTimeRef.current = performance.now();
    previousTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);
  
  const canvasStyle = {
    border: '1px solid black',
    display: 'block',
    margin: '0 auto',
  };
  
  const hudStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    color: 'black',
  };
  
  
  // We'll fill in the details here
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        color: '#333',
        marginBottom: '20px'
      }}>
        Wall Defense
      </h1>
      <canvas 
        ref={canvasRef} 
        width={1200} 
        height={600} 
        style={{ 
          border: '1px solid black',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
}

export default Game;
