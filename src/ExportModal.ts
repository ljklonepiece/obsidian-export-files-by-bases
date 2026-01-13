import { App, Modal, Setting, Notice, parseYaml, TFile } from 'obsidian';
import { t } from './i18n';

// Extend Window to include electron require
declare global {
    interface Window {
        require(module: string): unknown;
    }
}

const INTERNAL_EXTENSIONS = ['base', 'canvas'];
const MEDIA_EXTENSIONS = [
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
    'mp4', 'webm', 'ogv',
    'mp3', 'wav', 'm4a', 'ogg', '3gp', 'flac',
    'pdf', 'zip', 'gz', '7z', 'rar'
];

interface BaseInfo {
    id: string;
    name: string;
    file: TFile;
}

interface ViewInfo {
    id: string;
    name: string;
    view: Record<string, unknown>;
    baseInstance: BasesView | null;
}

interface BasesController {
    [key: string]: unknown;
    viewName?: string;
    queryState?: unknown;
    ctx?: unknown;
    selectView?(name: string): void;
    setQueryAndView?(a: unknown, b: string): void;
    viewHeaderEl?: HTMLElement;
    viewContainerEl?: HTMLElement;
    view?: {
        data?: { data?: unknown[] };
        rows?: unknown[];
    };
    _children?: unknown[];
}

interface BasesView {
    file?: TFile;
    controller?: BasesController;
    containerEl?: HTMLElement;
}

interface BasesPlugin {
    enabled: boolean;
    instance?: unknown;
}

interface FSModule {
    promises: {
        writeFile(path: string, data: string | Uint8Array): Promise<void>;
        mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    };
    existsSync(path: string): boolean;
}

interface PathModule {
    join(...args: string[]): string;
}

interface ExtendedApp extends App {
    internalPlugins?: {
        getPluginById(id: string): BasesPlugin | null;
        plugins: Record<string, BasesPlugin>;
    };
    plugins?: {
        getPlugin(id: string): BasesPlugin | null;
        plugins: Record<string, BasesPlugin>;
    };
    viewRegistry?: {
        viewByType: Record<string, unknown>;
    };
}

