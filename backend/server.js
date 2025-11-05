import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import promptRoute from "./routes/promptRoute.js";
import { loadTimetableData } from './services/timetableService.js';
import { loadSubjectData } from './services/subjectService.js';

dotenv.config();
const app = express();

loadTimetableData(); // Load the CSV data
loadSubjectData();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "CampusGPT Backend Running 🚀" });
});

app.use("/api/prompt", promptRoute);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
