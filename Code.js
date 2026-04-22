// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sheet name constants — single place to update if sheets are renamed. */
const SHEET_NAMES = {
  RESPONSES: 'Form Responses 1',
  SEARCH: 'Search',
  STAFF: 'Staff',
};

/**
 * Column layout constants.
 * "1-based" values are for Sheets API getRange(row, col) calls.
 * "0-based" values are for array index access on row data.
 */
const COLUMNS = {
  // Form Responses sheet (1-based for getRange)
  EMAIL: 2,            // Column B
  CAMPUS_START: 5,     // Column E
  CAMPUS_COUNT: 4,     // E through H (4 columns)

  // Form Responses sheet (0-based for array access)
  EMAIL_INDEX: 1,      // Column B
  CAMPUS_INDEXES: [4, 5, 6, 7], // Columns E–H

  // Staff sheet (0-based for array access)
  STAFF_EMAIL: 1,      // Column B
  STAFF_CAMPUS: 2,     // Column C
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Returns the sheet with the given name from the active spreadsheet.
 * @param {string} name - One of the SHEET_NAMES values.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

/**
 * Returns a new array with duplicates and falsy values removed.
 * @param {Array} arr - The source array.
 * @returns {Array} De-duplicated array (preserves original order).
 */
function unique(arr) {
  return [...new Set(arr.filter(v => v))];
}


/**
 * Reads a range of values, flattens, de-dupes, sorts, and applies a
 * data-validation dropdown to the target cell.
 * @param {GoogleAppsScript.Spreadsheet.Range} targetCell - Cell to receive the dropdown.
 * @param {GoogleAppsScript.Spreadsheet.Range} sourceRange - Range to pull values from.
 * @returns {void}
 */
function setDropdownFromRange(targetCell, sourceRange) {
  const values = unique(sourceRange.getValues().flat()).sort();
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .build();
  targetCell.setDataValidation(rule);
}

/**
 * Safely returns data rows from a sheet, or an empty array when the sheet
 * has no data rows (only headers or is completely empty).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to read.
 * @param {number} startCol - 1-based start column.
 * @param {number} numCols - Number of columns to read.
 * @returns {Array[]} 2-D array of row data.
 */
function getDataRows(sheet, startCol, numCols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, startCol, lastRow - 1, numCols).getValues();
}

// ---------------------------------------------------------------------------
// Dropdown setup
// ---------------------------------------------------------------------------

/**
 * Runs when the spreadsheet is opened. Adds dropdowns to the Search sheet.
 * @returns {void}
 */
function onOpen() {
  const searchSheet = getSheet(SHEET_NAMES.SEARCH);
  addEmailDropdown(searchSheet);
  addCampusDropdown(searchSheet);
}

/**
 * Adds a dropdown list of unique emails to cell B2 in the given sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add the dropdown to.
 * @returns {void}
 */
function addEmailDropdown(sheet) {
  const responsesSheet = getSheet(SHEET_NAMES.RESPONSES);
  const lastRow = responsesSheet.getLastRow();
  if (lastRow < 2) return;

  const sourceRange = responsesSheet.getRange(2, COLUMNS.EMAIL, lastRow - 1);
  setDropdownFromRange(sheet.getRange('B2'), sourceRange);
}

/**
 * Adds a dropdown list of campuses to cell B3 in the given sheet.
 * If an email is provided, only campuses associated with that person's
 * form responses are included. Otherwise all campuses are listed.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add the dropdown to.
 * @param {string} [email] - Optional email to filter campuses by.
 * @returns {void}
 */
function addCampusDropdown(sheet, email) {
  const responsesSheet = getSheet(SHEET_NAMES.RESPONSES);
  const lastRow = responsesSheet.getLastRow();
  if (lastRow < 2) {
    sheet.getRange('B3').clearDataValidations();
    return;
  }

  if (email) {
    // Read email column + campus columns for filtering
    const emailData = responsesSheet.getRange(2, COLUMNS.EMAIL, lastRow - 1).getValues().flat();
    const campusData = responsesSheet.getRange(2, COLUMNS.CAMPUS_START, lastRow - 1, COLUMNS.CAMPUS_COUNT).getValues();

    const campuses = [];
    emailData.forEach((rowEmail, i) => {
      if (rowEmail === email) {
        campusData[i].forEach(v => { if (v) campuses.push(v); });
      }
    });

    const values = unique(campuses).sort();
    if (!values.length) {
      sheet.getRange('B3').clearDataValidations().clearContent();
      return;
    }
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).build();
    sheet.getRange('B3').clearContent().setDataValidation(rule);
  } else {
    // No email selected — show all campuses
    const sourceRange = responsesSheet.getRange(2, COLUMNS.CAMPUS_START, lastRow - 1, COLUMNS.CAMPUS_COUNT);
    sheet.getRange('B3').clearContent();
    setDropdownFromRange(sheet.getRange('B3'), sourceRange);
  }
}


