export class App { }
export class Modal {
    app: unknown;
    contentEl: HTMLElement;
    constructor(app: unknown) {
        this.app = app;
        this.contentEl = document.createElement('div');
    }
    open() { }
    close() { }
    onOpen() { }
    onClose() { }
}
export class Setting {
    constructor(containerEl: HTMLElement) { }
    setName(name: string) { return this; }
    setDesc(desc: string) { return this; }
    addDropdown(callback: (dropdown: unknown) => void) { return this; }
    addText(callback: (text: unknown) => void) { return this; }
    addButton(callback: (button: unknown) => void) { return this; }
}
export const Notice = jest.fn();
export const parseYaml = jest.fn((content: string) => {
    // Basic mock for testing
    if (content.includes('family')) {
        return {
            views: [{ name: 'family', filters: { and: ['area.contains("family")'] } }]
        };
    }
    return {};
});
export class Plugin { }
export class PluginSettingTab {
    constructor(app: unknown, plugin: unknown) { }
}
export class TFolder { }
