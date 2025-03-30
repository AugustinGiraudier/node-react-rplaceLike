import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './Login.css';

function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: ''
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

		try {
			const response = await fetch(`${VITE_API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Login failed');
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
		<div className="login-container">
			<div className="login-card">
				<h2>Log In to PixelBoard</h2>

				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit}>
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
							autoComplete="current-password"
						/>
					</div>

					<button type="submit" className="login-button" disabled={loading}>
						{loading ? 'Logging in...' : 'Log In'}
					</button>
				</form>

				<div className="login-footer">
					<p>Don't have an account? <Link to="/register">Sign up</Link></p>
				</div>
			</div>
		</div>
	);
}

export default Login;