// ---------------------------------------------------------------------------
// Edit trigger
// ---------------------------------------------------------------------------

/**
 * Runs on every cell edit. When the email dropdown (B2) on the Search sheet
 * changes, rebuilds the campus dropdown (B3) to show only that person's
 * campuses.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - The edit event object.
 * @returns {void}
 */
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAMES.SEARCH) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // B2 is row 2, column 2
  if (row === 2 && col === 2) {
    const email = e.range.getValue();
    addCampusDropdown(sheet, email || undefined);
  }
}

// ---------------------------------------------------------------------------
// Data filtering
// ---------------------------------------------------------------------------

/**
 * Filters form response data by selected email and campus, and outputs
 * results to the Search sheet.
 * @returns {void}
 */
function filterData() {
  const formSheet = getSheet(SHEET_NAMES.RESPONSES);
  const searchSheet = getSheet(SHEET_NAMES.SEARCH);

  const email = searchSheet.getRange('B2').getValue();
  const campus = searchSheet.getRange('B3').getValue();

  if (!email) {
    searchSheet.getRange('A5').setValue('Please select an email before filtering.');
    return;
  }

  const lastCol = formSheet.getLastColumn();
  const headers = formSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = getDataRows(formSheet, 1, lastCol);

  const filtered = data.filter(row => {
    const emailMatch = row[COLUMNS.EMAIL_INDEX] === email;
    if (!emailMatch) return false;
    if (!campus) return true; // No campus selected — return all rows for this email
    return COLUMNS.CAMPUS_INDEXES.some(i => row[i] === campus);
  });

  // Clear existing output dynamically based on actual column count
  const clearLastCol = Math.max(lastCol, 26);
  searchSheet.getRange(5, 1, searchSheet.getMaxRows() - 4, clearLastCol).clearContent();

  if (filtered.length > 0) {
    searchSheet.getRange(5, 1, 1, headers.length).setValues([headers]);
    searchSheet.getRange(6, 1, filtered.length, filtered[0].length).setValues(filtered);
  } else {
    searchSheet.getRange(5, 1).setValue('No matching results found.');
  }
}


// ---------------------------------------------------------------------------
// Email notification helpers (decomposed from notifyStaffOnSubmit)
// ---------------------------------------------------------------------------

/**
 * Extracts a de-duplicated list of campus names from a form-submit event.
 * Reads columns E–H from the submitted row first, then falls back to
 * namedValues for campus-like field names.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - The form submit event.
 * @returns {string[]} Unique, non-empty campus names.
 */
function extractCampuses(e) {
  const namedValues = e.namedValues || {};
  let campuses = [];

  // Primary source: cell values from the submitted row (columns E–H)
  if (e.range && e.range.getSheet) {
    const sheet = e.range.getSheet();
    const row = e.range.getRow();
    const values = sheet.getRange(row, COLUMNS.CAMPUS_START, 1, COLUMNS.CAMPUS_COUNT).getValues()[0];
    values.forEach(v => {
      if (v && String(v).trim()) campuses.push(String(v).trim());
    });
  }

  // Fallback: namedValues with campus-like field names
  if (Object.keys(namedValues).length > 0) {
    Object.keys(namedValues).forEach(k => {
      if (/campus|elementary|middle|high|special/i.test(k)) {
        const val = namedValues[k];
        if (Array.isArray(val)) campuses.push(...val.map(s => String(s).trim()));
        else if (val) campuses.push(String(val).trim());
      }
    });
  }

  return unique(campuses);
}

/**
 * Builds the plain-text email body for a form submission notification.
 * Prefers namedValues when available; falls back to reading the header row
 * and submitted row directly from the sheet.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - The form submit event.
 * @param {string[]} campuses - Campus names for the intro line.
 * @returns {string} Formatted email body.
 */
