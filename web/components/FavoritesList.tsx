/**
 * web/components/FavoritesList.tsx
 * Display user's favorite barbers and shops
 */

import React, { useEffect, useState } from 'react';

interface Favorite {
  id: number;
  shop_id: number;
  shop_name: string;
  barber_id?: number | null;
  barber_name?: string;
  notes?: string;
  saved_at: string;
}

interface FavoritesListProps {
  userId: string;
  token: string;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ userId, token }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [userId, token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(new URL(`/api/users/${userId}/favorites`, apiBase).toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (shopId: number, barberId?: number | null) => {
    try {
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
        throw new Error('Failed to remove favorite');
      }

      setFavorites(favorites.filter(f => !(f.shop_id === shopId && f.barber_id === barberId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing favorite');
    }
  };

  if (loading) {
    return <div className="favorites-list">Loading favorites...</div>;
  }

  if (error) {
    return <div className="favorites-list error">{error}</div>;
  }

  if (favorites.length === 0) {
    return <div className="favorites-list empty">No favorites yet. Start adding your favorite barbers!</div>;
  }

  return (
    <div className="favorites-list">
      <h2>My Favorites ({favorites.length})</h2>
      <div className="favorites-grid">
        {favorites.map((fav) => (
          <div key={`${fav.shop_id}-${fav.barber_id}`} className="favorite-card">
            <div className="card-header">
              <h3>{fav.shop_name}</h3>
              <button
                onClick={() => handleRemove(fav.shop_id, fav.barber_id)}
                className="remove-btn"
                title="Remove from favorites"
              >
                ✕
              </button>
            </div>

            {fav.barber_name && (
              <div className="barber-name">
                Barber: <strong>{fav.barber_name}</strong>
              </div>
            )}

            {fav.notes && (
              <div className="notes">
                <em>{fav.notes}</em>
              </div>
            )}

            <div className="saved-date">
              Added {new Date(fav.saved_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .favorites-list {
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .favorites-list.empty {
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .favorites-list.error {
          color: #d32f2f;
          padding: 20px;
          background: #ffebee;
          border-radius: 4px;
        }

        h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
        }

        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .favorite-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .favorite-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 16px;
          color: #1976d2;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .remove-btn:hover {
          color: #d32f2f;
        }

        .barber-name {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .notes {
          margin: 8px 0;
          font-size: 13px;
          color: #888;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .saved-date {
          margin-top: 12px;
          font-size: 12px;
          color: #999;
          text-align: right;
        }
      `}</style>
    </div>
  );
};
