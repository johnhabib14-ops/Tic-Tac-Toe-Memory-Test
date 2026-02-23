/**
 * Google Apps Script: append one row to the linked spreadsheet when the app POSTs results.
 *
 * SETUP:
 * 1. Create a new Google Sheet for your study (e.g. "Tic-Tac-Toe Memory Test Results").
 * 2. In the sheet, go to Extensions → Apps Script.
 * 3. Replace the default Code.gs with this file's contents (or paste this into Code.gs).
 * 4. Save the project (e.g. name it "MemoryTestSheet").
 * 5. Deploy: Deploy → New deployment → Type "Web app".
 *    - Description: e.g. "Receive results"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy, authorize when prompted, then copy the "Web app URL".
 * 7. In your app's .env (or Vite env), set:
 *    VITE_GOOGLE_SHEETS_SCRIPT_URL=<paste the Web app URL>
 * 8. Rebuild the app (e.g. npm run build). When participants click "Submit results to study",
 *    a new tab will POST to this URL and the row will be appended; the tab shows a confirmation.
 *
 * The first row of the sheet will be used as headers (written on first submission if the sheet is empty).
 */

const HEADERS = [
  'participantId',
  'name',
  'age',
  'gender',
  'location',
  'timestamp',
  'memoryPoints',
  'highestLevelPassed',
  'overallAccuracyPercent',
  'meanReactionTimeMs',
  'totalIncorrectPlacements',
  'totalWrongShapeUsed',
  'copyScore',
  'copyTimeMs'
];

function doPost(e) {
  try {
    const raw = e && e.parameter && e.parameter.data;
    if (!raw) {
      return createResponse(400, 'Missing "data" parameter');
    }
    const payload = JSON.parse(raw);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    const row = HEADERS.map(function (key) {
      var v = payload[key];
      return v === undefined || v === null ? '' : v;
    });
    sheet.appendRow(row);

    return createResponse(200, 'Results recorded. You can close this tab.');
  } catch (err) {
    return createResponse(500, 'Error: ' + (err.message || String(err)));
  }
}

function createResponse(status, message) {
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Submit</title></head><body><p>' +
    message + '</p></body></html>';
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}
