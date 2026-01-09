import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import styles from './Profile.module.css';

const MAX_IMAGE_SIZE_BYTES = 3_000_000; // ~3MB

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || 18,
    city: user?.city || '',
    description: user?.description || '',
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.name === 'age' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = async () => {
    setError('');
    
    if (formData.description.length < 100) {
      setError('Description must be at least 100 characters long.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await userAPI.updateProfile({
        ...formData,
        photoUrl: photoUrl ?? null,
      });
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      age: user?.age || 18,
      city: user?.city || '',
      description: user?.description || '',
    });
    setPhotoUrl(user?.photoUrl ?? null);
    setIsEditing(false);
    setError('');
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Photo trop lourde. Merci de choisir une image de moins de ~3 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() || '';
      setPhotoUrl(result || null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setPhotoUrl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <button onClick={() => navigate('/matches')} className="secondary">
          ← Back
        </button>
        <h1>My Profile</h1>
        <button onClick={handleLogout} className="secondary">
          Logout
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      <div className={styles.profileContent}>
        {!isEditing ? (
          <>
            <div className={styles.photoSection}>
              {photoUrl ? (
                <img src={photoUrl} alt="Profil" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>Photo cachée</div>
              )}
            </div>
            <div className={styles.section}>
              <h2>{user.name}, {user.age}</h2>
              <p className={styles.meta}>{user.city} • {user.gender}</p>
              <p className={styles.email}>{user.email}</p>
            </div>

            <div className={styles.section}>
              <h3>About Me</h3>
              <p className={styles.description}>{user.description}</p>
            </div>

            <div className={styles.actions}>
              <button onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.photoSection}>
              {photoUrl ? (
                <img src={photoUrl} alt="Profil" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>Photo cachée</div>
              )}
              <div className={styles.photoActions}>
                <button type="button" onClick={handlePhotoSelect} className={styles.photoButton} disabled={loading}>
                  Remplacer la photo
                </button>
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className={`${styles.photoButton} ${styles.deleteButton}`}
                  disabled={loading}
                >
                  Supprimer
                </button>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className={styles.fileInput}
                onChange={handleFileChange}
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
              />
              <small style={{ color: 'var(--text-tertiary)' }}>
                {formData.description.length} / 100 characters
              </small>
            </div>

            <div className={styles.actions}>
              <button onClick={handleCancel} className="secondary" disabled={loading}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
