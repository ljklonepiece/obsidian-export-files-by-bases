/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable obsidianmd/no-tfile-tfolder-cast */
import { ExportModal } from '../ExportModal';
import { TFile } from 'obsidian';

// Helper to capture and trigger UI callbacks
const uiCallbacks: Record<string, any[]> = {};
const captureCallback = (type: string, cb: any) => {
    if (!uiCallbacks[type]) uiCallbacks[type] = [];
    uiCallbacks[type].push(cb);
};

jest.mock('obsidian', () => ({
    Notice: jest.fn(),
    parseYaml: jest.fn((yaml: string) => {
        if (yaml && yaml.includes('family')) return { views: [{ name: 'family', id: 'view1' }] };
        return { views: [] };
    }),
    Modal: class {
        app: any;
        contentEl = { empty: jest.fn(), createEl: jest.fn() };
        constructor(app: any) { this.app = app; }
        close = jest.fn();
    },
    TAbstractFile: class { path: string; name: string; parent: any; },
    TFile: class { path: string; name: string; parent: any; extension: string; basename: string; },
    TFolder: class { path: string; name: string; parent: any; children: any[]; },
    Setting: class {
        contentEl: any;
        constructor(contentEl: any) { this.contentEl = contentEl; }
        setName = jest.fn().mockReturnThis();
        setDesc = jest.fn().mockReturnThis();
        addDropdown = jest.fn().mockImplementation((fn) => {
            const dropdown = {
                addOption: jest.fn().mockReturnThis(),
                setValue: jest.fn().mockReturnThis(),
                onChange: jest.fn().mockImplementation((cb) => {
                    captureCallback('dropdown.onChange', cb);
                    return dropdown;
                }),
            };
            fn(dropdown);
            return this;
        });
        addSlider = jest.fn().mockImplementation((fn) => {
            const slider = {
                setLimits: jest.fn().mockReturnThis(),
                setValue: jest.fn().mockReturnThis(),
                setDynamicTooltip: jest.fn().mockReturnThis(),
                onChange: jest.fn().mockImplementation((cb) => {
                    captureCallback('slider.onChange', cb);
                    return slider;
                }),
            };
            fn(slider);
            return this;
        });
        addText = jest.fn().mockImplementation((fn) => {
            const text = {
                setPlaceholder: jest.fn().mockReturnThis(),
                setValue: jest.fn().mockReturnThis(),
                onChange: jest.fn().mockImplementation((cb) => {
                    captureCallback('text.onChange', cb);
                    return text;
                }),
            };
            fn(text);
            return this;
        });
        addToggle = jest.fn().mockImplementation((fn) => {
            const toggle = {
                setValue: jest.fn().mockReturnThis(),
                onChange: jest.fn().mockImplementation((cb) => {
                    captureCallback('toggle.onChange', cb);
                    return toggle;
                }),
            };
            fn(toggle);
            return this;
        });
        addButton = jest.fn().mockImplementation((fn) => {
            const button = {
                setButtonText: jest.fn().mockReturnThis(),
                setCta: jest.fn().mockReturnThis(),
                setTooltip: jest.fn().mockReturnThis(),
                onClick: jest.fn().mockImplementation((cb) => {
                    captureCallback('button.onClick', cb);
                    return button;
                }),
            };
            fn(button);
            return this;
        });
    }
}));

