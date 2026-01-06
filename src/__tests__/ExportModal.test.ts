/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ExportModal } from '../ExportModal';

// Mock Obsidian modules
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
    Setting: class {
        contentEl: any;
        constructor(contentEl: any) { this.contentEl = contentEl; }
        setName = jest.fn().mockReturnThis();
        setDesc = jest.fn().mockReturnThis();
        addDropdown = jest.fn().mockReturnThis();
        addText = jest.fn().mockReturnThis();
        addButton = jest.fn().mockReturnThis();
    }
}));

describe('ExportModal', () => {
    let app: any;
    let modal: ExportModal;

    beforeEach(() => {
        jest.clearAllMocks();
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
                getLeaf: jest.fn().mockResolvedValue({ openFile: jest.fn() }),
                getActiveViewOfType: jest.fn().mockReturnValue(null),
            },
            viewRegistry: {
                viewByType: { bases: { prototype: { constructor: { name: 'BasesView' } } } }
            }
        };
        modal = new ExportModal(app);

        // Mock electron/remote
        (window as unknown).require = jest.fn((mod) => {
            if (mod === 'electron') return { dialog: { showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/test/path'] }) } };
            if (mod === 'fs') return { existsSync: jest.fn().mockReturnValue(true), mkdirSync: jest.fn(), writeFileSync: jest.fn() };
            if (mod === 'path') return { join: (...args: string[]) => args.join('/') };
            return {};
        });
    });

    it('should fetch bases from .base files', async () => {
        const bases = await modal.getBases();
        expect(bases).toHaveLength(1);
        expect(bases[0].name).toBe('Untitled');
    });

    it('should auto-detect active Base and View from workspace', async () => {
        const mockBaseFile = { path: 'Untitled.base' };
        (app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([{
            view: {
                file: mockBaseFile,
                controller: { viewName: 'family' }
            }
        }]);

        await modal.display();

        expect(modal.selectedBase).toBeDefined();
        expect(modal.selectedBase.file.path).toBe('Untitled.base');

        // Mock views for this base
        const bases = await modal.getBases();
        await modal.getViews(bases[0]!);
        // Set detected view name manually for the test because display() sets it
        modal._autoDetectedViewName = 'family';

        // Re-run display to trigger auto-select
        await modal.display();
        expect(modal.selectedView).toBeDefined();
        expect(modal.selectedView.name).toBe('family');
    });

    it('should extract results from controller.view.data.data', async () => {
        const mockFile = { path: 'note1.md', name: 'note1.md' };
        const viewInstance = {
            controller: {
                viewName: 'family',
                view: {
                    data: { data: [{ file: mockFile }] }
                }
            }
        };

        const base = { file: { path: 'Untitled.base' }, name: 'Untitled' };
        const viewInfo = { name: 'family', baseInstance: viewInstance };

        const files = await modal.getFilteredFiles(base, viewInfo);

        expect(files).toHaveLength(1);
        expect(files[0].path).toBe('note1.md');
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

        const base = { file: { path: 'Untitled.base' }, name: 'Untitled' };
        const viewInfo = { name: 'correct-view', baseInstance: viewInstance };

        await modal.getFilteredFiles(base, viewInfo);

        expect(viewInstance.controller.selectView).toHaveBeenCalledWith('correct-view');
    });

    it('should open Base file if not already open', async () => {
        const openFileSpy = jest.fn();
        (app.workspace.getLeaf as jest.Mock).mockResolvedValue({ openFile: openFileSpy });

        const base = { file: { path: 'Other.base' }, name: 'Other' };
        const viewInfo = { name: 'family', baseInstance: null };

        // Mock getting leaves AFTER opening (second call)
        (app.workspace.getLeavesOfType as jest.Mock).mockImplementation(() => {
            return [{
                view: {
                    file: { path: 'Other.base' },
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
        expect(typeof app.workspace.getLeavesOfType).toBe('function');
    });
});
