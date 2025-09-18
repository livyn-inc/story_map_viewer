// Test file for user-story-map-grid-spec Task 1.2
// Test: スキーマ検証

describe('SchemaValidator', () => {
    describe('validate', () => {
        it('should pass validation for valid schema', () => {
            // Arrange
            const validData = {
                integrated_story_map: {
                    story_map_structure: {
                        activities: [
                            { id: 'ACT-001', name: '組織運営', description: 'test' }
                        ],
                        backbones: [
                            { id: 'BB-001', activity_id: 'ACT-001', name: 'Test', sequence: 1 }
                        ]
                    },
                    personas_stories: {
                        P001: {
                            name: 'テストペルソナ',
                            mvp_priority_1: [
                                { id: 'ST-001', story: 'Test Story', backbone_id: 'BB-001' }
                            ]
                        }
                    }
                }
            };
            
            // Act
            const errors = SchemaValidator.validate(validData);
            
            // Assert
            expect(errors).toHaveLength(0);
        });
        
        it('should detect missing required keys in activities', () => {
            // Arrange
            const dataWithMissingKey = {
                integrated_story_map: {
                    story_map_structure: {
                        activities: [
                            { id: 'ACT-001' } // name is missing
                        ],
                        backbones: []
                    }
                }
            };
            
            // Act
            const errors = SchemaValidator.validate(dataWithMissingKey);
            
            // Assert
            expect(errors).toHaveLength(1);
            expect(errors[0].path).toBe('activities[0]');
            expect(errors[0].message).toContain('必須キー');
        });
        
        it('should detect invalid activity_id reference in backbones', () => {
            // Arrange
            const dataWithInvalidRef = {
                integrated_story_map: {
                    story_map_structure: {
                        activities: [
                            { id: 'ACT-001', name: 'Test' }
                        ],
                        backbones: [
                            { id: 'BB-001', activity_id: 'ACT-999', name: 'Test', sequence: 1 }
                        ]
                    }
                }
            };
            
            // Act
            const errors = SchemaValidator.validate(dataWithInvalidRef);
            
            // Assert
            expect(errors).toHaveLength(1);
            expect(errors[0].path).toBe('backbones[0].activity_id');
            expect(errors[0].message).toContain('activities.id に一致しない');
        });
        
        it('should detect invalid backbone_id reference in stories', () => {
            // Arrange
            const dataWithInvalidStoryRef = {
                integrated_story_map: {
                    story_map_structure: {
                        activities: [
                            { id: 'ACT-001', name: 'Test' }
                        ],
                        backbones: [
                            { id: 'BB-001', activity_id: 'ACT-001', name: 'Test', sequence: 1 }
                        ]
                    },
                    personas_stories: {
                        P001: {
                            name: 'Test',
                            mvp_priority_1: [
                                { id: 'ST-001', story: 'Test', backbone_id: 'BB-999' }
                            ]
                        }
                    }
                }
            };
            
            // Act
            const errors = SchemaValidator.validate(dataWithInvalidStoryRef);
            
            // Assert
            expect(errors.length).toBeGreaterThan(0);
            const bbError = errors.find(e => e.path.includes('backbone_id'));
            expect(bbError.message).toContain('backbones.id に一致しない');
        });
        
        it('should validate all stories in both priority levels', () => {
            // Arrange
            const dataWithPriority2 = {
                integrated_story_map: {
                    story_map_structure: {
                        activities: [{ id: 'ACT-001', name: 'Test' }],
                        backbones: [{ id: 'BB-001', activity_id: 'ACT-001', name: 'Test', sequence: 1 }]
                    },
                    personas_stories: {
                        P001: {
                            name: 'Test',
                            mvp_priority_1: [
                                { id: 'ST-001', story: 'Test1', backbone_id: 'BB-001' }
                            ],
                            mvp_priority_2: [
                                { id: 'ST-002', story: 'Test2', backbone_id: 'BB-999' } // Invalid
                            ]
                        }
                    }
                }
            };
            
            // Act
            const errors = SchemaValidator.validate(dataWithPriority2);
            
            // Assert
            expect(errors.length).toBe(1);
            expect(errors[0].path).toContain('mvp_priority_2');
        });
    });
});
