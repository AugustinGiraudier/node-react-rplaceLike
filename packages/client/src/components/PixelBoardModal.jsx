import { useState } from 'react';
import '../styles/AdminDashboard.css';

function PixelBoardModal({ isOpen, onClose, onSubmit, initialBoard = null }) {
  const [boardForm, setBoardForm] = useState(initialBoard ? {
    name: initialBoard.name,
    width: initialBoard.width,
    height: initialBoard.height,
    placementDelay: initialBoard.placementDelay,
    chunkSize: initialBoard.chunkSize || 16
  } : {
    name: '',
    width: 512,
    height: 512,
    placementDelay: 3000,
    chunkSize: 16
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(boardForm);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal">
      <div className="admin-modal-content">
        <h2>{initialBoard ? 'Edit PixelBoard' : 'Create New PixelBoard'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <input
              type="text"
              value={boardForm.name}
              onChange={(e) => setBoardForm({...boardForm, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Width (multiple of 16)</label>
            <input
              type="number"
              value={boardForm.width}
              onChange={(e) => setBoardForm({...boardForm, width: parseInt(e.target.value)})}
              min="16"
              step="16"
              required
            />
          </div>
          <div>
            <label>Height (multiple of 16)</label>
            <input
              type="number"
              value={boardForm.height}
              onChange={(e) => setBoardForm({...boardForm, height: parseInt(e.target.value)})}
              min="16"
              step="16"
              required
            />
          </div>
          <div>
            <label>Chunk Size</label>
            <input
              type="number"
              value={boardForm.chunkSize}
              onChange={(e) => setBoardForm({...boardForm, chunkSize: parseInt(e.target.value)})}
              min="16"
              step="16"
              required
            />
          </div>
          <div>
            <label>Placement Delay (milliseconds)</label>
            <input
              type="number"
              value={boardForm.placementDelay}
              onChange={(e) => setBoardForm({...boardForm, placementDelay: parseInt(e.target.value)})}
              min="1"
              required
            />
          </div>
          <div className="admin-modal-actions">
            <button type="submit">
              {initialBoard ? 'Update Board' : 'Create Board'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PixelBoardModal;
