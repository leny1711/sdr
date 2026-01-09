import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Auth.module.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'male',
    interestedIn: [] as string[],
    city: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleInterest = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.interestedIn.includes(value);
      const nextInterests = hasValue
        ? prev.interestedIn.filter((item) => item !== value)
        : [...prev.interestedIn, value];
      return { ...prev, interestedIn: nextInterests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.description.length < 100) {
      setError('Description must be at least 100 characters long.');
      return;
    }

    if (formData.interestedIn.length === 0) {
      setError('Select at least one interest.');
      return;
    }

    setLoading(true);

    try {
      await register({
        ...formData,
        age: parseInt(formData.age),
      });
      navigate('/discovery');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.authBox}>
        <h1 className="text-center">Create Your Profile</h1>
        <p className="text-center" style={{ color: 'var(--text-tertiary)' }}>
          Text-first dating starts with your story
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

          <div className={styles.formGroup}>
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Interested in</label>
            <div className={styles.checkboxGroup}>
              {['male', 'female', 'other'].map((value) => (
                <label key={value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.interestedIn.includes(value)}
                    onChange={() => toggleInterest(value)}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{value}</span>
                </label>
              ))}
            </div>
          </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">
              About You (minimum 100 characters)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={100}
              rows={8}
              placeholder="Tell your story... This is your chance to introduce yourself through words, not photos."
            />
            <small style={{ color: 'var(--text-tertiary)' }}>
              {formData.description.length} / 100 characters
            </small>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-lg">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
