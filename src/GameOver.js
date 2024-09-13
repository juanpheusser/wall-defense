// src/GameOver.js
import React from 'react';

function GameOver({ onRetry, score, time }) {
  // Handle key press for retrying the game
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRetry]);

  return (
    <div className="game-over" style={gameOverStyle}>
      <h1>Game Over</h1>
      <p>Score: {score}</p>
      <p>Time Survived: {time} seconds</p>
      <p>Press ENTER to Retry</p>
    </div>
  );
}

// Simple inline styles for the game over screen
const gameOverStyle = {
  textAlign: 'center',
  marginTop: '150px',
};

export default GameOver;
