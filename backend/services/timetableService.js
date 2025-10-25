// backend/services/timetableService.js
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const timetable = [];
const timetableCSVPath = path.resolve('./consolidated_timetable_v2.csv'); // Path relative to backend folder root

/**
 * Loads the consolidated timetable CSV into memory.
 * Reads the CSV, skipping the first 4 lines as identified from your file.
 */
export function loadTimetableData() {
  console.log('▶ Loading consolidated timetable data...');
  fs.createReadStream(timetableCSVPath)
    .pipe(csv()) // Skip the top 4 lines before the header
    .on('data', (row) => {
      // Safety check for the Batch column
      if (row && typeof row.Batch === 'string') {
        const batchValue = row.Batch.trim().toUpperCase();
        if (batchValue) { // Ensure batch isn't empty after trimming
          row.Batch = batchValue; // Assign cleaned value back
          timetable.push(row);
        }
      }
    })
    .on('end', () => {
      if (timetable.length > 0) {
        console.log(`✅ Successfully loaded ${timetable.length} timetable entries.`);
      } else {
        console.warn("⚠️ Timetable loaded, but 0 entries found. Check skipLines or CSV content.");
      }
    })
    .on('error', (err) => {
      console.error('❌ ERROR: Could not load consolidated_timetable_v2.csv', err.message);
      console.error('Please ensure the file exists in the backend folder and the skipLines value is correct.');
    });
}

/**
 * Gets the schedule for a specific batch for the current day.
 */
export function getScheduleForToday(batchName) {
  if (timetable.length === 0) {
    return "Sorry, the timetable data is not available or is still loading. Please try again in a moment.";
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];
  const batchNameClean = batchName.trim().toUpperCase();

  const todaysSchedule = timetable.filter(slot =>
    slot.Batch === batchNameClean && slot.Day === currentDay
  );

  if (todaysSchedule.length === 0) {
    const isValidBatch = timetable.some(slot => slot.Batch === batchNameClean);
    return isValidBatch
      ? `🎉 No classes found for ${batchNameClean} today (${currentDay}).`
      : `Sorry, I couldn't find any batch with the code '${batchNameClean}'.`;
  }

  const scheduleSorted = todaysSchedule.sort((a, b) => a.Hours.localeCompare(b.Hours));
  let responseStr = `Here is the schedule for ${batchNameClean} today (${currentDay}):\n`;
  responseStr += "---------------------------------\n";
  scheduleSorted.forEach(row => {
    responseStr += `🕒 ${row.Hours}: ${row.Subject}\n`;
  });
  return responseStr;
}