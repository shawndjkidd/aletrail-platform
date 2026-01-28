const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// POST /api/ratings - Submit a rating
router.post('/', async (req, res) => {
  try {
    const { userId, breweryId, beerId, rating, review, flavorsEnjoyed } = req.body;
    
    if (!userId || !breweryId || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, breweryId, and rating required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    // Check if rating exists
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('brewery_id', breweryId)
      .eq('beer_id', beerId || '')
      .single();
    
    let result;
    
    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update({
          rating,
          review,
          flavors_enjoyed: flavorsEnjoyed
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          user_id: userId,
          brewery_id: breweryId,
          beer_id: beerId,
          rating,
          review,
          flavors_enjoyed: flavorsEnjoyed
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    res.json({ 
      success: true, 
      rating: result,
      message: 'Rating submitted successfully!' 
    });
    
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ success: false, error: 'Failed to submit rating' });
  }
});

// GET /api/ratings/user/:userId - Get user's ratings
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('*, brewery:breweries(name, logo_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, ratings: ratings || [] });
    
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
  }
});

// GET /api/ratings/brewery/:breweryId - Get brewery's ratings
router.get('/brewery/:breweryId', async (req, res) => {
  try {
    const { breweryId } = req.params;
    
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating, review, flavors_enjoyed, created_at')
      .eq('brewery_id', breweryId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate stats
    const avgRating = ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;
    
    const ratingDistribution = {
      1: ratings?.filter(r => r.rating === 1).length || 0,
      2: ratings?.filter(r => r.rating === 2).length || 0,
      3: ratings?.filter(r => r.rating === 3).length || 0,
      4: ratings?.filter(r => r.rating === 4).length || 0,
      5: ratings?.filter(r => r.rating === 5).length || 0,
    };
    
    res.json({ 
      success: true, 
      ratings: ratings || [],
      stats: {
        averageRating: avgRating,
        totalRatings: ratings?.length || 0,
        distribution: ratingDistribution
      }
    });
    
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
