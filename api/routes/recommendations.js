const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Simple rule-based recommendation engine
function getSimpleRecommendations(userPreferences, breweries, visitedBreweryIds) {
  const recommendations = [];
  
  // Filter to unvisited breweries
  const unvisited = breweries.filter(b => !visitedBreweryIds.includes(b.id));
  
  if (unvisited.length === 0) {
    return { recommendations: [], message: 'You\'ve visited all breweries! 🎉' };
  }
  
  // If user has no preferences yet, recommend by position
  if (!userPreferences || !userPreferences.flavors || userPreferences.flavors.length === 0) {
    return {
      recommendations: unvisited.slice(0, 3),
      message: 'Start your journey at these breweries!'
    };
  }
  
  // Score breweries based on user preferences
  for (const brewery of unvisited) {
    let score = 0;
    const reasons = [];
    
    if (brewery.beer_menu && Array.isArray(brewery.beer_menu)) {
      for (const beer of brewery.beer_menu) {
        if (beer.flavors && Array.isArray(beer.flavors)) {
          const matchingFlavors = beer.flavors.filter(f => 
            userPreferences.flavors.includes(f)
          );
          
          if (matchingFlavors.length > 0) {
            score += matchingFlavors.length;
            reasons.push(`Try their ${beer.name} - matches your love of ${matchingFlavors.join(', ')}`);
          }
        }
      }
    }
    
    if (score > 0) {
      recommendations.push({
        ...brewery,
        score,
        reason: reasons[0] || 'Great match for your taste!'
      });
    }
  }
  
  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);
  
  // If no flavor matches, just return next breweries
  if (recommendations.length === 0) {
    return {
      recommendations: unvisited.slice(0, 3).map(b => ({
        ...b,
        reason: 'Continue your ale trail adventure!'
      })),
      message: 'Keep exploring!'
    };
  }
  
  return {
    recommendations: recommendations.slice(0, 3),
    message: 'Based on your ratings, we think you\'ll love these:'
  };
}

// GET /api/recommendations/:userId - Get personalized recommendations
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { trail } = req.query;
    
    if (!trail) {
      return res.status(400).json({ success: false, error: 'Trail subdomain required' });
    }
    
    // Get trail
    const { data: trailData } = await supabase
      .from('trails')
      .select('id')
      .eq('subdomain', trail)
      .single();
    
    if (!trailData) {
      return res.status(404).json({ success: false, error: 'Trail not found' });
    }
    
    // Get user preferences
    const { data: user } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    // Get breweries
    const { data: breweries } = await supabase
      .from('breweries')
      .select('*')
      .eq('trail_id', trailData.id)
      .eq('is_active', true)
      .order('position');
    
    // Get visited breweries
    const { data: stamps } = await supabase
      .from('stamps')
      .select('brewery_id')
      .eq('user_id', userId)
      .eq('trail_id', trailData.id);
    
    const visitedBreweryIds = stamps?.map(s => s.brewery_id) || [];
    
    // Get recommendations
    const result = getSimpleRecommendations(
      user?.preferences || {},
      breweries || [],
      visitedBreweryIds
    );
    
    res.json({ 
      success: true, 
      ...result,
      visited: visitedBreweryIds.length,
      total: breweries?.length || 0
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
