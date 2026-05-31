# Data exports

Flat snapshots of the app's mock database, generated from the data files.
Re-run `node tools/export-data.mjs` after the data changes.

## Files

- `users.csv` — the 100 users + their personal-profit figures.
- `companies.csv` — the company list.
- `courses.csv` — the Learn seed catalogue.
- `users.md` — the users table as Markdown (preview it for a column view).

## Viewing as columns in VS Code

1. **Markdown preview (no extension):** open `users.md`, press **Ctrl+Shift+V**.
2. **Spreadsheet grid:** install the **Edit CSV** extension (`janisdd.vscode-edit-csv`),
   open a `.csv`, then click *Edit as csv* — you get a sortable grid in the editor.
3. **Coloured columns:** the **Rainbow CSV** extension (`mechatroner.rainbow-csv`)
   colourises columns and adds an *Align* command + SQL-like queries.

(VS Code will offer to install both — they're listed in `.vscode/extensions.json`.)
