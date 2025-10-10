import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * Helper function to clean and parse a search prompt.
 * Turns "dr. ss bhatia" into ["ss", "bhatia"]
 * @param {string} prompt The raw user input.
 * @returns {string[]} An array of cleaned-up search terms.
 */
function sanitizeAndSplit(prompt) {
  return prompt
    .toLowerCase()
    // Remove common titles like dr, prof, etc.
    .replace(/(dr|prof|professor)\.?\s*/g, '')
    // Remove punctuation
    .replace(/[.,'-]/g, '')
    // Split into words by spaces
    .split(' ')
    // Remove any empty strings that might result from multiple spaces
    .filter(term => term.length > 0);
}


/**
 * Asynchronous prompt analysis with improved fuzzy name matching.
 */
async function analyzePrompt(prompt, db) {
  const lower = prompt.toLowerCase();

  // --- Pass 1: Check for simple, high-priority keywords first ---
  if (lower.includes("timetable")) return { type: "timetable", entity: null };
  if (lower.includes("mess") || lower.includes("menu")) return { type: "mess", entity: null };
  // ... add other simple intents here

  // --- Pass 2: Fallback to a more complex faculty name search ---
  try {
    const searchTerms = sanitizeAndSplit(prompt);

    if (searchTerms.length === 0) {
      return { type: "unknown", entity: null };
    }

    // Dynamically build the WHERE clause
    const whereClause = searchTerms.map(() => `LOWER(Name) LIKE ?`).join(' AND ');
    const query = `SELECT * FROM Faculty WHERE ${whereClause}`;
    
    // Create parameters for the query, e.g., ['%ss%', '%bhatia%']
    const queryParams = searchTerms.map(term => `%${term}%`);

    const [results] = await db.promise().query(query, queryParams);

    if (results.length > 0) {
      console.log(`✅ Found ${results.length} faculty match(es) for terms: [${searchTerms.join(', ')}]`);
      
      if (results.length === 1) {
        return { type: "faculty", data: results };
      } else {
        return { type: "faculty_list", data: results };
      }
    }

  } catch (err) {
    console.error("Error during faculty name search:", err.message);
  }

  // --- Fallback: If no keywords and no name match, the intent is unknown ---
  return { type: "unknown", entity: null };
}


// The main API route handler
router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const intent = await analyzePrompt(prompt, db);

    if (intent.data) {
      return res.json({ type: intent.type, data: intent.data });
    }

    let query = "";
    let responseType = "";

    switch (intent.type) {
      case "timetable":
        query = "SELECT * FROM Timetable LIMIT 5";
        responseType = "timetable";
        break;
      case "mess":
        query = "SELECT * FROM MessMenu LIMIT 5";
        responseType = "mess_menu";
        break;
      default:
        return res.json({
          type: "unknown",
          response: "Sorry, I couldn’t understand that. Please try again.",
        });
    }

    const [results] = await db.promise().query(query);
    res.json({ type: responseType, data: results });

  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ error: "An error occurred on the server." });
  }
});

export default router;