# Obsidian Export-Bases-Files Plugin

**Export-Bases-Files** is an Obsidian plugin designed to bridge the gap between Obsidian's powerful internal **Bases** feature and your external file system. It allows you to export a specific set of files—filtered by your Bases Table Views—to any folder on your computer with just a few clicks.

## Key Features

- 🚀 **Strict Bases API Integration**: Unlike basic filtering, this plugin talks directly to the internal Bases engine. If it shows up in your Table View, it will show up in your export.
- 🔍 **Smart Auto-Detection**: Automatically detects your active Base and Table View when you open the export interface, saving you from repetitive manual selection.
- 🔄 **Programmatic View Switching**: Selecting a view in the export modal automatically switches your Bases tab to the correct view in the background to ensure data consistency.
- 📂 **Automatic Base Management**: If you select a Base that isn't currently open, the plugin will automatically open it for you before processing the export.
- 🖱️ **Native Directory Picker**: Includes a "Browse..." button to select your export destination using a familiar system folder dialog (Desktop only).
- 🛡️ **Safe & Non-Destructive**: The plugin only *copies* files to your external folder. Your original notes in Obsidian are never moved or modified.

## How to Use

1. **Open the Interface**: Click the **Upload/Export** icon in the ribbon or use the command palette (`Cmd/Ctrl + P`) and search for `Export-Bases-Files: Open Export Interface`.
2. **Select your Base**: Choose the `.base` file that contains the data you want to export.
3. **Select your View**: Pick the specific Table View that has the filters you want to apply. 
4. **Choose Destination**: Click **Browse...** to select where on your computer you want the files to go.
5. **Export**: Hit the **Export** button. A notice will appear once the process is complete!

## Installation

### From GitHub Releases
1. Download the latest `main.js`, `manifest.json`, and `styles.css` from the [Releases](https://github.com/your-username/obsidian-export-by-bases-plugin/releases) page.
2. Create a folder named `obsidian-export-by-bases-plugin` inside your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community Plugins**.

## For Developers

If you want to build the plugin from source:
1. Clone the repository.
2. Run `npm install`.
3. Run `npm run build` to generate the `main.js`.
4. Run `npm test` to verify the logic with our unit test suite.

## Support

If you encounter any issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/your-username/obsidian-export-by-bases-plugin/issues).
