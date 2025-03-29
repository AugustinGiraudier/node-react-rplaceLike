import { useState, useEffect, useRef } from 'react';
import './Board.css';

// Palette de 16 couleurs
const COLORS = [
  '#FFFFFF', // blanc
  '#E4E4E4', // gris clair
  '#888888', // gris
  '#222222', // noir
  '#FFA7D1', // rose
  '#E50000', // rouge
  '#E59500', // orange
  '#A06A42', // marron
  '#E5D900', // jaune
  '#94E044', // vert clair
  '#02BE01', // vert
  '#00D3DD', // cyan
  '#0083C7', // bleu clair
  '#0000EA', // bleu
  '#CF6EE4', // violet
  '#820080'  // violet foncé
];

// Liste de noms fictifs pour la démo
const DEMO_USERS = [
  'Benjus', 'PixelArtist', 'CodeMaster', 'ColorFan', 'ArtGeek',
  'DesignPro', 'WebCreator', 'DigitalPainter', 'ReactDev', 'CanvasMaster'
];

// Durée totale du pixel board en secondes (3 minutes)
const BOARD_DURATION = 3 * 60;

// Fonction pour générer un pixel art simple
const generateSmileyPattern = () => {
  const BOARD_SIZE = 32;
  const pixels = Array(BOARD_SIZE).fill().map(() => 
    Array(BOARD_SIZE).fill().map(() => ({
      color: '#FFFFFF',
      lastModifiedBy: null,
      lastModifiedAt: null,
      cooldownUntil: null
    }))
  );
  
  // Fond jaune clair
  for (let i = 12; i < 20; i++) {
    for (let j = 12; j < 20; j++) {
      pixels[i][j] = {
        color: '#E5D900', 
        lastModifiedBy: DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)],
        lastModifiedAt: new Date(Date.now() - Math.random() * 3600000),
        cooldownUntil: null
      };
    }
  }
  
  // Yeux
  pixels[14][14] = {
    color: '#222222',
    lastModifiedBy: 'Benjus',
    lastModifiedAt: new Date(Date.now() - 120000),
    cooldownUntil: null
  };
  
  pixels[14][17] = {
    color: '#222222',
    lastModifiedBy: 'Benjus',
    lastModifiedAt: new Date(Date.now() - 120000),
    cooldownUntil: null
  };
  
  // Bouche
  for (let j = 14; j <= 17; j++) {
    pixels[17][j] = {
      color: '#222222',
      lastModifiedBy: 'PixelArtist',
      lastModifiedAt: new Date(Date.now() - 300000),
      cooldownUntil: null
    };
  }
  
  pixels[16][14] = {
    color: '#222222',
    lastModifiedBy: 'PixelArtist',
    lastModifiedAt: new Date(Date.now() - 300000),
    cooldownUntil: null
  };
  
  pixels[16][17] = {
    color: '#222222',
    lastModifiedBy: 'PixelArtist',
    lastModifiedAt: new Date(Date.now() - 300000),
    cooldownUntil: null
  };
  
  // Motif pixel art simple
  for (let i = 5; i < 8; i++) {
    for (let j = 5; j < 8; j++) {
      pixels[i][j] = {
        color: '#E50000',
        lastModifiedBy: 'ColorFan',
        lastModifiedAt: new Date(Date.now() - Math.random() * 1800000),
        cooldownUntil: null
      };
    }
  }

  for (let i = 5; i < 8; i++) {
    for (let j = 24; j < 27; j++) {
      pixels[i][j] = {
        color: '#0000EA',
        lastModifiedBy: 'ArtGeek',
        lastModifiedAt: new Date(Date.now() - Math.random() * 1800000),
        cooldownUntil: null
      };
    }
  }

  for (let i = 24; i < 27; i++) {
    for (let j = 5; j < 8; j++) {
      pixels[i][j] = {
        color: '#02BE01',
        lastModifiedBy: 'WebCreator',
        lastModifiedAt: new Date(Date.now() - Math.random() * 1800000),
        cooldownUntil: null
      };
    }
  }

  for (let i = 24; i < 27; i++) {
    for (let j = 24; j < 27; j++) {
      pixels[i][j] = {
        color: '#820080',
        lastModifiedBy: 'ReactDev',
        lastModifiedAt: new Date(Date.now() - Math.random() * 1800000),
        cooldownUntil: null
      };
    }
  }

  return pixels;
};

