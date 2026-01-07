# Changelog

All notable changes to this project will be documented in this file.

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
