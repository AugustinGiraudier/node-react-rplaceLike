import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/PixelBoardModal.css';

const PixelBoardModal = ({ isOpen, onClose, onSubmit, initialBoard }) => {
	const [formData, setFormData] = useState({
		name: '',
		width: 160,
		height: 160,
		placementDelay: 0,
		endingDate: null
	});

	const [formErrors, setFormErrors] = useState({});
	const isEditMode = !!initialBoard;

	// Reset form data when initialBoard changes
	useEffect(() => {
		if (initialBoard) {
			setFormData({
				name: initialBoard.name || '',
				width: initialBoard.width || 160,
				height: initialBoard.height || 160,
				placementDelay: initialBoard.placementDelay || 0,
				endingDate: initialBoard.endingDate ?
					Math.ceil((new Date(initialBoard.endingDate) - new Date()) / (24 * 60 * 60 * 1000)) :
					null
			});
		} else {
			setFormData({
				name: '',
				width: 160,
				height: 160,
				placementDelay: 0,
				endingDate: null
			});
		}
		setFormErrors({});
	}, [initialBoard, isOpen]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (name === 'hasDuration') {
			setFormData({
				...formData,
				endingDate: checked ? 7 : null
			});
			return;
		}

		setFormData({
			...formData,
			[name]: type === 'number' ? parseInt(value, 10) : value
		});
	};

	const validateForm = () => {
		const errors = {};

		if (!formData.name.trim()) {
			errors.name = 'Name is required';
		}

		if (!formData.width || formData.width < 16) {
			errors.width = 'Width must be at least 16px';
		} else if (formData.width % 16 !== 0) {
			errors.width = 'Width must be a multiple of 16';
		}

		if (!formData.height || formData.height < 16) {
			errors.height = 'Height must be at least 16px';
		} else if (formData.height % 16 !== 0) {
			errors.height = 'Height must be a multiple of 16';
		}

		if (formData.placementDelay < 0) {
			errors.placementDelay = 'Placement delay cannot be negative';
		}

		if (formData.endingDate !== null && formData.endingDate <= 0) {
			errors.endingDate = 'Duration must be a positive number of days';
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (validateForm()) {
			onSubmit(formData);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h2>{isEditMode ? 'Edit Board' : 'Create New Board'}</h2>

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="name">Board Name</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							className={formErrors.name ? 'error' : ''}
						/>
						{formErrors.name && <span className="error-message">{formErrors.name}</span>}
					</div>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="width">Width (px)</label>
							<input
								type="number"
								id="width"
								name="width"
								value={formData.width}
								onChange={handleChange}
								min="16"
								step="16"
								className={formErrors.width ? 'error' : ''}
							/>
							{formErrors.width && <span className="error-message">{formErrors.width}</span>}
						</div>

						<div className="form-group">
							<label htmlFor="height">Height (px)</label>
							<input
								type="number"
								id="height"
								name="height"
								value={formData.height}
								onChange={handleChange}
								min="16"
								step="16"
								className={formErrors.height ? 'error' : ''}
							/>
							{formErrors.height && <span className="error-message">{formErrors.height}</span>}
						</div>
					</div>

					<div className="form-group">
						<label htmlFor="placementDelay">Placement Delay (ms)</label>
						<input
							type="number"
							id="placementDelay"
							name="placementDelay"
							value={formData.placementDelay}
							onChange={handleChange}
							min="0"
							className={formErrors.placementDelay ? 'error' : ''}
						/>
						{formErrors.placementDelay && <span className="error-message">{formErrors.placementDelay}</span>}
					</div>

					<div className="form-group">
						<div className="checkbox-group">
							<input
								type="checkbox"
								id="hasDuration"
								name="hasDuration"
								checked={formData.endingDate !== null}
								onChange={handleChange}
							/>
							<label htmlFor="hasDuration">Set Duration</label>
						</div>

						{formData.endingDate !== null && (
							<div className="duration-input">
								<input
									type="number"
									id="endingDate"
									name="endingDate"
									value={formData.endingDate}
									onChange={handleChange}
									min="1"
									className={formErrors.endingDate ? 'error' : ''}
								/>
								<span>days</span>
								{formErrors.endingDate && <span className="error-message">{formErrors.endingDate}</span>}
							</div>
						)}
					</div>

					<div className="modal-actions">
						<button type="button" className="cancel-button" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="submit-button">
							{isEditMode ? 'Update Board' : 'Create Board'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

PixelBoardModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	initialBoard: PropTypes.object
};

export default PixelBoardModal;
