import { VocabularyCard } from '../../types/vocabulary';
import { generateStickerWithImagen, updateCardWithSticker } from './imagenApi';
import { supabase } from '../supabase';

export interface StickerJob {
  id: string;
  cardId: string;
  word: string;
  language: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  stickerUrl?: string;
}

// Queue for managing sticker generation jobs
class StickerGenerationQueue {
  private queue: StickerJob[] = [];
  private processing = false;
  private batchSize = 5; // Process 5 stickers at a time
  
  // Add a card to the generation queue
  async addToQueue(card: VocabularyCard): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: StickerJob = {
      id: jobId,
      cardId: card.id,
      word: card.word,
      language: card.language,
      category: card.category,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.queue.push(job);
    
    // Store job in database
    await this.saveJob(job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
    
    return jobId;
  }
  
  // Process jobs in the queue
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Get next batch of jobs
      const batch = this.queue
        .filter(job => job.status === 'pending')
        .slice(0, this.batchSize);
      
      if (batch.length === 0) {
        break;
      }
      
      // Process batch in parallel
      await Promise.all(batch.map(job => this.processJob(job)));
      
      // Remove completed/failed jobs from queue
      this.queue = this.queue.filter(
        job => job.status === 'pending' || job.status === 'processing'
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.processing = false;
  }
  
  // Process a single job
  private async processJob(job: StickerJob) {
    try {
      // Update job status
      job.status = 'processing';
      await this.updateJob(job);
      
      // Get full card data
      const { data: card, error: fetchError } = await supabase
        .from('vocabulary_cards')
        .select('*')
        .eq('id', job.cardId)
        .single();
      
      if (fetchError || !card) {
        throw new Error('Card not found');
      }
      
      // Convert to VocabularyCard type
      const vocabularyCard: VocabularyCard = {
        id: card.id,
        word: card.word,
        translation: card.translation || '',
        language: card.language_detected,
        difficulty: card.difficulty || 1,
        aiImageUrl: card.ai_image_url || '',
        aiPrompt: card.ai_prompt || '',
        pinId: card.wcache_id || '',
        rarity: 'common',
        category: job.category
      };
      
      // Generate sticker
      const result = await generateStickerWithImagen(vocabularyCard);
      
      if (result.success && result.stickerUrl) {
        // Update card with sticker URL
        await updateCardWithSticker(job.cardId, result.stickerUrl);
        
        // Update job as completed
        job.status = 'completed';
        job.completedAt = new Date();
        job.stickerUrl = result.stickerUrl;
      } else {
        // Update job as failed
        job.status = 'failed';
        job.error = result.error || 'Unknown error';
      }
      
      await this.updateJob(job);
      
    } catch (error) {
      console.error('Error processing sticker job:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJob(job);
    }
  }
  
  // Save job to database
  private async saveJob(job: StickerJob) {
    try {
      await supabase
        .from('sticker_generation_jobs')
        .insert({
          id: job.id,
          card_id: parseInt(job.cardId), // Convert to bigint
          word: job.word,
          language: job.language,
          category: job.category,
          status: job.status,
          created_at: job.createdAt.toISOString()
        });
    } catch (error) {
      console.error('Error saving job:', error);
    }
  }
  
  // Update job in database
  private async updateJob(job: StickerJob) {
    try {
      await supabase
        .from('sticker_generation_jobs')
        .update({
          status: job.status,
          completed_at: job.completedAt?.toISOString(),
          error: job.error,
          sticker_url: job.stickerUrl
        })
        .eq('id', job.id);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  }
  
  // Get job status
  async getJobStatus(jobId: string): Promise<StickerJob | null> {
    const job = this.queue.find(j => j.id === jobId);
    if (job) {
      return job;
    }
    
    // Check database
    const { data, error } = await supabase
      .from('sticker_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      cardId: data.card_id.toString(), // Convert bigint to string
      word: data.word,
      language: data.language,
      category: data.category,
      status: data.status,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      error: data.error,
      stickerUrl: data.sticker_url
    };
  }
  
  // Get pending jobs count
  getPendingCount(): number {
    return this.queue.filter(job => job.status === 'pending').length;
  }
}

// Singleton instance
export const stickerQueue = new StickerGenerationQueue();

// Check for new vocabulary words that need stickers
export const checkAndQueueNewWords = async () => {
  try {
    // Get cards without stickers
    const { data: cards, error } = await supabase
      .from('vocabulary_cards')
      .select('*')
      .or('ai_image_url.is.null,ai_image_url.eq.')
      .limit(50);
    
    if (error || !cards) {
      console.error('Error fetching cards without stickers:', error);
      return;
    }
    
    console.log(`Found ${cards.length} cards without stickers`);
    
    // Queue them for generation
    for (const card of cards) {
      const vocabularyCard: VocabularyCard = {
        id: card.id,
        word: card.word,
        translation: card.translation || '',
        language: card.language_detected,
        difficulty: card.difficulty || 1,
        aiImageUrl: '',
        aiPrompt: '',
        pinId: card.wcache_id || '',
        rarity: 'common',
        category: card.category || 'object'
      };
      
      await stickerQueue.addToQueue(vocabularyCard);
    }
    
  } catch (error) {
    console.error('Error checking for new words:', error);
  }
};