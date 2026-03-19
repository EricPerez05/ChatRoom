import { describe, expect, it } from 'vitest';
import { QuestionDetectionService } from '../src/services/questionDetectionService';

describe('QuestionDetectionService', () => {
  const service = new QuestionDetectionService();

  it('detects sentence ending with question mark', () => {
    expect(service.isLikelyQuestion('Can someone help me with this?')).toBe(true);
  });

  it('detects question starter without question mark', () => {
    expect(service.isLikelyQuestion('how do we deploy this to staging')).toBe(true);
  });

  it('does not detect normal statement as question', () => {
    expect(service.isLikelyQuestion('Deployment completed successfully')).toBe(false);
  });
});