const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// POST /api/validate - Validate brewery code and collect stamp
router.post('/', async (req, res) => {
  try {
    const { breweryId, code, userId, trail } = req.body;
    
    if (!breweryId || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Brewery ID and code required' 
      });
    }
    
    // Get brewery with secret code
    const { data: brewery, error: breweryError } = await supabase
      .from('breweries')
      .select('id, secret_code, trail_id, name')
      .eq('id', breweryId)
      .single();
    
    if (breweryError || !brewery) {
      return res.status(404).json({ success: false, error: 'Brewery not found' });
    }
    
    // Validate code
    const isValid = brewery.secret_code.toUpperCase() === code.toUpperCase().trim();
    
    if (!isValid) {
      return res.json({ 
        success: true, 
        valid: false, 
        message: 'Invalid code' 
      });
    }
    
    // Code is valid - collect stamp (if userId provided)
    if (userId) {
      // Check if stamp already exists
      const { data: existingStamp } = await supabase
        .from('stamps')
        .select('id')
        .eq('user_id', userId)
        .eq('brewery_id', breweryId)
        .single();
      
      if (!existingStamp) {
        // Create stamp
        await supabase
          .from('stamps')
          .insert({
            user_id: userId,
            brewery_id: breweryId,
            trail_id: brewery.trail_id,
            validation_method: 'code'
          });
        
        // Log analytics event
        await supabase
          .from('analytics_events')
          .insert({
            trail_id: brewery.trail_id,
            user_id: userId,
            brewery_id: breweryId,
            event_type: 'stamp_collected',
            event_data: { method: 'code', brewery_name: brewery.name }
          });
      }
    }
    
    res.json({ 
      success: true, 
      valid: true,
      message: 'Code validated successfully!',
      breweryId 
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

// GET /api/validate/stamps/:userId - Get user's collected stamps
router.get('/stamps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { trail } = req.query;
    
    let query = supabase
      .from('stamps')
      .select('*, brewery:breweries(name, position)')
      .eq('user_id', userId)
      .order('validated_at', { ascending: false });
    
    if (trail) {
      const { data: trailData } = await supabase
        .from('trails')
        .select('id')
        .eq('subdomain', trail)
        .single();
      
      if (trailData) {
        query = query.eq('trail_id', trailData.id);
      }
    }
    
    const { data: stamps, error } = await query;
    
    if (error) throw error;
    
    res.json({ success: true, stamps: stamps || [] });
    
  } catch (error) {
    console.error('Error fetching stamps:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stamps' });
  }
});

module.exports = router;
