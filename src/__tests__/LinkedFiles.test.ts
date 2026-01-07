/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ExportModal } from '../ExportModal';
import { TFile } from 'obsidian';

jest.mock('obsidian', () => ({
    Notice: jest.fn(),
    TFile: class { },
    Modal: class {
        app: any;
        constructor(app: any) { this.app = app; }
    },
    Setting: class {
        constructor() { return this; }
        setName = jest.fn().mockReturnThis();
        setDesc = jest.fn().mockReturnThis();
        addSlider = jest.fn().mockReturnThis();
        addButton = jest.fn().mockReturnThis();
    }
}));

describe('ExportModal - resolveLinkedFilesRecursive', () => {
    let app: any;
    let modal: ExportModal;

    beforeEach(() => {
        app = {
            vault: {
                getAbstractFileByPath: jest.fn(),
            },
            metadataCache: {
                resolvedLinks: {}
            }
        };
        modal = new ExportModal(app);
    });

    const createMockFile = (path: string): TFile => {
        const file = new TFile();
        (file as any).path = path;
        (file as any).name = path.split('/').pop();
        return file;
    };

    it('should handle depth 1', () => {
        const file1 = createMockFile('file1.md');
        const result = modal.resolveLinkedFilesRecursive([file1], 1);
        expect(result.size).toBe(1);
        expect(result.has(file1)).toBe(true);
    });

    describe('Depths 2-5 without circular links', () => {
        const file1 = createMockFile('file1.md');
        const file2 = createMockFile('file2.md');
        const file3 = createMockFile('file3.md');
        const file4 = createMockFile('file4.md');
        const file5 = createMockFile('file5.md');
        const file6 = createMockFile('file6.md');

        beforeEach(() => {
            app.metadataCache.resolvedLinks = {
                'file1.md': { 'file2.md': 1 },
                'file2.md': { 'file3.md': 1 },
                'file3.md': { 'file4.md': 1 },
                'file4.md': { 'file5.md': 1 },
                'file5.md': { 'file6.md': 1 }
            };
            app.vault.getAbstractFileByPath.mockImplementation((path: string) => {
                if (path === 'file2.md') return file2;
                if (path === 'file3.md') return file3;
                if (path === 'file4.md') return file4;
                if (path === 'file5.md') return file5;
                if (path === 'file6.md') return file6;
                return null;
            });
        });

        it('should handle depth 2 (no circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 2);
            expect(result.size).toBe(2);
            expect(result.has(file1)).toBe(true);
            expect(result.has(file2)).toBe(true);
        });

        it('should handle depth 3 (no circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 3);
            expect(result.size).toBe(3);
            expect(result.has(file3)).toBe(true);
        });

        it('should handle depth 4 (no circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 4);
            expect(result.size).toBe(4);
            expect(result.has(file4)).toBe(true);
        });

        it('should handle depth 5 (no circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 5);
            expect(result.size).toBe(5);
            expect(result.has(file5)).toBe(true);
        });
    });

    describe('Depths 2-5 with circular links', () => {
        const file1 = createMockFile('file1.md');
        const file2 = createMockFile('file2.md');
        const file3 = createMockFile('file3.md');
        const file4 = createMockFile('file4.md');
        const file5 = createMockFile('file5.md');

        beforeEach(() => {
            // Chain: file1 -> file2 -> file3 -> file4 -> file5
            // Cycle: file3 -> file1
            app.metadataCache.resolvedLinks = {
                'file1.md': { 'file2.md': 1 },
                'file2.md': { 'file3.md': 1 },
                'file3.md': { 'file1.md': 1, 'file4.md': 1 },
                'file4.md': { 'file5.md': 1 }
            };
            app.vault.getAbstractFileByPath.mockImplementation((path: string) => {
                if (path === 'file1.md') return file1;
                if (path === 'file2.md') return file2;
                if (path === 'file3.md') return file3;
                if (path === 'file4.md') return file4;
                if (path === 'file5.md') return file5;
                return null;
            });
        });

        it('should handle depth 2 (with circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 2);
            expect(result.size).toBe(2); // file1, file2
        });

        it('should handle depth 3 (with circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 3);
            expect(result.size).toBe(3); // file1, 2, 3
            expect(result.has(file1)).toBe(true);
            expect(result.has(file2)).toBe(true);
            expect(result.has(file3)).toBe(true);
        });

        it('should handle depth 4 (with circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 4);
            expect(result.size).toBe(4); // file1, 2, 3, 4
            expect(result.has(file4)).toBe(true);
        });

        it('should handle depth 5 (with circular)', () => {
            const result = modal.resolveLinkedFilesRecursive([file1], 5);
            expect(result.size).toBe(5);
        });
    });

    it('should ignore non-existent or folder links', () => {
        const file1 = createMockFile('file1.md');

        const initialFiles = [file1];
        app.metadataCache.resolvedLinks = {
            'file1.md': { 'non-existent.md': 1, 'folder/': 1 }
        };
        app.vault.getAbstractFileByPath.mockImplementation((path: string) => {
            if (path === 'folder/') return { path: 'folder/' }; // Not a TFile
            return null;
        });

        const result = modal.resolveLinkedFilesRecursive(initialFiles, 2);

        expect(result.size).toBe(1);
        expect(result.has(file1)).toBe(true);
    });

    it('should handle infinite depth (-1)', () => {
        const file1 = createMockFile('file1.md');
        const file2 = createMockFile('file2.md');
        const file3 = createMockFile('file3.md');
        const file4 = createMockFile('file4.md');

        const initialFiles = [file1];
        app.metadataCache.resolvedLinks = {
            'file1.md': { 'file2.md': 1 },
            'file2.md': { 'file3.md': 1 },
            'file3.md': { 'file4.md': 1 }
        };
        app.vault.getAbstractFileByPath.mockImplementation((path: string) => {
            if (path === 'file2.md') return file2;
            if (path === 'file3.md') return file3;
            if (path === 'file4.md') return file4;
            return null;
        });

        const result = modal.resolveLinkedFilesRecursive(initialFiles, -1);

        expect(result.size).toBe(4);
        expect(result.has(file1)).toBe(true);
        expect(result.has(file2)).toBe(true);
        expect(result.has(file3)).toBe(true);
        expect(result.has(file4)).toBe(true);
    });

    it('should have default depth of 2', () => {
        expect(modal.exportDepth).toBe(2);
    });
});
