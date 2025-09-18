/**
 * Exporter - エクスポート機能
 * PNG、PDF、Markdown形式でのストーリーマップ出力
 */

// file-saverはグローバル変数として使用

class Exporter {
  constructor() {
    this.storyMapData = null;
  }

  /**
   * エクスポート用データの設定
   * @param {Object} data - ストーリーマップデータ
   */
  setData(data) {
    this.storyMapData = data;
  }

  /**
   * PNG形式でエクスポート
   * @param {HTMLElement} element - キャプチャ対象の要素
   * @param {string} filename - ファイル名
   */
  async exportAsPNG(element, filename = 'story-map.png') {
    try {
      // 可能なら全体ラッパーを対象にする（可視範囲のみ問題の回避）
      const target = element.querySelector('.story-map-wrapper') || element;
      const width = target.scrollWidth || target.offsetWidth;
      const height = target.scrollHeight || target.offsetHeight;

      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc) => {
          const map = doc.getElementById('mapContent');
          if (map) { map.style.overflow = 'visible'; }
          const wrap = doc.querySelector('.story-map-wrapper');
          if (wrap) { wrap.style.overflow = 'visible'; wrap.style.width = width + 'px'; }
        }
      });

      // Blobに変換
      canvas.toBlob((blob) => {
        window.saveAs(blob, filename);
      }, 'image/png');

      return { success: true };
    } catch (error) {
      console.error('PNG export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * PDF形式でエクスポート
   * @param {HTMLElement} element - 変換対象の要素
   * @param {string} filename - ファイル名
   */
  async exportAsPDF(element, filename = 'story-map.pdf') {
    try {
      // jsPDFは既にグローバルで読み込まれている
      const { jsPDF } = window.jspdf;
      
      // A4横向きで作成
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // ページ情報
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // タイトル
      pdf.setFontSize(20);
      pdf.text('User Story Map', margin, margin + 10);

      // プロジェクト情報
      if (this.storyMapData) {
        pdf.setFontSize(12);
        const projectName = this.storyMapData.integrated_story_map?.meta?.project_name || 'Untitled Project';
        pdf.text(`Project: ${projectName}`, margin, margin + 20);
        pdf.text(`Generated: ${new Date().toLocaleString('ja-JP')}`, margin, margin + 25);
      }

      // html2canvasで全体をキャプチャ
      const target = element.querySelector('.story-map-wrapper') || element;
      const width = target.scrollWidth || target.offsetWidth;
      const height = target.scrollHeight || target.offsetHeight;

      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc) => {
          const map = doc.getElementById('mapContent');
          if (map) { map.style.overflow = 'visible'; }
          const wrap = doc.querySelector('.story-map-wrapper');
          if (wrap) { wrap.style.overflow = 'visible'; wrap.style.width = width + 'px'; }
        }
      });

      // 画像として追加
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin + 35, imgWidth, Math.min(imgHeight, pageHeight - margin * 2 - 35));

      // 複数ページ対応
      if (imgHeight > pageHeight - margin * 2 - 35) {
        let position = -(pageHeight - margin * 2 - 35);
        while (position < imgHeight) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);
          position -= (pageHeight - margin * 2);
        }
      }

      // PDFを保存
      pdf.save(filename);

      return { success: true };
    } catch (error) {
      console.error('PDF export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Markdown形式でエクスポート
   * @param {string} filename - ファイル名
   */
  async exportAsMarkdown(filename = 'story-map.md') {
    try {
      if (!this.storyMapData || !this.storyMapData.integrated_story_map) {
        throw new Error('No story map data available');
      }

      const markdown = this.generateMarkdown(this.storyMapData.integrated_story_map);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      window.saveAs(blob, filename);

      return { success: true };
    } catch (error) {
      console.error('Markdown export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Markdownの生成
   */
  generateMarkdown(storyMap) {
    let md = '';

    // ヘッダー
    md += '# User Story Map\n\n';
    
    // メタ情報
    if (storyMap.meta) {
      md += '## Project Information\n\n';
      md += `- **Project Name**: ${storyMap.meta.project_name || 'N/A'}\n`;
      md += `- **Version**: ${storyMap.meta.version || 'N/A'}\n`;
      md += `- **Generated**: ${new Date().toLocaleString('ja-JP')}\n\n`;
    }

    // ペルソナ
    md += '## Personas\n\n';
    Object.entries(storyMap.personas_stories || {}).forEach(([key, persona]) => {
      md += `### ${persona.name}\n`;
      if (persona.description) {
        md += `${persona.description}\n\n`;
      }
    });

    // アクティビティとバックボーン
    if (storyMap.story_map_structure) {
      md += '## Story Map Structure\n\n';
      
      // アクティビティごとにグループ化
      const activities = storyMap.story_map_structure.activities || [];
      const backbones = storyMap.story_map_structure.backbones || [];
      
      activities.forEach(activity => {
        md += `### ${activity.name}\n`;
        md += `${activity.description}\n\n`;
        
        // このアクティビティに属するバックボーン
        const activityBackbones = backbones.filter(b => b.activity_id === activity.id);
        
        activityBackbones.forEach(backbone => {
          md += `#### ${backbone.name}\n`;
          md += `${backbone.description}\n\n`;
          
          // このバックボーンに属するストーリー
          md += this.generateStoriesForBackbone(backbone.id, storyMap.personas_stories);
        });
      });
    }

    // 受け入れ条件の詳細
    md += '## Acceptance Criteria Details\n\n';
    Object.entries(storyMap.personas_stories || {}).forEach(([key, persona]) => {
      const stories = persona.stories || [];
      stories.forEach(story => {
        if (story.acceptance_criteria && story.acceptance_criteria.length > 0) {
          md += `### ${story.id}: ${this.extractStoryTitle(story.story)}\n\n`;
          md += '**Acceptance Criteria:**\n';
          story.acceptance_criteria.forEach(criteria => {
            md += `- ${criteria}\n`;
          });
          md += '\n';
        }
      });
    });

    // フッター
    md += '---\n\n';
    md += `*Generated by StoryMapViewer on ${new Date().toLocaleDateString('ja-JP')}*\n`;

    return md;
  }

  /**
   * バックボーンに属するストーリーの生成
   */
  generateStoriesForBackbone(backboneId, personasStories) {
    let md = '**User Stories:**\n\n';
    
    Object.entries(personasStories).forEach(([key, persona]) => {
      const stories = (persona.stories || []).filter(s => s.backbone_id === backboneId);
      
      stories.forEach(story => {
        const priority = story.priority || 3;
        const version = story.version || 'MVP';
        
        md += `- **[${story.id}]** ${story.story}\n`;
        md += `  - Persona: ${persona.name}\n`;
        md += `  - Priority: ${'⭐'.repeat(priority)}${'☆'.repeat(5 - priority)} (${priority}/5)\n`;
        md += `  - Version: ${version}\n`;
        
        if (story.ui_screens && story.ui_screens.length > 0) {
          md += `  - Screens: ${story.ui_screens.join(', ')}\n`;
        }
        
        md += '\n';
      });
    });
    
    return md;
  }

  /**
   * ストーリーからタイトルを抽出
   */
  extractStoryTitle(storyText) {
    // "I want XXX" の部分を抽出
    const match = storyText.match(/I want (.+?)(?:,|So that|$)/i);
    return match ? match[1].trim() : storyText.substring(0, 50) + '...';
  }

  /**
   * CSV形式でエクスポート（追加機能）
   * @param {string} filename - ファイル名
   */
  async exportAsCSV(filename = 'story-map.csv') {
    try {
      if (!this.storyMapData || !this.storyMapData.integrated_story_map) {
        throw new Error('No story map data available');
      }

      const csv = this.generateCSV(this.storyMapData.integrated_story_map);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM付き
      window.saveAs(blob, filename);

      return { success: true };
    } catch (error) {
      console.error('CSV export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * CSVの生成
   */
  generateCSV(storyMap) {
    const rows = [];
    const headers = [
      'Story ID',
      'Persona',
      'Activity',
      'Backbone',
      'Story',
      'Priority',
      'Version',
      'Acceptance Criteria',
      'UI Screens',
      'Code References'
    ];
    
    rows.push(headers);

    // データ準備
    const activities = new Map(storyMap.story_map_structure.activities.map(a => [a.id, a]));
    const backbones = new Map(storyMap.story_map_structure.backbones.map(b => [b.id, b]));

    // ストーリーを行に変換
    Object.entries(storyMap.personas_stories || {}).forEach(([key, persona]) => {
      (persona.stories || []).forEach(story => {
        const backbone = backbones.get(story.backbone_id);
        const activity = backbone ? activities.get(backbone.activity_id) : null;
        
        const row = [
          story.id,
          persona.name,
          activity ? activity.name : '',
          backbone ? backbone.name : '',
          story.story,
          story.priority || 3,
          story.version || 'MVP',
          (story.acceptance_criteria || []).join('; '),
          (story.ui_screens || []).join('; '),
          (story.code_refs || []).join('; ')
        ];
        
        rows.push(row);
      });
    });

    // CSV形式に変換
    return rows.map(row => 
      row.map(cell => {
        // セル内の値をエスケープ
        const value = String(cell || '');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ).join('\n');
  }

  /**
   * JSON形式でエクスポート（追加機能）
   * @param {string} filename - ファイル名
   */
  async exportAsJSON(filename = 'story-map.json') {
    try {
      if (!this.storyMapData) {
        throw new Error('No story map data available');
      }

      const json = JSON.stringify(this.storyMapData, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      window.saveAs(blob, filename);

      return { success: true };
    } catch (error) {
      console.error('JSON export error:', error);
      return { success: false, error: error.message };
    }
  }
}

// シングルトンインスタンスとしてエクスポート
export default new Exporter();