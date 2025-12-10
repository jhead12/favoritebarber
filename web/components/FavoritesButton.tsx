/**
 * web/components/FavoritesButton.tsx
 * Button to add/remove barber from user favorites
 */

import React, { useState } from 'react';

interface FavoritesButtonProps {
  userId: string;
  shopId: number;
  barberId?: number | null;
  isFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
  token: string;
}

export const FavoritesButton: React.FC<FavoritesButtonProps> = ({
  userId,
  shopId,
  barberId,
  isFavorited = false,
  onToggle,
  token,
}) => {
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (favorited) {
        // Remove from favorites
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(new URL(`/api/users/${userId}/favorites/${shopId}`, apiBase).toString(), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barberId }),
        });

        if (!res.ok) {
          throw new Error('Failed to remove from favorites');
        }

        setFavorited(false);
        onToggle?.(false);
      } else {
        // Add to favorites
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(new URL(`/api/users/${userId}/favorites`, apiBase).toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            barberId: barberId || null,
            notes: 'Added via UI',
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to add to favorites');
        }

        setFavorited(true);
        onToggle?.(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="favorites-button">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`favorite-btn ${favorited ? 'favorited' : ''}`}
        title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {loading ? '...' : favorited ? '★' : '☆'}
      </button>
      {error && <span className="error-text">{error}</span>}

      <style jsx>{`
        .favorites-button {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .favorite-btn {
          background: none;
          border: 2px solid #ddd;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }

        .favorite-btn:hover {
          border-color: #ffc107;
          color: #ffc107;
        }

        .favorite-btn.favorited {
          background-color: #ffc107;
          border-color: #ffc107;
          color: white;
        }

        .favorite-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-text {
          color: #d32f2f;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};
