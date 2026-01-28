const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Simple admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  next();
};

// GET /api/admin/trails - Get all trails (admin only)
router.get('/trails', authenticateAdmin, async (req, res) => {
  try {
    const { data: trails, error } = await supabase
      .from('trails')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, trails });
  } catch (error) {
    console.error('Error fetching trails:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trails' });
  }
});

// GET /api/admin/analytics/:trailId - Get analytics for a trail
router.get('/analytics/:trailId', authenticateAdmin, async (req, res) => {
  try {
    const { trailId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get analytics events
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('trail_id', trailId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    // Calculate stats
    const stats = {
      totalEvents: events?.length || 0,
      stampCollections: events?.filter(e => e.event_type === 'stamp_collected').length || 0,
      qrScans: events?.filter(e => e.event_type === 'qr_scanned').length || 0,
      ratingsSubmitted: events?.filter(e => e.event_type === 'rating_submitted').length || 0
    };
    
    // Get unique users
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('trail_id', trailId);
    
    stats.totalUsers = users?.length || 0;
    
    // Get stamps by brewery
    const { data: stamps } = await supabase
      .from('stamps')
      .select('brewery_id, brewery:breweries(name)')
      .eq('trail_id', trailId);
    
    const stampsByBrewery = {};
    stamps?.forEach(stamp => {
      const breweryName = stamp.brewery?.name || 'Unknown';
      stampsByBrewery[breweryName] = (stampsByBrewery[breweryName] || 0) + 1;
    });
    
    res.json({ 
      success: true, 
      stats,
      stampsByBrewery,
      recentEvents: events?.slice(0, 20) || []
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
