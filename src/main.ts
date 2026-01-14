import { Plugin } from 'obsidian';
import { ExportModal } from './ExportModal';
import { t } from './i18n';

interface ExportBasesSettings {
	lastExportPath: string;
}

const DEFAULT_SETTINGS: ExportBasesSettings = {
	lastExportPath: ''
};

export default class ExportBasesFilesPlugin extends Plugin {
	settings: ExportBasesSettings;

	async onload() {
		await this.loadSettings();

		// This adds a ribbon icon to open the export modal
		this.addRibbonIcon('upload', t('RIBBON_TOOLTIP'), () => {
			new ExportModal(this).open();
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-export-modal',
			name: t('COMMAND_NAME'),
			callback: () => {
				new ExportModal(this).open();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<ExportBasesSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
	}
}
