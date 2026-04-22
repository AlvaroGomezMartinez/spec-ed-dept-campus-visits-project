# Special Education Department Campus Visits/Communication 2025-2026 Project

## Google Apps Script Development

Alvaro Gomez<br>
210-363-1577

This project uses a bound Google Apps Script file designed to support NISD's Special Education Department campus visit reporting. It relies on four sheets that together provide filtered data views and automated email notifications.

## Features

- Populates email and campus dropdowns automatically when the spreadsheet is opened
- Campus dropdown updates dynamically to show only campuses associated with the selected staff member
- Filters form response data by staff email, with optional campus narrowing
- Sends email notifications to relevant staff when a new form response is submitted
- Integrates with Google Workspace (Sheets, Forms, and Gmail)

## Sheets

| Sheet | Purpose |
|---|---|
| **Form Responses 1** | Raw data collected by the Google Form. |
| **By SE Dept Staff** | Query-driven view that sorts responses by staff member. |
| **Search** | Interactive filter UI with email/campus dropdowns and a Filter button. |
| **Staff** | Lookup table mapping staff names, emails, and campus assignments (used for email notifications). |

## Getting Started

1. Create a Google Form that collects the necessary fields for each campus visit. The following fields were used: Email Address, Date, Duration of Visit, Elementary Campus, Middle School, High School, Special Campus, Mode of Communication, Purpose (*check all that apply*), Support Provided to, Staff Name (first initial, last name), Notes, Special Education Department Staff.
2. Create the Google Sheet that collects the form's responses (the **Form Responses 1** sheet is created automatically).
3. Create three additional sheets: **By SE Dept Staff**, **Search**, and **Staff**.
4. Add the following Google Sheets Query formula in A1 of the **By SE Dept Staff** sheet:
   ```
   =QUERY('Form Responses 1'!A:N, "SELECT N, A, B, C, D, E, F, G, H, I, J, K, L, M WHERE N IS NOT NULL ORDER BY N ASC", 1)
   ```
5. Set up the **Search** sheet:
   - A1: Directions for filtering data by staff and campus.
   - A2: `Email:`
   - A3: `Campus:`
   - B2: Email dropdown (populated automatically by the script).
   - B3: Campus dropdown (populated automatically; updates when an email is selected).
   - Create a button (Insert > Drawing) and assign the `filterData` function to it.
6. Set up the **Staff** sheet:
   - Row 1 headers: `Name`, `Email`, `Campus`
   - Row 2+: One row per staff member. The Campus column can contain a single campus or multiple campuses separated by commas or semicolons.
7. Clone or download this repository.
8. Use [clasp](https://github.com/google/clasp) to push/pull code to your Google Apps Script project.
9. Run `createOnFormSubmitTrigger()` once from the Apps Script editor to install the form-submit email notification trigger.
10. Update `appsscript.json` and `Code.js` as needed.

## Script Functions

| Function | Trigger | Description |
|---|---|---|
| `onOpen` | Automatic (spreadsheet open) | Populates the email and campus dropdowns on the Search sheet. |
| `onEdit` | Automatic (cell edit) | When the email dropdown (B2) changes, rebuilds the campus dropdown to show only that person's campuses. |
| `filterData` | Manual (button click) | Filters form responses by the selected email and optional campus, then outputs results to the Search sheet. |
| `notifyStaffOnSubmit` | Installable (form submit) | Sends email notifications to staff assigned to the campuses in the submitted form response. |
| `createOnFormSubmitTrigger` | Run once manually | Creates the installable `onFormSubmit` trigger for `notifyStaffOnSubmit`. Safe to run multiple times. |

## Deployment

- Use the Google Apps Script editor or clasp to deploy updates.
- Make sure to configure necessary permissions in the Google Cloud Console if using advanced services.

## Files

- `Code.js` — Main script file containing all functions, constants, and helpers.
- `appsscript.json` — Project manifest file.

## Requirements

- Google account with access to Google Apps Script
- [clasp](https://github.com/google/clasp) installed for local development (optional)

## Notes

- The Search sheet filter is designed for single-user use. If multiple users filter at the same time, their selections and results may conflict since the dropdowns and output area are shared cells.
