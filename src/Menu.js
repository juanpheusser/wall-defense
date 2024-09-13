// src/Menu.js
import React from 'react';

function Menu({ onStart }) {
  // Handle key press for starting the game
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="menu" style={menuStyle}>
      <h1>Wall Defense</h1>
      <div style={instructionsStyle}>
        <h2>How to Play:</h2>
        <ol>
          <li>Defend your wall from incoming attackers</li>
          <li>Move the cannon up and down using the arrow keys</li>
          <li>Press and hold the spacebar to control firing power</li>
          <li>Release the spacebar to fire cannonballs</li>
          <li>Destroy attackers before they reach your wall</li>
          <li>Score points for each attacker destroyed</li>
          <li>The game ends if any attacker reaches your wall</li>
        </ol>
      </div>
      <p style={startPromptStyle}>Press ENTER to Start</p>
    </div>
  );
}

// Styles for the menu
const menuStyle = {
  textAlign: 'center',
  marginTop: '50px',
  fontFamily: 'Arial, sans-serif',
};

const instructionsStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  textAlign: 'left',
  backgroundColor: '#f0f0f0',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const startPromptStyle = {
  fontSize: '1.2em',
  fontWeight: 'bold',
};

export default Menu;
