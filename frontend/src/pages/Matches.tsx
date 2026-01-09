import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import type { Match } from '../types';
import styles from './Matches.module.css';

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await matchAPI.getMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRevealLevelText = (level: number): string => {
    switch (level) {
      case 0:
        return 'Chapitre 0 • Photo cachée';
      case 1:
        return 'Chapitre 1 • Silhouette floutée (N&B)';
      case 2:
        return 'Chapitre 2 • Contours (N&B)';
      case 3:
        return 'Chapitre 3 • Couleur partielle';
      case 4:
        return 'Chapitre final • Photo dévoilée';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container text-center">
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <button onClick={() => navigate('/discovery')} className="secondary">
          ← Discovery
        </button>
        <h1>Your Matches</h1>
        <button onClick={() => navigate('/profile')} className="secondary">
          Profile
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center mt-xl">
          <h2>No Matches Yet</h2>
          <p>Start liking profiles to make connections!</p>
          <button onClick={() => navigate('/discovery')} className="mt-lg">
            Discover People
          </button>
        </div>
      ) : (
        <div className={styles.matchesList}>
          {matches.map((match) => (
            <div
              key={match.id}
              className={styles.matchCard}
              onClick={() => navigate(`/chat/${match.conversationId}`)}
            >
              <div className={styles.matchInfo}>
                <h3>{match.otherUser.name}, {match.otherUser.age}</h3>
                <p className={styles.meta}>{match.otherUser.city}</p>
                <p className={styles.revealLevel}>
                  Photo reveal: {getRevealLevelText(match.conversation.revealLevel)}
                </p>
              </div>
              <div className={styles.arrow}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;
