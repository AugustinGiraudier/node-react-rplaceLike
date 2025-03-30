import PropTypes from 'prop-types';
import "./BoardCard.css";
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';

const { VITE_API_URL } = import.meta.env;

BoardCard.propTypes = {
	name: PropTypes.string.isRequired,
	author: PropTypes.string.isRequired,
	time: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	refreshTrigger: PropTypes.number
};

const getNameWithMaxLength = (str, n) => {
	if (str.length > n) {
		return `${str.slice(0, n - 3)}...`;
	}
	return str;
};

function BoardCard({ name, author, time, id, refreshTrigger }) {
	const [previewLoaded, setPreviewLoaded] = useState(false);
	const [previewError, setPreviewError] = useState(false);
	const [cacheKey, setCacheKey] = useState(Date.now());

	// Actualiser le cacheKey quand refreshTrigger change
	useEffect(() => {
		setCacheKey(Date.now());
		setPreviewLoaded(false);
		setPreviewError(false);
	}, [refreshTrigger]);


	// Ajouter un paramètre cache-busting à l'URL pour éviter la mise en cache par le navigateur
	const snapshotUrl = `${VITE_API_URL}/snapshot/board/${id}/snapshot?t=${cacheKey}`;

	const handleImageError = () => {
		setPreviewError(true);
	};

	const handleImageLoad = () => {
		setPreviewLoaded(true);
	};

	const displayableProps = useMemo(() => {
		return {
			name: getNameWithMaxLength(name, 15),
			author: getNameWithMaxLength(author, 15),
			time: time
		};
	}, [name, author, time]);

	return (
		<Link to={`/pixelBoards/${id}`}>
			<div className="board-card-vignette">
				<div className="board-card-content">
					<div className="board-card-preview-container">
						{!previewError ? (
							<img
								src={snapshotUrl}
								alt={`Preview of ${name}`}
								className={`board-card-preview ${previewLoaded ? 'loaded' : ''}`}
								onError={handleImageError}
								onLoad={handleImageLoad}
							/>
						) : (
							<div className="board-card-preview-placeholder">
								<span>No preview</span>
							</div>
						)}
					</div>
					<div className="board-card-info">
						<h2>{displayableProps.name}</h2>
						<p>By <strong>{displayableProps.author}</strong></p>
						<div className='board-card-timer-container'>
							<svg className='board-card-timer-icon' viewBox="0 0 448 512"><path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
							<p className="board-card-time-left">{displayableProps.time}</p>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default BoardCard;
