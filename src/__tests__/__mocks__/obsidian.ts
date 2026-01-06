export class App { }
export class Modal {
    app: any;
    contentEl: HTMLElement;
    constructor(app: any) {
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
    addDropdown(callback: (dropdown: any) => void) { return this; }
    addText(callback: (text: any) => void) { return this; }
    addButton(callback: (button: any) => void) { return this; }
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
    constructor(app: any, plugin: any) { }
}
export class TFolder { }
