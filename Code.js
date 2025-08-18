/**
 * Runs when the spreadsheet is opened. Adds dropdowns to the Search sheet.
 * @returns {void}
 */
function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Search");
  addEmailDropdown(sheet);
  addCampusDropdown(sheet);
}

/**
 * Adds a dropdown list of unique emails to cell B2 in the given sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add the dropdown to.
 * @returns {void}
 */
function addEmailDropdown(sheet) {
  const responsesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  const emailCol = 2; // Assuming emails are in column B (index 2)
  const emails = responsesSheet.getRange(2, emailCol, responsesSheet.getLastRow() - 1).getValues()
    .flat()
    .filter(e => e)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  
  const range = sheet.getRange("B2");
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(emails, true).build();
  range.setDataValidation(rule);
}

/**
 * Adds a dropdown list of unique campuses to cell B3 in the given sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add the dropdown to.
 * @returns {void}
 */
function addCampusDropdown(sheet) {
  const responsesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  const data = responsesSheet.getRange(2, 5, responsesSheet.getLastRow() - 1, 4).getValues(); // Columns E:H
  const campuses = [...new Set(data.flat().filter(c => c))].sort();
  
  const range = sheet.getRange("B3");
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(campuses, true).build();
  range.setDataValidation(rule);
}

/**
 * Filters form response data by selected email and campus, and outputs results to the Search sheet.
 * @returns {void}
 */
function filterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName("Form Responses 1");
  const searchSheet = ss.getSheetByName("Search");

  const email = searchSheet.getRange("B2").getValue();
  const campus = searchSheet.getRange("B3").getValue();

  const headers = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getValues()[0];
  const data = formSheet.getRange(2, 1, formSheet.getLastRow() - 1, formSheet.getLastColumn()).getValues();

  // Filter by email and campus
  const emailIndex = 1; // Column B (index 1)
  const campusRange = [4, 5, 6, 7]; // Columns E to H (indexes 4–7)
  const filtered = data.filter(row => {
    return row[emailIndex] === email && campusRange.some(i => row[i] === campus);
  });

  // Clear existing output
  searchSheet.getRange("A5:Z").clearContent();

  // Output headers + filtered rows
  if (filtered.length > 0) {
    searchSheet.getRange(5, 1, 1, headers.length).setValues([headers]);
    searchSheet.getRange(6, 1, filtered.length, filtered[0].length).setValues(filtered);
  } else {
    searchSheet.getRange(5, 1).setValue("No matching results found.");
  }
}
