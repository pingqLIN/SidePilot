# SidePilot v2.0 Manual Test Procedures

## Prerequisites

- Chrome browser (latest)
- Extension loaded unpacked from C:/dev/Projects/SidePilot/
- (Optional) GitHub Copilot CLI for SDK mode testing

## Test Procedures

### 1. Extension Loading

#### L-001: Initial Load

**Steps:**

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable "Developer mode".
4. Click "Load unpacked" and select `C:/dev/Projects/SidePilot/`.
5. Verify the extension appears in the list.

**Expected Result:**

- Extension loads without errors.
- SidePilot icon appears in the toolbar.

**Notes:**

- Check for any "Errors" button on the extension card.

### 2. Mode Detection (M1)

#### M1-001: Mode Detection on Load

**Steps:**

1. Close all sidepanels.
2. Open Chrome DevTools (F12).
3. Click SidePilot extension icon to open sidepanel.
4. Check Console for mode detection log.

**Expected Result:**

- Console shows: "SidePilot: Detected mode: [sdk|iframe]".
- Mode badge in tab-bar (right side) displays correct mode.
- No console errors.

**Notes:**

- If Copilot CLI not running, mode should be "iframe".

### 3. SDK Connection (M2)

#### M2-001: SDK Client Connection

**Steps:**

1. Ensure GitHub Copilot CLI is running (`github-copilot-cli alias --get-sdk-port`).
2. Open SidePilot sidepanel.
3. Observe the connection status in the console.

**Expected Result:**

- Console shows successful connection to SDK.
- Mode badge shows "SDK".

**Notes:**

- Requires Copilot CLI to be authenticated and running.

#### M2-002: SDK Unavailable Fallback

**Steps:**

1. Ensure GitHub Copilot CLI is NOT running.
2. Open SidePilot sidepanel.

**Expected Result:**

- SidePilot falls back to "iframe" mode.
- Mode badge shows "iframe".
- User can still interact with the Copilot web interface.

### 4. Tab Navigation (M3)

#### M3-001: Switching Tabs

**Steps:**

1. Open SidePilot sidepanel.
2. Click on the "Copilot" tab.
3. Click on the "Rules" tab.
4. Click on the "Memory" tab.

**Expected Result:**

- UI updates to show the corresponding section.
- Active tab is visually highlighted.
- No layout shifts or errors.

### 5. Rules System (Part 1)

#### 5.1 Save Rules (R-001)

**Steps:**

1. Navigate to the "Rules" tab.
2. Enter text into the rules editor.
3. Click "Save".

**Expected Result:**

- Success notification appears.
- Rules are persisted (verify by reloading sidepanel).

#### 5.2 Load Rules (R-002)

**Steps:**

1. Navigate to the "Rules" tab.
2. Ensure there are saved rules.
3. Reload the extension or sidepanel.

**Expected Result:**

- Previously saved rules are automatically loaded into the editor.

#### 5.3 Export Rules (R-003)

**Steps:**

1. Navigate to the "Rules" tab.
2. Click "Export".

**Expected Result:**

- A `.md` file is downloaded containing the current rules.

#### 5.4 Import Rules (R-004)

**Steps:**

1. Navigate to the "Rules" tab.
2. Click "Import".
3. Select a valid `.md` file.

**Expected Result:**

- Editor content is updated with the file's content.
- Success notification appears.

#### 5.5 Apply Template (R-005)

**Steps:**

1. Navigate to the "Rules" tab.
2. Click "Templates".
3. Select a template (e.g., "Technical Writer").

**Expected Result:**

- Editor content is replaced or appended with the template content.

### 6. Memory Bank (Part 2)

#### 6.1 Create Entry (MB-001)

**Steps:**

1. Navigate to the "Memory" tab.
2. Click "Add Entry".
3. Fill in Title, Content, Type, and Status.
4. Click "Save".

**Expected Result:**

- New entry appears in the list.

#### 6.2 View Entry (MB-002)

**Steps:**

1. Navigate to the "Memory" tab.
2. Click on an existing entry.

**Expected Result:**

- Entry details are displayed clearly.

#### 6.3 Update Entry (MB-003)

**Steps:**

1. Navigate to the "Memory" tab.
2. Click "Edit" on an entry.
3. Modify content and click "Save".

**Expected Result:**

- Entry is updated in the list with new information.

#### 6.4 Delete Entry (MB-004)

**Steps:**

1. Navigate to the "Memory" tab.
2. Click "Delete" on an entry.
3. Confirm deletion.

**Expected Result:**

- Entry is removed from the list.

#### 6.5 Search Entries (MB-005)

**Steps:**

1. Navigate to the "Memory" tab.
2. Type a keyword into the search bar.

**Expected Result:**

- List filters in real-time to show only matching entries.

#### 6.6 Filter Entries (MB-006)

**Steps:**

1. Navigate to the "Memory" tab.
2. Select a "Type" or "Status" filter from the dropdowns.

**Expected Result:**

- List updates to show only entries matching the selected filters.

#### 6.7 Send to VS Code (MB-007)

**Steps:**

1. Navigate to the "Memory" tab.
2. Click on an existing entry to open the edit modal.
3. Click "VS Code" button in the modal footer.

**Expected Result:**

- VS Code opens (if not already).
- A prompt or new file appears in VS Code with the entry content (via URI protocol).

### 7. Mode Indicator

#### MI-001: Badge Update

**Steps:**

1. Toggle the SDK availability (start/stop CLI).
2. Refresh SidePilot.

**Expected Result:**

- The badge in the tab-bar correctly reflects "SDK" or "iframe".
- Color coding matches the mode (e.g., Green for SDK, Blue for iframe).
- Badge is positioned at the right end of the tab-bar.

### 8. Error Scenarios

#### 8.1 SDK unavailable (E-001)

**Steps:**

1. Block the SDK port or stop the CLI.
2. Open SidePilot.

**Expected Result:**

- Graceful fallback to iframe mode.
- Warning message or indicator showing SDK is unavailable.

#### 8.2 Storage quota warning (E-002)

**Steps:**

1. Attempt to save a very large amount of data to Rules or Memory (exceeding Chrome storage limits).

**Expected Result:**

- Error message: "Storage quota exceeded".
- Data is not lost (previous state remains).

#### 8.3 Invalid file import (E-003)

**Steps:**

1. Navigate to "Rules" -> "Import".
2. Select a non-markdown file or a corrupted file.

**Expected Result:**

- Error message: "Invalid file format".
- Editor content remains unchanged.

## Expected Results Summary

| Test ID | Feature           | Pass Criteria                         |
| ------- | ----------------- | ------------------------------------- |
| L-001   | Extension Loading | Extension loads and icon appears      |
| M1-001  | Mode Detection    | Correct mode detected and logged      |
| M2-001  | SDK Connection    | Successful connection when CLI active |
| M3-001  | Tab Navigation    | Smooth switching between all tabs     |
| R-001   | Save Rules        | Rules persist after reload            |
| R-003   | Export Rules      | .md file downloaded correctly         |
| R-004   | Import Rules      | Editor updates with file content      |
| MB-001  | Create Memory     | Entry added to list                   |
| MB-005  | Search Memory     | Real-time filtering works             |
| MB-007  | VS Code Export    | URI protocol triggers VS Code         |
| MI-001  | Mode Badge        | Badge matches current operation mode  |
| E-001   | SDK Fallback      | Iframe mode works when SDK fails      |
