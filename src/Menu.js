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
      <p>Press ENTER to Start</p>
    </div>
  );
}

// Simple inline styles for the menu
const menuStyle = {
  textAlign: 'center',
  marginTop: '200px',
};

export default Menu;
