import express from "express";
import db from "../db.js";

import { findDoaaProcedure, getDoaaProcedureById } from '../services/doaaService.js';

// ADD THIS IMPORT at the top
import { getScheduleForToday } from "../services/timetableService.js";

const router = express.Router();

// this is the function for the timetable part

/**
 * Helper function to clean and parse a search prompt.
 * Turns "dr. ss bhatia" into ["ss", "bhatia"]
 * @param {string} prompt The raw user input.
 * @returns {string[]} An array of cleaned-up search terms.
 */
function sanitizeAndSplit(prompt) {
  return (
    prompt
      .toLowerCase()
      // Remove common titles like dr, prof, etc.
      .replace(/(dr|prof|professor)\.?\s*/g, "")
      // Remove punctuation
      .replace(/[.,'-]/g, "")
      // Split into words by spaces
      .split(" ")
      // Remove any empty strings that might result from multiple spaces
      .filter((term) => term.length > 0)
  );
}

/**
 * Asynchronous prompt analysis with improved fuzzy name matching.
 */
// async function analyzePrompt(prompt, db) {
//   const lower = prompt.toLowerCase();

//   // --- Pass 1: Check for simple, high-priority keywords first ---
//   if (lower.includes("timetable")) return { type: "timetable", entity: null };
//   if (lower.includes("mess") || lower.includes("menu"))
//     return { type: "mess", entity: null };
//   // ... add other simple intents here

//   // --- Pass 2: Fallback to a more complex faculty name search ---
//   try {
//     const searchTerms = sanitizeAndSplit(prompt);

//     if (searchTerms.length === 0) {
//       return { type: "unknown", entity: null };
//     }

//     // Dynamically build the WHERE clause
//     const whereClause = searchTerms
//       .map(() => `LOWER(Name) LIKE ?`)
//       .join(" AND ");
//     const query = `SELECT * FROM Faculty WHERE ${whereClause}`;

//     // Create parameters for the query, e.g., ['%ss%', '%bhatia%']
//     const queryParams = searchTerms.map((term) => `%${term}%`);

//     const [results] = await db.promise().query(query, queryParams);

//     if (results.length > 0) {
//       console.log(
//         `✅ Found ${
//           results.length
//         } faculty match(es) for terms: [${searchTerms.join(", ")}]`
//       );

//       if (results.length === 1) {
//         return { type: "faculty", data: results };
//       } else {
//         return { type: "faculty_list", data: results };
//       }
//     }

//     // pass 2 timetable check
//     // In analyzePrompt, REPLACE the "Pass 2" block with this:

// // --- Pass 2: Check if the prompt is a Batch Code ---
// // This regex looks for common batch code patterns (e.g., 1A1A, 2F11, 4EC4, 3EC)
// const batchRegex = /^([A-Z0-9-]{3,6})$/i;
// const batchMatch = prompt.trim().match(batchRegex);

// if (batchMatch && batchMatch[0]) {
//   console.log(`✅ Found a batch code: ${batchMatch[0]}`);
//   return { type: "batch_timetable", batch: batchMatch[0] };
// }

//   // --- Fallback: If no keywords and no name match, the intent is unknown ---
//   return { type: "unknown", entity: null };
// }

// REPLACE your entire analyzePrompt function with this one

async function analyzePrompt(prompt, db) {
  const lower = prompt.toLowerCase();

  // --- Pass 1: Check for Batch Code ---
  const batchRegex = /^([A-Z0-9-]{3,6})$/i; // Matches 1A1A, COE-21 etc.
  const batchMatch = prompt.trim().match(batchRegex);
  if (batchMatch && batchMatch[0]) {
    return { type: "batch_timetable", batch: batchMatch[0] };
  }

  // --- Pass 2: Check for keywords ---
  if (lower.includes("mess") || lower.includes("menu")) {
    return { type: "mess" };
  }
  // Add other keyword checks here (faculty, cafeteria...)

  

  if (
    lower.includes("faculty") ||
    lower.includes("professor") ||
    lower.includes("dr")
  ) {
    return { type: "faculty_search", prompt: prompt }; // Pass original prompt
  }

  const hasChange = lower.includes('change');
  const hasGroup = lower.includes('group') || lower.includes('subgroup') || lower.includes('sub-group') || lower.includes('sub') && lower.includes('group');

  if (hasChange && hasGroup) {
    // ID 1 is for "Group / Sub-group Change"
    const steps = getDoaaProcedureById(1); 
    if (steps) {
      // Return this specific procedure immediately
      return { type: "simple_message", response: steps };
    }
  }

  const hasAdd = lower.includes('add') || lower.includes('opt');
  const hasAdditional = lower.includes('additional');
  const hasSubject = lower.includes('subject');
  const hasReg = lower.includes('registration');
  const hasBacklog = lower.includes('backlog');

  if ((hasAdd && hasAdditional && hasSubject) || (hasReg && hasBacklog)) {
    // ID 2 is for "Add Additional Subject / Backlog Registration"
    const steps = getDoaaProcedureById(2);
    if (steps) {
       // Return this specific procedure immediately
       return { type: "simple_message", response: steps };
    }
  }
  const hasDrop = lower.includes('drop') || lower.includes('remove') || lower.includes('withdraw') || lower.includes('with') && lower.includes('draw');
  const hasCourse = lower.includes('additional');


  if ((hasDrop && hasCourse)) {
    // ID 2 is for "Add Additional Subject / Backlog Registration"
    const steps = getDoaaProcedureById(3);
    if (steps) {
       // Return this specific procedure immediately
       return { type: "simple_message", response: steps };
    }
  }
  

  const doaaSteps = findDoaaProcedure(prompt);
  console.log("--- DoAA Check ---"); // <<< ADD THIS
  console.log("Prompt:", prompt); // <<< ADD THIS
  console.log("Result:", doaaSteps); // <<< ADD THIS
  if (doaaSteps) {
    // If a procedure is found, return it directly
    return { type: "simple_message", response: doaaSteps };
  }

  // Example for faculty (ensure sanitizeAndSplit exists):
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


  // --- Fallback ---
  return { type: "unknown" };
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
      case "faculty_search": {
        try {
          // Paste your existing faculty search logic here
          const searchTerms = sanitizeAndSplit(intent.prompt);
          if (searchTerms.length === 0) {
            return res.json({
              type: "unknown",
              response: "Please specify a faculty name.",
            });
          }

          const whereClause = searchTerms
            .map(() => `LOWER(Name) LIKE ?`)
            .join(" AND ");
          const query = `SELECT * FROM Faculty WHERE ${whereClause}`;
          const queryParams = searchTerms.map((term) => `%${term}%`);
          const [results] = await db.promise().query(query, queryParams);

          if (results.length === 0) {
            return res.json({
              type: "unknown",
              response: "No faculty found matching that name.",
            });
          }
          if (results.length === 1) {
            // Return single result directly
            return res.json({ type: "faculty", data: results });
          }
          // If multiple results, ask for clarification
          return res.json({ type: "clarification_needed", data: results }); // Or use 'faculty_list' if you prefer
        } catch (facultyErr) {
          console.error("Faculty search error:", facultyErr.message);
          return res.json({
            type: "unknown",
            response: "Sorry, I encountered an error searching for faculty.",
          });
        }
      }

      case "simple_message":
    // If analyzePrompt already found the answer (like DoAA steps)
    return res.json({ type: "simple_message", response: intent.response });
      case "batch_timetable": {
        const schedule = getScheduleForToday(intent.batch);
        return res.json({ type: "simple_message", response: schedule });
      }

      // case "timetable": {
      //   // Use block scope {} for clarity
      //   let query;
      //   let params;
      //   // This custom sort order ensures days are always Monday, Tuesday, etc.
      //   const daysOrder =
      //     "FIELD(DayOfWeek, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')";

      //   if (intent.entity?.group) {
      //     query = `SELECT * FROM Timetable WHERE GroupName = ? ORDER BY ${daysOrder}, TimeSlot`;
      //     params = [intent.entity.group];
      //   } else {
      //     // This can be a fallback or an error message
      //     return res.json({
      //       type: "unknown",
      //       response:
      //         "Please specify a group (e.g., COE-21) to see a timetable.",
      //     });
      //   }

      //   const [results] = await db.promise().query(query, params);
      //   return res.json({
      //     type: "timetable",
      //     data: results,
      //     entity: intent.entity,
      //   });
      // }
      
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
