/**
 * api/routes/users.js
 * User account, favorites, and review endpoints
 * All routes are protected - require Authorization: Bearer {token} header
 */

const express = require('express');
const router = express.Router();
const userModel = require('../models/user.js');

/**
 * Middleware: verify user is accessing their own data
 */
function verifyOwnData(req, res, next) {
  const { userId } = req.params;
  if (userId !== req.user.userId) {
    return res.status(403).json({ success: false, error: 'Unauthorized: cannot access other users data' });
  }
  next();
}

/**
 * GET /api/users/{userId}/favorites
 * Get user's favorite barbers and shops
 */
router.get('/:userId/favorites', verifyOwnData, async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await userModel.getUserFavorites(userId);
    res.json({ success: true, favorites });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/{userId}/favorites
 * Add a barber/shop to favorites
 */
router.post('/:userId/favorites', verifyOwnData, async (req, res) => {
  try {
    const { userId } = req.params;
    const { shopId, barberId, notes } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId required' });
    }

    const favorite = await userModel.addFavorite(userId, shopId, barberId, notes);
    res.json({ success: true, favorite });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/users/{userId}/favorites/{shopId}
 * Remove from favorites
 */
router.delete('/:userId/favorites/:shopId', verifyOwnData, async (req, res) => {
  try {
    const { userId, shopId } = req.params;
    const { barberId } = req.body;

    await userModel.removeFavorite(userId, parseInt(shopId), barberId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/{userId}/reviews
 * Create a user review
 */
router.post('/:userId/reviews', verifyOwnData, async (req, res) => {
  try {
    const { userId } = req.params;
    const { shopId, barberId, title, text, rating, hairstyleRequested, pricePaid, wouldReturn } = req.body;

    if (!shopId || !text || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'shopId, text, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'rating must be 1-5' 
      });
    }

    const review = await userModel.createUserReview(userId, shopId, barberId, {
      title,
      text,
      rating,
      hairstyleRequested,
      pricePaid,
      wouldReturn
    });

    res.json({ success: true, review });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/barbers/:barberId/user-reviews
 * Get user reviews for a barber
 */
router.get('/:barberId/user-reviews', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await userModel.getBarberUserReviews(
      parseInt(barberId),
      parseInt(limit),
      parseInt(offset)
    );

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error fetching barber reviews:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shops/:shopId/user-reviews
 * Get user reviews for a shop
 */
router.get('/:shopId/user-reviews', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await userModel.getShopUserReviews(
      parseInt(shopId),
      parseInt(limit),
      parseInt(offset)
    );

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error fetching shop reviews:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reviews/:reviewId/helpful
 * Mark review as helpful (or undo vote)
 */
router.post('/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, isHelpful } = req.body;

    if (!userId || isHelpful === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and isHelpful required' 
      });
    }

    await userModel.markReviewHelpful(userId, parseInt(reviewId), isHelpful);
    res.json({ success: true, message: 'Helpful vote recorded' });
  } catch (err) {
    console.error('Error marking review helpful:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shops/:shopId/reviews/search
 * Search user reviews by hairstyle or keyword
 */
router.get('/:shopId/reviews/search', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'search query (q) required' 
      });
    }

    const results = await userModel.searchUserReviews(
      parseInt(shopId),
      q,
      parseInt(limit)
    );

    res.json({ success: true, results });
  } catch (err) {
    console.error('Error searching reviews:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
