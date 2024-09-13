// src/App.js
import React from 'react';
import Menu from './Menu';
import Game from './Game';
import GameOver from './GameOver';

function App() {
  const [state, setState] = React.useState('menu'); // Possible states: 'menu', 'game', 'gameOver'
  const [score, setScore] = React.useState(0);
  const [timeSurvived, setTimeSurvived] = React.useState(0);

  const handleStart = () => {
    setState('game');
  };

  const handleGameOver = (finalScore, elapsedTime) => {
    setScore(finalScore);
    setTimeSurvived(elapsedTime);
    setState('gameOver');
  };

  const handleRetry = () => {
    setScore(0);
    setTimeSurvived(0);
    setState('game');
  };

  return (
    <div className="App">
      {state === 'menu' && <Menu onStart={handleStart} />}
      {state === 'game' && <Game onGameOver={handleGameOver} />}
      {state === 'gameOver' && (
        <GameOver onRetry={handleRetry} score={score} time={timeSurvived} />
      )}
    </div>
  );
}

export default App;
