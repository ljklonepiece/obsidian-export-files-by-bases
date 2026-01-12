/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { moment } from 'obsidian';

export const locales = {
    en: {
        // main.ts
        RIBBON_TOOLTIP: 'Export bases files',
        COMMAND_NAME: 'Open export interface',

        // settings.ts


        // ExportModal.ts - Header
        MODAL_TITLE: 'Export bases files',

        // ExportModal.ts - Fields
        SELECT_BASE: 'Select Base',
        SELECT_BASE_DESC: 'Select the base you want to export from',
        SELECT_VIEW: 'Select View',
        SELECT_VIEW_DESC: 'Select the table view containing the filtering logic',
        EXPORT_PATH: 'Export path',
        EXPORT_PATH_DESC: 'Specify the target folder for exported files',
        BROWSE_BUTTON: 'Browse',
        BROWSE_TOOLTIP: 'Select export directory',
        PATH_PLACEHOLDER: 'Click to select a folder',
        PATH_INPUT_PLACEHOLDER: 'path/to/folder',
        PICKER_TITLE: 'Select export directory',
        EXPORT_DEPTH: 'Export depth',
        EXPORT_DEPTH_DESC: '1: only filtered files, 2: include links from filtered files, etc. Enter -1 for infinite depth.',
        DEPTH_PLACEHOLDER: 'Depth Level',
        INFINITE_DEPTH_NOTICE: 'Infinite depth enabled: all reachable notes will be exported.',
        INCLUDE_INTERNAL: 'Include internal files',
        INCLUDE_INTERNAL_DESC: 'Include Obsidian internal files like .base, .canvas',
        INCLUDE_MEDIA: 'Include media files',
        INCLUDE_MEDIA_DESC: 'Include images, videos, audio, and other attachments',
        EXPORT_BUTTON: 'Export',

        // ExportModal.ts - Notices
        NOTICE_EXPORTING: 'Exporting files from {{base}}...',
        NOTICE_NO_FILES: 'No files found matching the view filters.',
        NOTICE_COMPLETE_FIELDS: 'Please complete all selection fields.',
        NOTICE_EXPORT_SUCCESS: 'Successfully exported {{count}} files to {{path}}.',
        NOTICE_EXPORT_FAILED: 'Export failed. See console for details.',
        NOTICE_OPEN_BASE: 'Please open the Base file first.',
        NOTICE_SWITCH_VIEW: 'Please switch to the "{{view}}" view in the Bases tab manually.',

        // ExportModal.ts - Errors
        ERROR_UI_LOAD: 'An error occurred while loading the interface. Check console for details.',
        ERROR_FS_ACCESS: 'File system access is not available (are you on mobile?)',
        ERROR_PICKER: 'Could not open directory picker. Please enter path manually.',
        ERROR_READ_VIEWS: 'Failed to read base views: {{message}}',
    },
    zh: {
        // main.ts
        RIBBON_TOOLTIP: '导出 Bases 文件',
        COMMAND_NAME: '打开导出界面',

        // settings.ts


        // ExportModal.ts - Header
        MODAL_TITLE: '导出 Bases 文件',

        // ExportModal.ts - Fields
        SELECT_BASE: '选择 Base',
        SELECT_BASE_DESC: '选择您想要从中导出的 Base',
        SELECT_VIEW: '选择视图',
        SELECT_VIEW_DESC: '选择包含过滤逻辑的表视图',
        EXPORT_PATH: '导出路径',
        EXPORT_PATH_DESC: '指定导出文件的目标文件夹',
        BROWSE_BUTTON: '浏览',
        BROWSE_TOOLTIP: '选择导出目录',
        PATH_PLACEHOLDER: '点击选择文件夹',
        PATH_INPUT_PLACEHOLDER: '路径/至/文件夹',
        PICKER_TITLE: '选择导出目录',
        EXPORT_DEPTH: '导出深度',
        EXPORT_DEPTH_DESC: '1: 仅导出过滤文件, 2: 包含过滤文件的链接文件, 依此类推。输入 -1 表示无限深度。',
        DEPTH_PLACEHOLDER: '深度等级',
        INFINITE_DEPTH_NOTICE: '已启用无限深度：所有可触达的笔记都将被导出。',
        INCLUDE_INTERNAL: '包含内部文件',
        INCLUDE_INTERNAL_DESC: '包含 Obsidian 内部文件，如 .base, .canvas',
        INCLUDE_MEDIA: '包含媒体文件',
        INCLUDE_MEDIA_DESC: '包含图片、视频、音频和其他附件',
        EXPORT_BUTTON: '导出',

        // ExportModal.ts - Notices
        NOTICE_EXPORTING: '正在从 {{base}} 导出文件...',
        NOTICE_NO_FILES: '未找到匹配视图过滤条件的文件。',
        NOTICE_COMPLETE_FIELDS: '请填写所有必填字段。',
        NOTICE_EXPORT_SUCCESS: '成功导出 {{count}} 个文件至 {{path}}。',
        NOTICE_EXPORT_FAILED: '导出失败。请查看控制台了解详情。',
        NOTICE_OPEN_BASE: '请先打开 Base 文件。',
        NOTICE_SWITCH_VIEW: '请手动在 Bases 标签页中切换至 "{{view}}" 视图。',

        // ExportModal.ts - Errors
        ERROR_UI_LOAD: '加载界面时出错。请查看控制台了解详情。',
        ERROR_FS_ACCESS: '文件系统访问不可用（您是否在移动端？）',
        ERROR_PICKER: '无法打开目录选择器。请手动输入路径。',
        ERROR_READ_VIEWS: '读取 Base 视图失败：{{message}}',
    },
    ja: {
        // main.ts
        RIBBON_TOOLTIP: 'Basesファイルをエクスポート',
        COMMAND_NAME: 'エクスポートインターフェースを開く',

        // settings.ts


        // ExportModal.ts - Header
        MODAL_TITLE: 'Basesファイルをエクスポート',

        // ExportModal.ts - Fields
        SELECT_BASE: 'Baseを選択',
        SELECT_BASE_DESC: 'エクスポート元のBaseを選択してください',
        SELECT_VIEW: 'ビューを選択',
        SELECT_VIEW_DESC: 'フィルタリングロジックを含むテーブルビューを選択してください',
        EXPORT_PATH: 'エクスポート先パス',
        EXPORT_PATH_DESC: 'エクスポートファイルの保存先フォルダを指定してください',
        BROWSE_BUTTON: '参照',
        BROWSE_TOOLTIP: 'エクスポート先ディレクトリを選択',
        PATH_PLACEHOLDER: 'クリックしてフォルダを選択',
        PATH_INPUT_PLACEHOLDER: 'フォルダへのパス',
        PICKER_TITLE: 'エクスポート先ディレクトリを選択',
        EXPORT_DEPTH: 'エクスポートの深さ',
        EXPORT_DEPTH_DESC: '1: フィルタリングされたファイルのみ, 2: リンク元を含む, など。無制限の場合は -1 を入力してください。',
        DEPTH_PLACEHOLDER: '深度レベル',
        INFINITE_DEPTH_NOTICE: '無制限の深度が有効です：到達可能なすべてのノートがエクスポートされます。',
        INCLUDE_INTERNAL: '内部ファイルを含める',
        INCLUDE_INTERNAL_DESC: '.base, .canvas などの Obsidian 内部ファイルを含める',
        INCLUDE_MEDIA: 'メディアファイルを含める',
        INCLUDE_MEDIA_DESC: '画像、動画、音声、その他の添付ファイルを含める',
        EXPORT_BUTTON: 'エクスポート',

        // ExportModal.ts - Notices
        NOTICE_EXPORTING: '{{base}} からファイルをエクスポート中...',
        NOTICE_NO_FILES: 'ビューのフィルタに一致するファイルが見つかりませんでした。',
        NOTICE_COMPLETE_FIELDS: 'すべての選択項目を入力してください。',
        NOTICE_EXPORT_SUCCESS: '{{count}} 個のファイルを {{path}} に正常にエクスポートしました。',
        NOTICE_EXPORT_FAILED: 'エクスポートに失敗しました。詳細はコンソールを確認してください。',
        NOTICE_OPEN_BASE: '先に Base ファイルを開いてください。',
        NOTICE_SWITCH_VIEW: 'Bases タブで手動で "{{view}}" ビューに切り替えてください。',

        // ExportModal.ts - Errors
        ERROR_UI_LOAD: 'インターフェースの読み込み中にエラーが発生しました。詳細はコンソールを確認してください。',
        ERROR_FS_ACCESS: 'ファイルシステムへのアクセスが利用できません（モバイル版ですか？）',
        ERROR_PICKER: 'ディレクトリ選択ツールを開けませんでした。パスを手動で入力してください。',
        ERROR_READ_VIEWS: 'Base ビューの読み込みに失敗しました: {{message}}',
    },
    ko: {
        // main.ts
        RIBBON_TOOLTIP: 'Bases 파일 내보내기',
        COMMAND_NAME: '내보내기 인터페이스 열기',

        // settings.ts


        // ExportModal.ts - Header
        MODAL_TITLE: 'Bases 파일 내보내기',

        // ExportModal.ts - Fields
        SELECT_BASE: 'Base 선택',
        SELECT_BASE_DESC: '내보낼 원본 Base를 선택하세요',
        SELECT_VIEW: '뷰 선택',
        SELECT_VIEW_DESC: '필터링 로직이 포함된 테이블 뷰를 선택하세요',
        EXPORT_PATH: '내보내기 경로',
        EXPORT_PATH_DESC: '내보낼 파일의 대상 폴더를 지정하세요',
        BROWSE_BUTTON: '찾아보기',
        BROWSE_TOOLTIP: '내보내기 디렉토리 선택',
        PATH_PLACEHOLDER: '클릭하여 폴더 선택',
        PATH_INPUT_PLACEHOLDER: '폴더 경로',
        PICKER_TITLE: '내보내기 디렉토리 선택',
        EXPORT_DEPTH: '내보내기 깊이',
        EXPORT_DEPTH_DESC: '1: 필터링된 파일만, 2: 링크 포함 등. 무제한 깊이는 -1을 입력하세요.',
        DEPTH_PLACEHOLDER: '깊이 레벨',
        INFINITE_DEPTH_NOTICE: '무제한 깊이 활성화: 접근 가능한 모든 노트가 내보내집니다.',
        INCLUDE_INTERNAL: '내부 파일 포함',
        INCLUDE_INTERNAL_DESC: '.base, .canvas와 같은 Obsidian 내부 파일 포함',
        INCLUDE_MEDIA: '미디어 파일 포함',
        INCLUDE_MEDIA_DESC: '이미지, 비디오, 오디오 및 기타 첨부 파일 포함',
        EXPORT_BUTTON: '내보내기',

        // ExportModal.ts - Notices
        NOTICE_EXPORTING: '{{base}}에서 파일을 내보내는 중...',
        NOTICE_NO_FILES: '뷰 필터와 일치하는 파일을 찾을 수 없습니다.',
        NOTICE_COMPLETE_FIELDS: '모든 선택 필드를 채워주세요.',
        NOTICE_EXPORT_SUCCESS: '{{count}}개의 파일을 {{path}}(으)로 성공적으로 내보냈습니다.',
        NOTICE_EXPORT_FAILED: '내보내기에 실패했습니다. 자세한 내용은 콘솔을 확인하세요.',
        NOTICE_OPEN_BASE: '먼저 Base 파일을 열어주세요.',
        NOTICE_SWITCH_VIEW: 'Bases 탭에서 "{{view}}" 뷰로 수동으로 전환해주세요.',

        // ExportModal.ts - Errors
        ERROR_UI_LOAD: '인터페이스를 로드하는 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.',
        ERROR_FS_ACCESS: '파일 시스템 액세스를 사용할 수 없습니다 (모바일 기기인가요?)',
        ERROR_PICKER: '디렉토리 선택기를 열 수 없습니다. 경로를 수동으로 입력하세요.',
        ERROR_READ_VIEWS: 'Base 뷰를 읽지 못했습니다: {{message}}',
    }
} as const;

const locale = (typeof window !== 'undefined' && (window as any).localStorage?.getItem('language')) ||
    (typeof moment !== 'undefined' ? moment.locale() : 'en');

export function t(key: keyof typeof locales.en, vars?: Record<string, string | number>): string {
    const localeMap: any = locales;
    const currentLocale = localeMap[locale] || locales.en;
    let text = currentLocale[key] || (locales.en as any)[key] || key;

    if (vars) {
        Object.keys(vars).forEach(v => {
            text = text.replace(`{{${v}}}`, String(vars[v]));
        });
    }

    return text;
}
