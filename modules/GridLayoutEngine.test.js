// Test file for user-story-map-grid-spec Task 3.1, 3.2
// Test: グリッドレイアウトエンジン

describe('GridLayoutEngine', () => {
    let originalSetProperty;
    
    beforeEach(() => {
        // Mock CSS custom property setter
        originalSetProperty = document.documentElement.style.setProperty;
        document.documentElement.style.setProperty = jest.fn();
        
        // Create mock DOM structure
        document.body.innerHTML = `
            <div id="mapContent">
                <div class="row-label">アクティビティ</div>
                <div class="row-label">バックボーン</div>
                <div class="row-label">Priority 1</div>
            </div>
        `;
    });
    
    afterEach(() => {
        document.documentElement.style.setProperty = originalSetProperty;
    });
    
    describe('applyGridColumns', () => {
        it('should set CSS custom property --cols', () => {
            // Act
            GridLayoutEngine.applyGridColumns(5);
            
            // Assert
            expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--cols', 5);
        });
        
        it('should throw error for invalid column count', () => {
            // Act & Assert
            expect(() => GridLayoutEngine.applyGridColumns(0)).toThrow();
            expect(() => GridLayoutEngine.applyGridColumns(-1)).toThrow();
            expect(() => GridLayoutEngine.applyGridColumns(null)).toThrow();
        });
    });
    
    describe('applyLabelCardStyles', () => {
        it('should convert row labels to card style', () => {
            // Act
            GridLayoutEngine.applyLabelCardStyles();
            
            // Assert
            const labels = document.querySelectorAll('.row-label');
            labels.forEach(label => {
                expect(label.classList.contains('label-card')).toBe(true);
                expect(label.innerHTML).toMatch(/<div class="label-card-content">/);
            });
        });
        
        it('should preserve label text content', () => {
            // Act
            GridLayoutEngine.applyLabelCardStyles();
            
            // Assert
            const label = document.querySelector('.row-label');
            expect(label.textContent).toBe('アクティビティ');
        });
    });
    
    describe('setupGridStructure', () => {
        it('should apply both grid columns and label styles', () => {
            // Arrange
            const applyColsSpy = jest.spyOn(GridLayoutEngine, 'applyGridColumns');
            const applyLabelsSpy = jest.spyOn(GridLayoutEngine, 'applyLabelCardStyles');
            
            // Act
            GridLayoutEngine.setupGridStructure(3);
            
            // Assert
            expect(applyColsSpy).toHaveBeenCalledWith(3);
            expect(applyLabelsSpy).toHaveBeenCalled();
        });
    });
});
