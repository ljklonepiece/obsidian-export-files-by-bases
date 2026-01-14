# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-01-14
### Added
- **Robust Linux Directory Picker**: Implemented a platform-specific workaround for Linux/Ubuntu to ensure the "New Folder" button is always available in the directory dialog.
- **Directory Choice Persistence**: Added a settings system to remember the last used export directory for the "Browse" button, while keeping the input field clean by default for a fresh start.
- **Comprehensive Internationalization (i18n)**: Support for **English**, **Chinese (Simplified)**, **Japanese**, and **Korean**.
- **Funding URL**: Added a link to "Buy Me a Coffee" in the manifest.

### Removed
- **Settings Tab**: Removed the configuration interface as the plugin currently requires no user settings.
- **Unused Assets**: Removed `styles.css` and cleaned up unused localization keys.

### Fixed
- **Submission Readiness**: Updated License copyright and removed development-only console logs to comply with Community Plugin submission guidelines.
- **ESLint Compliance**: Refactored the codebase to resolve all bot-reported issues, including the removal of forbidden `any` ignores.
- **Strict Typing**: Replaced `any` with `unknown` and specific types, using type guards and `instanceof TFile` checks for Obsidian internal APIs.
- **Async Methods**: Fixed redundant `async` keywords in `onload` and `getBases`.
- **Build & Test Fixes**: Resolved TypeScript "possibly undefined" errors and updated unit tests to mock `TFile` class correctly.

## [1.2.1] - 2026-01-07

### Fixed
- **Depth Validation**: Prevented export depth from being set to 0 or invalid negative values. The minimum depth is now enforced at 1 (or -1 for infinite).

## [1.2.0] - 2026-01-07

### Added
- **File Type Filtering**: Added toggles to include/exclude internal files (`.base`, `.canvas`) and media files (images, audio, video, etc.) during export.
- **Default Exclusions**: Linked internal and media files are now excluded by default to keep exports clean.
- **Behavioral Toggles Mock**: Added `addToggle` support to the unit test suite for state synchronization verification.

## [1.1.0] - 2026-01-07

### Added
- **Export Linked Notes**: New feature to recursively export notes linked from the filtered set.
- **Export Depth Control**: Added a slider and text input to specify recursion depth (1-5).
- **Infinite Depth**: Support for infinite recursion (-1) with a safety limit of 50 levels.
- **Folder Creation**: Enabled the ability to create new folders directly in the export directory picker.
- **Auto-Detection**: The export modal now automatically detects the active Base and View from the workspace.
- **Fortified Testing**: Added behavioral UI mocks and full lifecycle unit tests to ensure stability without manual verification.

### Improved
- **Asynchronous Execution**: Migrated file operations to `fs.promises` to prevent UI blocking during large exports.
- **Type Safety**: Refined internal interfaces for the Bases plugin structure, reducing `any` usage.
- **Clean Logging**: Removed verbose debug logs for a cleaner developer console.

## [1.0.0] - 2026-01-06
- Initial release.
- Support for exporting files from Bases table views.
- Directory picker for export target.
