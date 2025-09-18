// Test file for user-story-map-grid-spec Task 4.1-4.4
// Test: レンダリング

describe('StoryMapRenderer', () => {
    let mockData;
    
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="activities"></div>
            <div id="backbones"></div>
            <div id="priority1"></div>
            <div id="priority2"></div>
        `;
        
        mockData = {
            columns: [
                { id: 'BB-001', name: '組織作成', sequence: 1 },
                { id: 'BB-002', name: '組織切替', sequence: 2 }
            ],
            activityByColumn: [
                { id: 'ACT-001', name: '組織運営', description: 'テスト説明' },
                { id: 'ACT-001', name: '組織運営', description: 'テスト説明' }
            ],
            rowsP1: [
                [
                    { id: 'ST-001', story: 'Story 1', personaName: '組織管理者' },
                    null
                ],
                [
                    null,
                    { id: 'ST-002', story: 'Story 2', personaName: 'プロジェクト利用者' }
                ]
            ],
            rowsP2: [
                [
                    null,
                    { id: 'ST-003', story: 'Story 3', personaName: '組織管理者' }
                ]
            ],
            showPriority2: true
        };
    });
    
    describe('render', () => {
        it('should render activities with column alignment', () => {
            // Arrange
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            const activityCards = mounts.activities.querySelectorAll('.activity-card');
            expect(activityCards).toHaveLength(2);
            expect(activityCards[0].textContent).toContain('組織運営');
        });
        
        it('should render empty card when activity is missing', () => {
            // Arrange
            mockData.activityByColumn[1] = null;
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            const cards = mounts.activities.querySelectorAll('.card');
            expect(cards).toHaveLength(2);
            expect(cards[1].classList.contains('empty-card')).toBe(true);
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Activity not found'));
        });
        
        it('should render backbone cards', () => {
            // Arrange
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            const backboneCards = mounts.backbones.querySelectorAll('.backbone-card');
            expect(backboneCards).toHaveLength(2);
            expect(backboneCards[0].textContent).toContain('組織作成');
            expect(backboneCards[1].textContent).toContain('組織切替');
        });
        
        it('should render story cards with invisible placeholders', () => {
            // Arrange
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            const cards = mounts.priority1.querySelectorAll('.card');
            expect(cards).toHaveLength(4); // 2x2 grid
            
            // First row
            expect(cards[0].classList.contains('story-card')).toBe(true);
            expect(cards[1].classList.contains('empty-card')).toBe(true);
            
            // Second row
            expect(cards[2].classList.contains('empty-card')).toBe(true);
            expect(cards[3].classList.contains('story-card')).toBe(true);
        });
        
        it('should not render Priority2 when showPriority2 is false', () => {
            // Arrange
            mockData.showPriority2 = false;
            mockData.rowsP2 = undefined;
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1'),
                priority2: document.getElementById('priority2')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            expect(mounts.priority2.innerHTML).toBe('');
        });
        
        it('should render Priority2 when showPriority2 is true', () => {
            // Arrange
            const mounts = {
                activities: document.getElementById('activities'),
                backbones: document.getElementById('backbones'),
                priority1: document.getElementById('priority1'),
                priority2: document.getElementById('priority2')
            };
            
            // Act
            StoryMapRenderer.render(mockData, mounts);
            
            // Assert
            const p2Cards = mounts.priority2.querySelectorAll('.story-card');
            expect(p2Cards).toHaveLength(1);
            expect(p2Cards[0].textContent).toContain('Story 3');
        });
    });
});

// Mock console for testing
console.warn = jest.fn();
