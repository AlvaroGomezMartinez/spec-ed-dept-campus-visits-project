# Special Education Department Campus Visits/Communication

## What This Project Does

Special Education Department staff at NISD visit campuses regularly and need a simple way to log those visits and look them up later. This project ties a Google Form to a Google Sheet with Apps Script automation so that:

1. Staff submit a form after each campus visit.
2. The data lands in a spreadsheet where it can be viewed by staff member or searched by email and campus.
3. When a form is submitted, staff assigned to that campus automatically receive an email notification with the submission details.

No extra software is needed — everything runs inside Google Workspace (Forms, Sheets, Gmail).

## How It Works

```
Google Form  ──▶  Form Responses 1 sheet  ──▶  By SE Dept Staff (query view)
                         │                          
                         ├──▶  Search sheet (interactive filter)
                         │
                         └──▶  Email notification to campus staff
```

The spreadsheet has four sheets:

| Sheet | What it does |
|---|---|
| **Form Responses 1** | Stores raw form submissions. Created automatically when you link a form to the sheet. |
| **By SE Dept Staff** | A read-only view that reorders responses by staff member name using a `QUERY` formula. |
| **Search** | An interactive page where users pick their email and optionally a campus, then click a Filter button to see matching visits. |
| **Staff** | A lookup table of staff names, email addresses, and campus assignments. Used by the script to determine who gets notified. |

## Setup Guide

### Prerequisites

- A Google account with access to Google Sheets and Google Forms
- (Optional) [clasp](https://github.com/google/clasp) if you want to edit the script locally instead of in the browser

### Step 1: Create the Google Form

Create a form with these fields (adjust as needed):

| Field | Type |
|---|---|
| Email Address | Auto-collected or short answer |
| Date | Date picker |
| Duration of Visit | Short answer or dropdown |
| Elementary Campus | Dropdown or list |
| Middle School | Dropdown or list |
| High School | Dropdown or list |
| Special Campus | Dropdown or list |
| Mode of Communication | Multiple choice |
| Purpose | Checkboxes (*check all that apply*) |
| Support Provided to | Short answer |
| Staff Name | Short answer (first initial, last name) |
| Notes | Paragraph |
| Special Education Department Staff | Dropdown or list |

The four campus fields (Elementary, Middle, High, Special) must be in columns E through H of the response sheet. The script depends on this layout.

### Step 2: Create the spreadsheet

Link the form to a Google Sheet. This creates the **Form Responses 1** sheet automatically. Then create three more sheets:

**By SE Dept Staff** — In cell A1, paste this formula:

```
=QUERY('Form Responses 1'!A:N, "SELECT N, A, B, C, D, E, F, G, H, I, J, K, L, M WHERE N IS NOT NULL ORDER BY N ASC", 1)
```

**Search** — Set up the filter interface:

| Cell | Content |
|---|---|
| A1 | Directions text (e.g., "Select your email, optionally select a campus, then click Filter.") |
| A2 | `Email:` |
| A3 | `Campus:` |
| B2 | *(left blank — the script populates an email dropdown here)* |
| B3 | *(left blank — the script populates a campus dropdown here)* |

Then add a Filter button: **Insert > Drawing**, create a button shape, right-click it after placing, choose **Assign script**, and enter `filterData`.

**Staff** — Create a table for email notifications:

| Name | Email | Campus |
|---|---|---|
| J. Smith | jsmith@nisd.net | Lincoln Elementary |
| A. Jones | ajones@nisd.net | Lincoln Elementary; Taft Middle School |

The Campus column can hold a single campus or multiple campuses separated by commas or semicolons.

### Step 3: Add the script

Option A (browser): Open the sheet, go to **Extensions > Apps Script**, and paste the contents of `Code.js`.

Option B (clasp): Clone this repo, then push with clasp:

```bash
clasp push
```

### Step 4: Install the email notification trigger

In the Apps Script editor, run the `createOnFormSubmitTrigger` function once. This creates an installable trigger so that `notifyStaffOnSubmit` fires every time a form response comes in. You only need to do this once — running it again is safe and will skip if the trigger already exists.

### Step 5: Authorize permissions

The first time the script runs, Google will prompt you to authorize access to Sheets and Gmail. Accept the permissions to allow the script to read data and send emails.

## Script Reference

| Function | When it runs | What it does |
|---|---|---|
| `onOpen` | Spreadsheet is opened | Populates the email and campus dropdowns on the Search sheet. |
| `onEdit` | Any cell is edited | If the email dropdown (B2) on the Search sheet changes, rebuilds the campus dropdown (B3) to show only that person's campuses. |
| `filterData` | User clicks the Filter button | Reads the selected email and optional campus, filters form responses, and writes the results to the Search sheet starting at row 5. |
| `notifyStaffOnSubmit` | A form response is submitted | Looks up which campuses were in the submission, finds staff assigned to those campuses in the Staff sheet, and sends each of them an email with the submission details. |
| `createOnFormSubmitTrigger` | Run once manually | Creates the installable trigger for `notifyStaffOnSubmit`. |

### Column layout the script expects

The script uses hardcoded column positions. If you change the form field order, update the `COLUMNS` constant at the top of `Code.js`.

| Column | Sheet | Contains |
|---|---|---|
| B (col 2) | Form Responses 1 | Email address |
| E–H (cols 5–8) | Form Responses 1 | Campus fields (Elementary, Middle, High, Special) |
| B (col 2) | Staff | Staff email |
| C (col 3) | Staff | Campus assignment(s) |

## Files

| File | Purpose |
|---|---|
| `Code.js` | All script functions, constants, and helpers. |
| `appsscript.json` | Apps Script project manifest (timezone, runtime version). |
| `.clasp.json` | clasp project config (script ID binding). |

## Known Limitations

- **Single-user filtering.** The Search sheet uses shared cells for the dropdowns and output. If two users filter at the same time, their selections and results will overwrite each other.
- **Column positions are hardcoded.** If the form field order changes, the `COLUMNS` object in `Code.js` must be updated to match.
