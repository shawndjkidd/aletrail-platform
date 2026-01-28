const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// GET /api/trails/:subdomain - Get trail by subdomain
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const { data: trail, error } = await supabase
      .from('trails')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();
    
    if (error || !trail) {
      return res.status(404).json({ 
        success: false, 
        error: 'Trail not found' 
      });
    }
    
    res.json({ success: true, trail });
  } catch (error) {
    console.error('Error fetching trail:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trail' });
  }
});

// GET /api/trails/:subdomain/stats - Get trail statistics
router.get('/:subdomain/stats', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const { data: trail } = await supabase
      .from('trails')
      .select('id')
      .eq('subdomain', subdomain)
      .single();
    
    if (!trail) {
      return res.status(404).json({ success: false, error: 'Trail not found' });
    }
    
    const { data: stamps } = await supabase
      .from('stamps')
      .select('id')
      .eq('trail_id', trail.id);
    
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating');
    
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('trail_id', trail.id);
    
    const stats = {
      totalStamps: stamps?.length || 0,
      totalRatings: ratings?.length || 0,
      totalUsers: users?.length || 0,
      averageRating: ratings?.length 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
        : 0
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;
