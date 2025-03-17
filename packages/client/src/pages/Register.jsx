import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import '../styles/Register.css';

function Register() {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const {VITE_API_URL} = import.meta.env;

	const handleChange = (e) => {
		const {name, value} = e.target;
		setFormData(prevState => ({
			...prevState,
			[name]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		// Vérification de la correspondance des mots de passe
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setLoading(false);
			return;
		}

		try {
			// On n'envoie pas confirmPassword à l'API
			const {confirmPassword, ...dataToSend} = formData;

			const response = await fetch(`${VITE_API_URL}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSend)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Registration failed');
			}

			// Sauvegarde du token et des informations utilisateur
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));

			// Redirection vers la page d'accueil
			navigate('/');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="register-container">
			<div className="register-card">
				<h2>Create Your PixelBoard Account</h2>

				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleChange}
							required
							autoComplete="username"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							autoComplete="email"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							autoComplete="new-password"
							minLength="6"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="confirmPassword">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							required
							autoComplete="new-password"
							minLength="6"
						/>
					</div>

					<button type="submit" className="register-button" disabled={loading}>
						{loading ? 'Creating Account...' : 'Sign Up'}
					</button>
				</form>

				<div className="register-footer">
					<p>Already have an account? <Link to="/login">Log in</Link></p>
				</div>
			</div>
		</div>
	);
}

export default Register;
