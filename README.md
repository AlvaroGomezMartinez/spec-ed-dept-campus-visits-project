# Special Education Department Campus Visits/Communication 2025-2026 Project
## Google Apps Script Development
[Alvaro Gomez](alvaro.gomez@nisd.net)<br>
Academic Technology Coach<br>
Department of Academic Technology<br>
Northside Independent School District<br>
210-397-9408

This project uses a bound Google Apps Script file designed to support NISD's Special Education Department campus visit reporting. It consists of three sheets that together provide filtered data views.

## Features
- Automates campus visit reporting by SE Dept Staff
- Automates campus specific data
- Collects and stores visit data
- Integrates with Google Workspace (Sheets and Forms)

## Getting Started
1. Create a Google Form that collects the necessary fields for each campus visit. Following are the fields that were used: Email Address | Date | Duration of Visit | Elementary Campus | Middle School | High School | Special Campus | Mode of Communication | Purpose *check all that apply* | Support Provided to: | Staff Name (first initial, last name) | Notes | Special Education Department Staff
2. Create the Google Sheet that collects the form's responses.
3. Create two additional sheets for the data filter views, "By SE Dept Staff" and "Search".
4. Add the following Google Sheets Query formula in A1 of the "By SE Dept Staff" sheet: `=QUERY('Form Responses 1'!A:N, "SELECT N, A, B, C, D, E, F, G, H, I, J, K, L, M WHERE N IS NOT NULL ORDER BY N ASC", 1)`. This will pull in the data from the "Form Responses 1" sheet.
5. In the "Search" sheet add the following text in A1:<br><br>
Directions for filtering data by staff & campus: 
- Select your email in the yellow cell.
- Select the campus in the orange cell.
- Click on green "FILTER" button.<br>
6. In the "Search" sheet add the following text in A2: "Email:"	
7. In the "Search" sheet add the following text in A3: "Campus:"
8. Create a button to launch the script function (Insert -> Drawing)
9. Clone or download this repository.
10. Use [clasp](https://github.com/google/clasp) to push/pull code to your Google Apps Script project.
11. Update `appsscript.json` and `Code.js` as needed.

## Deployment
- Use the Google Apps Script editor or clasp to deploy updates.
- Make sure to configure necessary permissions in the Google Cloud Console if using advanced services.

## Files
- `Code.js`: Main script file containing the core logic.
- `appsscript.json`: Project manifest file.

## Requirements
- Google account with access to Google Apps Script
- [clasp](https://github.com/google/clasp) installed for local development (optional)
