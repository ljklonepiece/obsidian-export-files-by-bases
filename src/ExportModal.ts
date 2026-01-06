import { App, Modal, Setting, Notice, TFolder, parseYaml } from 'obsidian';

export class ExportModal extends Modal {
    selectedBase: any = null;
    selectedView: any = null;
    targetPath: string = "";

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Export-Bases-Files' });

        this.display();
    }

    async display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Export-Bases-Files' });

        try {
            // Fetch data upfront to avoid async race conditions in dropdowns
            const bases = await this.getBases();

            // Auto-detect active Base and View from workspace
            if (!this.selectedBase) {
                const app = this.app as any;
                const leaves = app.workspace.getLeavesOfType('bases') || [];
                if (leaves.length > 0) {
                    const activeLeaf = leaves.find((l: any) => l.view?.file) || leaves[0];
                    if (activeLeaf?.view?.file) {
                        const activeBasePath = activeLeaf.view.file.path;
                        const matchingBase = bases.find((b: any) => b.file?.path === activeBasePath);
                        if (matchingBase) {
                            console.info('[ExportBases] Auto-detected active Base:', matchingBase.name);
                            this.selectedBase = matchingBase;

                            // Also try to detect the active view
                            const controller = activeLeaf.view?.controller;
                            if (controller?.viewName) {
                                console.info('[ExportBases] Auto-detected active View:', controller.viewName);
                                // We'll set selectedView after getting views below
                                (this as any)._autoDetectedViewName = controller.viewName;
                            }
                        }
                    }
                }
            }

            // 1. Select Base
            new Setting(contentEl)
                .setName('Select Base')
                .setDesc('Select the Base you want to export from')
                .addDropdown((dropdown) => {
                    dropdown.addOption("", "Select a Base");
                    bases.forEach((base: any) => {
                        dropdown.addOption(base.id, base.name);
                    });
                    dropdown.setValue(this.selectedBase?.id || "");
                    dropdown.onChange(async (value) => {
                        this.selectedBase = bases.find((b: any) => b.id === value);
                        this.selectedView = null; // Reset view when base changes
                        await this.display();
                    });
                });

            // 2. Select View (only if Base is selected)
            if (this.selectedBase) {
                console.log('Fetching views for selected base:', this.selectedBase.name);
                const views = await this.getViews(this.selectedBase);
                console.log('Found views:', views.length);

                // Auto-select the detected view if not already selected
                if (!this.selectedView && (this as any)._autoDetectedViewName) {
                    const autoView = views.find((v: any) => v.name === (this as any)._autoDetectedViewName);
                    if (autoView) {
                        console.info('[ExportBases] Auto-selecting view:', autoView.name);
                        this.selectedView = autoView;
                    }
                    delete (this as any)._autoDetectedViewName;
                }

                new Setting(contentEl)
                    .setName('Select View')
                    .setDesc('Select the Table View containing the filtering logic')
                    .addDropdown((dropdown) => {
                        dropdown.addOption("", "Select a View");
                        views.forEach((view: any) => {
                            dropdown.addOption(view.id, view.name);
                        });
                        dropdown.setValue(this.selectedView?.id || "");
                        dropdown.onChange((value) => {
                            this.selectedView = views.find((v: any) => v.id === value);
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
                            const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

                            const result = await dialog.showOpenDialog({
                                properties: ['openDirectory'],
                                title: 'Select Export Directory'
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


    async getBases(): Promise<any[]> {
        const app = this.app as any;
        // Try both internal and third-party plugin locations
        const basesPlugin = app.internalPlugins?.getPluginById('bases') || app.plugins?.getPlugin('bases');

        if (basesPlugin && basesPlugin.enabled) {
            console.info('[ExportBases] Bases plugin detected.');
        } else {
            console.warn('[ExportBases] Bases plugin not found or not enabled.');
        }

        const files = this.app.vault.getFiles().filter(f => f.extension === 'base');
        console.log('Found .base files:', files);

        return files.map(file => ({
            id: file.path,
            name: file.basename,
            file: file
        }));
    }



    async getViews(base: any): Promise<any[]> {
        console.info('[ExportBases] getViews called for base:', base.name);
        if (!base || !base.file) {
            console.warn('[ExportBases] No base file provided to getViews');
            return [];
        }

        let matchingBase: any = null;
        const app = this.app as any;

        // Deep exploration of plugin structure
        console.info('[ExportBases] === DEEP PLUGIN EXPLORATION ===');

        // Check internal plugin
        const internalPlugin = app.internalPlugins?.getPluginById('bases');
        console.info('[ExportBases] Internal plugin:', internalPlugin ? 'FOUND' : 'NOT FOUND');
        if (internalPlugin) {
            console.info('[ExportBases] Internal plugin keys:', Object.keys(internalPlugin));
            if (internalPlugin.instance) {
                console.info('[ExportBases] Instance keys:', Object.keys(internalPlugin.instance));
            }
        }

        // Check third-party plugin
        const thirdPartyPlugin = app.plugins?.getPlugin('bases');
        console.info('[ExportBases] Third-party plugin:', thirdPartyPlugin ? 'FOUND' : 'NOT FOUND');
        if (thirdPartyPlugin) {
            console.info('[ExportBases] Third-party plugin keys:', Object.keys(thirdPartyPlugin));
        }

        // The Bases feature might be part of Obsidian core, not a separate plugin
        // Let's check if there's a bases manager on the app itself
        console.info('[ExportBases] App keys:', Object.keys(app).filter(k => k.toLowerCase().includes('base')));

        // Check workspace for open base files
        const leaves = app.workspace?.getLeavesOfType?.('bases') || [];
        console.info('[ExportBases] Open Bases leaves:', leaves.length);
        if (leaves.length > 0) {
            const firstLeaf = leaves[0];
            console.info('[ExportBases] First leaf view keys:', Object.keys(firstLeaf.view || {}));
            if (firstLeaf.view) {
                // The view might have the actual data
                console.info('[ExportBases] Leaf view file:', firstLeaf.view.file?.path);
                if (firstLeaf.view.file?.path === base.file.path) {
                    matchingBase = firstLeaf.view;
                    console.info('[ExportBases] MATCH! Found matching base view in workspace.');
                }
            }
        }

        console.info('[ExportBases] === END EXPLORATION ===');

        try {
            console.info('[ExportBases] Reading .base file:', base.file.path);
            const content = await this.app.vault.read(base.file);
            console.info('[ExportBases] File read successfully, length:', content?.length);

            if (!content || content.trim() === "") return [];

            const data = parseYaml(content);
            console.info('[ExportBases] YAML parsed successfully:', !!data);

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

    async getFilteredFiles(base: any, viewInfo: any): Promise<any[]> {
        console.info('[ExportBases] getFilteredFiles called for view:', viewInfo.name, 'in base:', base.name);

        const app = this.app as any;

        // First, ensure the correct Base is open in a tab
        let leafView = viewInfo.baseInstance;

        // Check if we have a valid baseInstance and it matches the selected base
        if (!leafView || leafView.file?.path !== base.file?.path) {
            console.info('[ExportBases] Selected Base is not the active one. Opening it...');

            // Open the Base file
            const baseFile = base.file;
            if (baseFile) {
                // Open the file in a new leaf
                const leaf = await app.workspace.getLeaf(false);
                await leaf.openFile(baseFile);

                // Wait for it to load
                await new Promise(r => setTimeout(r, 500));

                // Find the leaf view for this base
                const leaves = app.workspace.getLeavesOfType('bases') || [];
                for (const l of leaves) {
                    if (l.view?.file?.path === baseFile.path) {
                        leafView = l.view;
                        console.info('[ExportBases] Found opened Base leaf view.');
                        break;
                    }
                }

                if (!leafView) {
                    console.warn('[ExportBases] Could not find leaf view after opening Base. Using fallback...');
                    // Try getting from workspace active view
                    const activeView = app.workspace.getActiveViewOfType(Object.values(app.viewRegistry.viewByType).find((v: any) => v?.prototype?.constructor?.name === 'BasesView') || null);
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
            console.info('[ExportBases] Controller found. Exploring all possible result locations...');

            // Explore queryState
            if (controller.queryState) {
                console.info('[ExportBases] queryState keys:', Object.keys(controller.queryState));
                if (controller.queryState.results) {
                    console.info('[ExportBases] queryState.results:', controller.queryState.results);
                }
                if (controller.queryState.data) {
                    console.info('[ExportBases] queryState.data:', controller.queryState.data);
                }
            }

            // Explore ctx (context)
            if (controller.ctx) {
                console.info('[ExportBases] ctx keys:', Object.keys(controller.ctx));
                if (controller.ctx.results) {
                    const ctxResults = controller.ctx.results;
                    console.info('[ExportBases] ctx.results:', Array.isArray(ctxResults) ? ctxResults.length + ' items' : typeof ctxResults);
                    if (Array.isArray(ctxResults) && ctxResults.length > 0) {
                        console.info('[ExportBases] SUCCESS: Found ctx.results!');
                        return ctxResults.map((r: any) => r.file || r).filter((f: any) => f && f.path);
                    }
                }
            }

            // Explore view - the data is in controller.view.data.data
            // IMPORTANT: The controller only has data for the CURRENTLY ACTIVE view
            const activeViewName = controller.viewName;
            console.info('[ExportBases] Active view in Bases tab:', activeViewName);
            console.info('[ExportBases] Requested view:', viewInfo.name);

            if (activeViewName && activeViewName !== viewInfo.name) {
                console.info('[ExportBases] View mismatch. Attempting to switch views programmatically...');

                // Explore controller methods for view switching
                const controllerProto = Object.getPrototypeOf(controller);
                const methods = Object.getOwnPropertyNames(controllerProto).filter(m => typeof controller[m] === 'function');
                console.info('[ExportBases] Controller methods related to views:', methods.filter(m =>
                    m.toLowerCase().includes('view') || m.toLowerCase().includes('switch') || m.toLowerCase().includes('set')
                ));

                // Try calling selectView first (discovered from controller methods)
                if (typeof controller.selectView === 'function') {
                    console.info('[ExportBases] Calling selectView...');
                    controller.selectView(viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else if (typeof controller.setQueryAndView === 'function') {
                    console.info('[ExportBases] Calling setQueryAndView...');
                    controller.setQueryAndView(null, viewInfo.name);
                    await new Promise(r => setTimeout(r, 200));
                } else {
                    // Fallback: Try DOM click
                    const viewHeader = controller.viewHeaderEl || leafView.containerEl?.querySelector('.bases-view-header');
                    if (viewHeader) {
                        const tabs = viewHeader.querySelectorAll('*');
                        for (const el of tabs) {
                            if (el.textContent?.trim() === viewInfo.name) {
                                console.info('[ExportBases] Clicking view tab in DOM...');
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
                console.info('[ExportBases] View switch successful!');
            }

            if (controller.view) {

                // The actual results are in controller.view.data.data
                if (controller.view.data && controller.view.data.data && Array.isArray(controller.view.data.data)) {
                    const results = controller.view.data.data;
                    console.info('[ExportBases] SUCCESS: Found controller.view.data.data with', results.length, 'entries');
                    if (results.length > 0) {
                        console.info('[ExportBases] First entry keys:', Object.keys(results[0]));
                    }
                    return results.map((r: any) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        return r.file || r;
                    }).filter((f: any) => f && f.path);
                }

                // Also check controller.view.rows
                if (controller.view.rows && Array.isArray(controller.view.rows)) {
                    const rows = controller.view.rows;
                    console.info('[ExportBases] SUCCESS: Found controller.view.rows with', rows.length, 'entries');
                    if (rows.length > 0) {
                        console.info('[ExportBases] First row keys:', Object.keys(rows[0]));
                    }
                    return rows.map((r: any) => {
                        if (typeof r === 'string') return this.app.vault.getAbstractFileByPath(r);
                        return r.file || r;
                    }).filter((f: any) => f && f.path);
                }
            }

            // Explore _children (might contain the actual view components)
            if (controller._children && controller._children.length > 0) {
                console.info('[ExportBases] controller._children:', controller._children.length, 'children');
                const firstChild = controller._children[0];
                if (firstChild) {
                    console.info('[ExportBases] First child keys:', Object.keys(firstChild));
                    if (firstChild.results) {
                        console.info('[ExportBases] First child has results!');
                    }
                    if (firstChild.data) {
                        console.info('[ExportBases] First child data:', firstChild.data);
                    }
                }
            }

            // Check the DOM for table rows as a last resort
            const viewContainer = controller.viewContainerEl;
            if (viewContainer) {
                const rows = viewContainer.querySelectorAll('.bases-row, tr[data-file], .table-row');
                console.info('[ExportBases] DOM table rows found:', rows.length);
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
                        console.info('[ExportBases] SUCCESS: Extracted', files.length, 'files from DOM');
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

    async copyFileToExternalFolder(file: any, targetPath: string) {
        // Only run on desktop where fs is available
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');

        if (!fs || !path) {
            new Notice('File system access is not available (are you on mobile?)');
            return;
        }

        try {
            const arrayBuffer = await this.app.vault.readBinary(file);
            const buffer = Buffer.from(arrayBuffer);

            // Handle subfolders if the file is in a folder in Obsidian?
            // The user requested to export to a specified folder.
            // Let's keep it flat for now unless they specify otherwise.
            const destination = path.join(targetPath, file.name);

            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            fs.writeFileSync(destination, buffer);
            console.log(`Exported: ${file.path} -> ${destination}`);
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

