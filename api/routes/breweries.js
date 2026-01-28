const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// GET /api/breweries?trail=:subdomain - Get all breweries for a trail
router.get('/', async (req, res) => {
  try {
    const { trail } = req.query;
    
    if (!trail) {
      return res.status(400).json({ success: false, error: 'Trail subdomain required' });
    }
    
    // Get trail ID
    const { data: trailData } = await supabase
      .from('trails')
      .select('id')
      .eq('subdomain', trail)
      .single();
    
    if (!trailData) {
      return res.status(404).json({ success: false, error: 'Trail not found' });
    }
    
    // Get breweries (without secret codes!)
    const { data: breweries, error } = await supabase
      .from('breweries')
      .select('id, name, subtitle, district, address, tagline, description, facebook_url, instagram_url, website_url, google_maps_url, logo_url, position, beer_menu, is_active')
      .eq('trail_id', trailData.id)
      .eq('is_active', true)
      .order('position');
    
    if (error) throw error;
    
    res.json({ success: true, breweries: breweries || [] });
  } catch (error) {
    console.error('Error fetching breweries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch breweries' });
  }
});

// GET /api/breweries/:id - Get single brewery
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: brewery, error } = await supabase
      .from('breweries')
      .select('id, name, subtitle, district, address, tagline, description, facebook_url, instagram_url, website_url, google_maps_url, logo_url, beer_menu, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error || !brewery) {
      return res.status(404).json({ success: false, error: 'Brewery not found' });
    }
    
    res.json({ success: true, brewery });
  } catch (error) {
    console.error('Error fetching brewery:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch brewery' });
  }
});

module.exports = router;
