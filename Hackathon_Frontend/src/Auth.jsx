import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Auth.css';
import Authentication from './authApi';

export default function Auth() {
  const [currentPage, setCurrentPage] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const auth = new Authentication();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    return errors;
  };

  const validateUsername = (username) => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Login block starts
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try{
      const data = {
        username: formData.username,
        password: formData.password,
      };

      const response = await auth.login(data);
      
      if(response && response.success){
        setIsLoggedIn(true);
        
        // Redirect based on admin status
        if(response.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/inventory");
        }
      }else{
        setErrors({
          general: "Invalid username or password",
        });
      }
    }catch(error) {
      setErrors({
          general: "Invalid username or password",
        });
      } finally {
        setLoading(false);
    }
  };
  // Login block ends


  // Register block starts
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    const newErrors = {};
    
    // Username validation
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      newErrors.username = usernameError;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

     // Password validation
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors[0];
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const data = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      const response = await auth.register(data);
      if(response) {
        setSuccessMessage('Registration successful! Please login to continue.');
        switchPage('login');
      } else{
        setErrors({
          general: 'Registration failed. Please try again.'
        });
      }
    }catch (error) {
      if (error.response) {
        setErrors({
         general: error.response.data.error || 'Registration failed. Please try again.'
        });
      } else {
        setErrors({
          general: 'Unable to connect to server. Please try again later.'
        });
     }
    } finally {
        setLoading(false);
    }
  };

  // Register block ends


  // Logout block starts
  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    navigate("/login");
  };
  // Logout block ends

  const switchPage = (page) => {
    setCurrentPage(page);
    setErrors({});
    setSuccessMessage('');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  // return block

return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="tab-container">
          <button
            className={`tab ${currentPage === 'login' ? 'active-tab' : ''}`}
            onClick={() => switchPage('login')}
          >
            Login
          </button>
          <button
            className={`tab ${currentPage === 'register' ? 'active-tab' : ''}`}
            onClick={() => switchPage('register')}
          >
            Register
          </button>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        {currentPage === 'login' ? (
          <div className="form-container">
            <h2 className="auth-title">Login</h2>
            
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`input-field ${errors.username ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="current-password"
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <button 
              onClick={handleLogin} 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="switch-text">
              Don't have an account?{' '}
              <span className="link" onClick={() => switchPage('register')}>
                Register here
              </span>
            </p>
          </div>
        ) : (
          <div className="form-container">
            <h2 className="auth-title">Register</h2>
            
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`input-field ${errors.username ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
              <small className="password-hint">
                Min 8 characters, with uppercase, lowercase, number, and special character
              </small>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button 
              onClick={handleRegister} 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <p className="switch-text">
              Already have an account?{' '}
              <span className="link" onClick={() => switchPage('login')}>
                Login here
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}