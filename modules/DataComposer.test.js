// Test file for user-story-map-grid-spec Task 2.1, 2.2
// Test: データ合成と表示制御

describe('DataComposer', () => {
    describe('compose', () => {
        const mockData = {
            integrated_story_map: {
                meta: {
                    ui_options: {
                        hide_priority_2: false
                    }
                },
                story_map_structure: {
                    activities: [
                        { id: 'ACT-001', name: '組織運営' },
                        { id: 'ACT-002', name: 'プロジェクト管理' }
                    ],
                    backbones: [
                        { id: 'BB-001', activity_id: 'ACT-001', name: '組織作成', sequence: 1 },
                        { id: 'BB-002', activity_id: 'ACT-001', name: '組織切替', sequence: 2 },
                        { id: 'BB-003', activity_id: 'ACT-002', name: 'プロジェクト作成', sequence: 3 }
                    ]
                },
                personas_stories: {
                    P001: {
                        name: '組織管理者',
                        mvp_priority_1: [
                            { id: 'ST-001', story: 'Test1', backbone_id: 'BB-001' },
                            { id: 'ST-002', story: 'Test2', backbone_id: 'BB-003' }
                        ],
                        mvp_priority_2: [
                            { id: 'ST-003', story: 'Test3', backbone_id: 'BB-002' }
                        ]
                    },
                    P002: {
                        name: 'プロジェクト利用者',
                        mvp_priority_1: [
                            { id: 'ST-004', story: 'Test4', backbone_id: 'BB-002' }
                        ]
                    }
                }
            }
        };
        
        it('should create columns in backbone sequence order', () => {
            // Act
            const result = DataComposer.compose(mockData);
            
            // Assert
            expect(result.columns).toHaveLength(3);
            expect(result.columns[0].id).toBe('BB-001');
            expect(result.columns[1].id).toBe('BB-002');
            expect(result.columns[2].id).toBe('BB-003');
        });
        
        it('should map activities to columns correctly', () => {
            // Act
            const result = DataComposer.compose(mockData);
            
            // Assert
            expect(result.activityByColumn).toHaveLength(3);
            expect(result.activityByColumn[0].id).toBe('ACT-001'); // BB-001's activity
            expect(result.activityByColumn[1].id).toBe('ACT-001'); // BB-002's activity
            expect(result.activityByColumn[2].id).toBe('ACT-002'); // BB-003's activity
        });
        
        it('should create story grid with null for empty cells', () => {
            // Act
            const result = DataComposer.compose(mockData);
            
            // Assert
            // P001 row: ST-001 in column 0, null in column 1, ST-002 in column 2
            expect(result.rowsP1[0][0].id).toBe('ST-001');
            expect(result.rowsP1[0][1]).toBeNull();
            expect(result.rowsP1[0][2].id).toBe('ST-002');
            
            // P002 row: null in column 0, ST-004 in column 1, null in column 2
            expect(result.rowsP1[1][0]).toBeNull();
            expect(result.rowsP1[1][1].id).toBe('ST-004');
            expect(result.rowsP1[1][2]).toBeNull();
        });
        
        it('should hide Priority2 when hide_priority_2 is true', () => {
            // Arrange
            const dataWithHide = JSON.parse(JSON.stringify(mockData));
            dataWithHide.integrated_story_map.meta.ui_options.hide_priority_2 = true;
            
            // Act
            const result = DataComposer.compose(dataWithHide);
            
            // Assert
            expect(result.showPriority2).toBe(false);
            expect(result.rowsP2).toBeUndefined();
        });
        
        it('should hide Priority2 when no mvp_priority_2 stories exist', () => {
            // Arrange
            const dataNoP2 = JSON.parse(JSON.stringify(mockData));
            delete dataNoP2.integrated_story_map.personas_stories.P001.mvp_priority_2;
            
            // Act
            const result = DataComposer.compose(dataNoP2);
            
            // Assert
            expect(result.showPriority2).toBe(false);
        });
        
        it('should show Priority2 when stories exist and not hidden', () => {
            // Act
            const result = DataComposer.compose(mockData);
            
            // Assert
            expect(result.showPriority2).toBe(true);
            expect(result.rowsP2).toBeDefined();
            expect(result.rowsP2[0][1].id).toBe('ST-003'); // P001's P2 story
        });
        
        it('should add persona info to each story', () => {
            // Act
            const result = DataComposer.compose(mockData);
            
            // Assert
            expect(result.rowsP1[0][0].personaName).toBe('組織管理者');
            expect(result.rowsP1[1][1].personaName).toBe('プロジェクト利用者');
        });
    });
});
