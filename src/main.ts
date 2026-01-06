import { App, Plugin, Notice } from 'obsidian';
import { ExportModal } from './ExportModal';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";

export default class ExportBasesFilesPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a ribbon icon to open the export modal
		this.addRibbonIcon('upload', 'Export Bases Files', (evt: MouseEvent) => {
			new ExportModal(this.app).open();
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-export-modal',
			name: 'Open Export Interface',
			callback: () => {
				new ExportModal(this.app).open();
			}
		});

		// This adds a settings tab
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

