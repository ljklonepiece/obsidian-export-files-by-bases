import { Plugin } from 'obsidian';
import { ExportModal } from './ExportModal';
import { t } from './i18n';

export default class ExportBasesFilesPlugin extends Plugin {

	async onload() {
		// This adds a ribbon icon to open the export modal
		this.addRibbonIcon('upload', t('RIBBON_TOOLTIP'), () => {
			new ExportModal(this.app).open();
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-export-modal',
			name: t('COMMAND_NAME'),
			callback: () => {
				new ExportModal(this.app).open();
			}
		});
	}

	onunload() {
	}
}