function BenjusBoard() {
  const [pixels, setPixels] = useState([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState('VisitorUser');
  const [boardStatus, setBoardStatus] = useState('Ouvert');
  const [remainingTime, setRemainingTime] = useState(BOARD_DURATION);
  const hoverTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Initialiser le tableau de pixels avec un motif
  useEffect(() => {
    setPixels(generateSmileyPattern());
    
    // Simuler un utilisateur connecté
    const randomUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    setCurrentUser(randomUser);
    
    // Initialiser le temps de départ
    startTimeRef.current = new Date();
  }, []);

  // Mise à jour des cooldowns et du temps restant toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      // Mise à jour du temps restant
      if (boardStatus === 'Ouvert') {
        const elapsedSeconds = Math.floor((new Date() - startTimeRef.current) / 1000);
        const newRemainingTime = Math.max(0, BOARD_DURATION - elapsedSeconds);
        setRemainingTime(newRemainingTime);
        
        // Vérifier si le temps est écoulé
        if (newRemainingTime === 0) {
          setBoardStatus('Fermé');
        }
      }
      
      // Mise à jour des cooldowns des pixels
      setPixels(prevPixels => {
        // Créer une nouvelle copie seulement si nécessaire
        let updated = false;
        const newPixels = prevPixels.map(row => 
          row.map(pixel => {
            if (pixel.cooldownUntil && pixel.cooldownUntil <= new Date()) {
              updated = true;
              return { ...pixel, cooldownUntil: null };
            }
            return pixel;
          })
        );
        return updated ? newPixels : prevPixels;
      });
      
      // Mettre à jour aussi l'info de survol si nécessaire
      if (hoverInfo && hoverInfo.cooldownUntil) {
        setHoverInfo(prevInfo => {
          if (prevInfo && prevInfo.cooldownUntil && prevInfo.cooldownUntil <= new Date()) {
            return { ...prevInfo, cooldownUntil: null };
          }
          return prevInfo;
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [boardStatus]);

  // Gérer le début du survol d'un pixel
  const handlePixelMouseEnter = (row, col) => {
    // Annuler tout timer en cours
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    // Définir un nouveau timer de 1 seconde
    hoverTimerRef.current = setTimeout(() => {
      setHoverInfo({
        row, 
        col,
        ...pixels[row][col]
      });
    }, 1000);
  };

  // Gérer la fin du survol d'un pixel
  const handlePixelMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverInfo(null);
  };

  // Gérer le clic sur un pixel
  const handlePixelClick = (row, col) => {
    // Vérifier si le board est fermé
    if (boardStatus === 'Fermé') {
      return;
    }
    
    const pixel = pixels[row][col];
    
    // Vérifier si le pixel est en cooldown
    if (pixel.cooldownUntil && pixel.cooldownUntil > new Date()) {
      // Pixel en cooldown, ne rien faire
      return;
    }
    
    // Mettre à jour le pixel
    const newPixels = [...pixels];
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes
    
    newPixels[row][col] = {
      color: selectedColor,
      lastModifiedBy: currentUser,
      lastModifiedAt: now,
      cooldownUntil: cooldownUntil
    };
    
    setPixels(newPixels);
    
    // Mettre à jour l'info de survol si ce pixel est actuellement survolé
    if (hoverInfo && hoverInfo.row === row && hoverInfo.col === col) {
      setHoverInfo({
        row, 
        col,
        color: selectedColor,
        lastModifiedBy: currentUser,
        lastModifiedAt: now,
        cooldownUntil: cooldownUntil
      });
    }
  };

  // Calculer le temps restant du cooldown
  const formatCooldownTime = (cooldownUntil) => {
    if (!cooldownUntil) return null;
    
    const now = new Date();
    if (cooldownUntil <= now) return null;
    
    const diffMs = cooldownUntil - now;
    const diffSec = Math.ceil(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec}s`;
    } else {
      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  // Formater le temps restant du board
  const formatBoardTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="board-container">
      <h1 className="board-title">Benjus Secret PixelBoard</h1>
      
      <div className="board-info">
        <div className="board-details">
          <p>Créé par: <strong>Benjus</strong></p>
          <p>Taille: 32x32</p>
          <p>Connecté en tant que: <strong>{currentUser}</strong></p>
          <div className={`board-status ${boardStatus === 'Fermé' ? 'status-closed' : 'status-open'}`}>
            <p>Statut: <strong>{boardStatus}</strong></p>
            {boardStatus === 'Ouvert' ? (
              <p>Temps restant: <strong>{formatBoardTime(remainingTime)}</strong></p>
            ) : (
              <p>Le pixel board est terminé</p>
            )}
          </div>
        </div>
      </div>

      <div className="color-palette">
        {COLORS.map((color, index) => (
          <div
            key={index}
            className={`color-option ${selectedColor === color ? 'selected' : ''} ${boardStatus === 'Fermé' ? 'disabled' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => boardStatus === 'Ouvert' && setSelectedColor(color)}
            title={`Couleur ${index + 1}`}
          />
        ))}
      </div>

      <div className="pixel-board-container">
        <div className={`pixel-board ${boardStatus === 'Fermé' ? 'board-closed' : ''}`}>
          {pixels.map((row, rowIndex) => (
            <div key={rowIndex} className="pixel-row">
              {row.map((pixel, colIndex) => (
                <div
                  key={colIndex}
                  className={`pixel ${pixel.cooldownUntil && pixel.cooldownUntil > new Date() ? 'in-cooldown' : ''} ${boardStatus === 'Fermé' ? 'closed' : ''}`}
                  style={{ backgroundColor: pixel.color }}
                  onClick={() => handlePixelClick(rowIndex, colIndex)}
                  onMouseEnter={() => handlePixelMouseEnter(rowIndex, colIndex)}
                  onMouseLeave={handlePixelMouseLeave}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Info-bulle de survol */}
        {hoverInfo && (
          <div className="pixel-hover-info" style={{
            position: 'absolute',
            left: `${hoverInfo.col * 15 + 20}px`,
            top: `${hoverInfo.row * 15 - 60}px`
          }}>
            {hoverInfo.lastModifiedBy ? (
              <>
                <p>Placé par: <strong>{hoverInfo.lastModifiedBy}</strong></p>
                {boardStatus === 'Ouvert' && hoverInfo.cooldownUntil && hoverInfo.cooldownUntil > new Date() ? (
                  <p>Temps restant: <strong>{formatCooldownTime(hoverInfo.cooldownUntil)}</strong></p>
                ) : (
                  boardStatus === 'Ouvert' ? <p>Disponible</p> : <p>Pixel board fermé</p>
                )}
              </>
            ) : (
              <p>Pixel non modifié</p>
            )}
          </div>
        )}
      </div>

      <div className="board-instructions">
        <p>Ceci est un pixel board de démonstration r/place.</p>
        <p>Survolez un pixel pendant 1 seconde pour voir qui l'a modifié en dernier.</p>
        <p>Après avoir placé un pixel, il faut attendre 2 minutes avant de pouvoir le modifier à nouveau.</p>
        <p>Le pixel board sera fermé après <strong>3 minutes</strong> et ne pourra plus être modifié.</p>
        {boardStatus === 'Fermé' && (
          <p className="closed-message">Ce pixel board est maintenant fermé et ne peut plus être modifié.</p>
        )}
      </div>
    </div>
  );
}

export default BenjusBoard;