export class ExportModal extends Modal {
    selectedBase: BaseInfo | null = null;
    selectedView: ViewInfo | null = null;
    targetPath = "";
    exportDepth = 2;
    includeInternalFiles = false;
    includeMediaFiles = false;
    _autoDetectedViewName?: string;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: t('MODAL_TITLE') });

        void this.display();
    }

    async display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: t('MODAL_TITLE') });

        try {
            // Fetch data upfront to avoid async race conditions in dropdowns
            const bases = this.getBases();

            // Auto-detect active Base and View from workspace
            if (!this.selectedBase) {
                const app = this.app as ExtendedApp;
                const leaves = app.workspace.getLeavesOfType('bases');
                if (leaves.length > 0) {
                    const activeLeaf = (leaves.find((l) => (l.view as BasesView)?.file) || leaves[0]) as { view: BasesView };
                    if (activeLeaf?.view?.file) {
                        const activeBasePath = activeLeaf.view.file.path;
                        const matchingBase = bases.find((b) => b.file?.path === activeBasePath);
                        if (matchingBase) {
                            this.selectedBase = matchingBase;

                            // Also try to detect the active view
                            const controller = activeLeaf.view?.controller;
                            if (controller?.viewName) {
                                // We'll set selectedView after getting views below
                                this._autoDetectedViewName = controller.viewName;
                            }
                        }
                    }
                }
            }

            // 1. Select Base
            new Setting(contentEl)
                .setName(t('SELECT_BASE'))
                .setDesc(t('SELECT_BASE_DESC'))
                .addDropdown((dropdown) => {
                    dropdown.addOption("", t('SELECT_BASE'));
                    bases.forEach((base) => {
                        dropdown.addOption(base.id, base.name);
                    });
                    dropdown.setValue(this.selectedBase?.id || "");
                    dropdown.onChange(async (value) => {
                        this.selectedBase = bases.find((b) => b.id === value) || null;
                        this.selectedView = null; // Reset view when base changes
                        await this.display();
                    });
                });

            // 2. Select View (only if Base is selected)
            if (this.selectedBase) {
                const views = await this.getViews(this.selectedBase);

                if (!this.selectedView && this._autoDetectedViewName) {
                    const autoView = views.find((v) => v.name === this._autoDetectedViewName);
                    if (autoView) {
                        this.selectedView = autoView;
                    }
                    delete this._autoDetectedViewName;
                }

                new Setting(contentEl)
                    .setName(t('SELECT_VIEW'))
                    .setDesc(t('SELECT_VIEW_DESC'))
                    .addDropdown((dropdown) => {
                        dropdown.addOption("", t('SELECT_VIEW'));
                        views.forEach((view) => {
                            dropdown.addOption(view.id, view.name);
                        });
                        dropdown.setValue(this.selectedView?.id || "");
                        dropdown.onChange((value) => {
                            this.selectedView = views.find((v) => v.id === value) || null;
                        });
                    });
            }

            // 3. Specify Target Folder
            new Setting(contentEl)
                .setName(t('EXPORT_PATH'))
                .setDesc(t('EXPORT_PATH_DESC'))
                .addText(text => text
                    .setPlaceholder(t('PATH_INPUT_PLACEHOLDER'))
                    .setValue(this.targetPath)
                    .onChange((value) => {
                        this.targetPath = value;
                    }))
                .addButton(button => button
                    .setButtonText(t('BROWSE_BUTTON'))
                    .setTooltip(t('BROWSE_TOOLTIP'))
                    .onClick(async () => {
                        try {
                            const electron = window.require('electron') as { remote?: { dialog: unknown }, dialog: unknown };
                            const remote = electron.remote as { dialog: unknown } | undefined;
                            const dialog = (remote ? remote.dialog : electron.dialog) as {
                                showOpenDialog(options: unknown): Promise<{ canceled: boolean, filePaths: string[] }>
                            } | undefined;

                            if (!dialog) {
                                throw new Error('Electron dialog is not available');
                            }

                            const result = await dialog.showOpenDialog({
                                properties: ['openDirectory', 'createDirectory'],
                                title: t('PICKER_TITLE')
                            });

                            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                                const pickedPath = result.filePaths[0];
                                if (typeof pickedPath === 'string') {
                                    this.targetPath = pickedPath;
                                    await this.display();
                                }
                            }
                        } catch (err) {
                            console.error('Error opening directory picker:', err);
                            new Notice(t('ERROR_PICKER'));
                        }
                    }));

            // 4. Specify Export Depth
            const depthSetting = new Setting(contentEl)
                .setName(t('EXPORT_DEPTH'))
                .setDesc(t('EXPORT_DEPTH_DESC'));

            depthSetting.addSlider(slider => slider
                .setLimits(1, 5, 1)
                .setValue(this.exportDepth === -1 ? 5 : Math.min(this.exportDepth, 5))
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.exportDepth = value;
                    await this.display(); // Refresh to sync text field
                }));

            depthSetting.addText(text => text
                .setPlaceholder(t('DEPTH_PLACEHOLDER'))
                .setValue(this.exportDepth.toString())
                .onChange(async (value) => {
                    let num = parseInt(value);
                    if (!isNaN(num)) {
                        // Enforce depth >= 1 or -1
                        if (num < 1 && num !== -1) {
                            num = 1;
                        }
                        this.exportDepth = num;
                        await this.display();
                    }
                }));

            if (this.exportDepth === -1) {
                contentEl.createEl('span', { text: t('INFINITE_DEPTH_NOTICE'), cls: 'setting-item-description', attr: { style: 'color: var(--text-accent); display: block; margin-top: -10px; margin-bottom: 10px; padding-left: 20px;' } });
            }

            // 5. File Type Filters
            new Setting(contentEl)
                .setName(t('INCLUDE_INTERNAL'))
                .setDesc(t('INCLUDE_INTERNAL_DESC'))
                .addToggle(toggle => toggle
                    .setValue(this.includeInternalFiles)
                    .onChange(value => {
                        this.includeInternalFiles = value;
                    }));

            new Setting(contentEl)
                .setName(t('INCLUDE_MEDIA'))
                .setDesc(t('INCLUDE_MEDIA_DESC'))
                .addToggle(toggle => toggle
                    .setValue(this.includeMediaFiles)
                    .onChange(value => {
                        this.includeMediaFiles = value;
                    }));

            // 6. Export Button
            new Setting(contentEl)
                .addButton(button => button
                    .setButtonText(t('EXPORT_BUTTON'))
                    .setCta()
                    .onClick(async () => {
                        if (!this.selectedBase || !this.selectedView || !this.targetPath) {
                            new Notice(t('NOTICE_COMPLETE_FIELDS'));
                            return;
                        }
                        await this.exportFiles();
                        this.close();
                    }));
        } catch (e) {
            console.error('Error in ExportModal.display:', e);
            contentEl.createEl('div', { text: t('ERROR_UI_LOAD'), cls: 'error-message' });
        }
    }

    getLocale(): string {
        const lang = (window as unknown as { app?: { locale?: string } }).app?.locale;
        if (lang) return lang;
        return 'en';
    }

    getBases(): BaseInfo[] {
        const app = this.app as ExtendedApp;
        // Try both internal and third-party plugin locations
        const basesPlugin = app.internalPlugins?.getPluginById('bases') || app.plugins?.getPlugin('bases');

        if (!basesPlugin || !basesPlugin.enabled) {
            console.warn('[ExportBases] Bases plugin not found or not enabled.');
        }


        const files = this.app.vault.getFiles().filter(f => f.extension === 'base');

        return files.map(file => ({
            id: file.path,
            name: file.basename,
            file: file
        }));
    }



    async getViews(base: BaseInfo): Promise<ViewInfo[]> {
        let matchingBase: BasesView | null = null;
        const app = this.app as ExtendedApp;

        // Check workspace for open base files
        const leaves = app.workspace?.getLeavesOfType?.('bases') || [];
        if (leaves.length > 0) {
            const firstLeaf = leaves[0] as { view: BasesView } | undefined;
            if (firstLeaf && firstLeaf.view) {
                if (firstLeaf.view.file && firstLeaf.view.file.path === base.file.path) {
                    matchingBase = firstLeaf.view;
                }
            }
        }

        try {
            const content = await this.app.vault.read(base.file);
            if (!content || content.trim() === "") return [];

            const data = (parseYaml(content) as { views?: Record<string, unknown> | Array<Record<string, unknown>> }) || {};

            if (data && data.views) {
                const viewsArray = Array.isArray(data.views) ? data.views : Object.entries(data.views).map(([id, view]) => ({ ...(view as Record<string, unknown>), id }));

                return viewsArray.map((viewData: unknown, index: number) => {
                    const view = viewData as Record<string, unknown>;
                    const viewId = typeof view.id === 'string' ? view.id : undefined;
                    const viewName = typeof view.name === 'string' ? view.name : undefined;
                    return {
                        id: viewId ?? `view-${index}`,
                        name: viewName ?? viewId ?? `View ${index + 1}`,
                        view: view,
                        baseInstance: matchingBase
                    };
                });
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('[ExportBases] Error in getViews:', message);
            new Notice(t('ERROR_READ_VIEWS', { message }));
        }

        return [];
    }






    async exportFiles() {
        if (!this.selectedBase || !this.selectedView || !this.targetPath) return;

        new Notice(t('NOTICE_EXPORTING', { base: this.selectedBase.name }));

        try {
            // Pass the whole selectedView object which now carries baseInstance and id
            const initialFiles = await this.getFilteredFiles(this.selectedBase, this.selectedView);
            if (initialFiles.length === 0) {
                new Notice(t('NOTICE_NO_FILES'));
                return;
            }

            const filesToExport = this.resolveLinkedFilesRecursive(initialFiles, this.exportDepth);

            let exportedCount = 0;
            for (const file of filesToExport) {
                await this.copyFileToExternalFolder(file, this.targetPath);
                exportedCount++;
            }

            new Notice(t('NOTICE_EXPORT_SUCCESS', { count: exportedCount, path: this.targetPath }));
        } catch (error) {
            console.error('Export failed:', error);
            new Notice(t('NOTICE_EXPORT_FAILED'));
        }
    }

    resolveLinkedFilesRecursive(initialFiles: TFile[], depth: number): Set<TFile> {
        const result = new Set<TFile>(initialFiles);
        if (depth === 1) return result;

        let currentLevelFiles = [...initialFiles];
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        let currentDepth = 1;

        while (currentLevelFiles.length > 0) {
            if (depth !== -1 && currentDepth >= depth) break;

            const nextLevelFiles: TFile[] = [];
            for (const file of currentLevelFiles) {
                const links = resolvedLinks[file.path];
                if (links) {
                    for (const linkPath of Object.keys(links)) {
                        const linkedFile = this.app.vault.getAbstractFileByPath(linkPath);
                        if (linkedFile instanceof TFile && !result.has(linkedFile)) {
                            const ext = linkedFile.extension.toLowerCase();
                            const isInternal = INTERNAL_EXTENSIONS.includes(ext);
                            const isMedia = MEDIA_EXTENSIONS.includes(ext);

                            if (!this.includeInternalFiles && isInternal) continue;
                            if (!this.includeMediaFiles && isMedia) continue;

                            result.add(linkedFile);
                            nextLevelFiles.push(linkedFile);
                        }
                    }
                }
            }
            if (nextLevelFiles.length === 0) break;
            currentLevelFiles = nextLevelFiles;
            currentDepth++;

            // Safety break for infinite depth to prevent literal infinite hangs if something goes wrong
            if (depth === -1 && currentDepth > 50) {
                console.warn('[ExportBases] Infinite depth reached safety limit of 50.');
                break;
            }
        }

        return result;
    }

    async getFilteredFiles(base: BaseInfo, viewInfo: ViewInfo): Promise<TFile[]> {
        const app = this.app as ExtendedApp;

        // First, ensure the correct Base is open in a tab
        let leafView = viewInfo.baseInstance;

        // Check if we have a valid baseInstance and it matches the selected base
        if (!leafView || leafView.file?.path !== base.file?.path) {
            // Open the Base file
            const baseFile = base.file;
            if (baseFile) {
                // Open the file in a new leaf
                const leaf = app.workspace.getLeaf(false);
                await leaf.openFile(baseFile);

                // Wait for it to load
                await new Promise(r => setTimeout(r, 500));

                // Find the leaf view for this base
                const leaves = app.workspace.getLeavesOfType('bases') || [];
                for (const l of leaves) {
                    const view = l.view as BasesView;
                    if (view?.file?.path === baseFile.path) {
                        leafView = view;
                        break;
                    }
                }

                if (!leafView) {
                    // Try getting from workspace active view
                    const viewRegistry = app.viewRegistry;
                    if (viewRegistry) {
                        const basesViewCtor = Object.values(viewRegistry.viewByType).find((v: unknown) => {
                            const viewCtor = (v as { prototype?: { constructor?: { name?: string } } })?.prototype?.constructor;
                            return viewCtor?.name === 'BasesView';
                        }) as Parameters<typeof app.workspace.getActiveViewOfType>[0] | undefined;
                        const activeView = basesViewCtor ? app.workspace.getActiveViewOfType(basesViewCtor) : null;
                        if (activeView) {
                            leafView = activeView as unknown as BasesView;
                        }
                    }
                }
            }
        }

        if (!leafView) {
            new Notice(t('NOTICE_OPEN_BASE'));
            return [];
        }

        const controller = leafView.controller;

        if (controller) {
            // IMPORTANT: The controller only has data for the CURRENTLY ACTIVE view
            const activeViewName = controller.viewName;

            if (activeViewName && activeViewName !== viewInfo.name) {
                // Try calling selectView first (discovered from controller methods)
                if (typeof controller.selectView === 'function') {
                    controller.selectView(viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else if (typeof controller.setQueryAndView === 'function') {
                    controller.setQueryAndView(null, viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else {
                    // Fallback: Try DOM click
                    const viewHeader = controller.viewHeaderEl || leafView.containerEl?.querySelector('.bases-view-header');
                    if (viewHeader) {
                        const tabs = viewHeader.querySelectorAll('*');
                        for (const el of Array.from(tabs)) {
                            if (el.textContent?.trim() === viewInfo.name) {
                                (el as HTMLElement).click();
                                await new Promise(r => setTimeout(r, 300));
                                break;
                            }
                        }
                    }
                }

                // Check if it worked
                const newActiveView = controller.viewName;
                if (newActiveView !== viewInfo.name) {
                    new Notice(t('NOTICE_SWITCH_VIEW', { view: viewInfo.name }));
                    return [];
                }
            }
            if (controller.view) {
                // The actual results are in controller.view.data.data
                if (controller.view.data && controller.view.data.data && Array.isArray(controller.view.data.data)) {
                    const results = controller.view.data.data;
                    return results.map((r: unknown) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        const fileCandidate = (r as { file?: unknown })?.file || r;
                        return fileCandidate instanceof TFile ? fileCandidate : null;
                    }).filter((f: TFile | null): f is TFile => !!(f && f.path));
                }

                // Also check controller.view.rows
                if (controller.view.rows && Array.isArray(controller.view.rows)) {
                    const rows = controller.view.rows;
                    return rows.map((r: unknown) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        const fileCandidate = (r as { file?: unknown })?.file || r;
                        return fileCandidate instanceof TFile ? fileCandidate : null;
                    }).filter((f: TFile | null): f is TFile => !!(f && f.path));
                }
            }

            // Check the DOM for table rows as a last resort
            const viewContainer = controller.viewContainerEl;
            if (viewContainer) {
                const rows = viewContainer.querySelectorAll('.bases-row, tr[data-file], .table-row');
                if (rows.length > 0) {
                    const files: TFile[] = [];
                    rows.forEach((row: HTMLElement) => {
                        const filePath = row.dataset?.file || row.getAttribute('data-file');

                        if (filePath) {
                            const file = this.app.vault.getAbstractFileByPath(filePath);
                            if (file instanceof TFile) files.push(file);
                        }
                    });
                    if (files.length > 0) return files;
                }
            }
        }

        return [];
    }

    async copyFileToExternalFolder(file: TFile, targetPath: string) {
        let fs: FSModule | undefined;
        let path: PathModule | undefined;
        try {
            fs = window.require('fs') as FSModule;
            path = window.require('path') as PathModule;
        } catch (e) {
            console.warn('[ExportBases] Could not load fs or path:', e);
        }

        if (!fs || !path) {
            new Notice(t('ERROR_FS_ACCESS'));
            return;
        }

        try {
            const arrayBuffer = await this.app.vault.readBinary(file);
            const buffer = globalThis.Buffer.from(arrayBuffer);

            const destination = path.join(targetPath, file.name);

            if (!fs.existsSync(targetPath)) {
                await fs.promises.mkdir(targetPath, { recursive: true });
            }

            await fs.promises.writeFile(destination, buffer);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`Failed to export ${file.path}:`, message);
            throw e;
        }
    }


    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

