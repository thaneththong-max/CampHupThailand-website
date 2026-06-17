import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { CAMP_SITES } from './src/data/camps';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for Get AI Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { searchTerm, filterType, selectedAmenities, favorites, showFavoritesOnly } = req.body;

    // Filter camps locally on the server using identical logic as client
    let candidates = CAMP_SITES.filter(camp => {
      if (showFavoritesOnly && favorites && !favorites.includes(camp.id)) {
        return false;
      }
      if (filterType && filterType !== 'all' && camp.type !== filterType) {
        return false;
      }
      if (selectedAmenities && selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((keyword: string) => {
          return camp.amenities.some((amenity: string) => 
            amenity.toLowerCase().includes(keyword.toLowerCase())
          );
        });
        if (!hasAllAmenities) return false;
      }
      if (searchTerm && searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = camp.name.toLowerCase().includes(query);
        const matchesNameEn = camp.nameEn.toLowerCase().includes(query);
        const matchesProvince = camp.province.toLowerCase().includes(query);
        const matchesDesc = camp.description.toLowerCase().includes(query);
        const matchesAmenities = camp.amenities.some((a: string) => a.toLowerCase().includes(query));

        return matchesName || matchesNameEn || matchesProvince || matchesDesc || matchesAmenities;
      }
      return true;
    });

    let noResultsMatched = false;
    // Fallback if no campsites match current filters: use top rated campsites as candidates
    if (candidates.length === 0) {
      noResultsMatched = true;
      candidates = CAMP_SITES.filter(camp => camp.rating >= 4.5);
    }

    const ai = getGeminiClient();

    const campsitesDataSummary = candidates.map(c => ({
      id: c.id,
      name: c.name,
      province: c.province,
      type: c.type === 'national' ? 'อุทยานแห่งชาติ' : 'เอกชน',
      rating: c.rating,
      priceRange: c.priceRange,
      description: c.description,
      amenities: c.amenities,
      elevation: c.elevation,
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an expert camping guide in Thailand, providing recommendations for CampHub Thailand.
Current user filters:
- Search Term: "${searchTerm || 'None'}"
- Camping Ground Type: "${filterType || 'All'}"
- Selected Amenities: ${JSON.stringify(selectedAmenities || [])}
- Show Only Favorites: ${showFavoritesOnly ? 'Yes' : 'No'}
- Did any campsites match the filter directly? ${noResultsMatched ? 'No (showing top alternatives instead)' : 'Yes'}

Available candidate list:
${JSON.stringify(campsitesDataSummary)}

Please analyze the user's needs based on their filters and select the single absolute best campsite from this candidate list to recommend.
Provide a personalized warm recommendation explanation in Thai (write like a professional friendly local camping expert), and give specific tips for preparing to go there.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedCampId: {
              type: Type.STRING,
              description: 'The exact ID of the recommended campground from the candidate list.',
            },
            reason: {
              type: Type.STRING,
              description: 'Why this campsite is perfect for them in Thai. Refer to their filter options and why this site suits them best.',
            },
            tips: {
              type: Type.STRING,
              description: 'Survival / preparation tip tailored specifically to this campsite in Thai.',
            },
            note: {
              type: Type.STRING,
              description: 'Optional note. If no campsite originally matched their filters, explain warmly in Thai that no campsites matched their exact search so you recommended this top alternative instead.',
            }
          },
          required: ['recommendedCampId', 'reason', 'tips'],
        },
      },
    });

    const aiResponseText = response.text || '{}';
    const resultJson = JSON.parse(aiResponseText.trim());
    res.json({ ...resultJson, fallbackUsed: noResultsMatched });
  } catch (err: any) {
    console.error('Error in /api/recommendations:', err);
    res.status(500).json({ error: err.message || 'Failed to call Gemini recommendation service' });
  }
});

// Serve frontend build / dev assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampHub Thailand] Server is running on port ${PORT}`);
  });
}

startServer();
