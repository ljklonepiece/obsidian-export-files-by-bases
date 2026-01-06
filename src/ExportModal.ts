/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable obsidianmd/ui/sentence-case */
import { App, Modal, Setting, Notice, parseYaml, TFile } from 'obsidian';

interface BaseInfo {
    id: string;
    name: string;
    file: TFile;
}

interface ViewInfo {
    id: string;
    name: string;
    view: any;
    baseInstance: any;
}

interface BasesController {
    viewName?: string;
    queryState?: any;
    ctx?: any;
    selectView?(name: string): void;
    setQueryAndView?(a: any, b: string): void;
    viewHeaderEl?: HTMLElement;
    viewContainerEl?: HTMLElement;
    view?: {
        data?: { data?: any[] };
        rows?: any[];
    };
    _children?: any[];
}

interface BasesView {
    file?: TFile;
    controller?: BasesController;
    containerEl?: HTMLElement;
}

interface BasesPlugin {
    enabled: boolean;
    instance?: any;
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
        viewByType: Record<string, any>;
    };
}

export class ExportModal extends Modal {
    selectedBase: BaseInfo | null = null;
    selectedView: ViewInfo | null = null;
    targetPath = "";
    _autoDetectedViewName?: string;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Export bases files' });

        void this.display();
    }

    async display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Export bases files' });

        try {
            // Fetch data upfront to avoid async race conditions in dropdowns
            const bases = await this.getBases();

            // Auto-detect active Base and View from workspace
            if (!this.selectedBase) {
                const app = this.app as ExtendedApp;
                const leaves = app.workspace.getLeavesOfType('bases') as any[];
                if (leaves.length > 0) {
                    const activeLeaf = (leaves.find((l) => (l.view as BasesView)?.file) || leaves[0]) as { view: BasesView };
                    if (activeLeaf?.view?.file) {
                        const activeBasePath = activeLeaf.view.file.path;
                        const matchingBase = bases.find((b) => b.file?.path === activeBasePath);
                        if (matchingBase) {
                            console.debug('[ExportBases] Auto-detected active Base:', matchingBase.name);
                            this.selectedBase = matchingBase;

                            // Also try to detect the active view
                            const controller = activeLeaf.view?.controller;
                            if (controller?.viewName) {
                                console.debug('[ExportBases] Auto-detected active View:', controller.viewName);
                                // We'll set selectedView after getting views below
                                this._autoDetectedViewName = controller.viewName;
                            }
                        }
                    }
                }
            }

            // 1. Select Base
            new Setting(contentEl)
                .setName('Select base')
                .setDesc('Select the base you want to export from')
                .addDropdown((dropdown) => {
                    dropdown.addOption("", "Select a base");
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
                console.debug('Fetching views for selected base:', this.selectedBase.name);
                const views = await this.getViews(this.selectedBase);
                console.debug('Found views:', views.length);

                // Auto-select the detected view if not already selected
                if (!this.selectedView && this._autoDetectedViewName) {
                    const autoView = views.find((v) => v.name === this._autoDetectedViewName);
                    if (autoView) {
                        console.debug('[ExportBases] Auto-selecting view:', autoView.name);
                        this.selectedView = autoView;
                    }
                    delete this._autoDetectedViewName;
                }

                new Setting(contentEl)
                    .setName('Select view')
                    .setDesc('Select the table view containing the filtering logic')
                    .addDropdown((dropdown) => {
                        dropdown.addOption("", "Select a view");
                        views.forEach((view: any) => {
                            dropdown.addOption(view.id, view.name);
                        });
                        dropdown.setValue(this.selectedView?.id || "");
                        dropdown.onChange((value) => {
                            this.selectedView = views.find((v: any) => v.id === value) || null;
                        });
                    });
            }

            // 3. Specify Target Folder
            new Setting(contentEl)
                .setName('Export to')
                .setDesc('Specify the target folder for exported files')
                .addText(text => text
                    .setPlaceholder('path/to/folder')
                    .setValue(this.targetPath)
                    .onChange((value) => {
                        this.targetPath = value;
                    }))
                .addButton(button => button
                    .setButtonText('Browse...')
                    .setTooltip('Select export directory')
                    .onClick(async () => {
                        try {
                            const electron = (window as any).require('electron');
                            const remote = electron.remote;
                            const dialog = remote ? remote.dialog : electron.dialog;

                            if (!dialog) {
                                throw new Error('Electron dialog is not available');
                            }

                            const result = await dialog.showOpenDialog({
                                properties: ['openDirectory'],
                                title: 'Select export directory'
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                this.targetPath = result.filePaths[0];
                                await this.display();
                            }
                        } catch (err) {
                            console.error('Error opening directory picker:', err);
                            new Notice('Could not open directory picker. Please enter path manually.');
                        }
                    }));

            // 4. Export Button
            new Setting(contentEl)
                .addButton(button => button
                    .setButtonText('Export')
                    .setCta()
                    .onClick(async () => {
                        if (!this.selectedBase || !this.selectedView || !this.targetPath) {
                            new Notice('Please complete all selection fields.');
                            return;
                        }
                        await this.exportFiles();
                        this.close();
                    }));
        } catch (e) {
            console.error('Error in ExportModal.display:', e);
            contentEl.createEl('div', { text: 'An error occurred while loading the interface. Check console for details.', cls: 'error-message' });
        }
    }


    async getBases(): Promise<BaseInfo[]> {
        const app = this.app as ExtendedApp;
        // Try both internal and third-party plugin locations
        const basesPlugin = app.internalPlugins?.getPluginById('bases') || app.plugins?.getPlugin('bases');

        if (basesPlugin && basesPlugin.enabled) {
            console.debug('[ExportBases] Bases plugin detected.');
        } else {
            console.warn('[ExportBases] Bases plugin not found or not enabled.');
        }

        const files = this.app.vault.getFiles().filter(f => f.extension === 'base');
        console.debug('Found .base files:', files);

        return files.map(file => ({
            id: file.path,
            name: file.basename,
            file: file
        }));
    }



    async getViews(base: BaseInfo): Promise<ViewInfo[]> {
        console.debug('[ExportBases] getViews called for base:', base.name);
        if (!base || !base.file) {
            console.warn('[ExportBases] No base file provided to getViews');
            return [];
        }

        let matchingBase: BasesView | null = null;
        const app = this.app as ExtendedApp;

        // Deep exploration of plugin structure
        console.debug('[ExportBases] === DEEP PLUGIN EXPLORATION ===');

        // Check internal plugin
        const internalPlugin = app.internalPlugins?.getPluginById('bases');
        console.debug('[ExportBases] Internal plugin:', internalPlugin ? 'FOUND' : 'NOT FOUND');
        if (internalPlugin) {
            console.debug('[ExportBases] Internal plugin keys:', Object.keys(internalPlugin));
            if (internalPlugin.instance) {
                console.debug('[ExportBases] Instance keys:', Object.keys(internalPlugin.instance));
            }
        }

        // Check third-party plugin
        const thirdPartyPlugin = app.plugins?.getPlugin('bases');
        console.debug('[ExportBases] Third-party plugin:', thirdPartyPlugin ? 'FOUND' : 'NOT FOUND');
        if (thirdPartyPlugin) {
            console.debug('[ExportBases] Third-party plugin keys:', Object.keys(thirdPartyPlugin));
        }

        // The Bases feature might be part of Obsidian core, not a separate plugin
        // Let's check if there's a bases manager on the app itself
        console.debug('[ExportBases] App keys:', Object.keys(app).filter(k => k.toLowerCase().includes('base')));

        // Check workspace for open base files
        const leaves = app.workspace?.getLeavesOfType?.('bases') || [];
        console.debug('[ExportBases] Open Bases leaves:', leaves.length);
        if (leaves.length > 0) {
            const firstLeaf = leaves[0] as { view: BasesView } | undefined;
            if (firstLeaf && firstLeaf.view) {
                // The view might have the actual data
                console.debug('[ExportBases] First leaf view keys:', Object.keys(firstLeaf.view));
                if (firstLeaf.view.file) {
                    console.debug('[ExportBases] Leaf view file:', firstLeaf.view.file.path);
                    if (firstLeaf.view.file.path === base.file.path) {
                        matchingBase = firstLeaf.view;
                        console.debug('[ExportBases] MATCH! Found matching base view in workspace.');
                    }
                }
            }
        }

        console.debug('[ExportBases] === END EXPLORATION ===');

        try {
            console.debug('[ExportBases] Reading .base file:', base.file.path);
            const content = await this.app.vault.read(base.file);
            console.debug('[ExportBases] File read successfully, length:', content?.length);

            if (!content || content.trim() === "") return [];

            const data = parseYaml(content);
            console.debug('[ExportBases] YAML parsed successfully:', !!data);

            if (data && data.views) {
                const viewsArray = Array.isArray(data.views) ? data.views : Object.entries(data.views).map(([id, view]) => ({ ...(view as any), id }));

                return viewsArray.map((view: any, index: number) => ({
                    id: view.id || `view-${index}`,
                    name: view.name || view.id || `View ${index + 1}`,
                    view: view,
                    baseInstance: matchingBase
                }));
            }
        } catch (e: any) {
            console.error('[ExportBases] Error in getViews:', e);
            new Notice(`Failed to read base views: ${e.message}`);
        }

        return [];
    }






    async exportFiles() {
        if (!this.selectedBase || !this.selectedView || !this.targetPath) return;

        new Notice(`Exporting files from ${this.selectedBase.name}...`);

        try {
            // Pass the whole selectedView object which now carries baseInstance and id
            const files = await this.getFilteredFiles(this.selectedBase, this.selectedView);
            if (files.length === 0) {
                new Notice('No files found matching the view filters.');
                return;
            }

            let exportedCount = 0;
            for (const file of files) {
                await this.copyFileToExternalFolder(file, this.targetPath);
                exportedCount++;
            }

            new Notice(`Successfully exported ${exportedCount} files to ${this.targetPath}.`);
        } catch (error) {
            console.error('Export failed:', error);
            new Notice('Export failed. See console for details.');
        }
    }

    async getFilteredFiles(base: BaseInfo, viewInfo: ViewInfo): Promise<TFile[]> {
        console.debug('[ExportBases] getFilteredFiles called for view:', viewInfo.name, 'in base:', base.name);

        const app = this.app as ExtendedApp;

        // First, ensure the correct Base is open in a tab
        let leafView = viewInfo.baseInstance;

        // Check if we have a valid baseInstance and it matches the selected base
        if (!leafView || leafView.file?.path !== base.file?.path) {
            console.debug('[ExportBases] Selected Base is not the active one. Opening it...');

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
                        console.debug('[ExportBases] Found opened Base leaf view.');
                        break;
                    }
                }

                if (!leafView) {
                    console.warn('[ExportBases] Could not find leaf view after opening Base. Using fallback...');
                    // Try getting from workspace active view
                    const viewByType = app.viewRegistry?.viewByType;
                    const activeView = viewByType ? app.workspace.getActiveViewOfType(Object.values(viewByType).find((v: any) => v?.prototype?.constructor?.name === 'BasesView') || null) : null;
                    if (activeView) {
                        leafView = activeView;
                    }
                }
            }
        }

        if (!leafView) {
            console.warn('[ExportBases] No Base view available. Please open the Base file.');
            new Notice('Please open the Base file first.');
            return [];
        }

        const controller = leafView.controller;

        if (controller) {
            console.debug('[ExportBases] Controller found. Exploring all possible result locations...');

            // Explore queryState
            if (controller.queryState) {
                console.debug('[ExportBases] queryState keys:', Object.keys(controller.queryState));
                if (controller.queryState.results) {
                    console.debug('[ExportBases] queryState.results:', controller.queryState.results);
                }
                if (controller.queryState.data) {
                    console.debug('[ExportBases] queryState.data:', controller.queryState.data);
                }
            }

            // Explore ctx (context)
            if (controller.ctx) {
                console.debug('[ExportBases] ctx keys:', Object.keys(controller.ctx));
                if (controller.ctx.results) {
                    const ctxResults = controller.ctx.results;
                    console.debug('[ExportBases] ctx.results:', Array.isArray(ctxResults) ? ctxResults.length + ' items' : typeof ctxResults);
                    if (Array.isArray(ctxResults) && ctxResults.length > 0) {
                        console.debug('[ExportBases] SUCCESS: Found ctx.results!');
                        return ctxResults.map((r: any) => r.file || r).filter((f: any) => f && f.path);
                    }
                }
            }

            // Explore view - the data is in controller.view.data.data
            // IMPORTANT: The controller only has data for the CURRENTLY ACTIVE view
            const activeViewName = controller.viewName;
            console.debug('[ExportBases] Active view in Bases tab:', activeViewName);
            console.debug('[ExportBases] Requested view:', viewInfo.name);

            if (activeViewName && activeViewName !== viewInfo.name) {
                console.debug('[ExportBases] View mismatch. Attempting to switch views programmatically...');

                // Explore controller methods for view switching
                const controllerProto = Object.getPrototypeOf(controller);
                const methods = Object.getOwnPropertyNames(controllerProto).filter(m => typeof controller[m] === 'function');
                console.debug('[ExportBases] Controller methods related to views:', methods.filter(m =>
                    m.toLowerCase().includes('view') || m.toLowerCase().includes('switch') || m.toLowerCase().includes('set')
                ));

                // Try calling selectView first (discovered from controller methods)
                if (typeof controller.selectView === 'function') {
                    console.debug('[ExportBases] Calling selectView...');
                    controller.selectView(viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else if (typeof controller.setQueryAndView === 'function') {
                    console.debug('[ExportBases] Calling setQueryAndView...');
                    controller.setQueryAndView(null, viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else {
                    // Fallback: Try DOM click
                    const viewHeader = controller.viewHeaderEl || leafView.containerEl?.querySelector('.bases-view-header');
                    if (viewHeader) {
                        const tabs = viewHeader.querySelectorAll('*');
                        for (const el of tabs) {
                            if (el.textContent?.trim() === viewInfo.name) {
                                console.debug('[ExportBases] Clicking view tab in DOM...');
                                el.click();
                                await new Promise(r => setTimeout(r, 300));
                                break;
                            }
                        }
                    }
                }

                // Check if it worked
                const newActiveView = controller.viewName;
                if (newActiveView !== viewInfo.name) {
                    console.warn('[ExportBases] Automatic view switch failed.');
                    new Notice('Please switch to the "' + viewInfo.name + '" view in the Bases tab first.');
                    return [];
                }
                console.debug('[ExportBases] View switch successful!');
            }

            if (controller.view) {

                // The actual results are in controller.view.data.data
                if (controller.view.data && controller.view.data.data && Array.isArray(controller.view.data.data)) {
                    const results = controller.view.data.data;
                    console.debug('[ExportBases] SUCCESS: Found controller.view.data.data with', results.length, 'entries');
                    if (results.length > 0) {
                        console.debug('[ExportBases] First entry keys:', Object.keys(results[0]));
                    }
                    return results.map((r: any) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        return r.file || r;
                    }).filter((f: any) => f && f.path);
                }

                // Also check controller.view.rows
                if (controller.view.rows && Array.isArray(controller.view.rows)) {
                    const rows = controller.view.rows;
                    console.debug('[ExportBases] SUCCESS: Found controller.view.rows with', rows.length, 'entries');
                    if (rows.length > 0) {
                        console.debug('[ExportBases] First row keys:', Object.keys(rows[0]));
                    }
                    return rows.map((r: any) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        return r.file || r;
                    }).filter((f: any) => f && f.path);
                }
            }

            // Explore _children (might contain the actual view components)
            if (controller._children && controller._children.length > 0) {
                console.debug('[ExportBases] controller._children:', controller._children.length, 'children');
                const firstChild = controller._children[0];
                if (firstChild) {
                    console.debug('[ExportBases] First child keys:', Object.keys(firstChild));
                    if (firstChild.results) {
                        console.debug('[ExportBases] First child has results!');
                    }
                    if (firstChild.data) {
                        console.debug('[ExportBases] First child data:', firstChild.data);
                    }
                }
            }

            // Check the DOM for table rows as a last resort
            const viewContainer = controller.viewContainerEl;
            if (viewContainer) {
                const rows = viewContainer.querySelectorAll('.bases-row, tr[data-file], .table-row');
                console.debug('[ExportBases] DOM table rows found:', rows.length);
                if (rows.length > 0) {
                    // Extract file paths from DOM if possible
                    const files: any[] = [];
                    rows.forEach((row: any) => {
                        const filePath = row.dataset?.file || row.getAttribute('data-file');
                        if (filePath) {
                            const file = this.app.vault.getAbstractFileByPath(filePath);
                            if (file) files.push(file);
                        }
                    });
                    if (files.length > 0) {
                        console.debug('[ExportBases] SUCCESS: Extracted', files.length, 'files from DOM');
                        return files;
                    }
                }
            }

            console.warn('[ExportBases] Could not locate usable results in any known location.');
        } else {
            console.warn('[ExportBases] No controller found on leaf view.');
        }

        // Strict: No manual fallback.
        return [];
    }

    async copyFileToExternalFolder(file: TFile, targetPath: string) {
        // Only run on desktop where fs is available
        let fs, path;
        try {
            fs = (window as any).require('fs');
            path = (window as any).require('path');
        } catch (e) {
            console.warn('[ExportBases] Could not load fs or path:', e);
        }

        if (!fs || !path) {
            new Notice('File system access is not available (are you on mobile?)');
            return;
        }

        try {
            const arrayBuffer = await this.app.vault.readBinary(file);
            const buffer = globalThis.Buffer.from(arrayBuffer);

            // Handle subfolders if the file is in a folder in Obsidian?
            // The user requested to export to a specified folder.
            // Let's keep it flat for now unless they specify otherwise.
            const destination = path.join(targetPath, file.name);

            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            fs.writeFileSync(destination, buffer);
            console.debug(`Exported: ${file.path} -> ${destination}`);
        } catch (e) {
            console.error(`Failed to export ${file.path}:`, e);
            throw e;
        }
    }


    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

