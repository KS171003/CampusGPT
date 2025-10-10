import express from "express";
import db from "../db.js"; 

const router = express.Router();


function analyzePrompt(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes("faculty")) return { type: "faculty" };
  if (lower.includes("timetable")) return { type: "timetable" };
  if (lower.includes("mess")) return { type: "mess" };
  if (lower.includes("cafeteria")) return { type: "cafeteria" };
  if (
    lower.includes("navigate") ||
    lower.includes("direction") ||
    lower.includes("route")
  )
    return { type: "navigation" };

  return { type: "unknown" };
}


router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const intent = analyzePrompt(prompt);

  try {
    switch (intent.type) {
      case "faculty":
        db.query("SELECT * FROM Faculty LIMIT 5", (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ type: "faculty", data: result });
        });
        break;

      case "timetable":
        db.query("SELECT * FROM timetable LIMIT 5", (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ type: "timetable", data: result });
        });
        break;

      case "mess":
        db.query("SELECT * FROM MessMenu LIMIT 5", (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ type: "mess_menu", data: result });
        });
        break;

      default:
        res.json({
          type: "unknown",
          response:
            "Sorry, I didn’t understand that. Try asking about faculty, timetable, mess, or navigation.",
        });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
