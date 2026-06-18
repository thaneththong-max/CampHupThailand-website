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

function hasValidGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key) && 
         key !== 'MY_GEMINI_API_KEY' && 
         key !== 'YOUR_API_KEY' && 
         key !== 'your-api-key' && 
         key.trim() !== '';
}

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

// Local fallback recommendation generator
function generateLocalRecommendation(
  candidates: any[],
  searchTerm: string,
  selectedAmenities: string[],
  filterType: string,
  noResultsMatched: boolean
) {
  // Select the best candidate
  let chosen = candidates[0] || CAMP_SITES[0];
  
  // Try to find the single best candidate that matches the searchTerm in name or description
  if (searchTerm && searchTerm.trim() !== '') {
    const q = searchTerm.toLowerCase().trim();
    const matched = candidates.find(c => 
      c.name.toLowerCase().includes(q) || 
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      c.province.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
    if (matched) {
      chosen = matched;
    }
  }

  const amenitiesStr = chosen.amenities && chosen.amenities.length > 0 
    ? chosen.amenities.slice(0, 3).join(', ') 
    : 'การบริการดูแลความปลอดภัย, สำรวจระดับธรรมชาติ, จุดจอดรถใกล้ลาน';

  const reason = `ลานกางเต็นท์ "${chosen.name}" ณ จังหวัด${chosen.province} ได้รับการคัดสรรจากระบบผู้เชี่ยวชาญ CampHub ว่าเหมาะกับระดับความต้องการและพิกัดที่คุณชื่นชอบมากที่สุด! 

ด้วยทำเลที่ตั้งที่เงียบสงบ มอบทัศนียภาพกว้างขวาง ร่มรื่น และสดชื่นไปด้วยไอหมอกธรรมชาติ สอดคล้องกับคุณสมบัติตัวกรองของแอปแคมปิ้งที่คุณเลือกสรร สัดส่วนการบริการแบบสไตล์ ${chosen.type === 'national' ? 'อุทยานแห่งชาติรักษ์สิ่งแวดล้อมใกล้ชิดสัตว์ป่าและเส้นทางเดินศึกษาป่าเชิงลึก' : 'เอกชนที่เพียบพร้อมไปด้วยคาเฟ่พักสายตา ลาดจอดรถ และสิ่งอำนวยความสะดวกสบาย'}

คุณจะได้รับความเพลิดเพลินในการเดินทางและจัดตั้งแคมป์พร้อมกับบริการพรีเมียม อาทิเช่น ${amenitiesStr} ที่พร้อมจะมาเติมเต็มความฝันการออกแคมป์ให้เพอร์เฟกต์ระดับสิบดาวแน่นอนครับ`;

  const tips = `1. เพื่อความเชี่ยวชาญสูงสุดสำหรับลาน ${chosen.name} นี้ แนะนำให้ตรวจเช็กอุปกรณ์เต็นท์ สลักตอกสมอ และไฟฉาย/โคมสับพะรัง รวมถึงแบตเตอรี่พาวเวอร์แบงก์ให้เรียบร้อย
2. แนะนำให้ตระเตรียมสเปรย์ป้องกันมด ยุง และแมลงสูตรออร์แกนิกเป็นพิเศษ เพื่อความชิลตลอดการเอนกายในจุดกลางเต็นท์พรีเมียมนี้
3. ร่วมกันรักษากฎกติกาเบื้องต้นของชาวแคมป์ ได้แก่ งดส่งเสียงรำคาญหรือใช้เครื่องเสียงดังหลังเวลา 22.00 น. เพื่อให้กลุ่มแคมเปอร์ท่านอื่นๆ ตลอดจนระบบนิเวศป่าไม้ในพื้นที่กางเต็นท์ได้รับความเคารพร่วมกันครับ`;

  const note = noResultsMatched 
    ? `ระบบอัตโนมัติไม่พบพิกัดจุดกางเต็นท์หรืออุทยานที่จับความต้องการค้นหาดั้งเดิมได้ตรงเป๊ะ 100% ทางผู้ประสานงาน AI จึงขอเสนออัจฉริยะลานยอดฮิตใกล้เคียง "${chosen.name}" นี้แทนเพื่อความเหมาะสมสูงสุด!`
    : `คัดสรรจับคู่อย่างประณีตโดยระบบ CampHub Expert Engine เชื่อมพิกัดข้อมูล จังหวัด ${chosen.province} และสิ่งอำนวยความสะดวกครบถ้วน`;

  return {
    recommendedCampId: chosen.id,
    reason,
    tips,
    note
  };
}

// API endpoint for Get AI Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { searchTerm, filterType, selectedAmenities, favorites, showFavoritesOnly, campId } = req.body;

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
    
    // If a specific campId is requested, prioritize and isolate that specific camp
    if (campId) {
      const specificCamp = CAMP_SITES.find(c => c.id === campId);
      if (specificCamp) {
        candidates = [specificCamp];
        noResultsMatched = false;
      }
    }

    // Fallback if no campsites match current filters: use top rated campsites as candidates
    if (candidates.length === 0) {
      noResultsMatched = true;
      candidates = CAMP_SITES.filter(camp => camp.rating >= 4.5);
    }

    // Direct fallback if Gemini Key is not valid / present
    if (!hasValidGeminiKey()) {
      const fallbackResult = generateLocalRecommendation(
        candidates,
        searchTerm,
        selectedAmenities,
        filterType,
        noResultsMatched
      );
      return res.json({ ...fallbackResult, fallbackUsed: noResultsMatched });
    }

    try {
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
    } catch (geminiErr: any) {
      console.warn('Gemini recommendation call failed, using graceful local fallback:', geminiErr);
      const fallbackResult = generateLocalRecommendation(
        candidates,
        searchTerm,
        selectedAmenities,
        filterType,
        noResultsMatched
      );
      res.json({ ...fallbackResult, fallbackUsed: noResultsMatched });
    }
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
