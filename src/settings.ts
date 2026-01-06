import { App, PluginSettingTab, Setting } from "obsidian";
import ExportBasesFilesPlugin from "./main";

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

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
