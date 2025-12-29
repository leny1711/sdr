import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { discoveryAPI } from '../services/api';
import type { User } from '../types';
import styles from './Discovery.module.css';

const Discovery: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await discoveryAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (actionLoading || currentIndex >= users.length) return;

    console.log('Like button clicked');
    setActionLoading(true);
    try {
      const currentUser = users[currentIndex];
      console.log('Sending like request for user:', currentUser.id);
      const result = await discoveryAPI.like(currentUser.id);
      console.log('Like request successful:', result);
      
      if (result.matched) {
        setMatchedUserId(currentUser.id);
        setTimeout(() => {
          setMatchedUserId(null);
          moveToNext();
        }, 3000);
      } else {
        moveToNext();
      }
    } catch (error) {
      console.error('Failed to like:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDislike = async () => {
    if (actionLoading || currentIndex >= users.length) return;

    console.log('Pass button clicked');
    setActionLoading(true);
    try {
      const currentUser = users[currentIndex];
      console.log('Sending dislike request for user:', currentUser.id);
      await discoveryAPI.dislike(currentUser.id);
      console.log('Dislike request successful');
      moveToNext();
    } catch (error) {
      console.error('Failed to dislike:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const moveToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="container text-center">
        <p>Loading profiles...</p>
      </div>
    );
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <div className="container text-center">
        <h2>No More Profiles</h2>
        <p>Check back later for more people to discover!</p>
        <button onClick={() => navigate('/matches')} className="mt-lg">
          View My Matches
        </button>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className={styles.discoveryContainer}>
      {matchedUserId && (
        <div className={styles.matchOverlay}>
          <div className={styles.matchBox}>
            <h2>It's a Match! 🎉</h2>
            <p>You and {currentUser.name} liked each other!</p>
            <button onClick={() => navigate('/matches')}>View Matches</button>
          </div>
        </div>
      )}

      <div className={styles.profilePage}>
        <div className={styles.header}>
          <button 
            onClick={() => navigate('/matches')} 
            className="secondary"
          >
            ← Matches
          </button>
          <span className={styles.counter}>
            {currentIndex + 1} of {users.length}
          </span>
        </div>

        <div className={styles.profileContent}>
          <h1>{currentUser.name}, {currentUser.age}</h1>
          <p className={styles.meta}>
            {currentUser.city} • {currentUser.gender}
          </p>

          <div className={styles.description}>
            {currentUser.description}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleDislike}
            disabled={actionLoading}
            className="secondary"
          >
            Pass
          </button>
          <button
            onClick={handleLike}
            disabled={actionLoading}
          >
            Like
          </button>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