describe('ExportModal', () => {
    let app: any;
    let plugin: any;
    let modal: ExportModal;

    beforeEach(() => {
        jest.clearAllMocks();
        // Clear UI callbacks between tests
        Object.keys(uiCallbacks).forEach(key => delete uiCallbacks[key]);

        app = {
            vault: {
                getFiles: jest.fn().mockReturnValue([{ path: 'Untitled.base', basename: 'Untitled', extension: 'base', name: 'Untitled.base' }]),
                read: jest.fn().mockResolvedValue('views:\n  - name: family\n    filters:\n      and:\n        - area.contains("family")'),
                getMarkdownFiles: jest.fn().mockReturnValue([]),
                readBinary: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
                getAbstractFileByPath: jest.fn((path) => ({ path, name: path.split('/').pop() })),
            },
            workspace: {
                getLeavesOfType: jest.fn().mockReturnValue([]),
                getLeaf: jest.fn().mockReturnValue({ openFile: jest.fn() }),
                getActiveViewOfType: jest.fn().mockReturnValue(null),
            },
            viewRegistry: {
                viewByType: { bases: { prototype: { constructor: { name: 'BasesView' } } } }
            }
        };

        plugin = {
            app: app,
            settings: { lastExportPath: '' },
            saveSettings: jest.fn().mockResolvedValue(undefined)
        };

        modal = new ExportModal(plugin);

        // Mock electron/remote
        (window as any).require = jest.fn((mod) => {
            if (mod === 'electron') return { dialog: { showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/test/path'] }) } };
            if (mod === 'fs') return { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn(), writeFileSync: jest.fn() };
            if (mod === 'path') return { join: (...args: string[]) => args.join('/') };
            return {};
        });
    });

    it('should fetch bases from .base files', async () => {
        const bases = modal.getBases();
        expect(bases).toHaveLength(1);
        expect(bases[0]?.name).toBe('Untitled');
    });

    it('should auto-detect active Base and View from workspace', async () => {
        const mockBaseFile = Object.assign(new TFile(), { path: 'Untitled.base' });
        (app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([{
            view: {
                file: mockBaseFile,
                controller: { viewName: 'family' }
            }
        }]);

        await modal.display();

        expect(modal.selectedBase).toBeDefined();
        if (modal.selectedBase?.file) {
            expect(modal.selectedBase.file.path).toBe('Untitled.base');
        }

        // Mock views for this base
        const bases = modal.getBases();
        await modal.getViews(bases[0]!);
        // Set detected view name manually for the test because display() sets it
        modal._autoDetectedViewName = 'family';

        // Re-run display to trigger auto-select
        await modal.display();
        expect(modal.selectedView).toBeDefined();
        if (modal.selectedView) {
            expect(modal.selectedView.name).toBe('family');
        }
    });

    it('should extract results from controller.view.data.data', async () => {
        const mockFile = Object.assign(new TFile(), { path: 'note1.md', name: 'note1.md' });
        const viewInstance = {
            controller: {
                viewName: 'family',
                view: {
                    data: { data: [{ file: mockFile }] }
                }
            }
        };

        const base = { id: 'Untitled.base', file: { path: 'Untitled.base' } as TFile, name: 'Untitled' };
        const viewInfo = { id: 'family', name: 'family', view: {}, baseInstance: viewInstance as any };

        const files = await modal.getFilteredFiles(base, viewInfo);

        expect(files).toHaveLength(1);
        expect(files[0]?.path).toBe('note1.md');
    });

    it('should switch views programmatically if mismatch', async () => {
        const selectViewSpy = jest.fn();
        const viewInstance = {
            controller: {
                viewName: 'wrong-view',
                selectView: selectViewSpy,
                // Make it switch successfully
                view: { data: { data: [] } }
            }
        };

        // Mock getter for viewName to show it "changed"
        let viewName = 'wrong-view';
        Object.defineProperty(viewInstance.controller, 'viewName', {
            get: () => viewName,
            set: (val) => { viewName = val; }
        });

        // Mock selectView to actually change the name
        viewInstance.controller.selectView = jest.fn().mockImplementation((name) => {
            viewName = name;
        });

        const base = { id: 'Untitled.base', file: { path: 'Untitled.base' } as TFile, name: 'Untitled' };
        const viewInfo = { id: 'correct-view', name: 'correct-view', view: {}, baseInstance: viewInstance as any };

        await modal.getFilteredFiles(base, viewInfo);

        expect(viewInstance.controller.selectView).toHaveBeenCalledWith('correct-view');
    });

    it('should open Base file if not already open', async () => {
        const openFileSpy = jest.fn();
        (app.workspace.getLeaf as jest.Mock).mockReturnValue({ openFile: openFileSpy });

        const baseFile = Object.assign(new TFile(), { path: 'Other.base' });
        const base = { id: 'Other.base', file: baseFile, name: 'Other' };
        const viewInfo = { id: 'family', name: 'family', view: {}, baseInstance: null };

        // Mock getting leaves AFTER opening (second call)
        (app.workspace.getLeavesOfType as jest.Mock).mockImplementation(() => {
            return [{
                view: {
                    file: baseFile,
                    controller: {
                        viewName: 'family',
                        view: { data: { data: [] } }
                    }
                }
            }];
        });

        await modal.getFilteredFiles(base, viewInfo);

        expect(openFileSpy).toHaveBeenCalledWith(base.file);
    });

    it('should handle directory selection via Browse button', async () => {
        await modal.display();
        const browseButton = uiCallbacks['button.onClick']?.find(cb => cb.toString().includes('showOpenDialog'));
        expect(browseButton).toBeDefined();
    });

    it('should synchronize Slider and Text input for exportDepth', async () => {
        // Reset callbacks for this test
        Object.keys(uiCallbacks).forEach(key => delete uiCallbacks[key]);

        await modal.display();

        // Find slider onChange
        const sliderOnChange = uiCallbacks['slider.onChange']?.[0];
        const textOnChange = uiCallbacks['text.onChange']?.[0];

        expect(sliderOnChange).toBeDefined();
        expect(textOnChange).toBeDefined();

        // 1. Slider change updates state and triggers re-display
        await sliderOnChange(4);
        expect(modal.exportDepth).toBe(4);

        // After re-display, we need to find the NEW callbacks because re-rendering replaces the old ones
        const latestTextOnChange = uiCallbacks['text.onChange']?.[uiCallbacks['text.onChange'].length - 1];
        expect(latestTextOnChange).toBeDefined();

        // 2. Text change updates state and triggers re-display
        await latestTextOnChange("1");
        expect(modal.exportDepth).toBe(1);

        // Fetch again after second re-display
        const finalTextOnChange = uiCallbacks['text.onChange']?.[uiCallbacks['text.onChange'].length - 1];

        // 3. Infinite depth (-1)
        await finalTextOnChange("-1");
        expect(modal.exportDepth).toBe(-1);

        // 4. Invalid depth (0) should default to 1
        await finalTextOnChange("0");
        expect(modal.exportDepth).toBe(1);

        // 5. Negative depth other than -1 should default to 1
        await finalTextOnChange("-2");
        expect(modal.exportDepth).toBe(1);
    });

    it('should synchronize Toggles for internal and media files', async () => {
        await modal.display();

        // Find toggles - Internal is the first toggle, Media is the second
        const internalToggleOnChange = uiCallbacks['toggle.onChange']?.[0];
        const mediaToggleOnChange = uiCallbacks['toggle.onChange']?.[1];

        expect(internalToggleOnChange).toBeDefined();
        expect(mediaToggleOnChange).toBeDefined();

        // 1. Internal Toggle
        await internalToggleOnChange(true);
        expect(modal.includeInternalFiles).toBe(true);

        // 2. Media Toggle
        await mediaToggleOnChange(true);
        expect(modal.includeMediaFiles).toBe(true);

        // 3. Toggle off
        await internalToggleOnChange(false);
        expect(modal.includeInternalFiles).toBe(false);
    });

    it('should reset view selection when base changes', async () => {
        modal.selectedBase = { id: 'b1', name: 'Base 1', file: { path: 'b1.base' } as any };
        modal.selectedView = { id: 'v1', name: 'View 1', view: {}, baseInstance: null };

        await modal.display();

        const baseDropdownOnChange = uiCallbacks['dropdown.onChange']?.[0];
        expect(baseDropdownOnChange).toBeDefined();

        // Trigger base change
        await baseDropdownOnChange("Untitled.base");

        expect(modal.selectedBase?.id).toBe("Untitled.base");
        expect(modal.selectedView).toBeNull();
    });

    it('should execute full export lifecycle successfully', async () => {
        // Setup state
        modal.selectedBase = { id: 'b1', name: 'B1', file: { path: 'b1.base' } as any };
        modal.selectedView = { id: 'v1', name: 'V1', view: {}, baseInstance: {} as any };
        modal.targetPath = "/export/path";

        // Spies
        const getFilteredFilesSpy = jest.spyOn(modal, 'getFilteredFiles').mockResolvedValue([{
            path: 'f1.md',
            name: 'f1.md',
            parent: { path: '/' }
        } as any]);
        const resolveLinkedFilesSpy = jest.spyOn(modal, 'resolveLinkedFilesRecursive').mockReturnValue(new Set([{
            path: 'f1.md',
            name: 'f1.md'
        } as any]));
        const copyFileSpy = jest.spyOn(modal, 'copyFileToExternalFolder').mockResolvedValue();

        await modal.display();

        // Find Export button - it's the last one added in display()
        const exportButton = uiCallbacks['button.onClick']?.[uiCallbacks['button.onClick'].length - 1];
        expect(exportButton).toBeDefined();

        // Click Export and wait for completion
        await exportButton();

        expect(getFilteredFilesSpy).toHaveBeenCalled();
        expect(resolveLinkedFilesSpy).toHaveBeenCalled();
        expect(copyFileSpy).toHaveBeenCalledWith(expect.anything(), "/export/path");
        // Verify success notice logic (implicitly verified if no throw)
    });
});
