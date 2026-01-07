import { App, PluginSettingTab, Setting } from "obsidian";
import ExportBasesFilesPlugin from "./main";
import { t } from "./i18n";

export interface ExportBasesSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: ExportBasesSettings = {
	mySetting: 'default'
}

export class ExportBasesSettingTab extends PluginSettingTab {
	plugin: ExportBasesFilesPlugin;

	constructor(app: App, plugin: ExportBasesFilesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		new Setting(containerEl).setName(t('SETTINGS_HEADER')).setHeading();

		new Setting(containerEl)
			.setName(t('SETTINGS_EXAMPLE_NAME'))
			.setDesc(t('SETTINGS_EXAMPLE_DESC'))
			.addText(text => text
				.setPlaceholder(t('SETTINGS_EXAMPLE_PLACEHOLDER'))
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
