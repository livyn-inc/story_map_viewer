/**
 * FileUploader - ファイルアップロードUI
 * ドラッグ&ドロップとファイル選択に対応
 */

import FileManager from './FileManager.js';

class FileUploader {
  constructor() {
    this.dropZone = null;
    this.fileInput = null;
    this.uploadCallback = null;
    this.errorCallback = null;
  }

  /**
   * ファイルアップローダーの初期化
   * @param {HTMLElement} dropZoneElement - ドロップゾーン要素
   * @param {Function} onUpload - アップロード成功時のコールバック
   * @param {Function} onError - エラー時のコールバック
   */
  init(dropZoneElement, onUpload, onError) {
    console.log('FileUploader.init called', dropZoneElement);
    
    this.dropZone = dropZoneElement;
    this.uploadCallback = onUpload;
    this.errorCallback = onError;

    // ファイル入力要素の作成
    this.createFileInput();
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    console.log('FileUploader initialized successfully');
  }

  /**
   * ファイル入力要素の作成
   */
  createFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.yaml,.yml';
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';
    
    document.body.appendChild(this.fileInput);
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ドラッグ&ドロップイベント
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
    
    // クリックでファイル選択
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    
    // ファイル選択イベント
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
  }

  /**
   * ドラッグオーバーハンドラー
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.dropZone.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'copy';
  }

  /**
   * ドラッグリーブハンドラー
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.dropZone.classList.remove('drag-over');
  }

  /**
   * ドロップハンドラー
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered', e);
    console.log('Files:', e.dataTransfer.files);
    
    this.dropZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    console.log('Processing files:', files);
    this.processFiles(files);
  }

  /**
   * ファイル選択ハンドラー
   */
  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
    
    // 同じファイルを再選択できるようにリセット
    this.fileInput.value = '';
  }

  /**
   * ファイルの処理
   */
  async processFiles(files) {
    console.log('ProcessFiles called with:', files);
    
    const yamlFiles = files.filter(file => 
      file.name.endsWith('.yaml') || file.name.endsWith('.yml')
    );

    console.log('YAML files found:', yamlFiles);

    if (yamlFiles.length === 0) {
      this.handleError('YAMLファイル（.yaml または .yml）を選択してください');
      return;
    }

    for (const file of yamlFiles) {
      try {
        await this.processFile(file);
      } catch (error) {
        this.handleError(`${file.name}: ${error.message}`);
      }
    }
  }

  /**
   * 単一ファイルの処理
   */
  async processFile(file) {
    // プログレス表示
    this.showProgress(file.name);

    try {
      // ファイル内容の読み取り
      const content = await this.readFile(file);
      
      // YAMLパース
      const parsedData = await this.parseYaml(content, file.name);
      
      // FileManagerに保存
      const savedFile = await FileManager.saveFile({
        name: file.name,
        content: content,
        parsedData: parsedData,
        size: file.size
      });

      // 成功コールバック
      if (this.uploadCallback) {
        this.uploadCallback(savedFile);
      }

      this.hideProgress();
      this.showSuccess(`${file.name} をアップロードしました`);

    } catch (error) {
      this.hideProgress();
      throw error;
    }
  }

  /**
   * ファイル読み取り
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('ファイルの読み取りに失敗しました'));
      
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * YAMLパース
   */
  async parseYaml(content, filename) {
    try {
      const data = window.jsyaml.load(content); // グローバルのjs-yamlを使用
      
      if (!data || typeof data !== 'object') {
        throw new Error('有効なYAMLデータではありません');
      }
      
      return data;
    } catch (error) {
      throw new Error(`YAMLパースエラー: ${error.message}`);
    }
  }

  /**
   * プログレス表示
   */
  showProgress(filename) {
    const progressEl = document.createElement('div');
    progressEl.className = 'upload-progress';
    progressEl.innerHTML = `
      <div class="progress-spinner"></div>
      <span>${filename} を処理中...</span>
    `;
    this.dropZone.appendChild(progressEl);
  }

  /**
   * プログレス非表示
   */
  hideProgress() {
    const progressEl = this.dropZone.querySelector('.upload-progress');
    if (progressEl) {
      progressEl.remove();
    }
  }

  /**
   * 成功メッセージ表示
   */
  showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'upload-success';
    successEl.textContent = message;
    this.dropZone.appendChild(successEl);

    setTimeout(() => successEl.remove(), 3000);
  }

  /**
   * エラーハンドリング
   */
  handleError(message) {
    if (this.errorCallback) {
      this.errorCallback(message);
    }
    
    const errorEl = document.createElement('div');
    errorEl.className = 'upload-error';
    errorEl.textContent = message;
    this.dropZone.appendChild(errorEl);

    setTimeout(() => errorEl.remove(), 5000);
  }

  /**
   * ドロップゾーンUIの作成
   */
  static createDropZoneUI() {
    const dropZone = document.createElement('div');
    dropZone.className = 'file-drop-zone';
    dropZone.innerHTML = `
      <svg class="drop-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>YAMLファイルをドロップ</h3>
      <p>または、クリックしてファイルを選択</p>
      <span class="file-types">対応形式: .yaml, .yml</span>
    `;
    
    return dropZone;
  }

  /**
   * アップローダーの破棄
   */
  destroy() {
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
    
    // イベントリスナーのクリーンアップ
    if (this.dropZone) {
      this.dropZone.removeEventListener('dragover', this.handleDragOver);
      this.dropZone.removeEventListener('dragleave', this.handleDragLeave);
      this.dropZone.removeEventListener('drop', this.handleDrop);
    }
  }
}

export default FileUploader;