function buildEmailBody(e, campuses) {
  const namedValues = e.namedValues || {};
  let body = `A new form response was submitted for ${campuses.join(', ')}.\n\n`;

  if (Object.keys(namedValues).length > 0) {
    body += 'Submission details:\n';
    for (const key of Object.keys(namedValues)) {
      const val = Array.isArray(namedValues[key]) ? namedValues[key].join(', ') : namedValues[key];
      body += `- ${key}: ${val}\n`;
    }
  } else if (e.range) {
    const sheet = e.range.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(e.range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
    body += 'Submission details:\n';
    for (let i = 0; i < headers.length; i++) {
      body += `- ${headers[i]}: ${values[i]}\n`;
    }
  }

  return body;
}

/**
 * Sends the same email to each address in the list, logging failures
 * individually so one bad address doesn't block the rest.
 * @param {string[]} emails - Recipient addresses.
 * @param {string} subject - Email subject line.
 * @param {string} body - Plain-text email body.
 * @returns {void}
 */
function sendNotifications(emails, subject, body) {
  emails.forEach(addr => {
    try {
      MailApp.sendEmail({ to: addr, subject: subject, body: body });
    } catch (err) {
      console.error(`Failed sending to ${addr}: ${err}`);
    }
  });
}


// ---------------------------------------------------------------------------
// Email notification (main orchestrator)
// ---------------------------------------------------------------------------

/**
 * Sends notification emails to staff assigned to the campus referenced in
 * the submitted form. Intended to be called by an onFormSubmit trigger.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - The form submit event object.
 * @returns {void}
 */
function notifyStaffOnSubmit(e) {
  try {
    const campuses = extractCampuses(e);
    if (!campuses.length) {
      console.warn('notifyStaffOnSubmit: No campus values found in columns E-H or namedValues. Aborting.');
      return;
    }

    const emails = unique(campuses.flatMap(getStaffEmailsForCampus));
    if (!emails.length) {
      console.info(`No staff emails found for campuses: ${campuses.join(', ')}`);
      return;
    }

    const subject = `New form submission for ${campuses.join(', ')}`;
    const body = buildEmailBody(e, campuses);
    sendNotifications(emails, subject, body);
  } catch (err) {
    console.error('notifyStaffOnSubmit error:', err);
  }
}

// ---------------------------------------------------------------------------
// Staff lookup
// ---------------------------------------------------------------------------

/**
 * Returns an array of staff emails assigned to the provided campus.
 * Expects a sheet named 'Staff' with at least columns: Name, Email, Campus.
 * Campus can be a single value or semicolon/comma-separated list in the
 * Campus cell.
 * @param {string} campus - Campus name to match (case-insensitive trim).
 * @returns {string[]} Array of email addresses.
 */
function getStaffEmailsForCampus(campus) {
  const staffSheet = getSheet(SHEET_NAMES.STAFF);
  if (!staffSheet) return [];

  const data = getDataRows(staffSheet, 1, staffSheet.getLastColumn());
  if (!data.length) return [];

  const target = campus.toLowerCase();
  const emails = [];

  data.forEach(row => {
    const cellCampus = row[COLUMNS.STAFF_CAMPUS];
    const cellEmail = row[COLUMNS.STAFF_EMAIL];
    if (!cellEmail || !cellCampus) return;

    const campuses = String(cellCampus).split(/[;,]+/).map(s => s.trim().toLowerCase());
    if (campuses.includes(target)) {
      emails.push(String(cellEmail).trim());
    }
  });

  return unique(emails);
}

// ---------------------------------------------------------------------------
// Trigger setup
// ---------------------------------------------------------------------------

/**
 * Creates an installable onFormSubmit trigger that calls notifyStaffOnSubmit.
 * Run once manually to install the trigger. Safe to call multiple times —
 * skips creation if the trigger already exists.
 * @returns {void}
 */
function createOnFormSubmitTrigger() {
  const existing = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'notifyStaffOnSubmit');

  if (existing.length === 0) {
    ScriptApp.newTrigger('notifyStaffOnSubmit')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onFormSubmit()
      .create();
    Logger.log('notifyStaffOnSubmit trigger created.');
  } else {
    Logger.log('notifyStaffOnSubmit trigger already exists.');
  }
}

/*
  Staff sheet format notes (expected):
  - Sheet name: 'Staff'
  - Row 1: headers (e.g., Name, Email, Campus)
  - Row 2..n: data rows
  - Campus cell may contain a single campus or multiple separated by semicolon/comma
*/