import { useState, useCallback } from 'react';
import { VocabularyCard } from '../types/vocabulary';
import { stickerQueue } from '../services/stickers/stickerQueue';

export interface StickerGenerationStatus {
  jobId: string;
  cardId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stickerUrl?: string;
  error?: string;
}

export const useStickerGeneration = () => {
  const [generationStatus, setGenerationStatus] = useState<Map<string, StickerGenerationStatus>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Queue a card for sticker generation
  const queueStickerGeneration = useCallback(async (card: VocabularyCard) => {
    // Skip if card already has a sticker
    if (card.aiImageUrl && card.aiImageUrl.includes('stickers')) {
      console.log(`Card ${card.word} already has a sticker`);
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Add to queue
      const jobId = await stickerQueue.addToQueue(card);
      
      // Update status
      setGenerationStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(card.id, {
          jobId,
          cardId: card.id,
          status: 'pending'
        });
        return newStatus;
      });
      
      // Poll for status updates
      pollJobStatus(jobId, card.id);
      
    } catch (error) {
      console.error('Error queuing sticker generation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  // Queue multiple cards
  const queueMultipleStickers = useCallback(async (cards: VocabularyCard[]) => {
    const cardsNeedingStickers = cards.filter(
      card => !card.aiImageUrl || !card.aiImageUrl.includes('stickers')
    );
    
    if (cardsNeedingStickers.length === 0) {
      console.log('All cards already have stickers');
      return;
    }
    
    console.log(`Queuing ${cardsNeedingStickers.length} cards for sticker generation`);
    
    for (const card of cardsNeedingStickers) {
      await queueStickerGeneration(card);
    }
  }, [queueStickerGeneration]);
  
  // Poll for job status updates
  const pollJobStatus = useCallback(async (jobId: string, cardId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setGenerationStatus(prev => {
          const newStatus = new Map(prev);
          newStatus.set(cardId, {
            jobId,
            cardId,
            status: 'failed',
            error: 'Timeout waiting for sticker generation'
          });
          return newStatus;
        });
        return;
      }
      
      const jobStatus = await stickerQueue.getJobStatus(jobId);
      
      if (!jobStatus) {
        attempts++;
        setTimeout(poll, 5000); // Check again in 5 seconds
        return;
      }
      
      // Update status
      setGenerationStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(cardId, {
          jobId,
          cardId,
          status: jobStatus.status,
          stickerUrl: jobStatus.stickerUrl,
          error: jobStatus.error
        });
        return newStatus;
      });
      
      // Continue polling if still processing
      if (jobStatus.status === 'pending' || jobStatus.status === 'processing') {
        attempts++;
        setTimeout(poll, 5000);
      }
    };
    
    poll();
  }, []);
  
  // Get status for a specific card
  const getCardStatus = useCallback((cardId: string): StickerGenerationStatus | undefined => {
    return generationStatus.get(cardId);
  }, [generationStatus]);
  
  // Clear completed/failed statuses
  const clearStatus = useCallback((cardId: string) => {
    setGenerationStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.delete(cardId);
      return newStatus;
    });
  }, []);
  
  return {
    queueStickerGeneration,
    queueMultipleStickers,
    getCardStatus,
    clearStatus,
    isGenerating,
    pendingCount: stickerQueue.getPendingCount()
  };
};