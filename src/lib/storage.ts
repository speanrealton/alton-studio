// src/lib/storage.ts
// Storage utility that works both in Claude.ai and local development

interface StorageResult {
  key: string;
  value: string;
  shared: boolean;
}

class StorageAdapter {
  private isClaudeEnvironment(): boolean {
    return typeof window !== 'undefined' && 'storage' in window;
  }

  async get(key: string, shared: boolean = false): Promise<StorageResult | null> {
    if (this.isClaudeEnvironment()) {
      // Use Claude's storage API
      try {
        return await (window as any).storage.get(key, shared);
      } catch (error) {
        console.log('Key not found in Claude storage:', key);
        return null;
      }
    } else {
      // Fallback to localStorage for local development
      try {
        const value = localStorage.getItem(key);
        if (value === null) return null;
        return { key, value, shared };
      } catch (error) {
        console.error('localStorage error:', error);
        return null;
      }
    }
  }

  async set(key: string, value: string, shared: boolean = false): Promise<StorageResult | null> {
    if (this.isClaudeEnvironment()) {
      // Use Claude's storage API
      try {
        return await (window as any).storage.set(key, value, shared);
      } catch (error) {
        console.error('Claude storage error:', error);
        return null;
      }
    } else {
      // Fallback to localStorage for local development
      try {
        localStorage.setItem(key, value);
        return { key, value, shared };
      } catch (error) {
        if ((error as any).name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded, attempting cleanup...');
          // Try to free up space by removing thumbnails
          this.cleanupThumbnails();
          try {
            localStorage.setItem(key, value);
            return { key, value, shared };
          } catch (retryError) {
            console.error('localStorage still full after cleanup:', retryError);
            return null;
          }
        }
        console.error('localStorage error:', error);
        return null;
      }
    }
  }

  private cleanupThumbnails(): void {
    try {
      const designsData = localStorage.getItem('user-designs');
      if (!designsData) return;

      const designs = JSON.parse(designsData);
      if (!Array.isArray(designs)) return;

      // Remove thumbnails and keep only the 10 most recent designs
      const designsWithoutThumbnails = designs
        .sort((a: any, b: any) => 
          new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
        )
        .slice(0, 10)
        .map((design: any) => ({
          ...design,
          thumbnail: '' // Remove thumbnail to save space
        }));

      localStorage.setItem('user-designs', JSON.stringify(designsWithoutThumbnails));
      console.log(`Cleaned up designs: kept 10 most recent, removed thumbnails`);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }

  async delete(key: string, shared: boolean = false): Promise<{ key: string; deleted: boolean; shared: boolean } | null> {
    if (this.isClaudeEnvironment()) {
      // Use Claude's storage API
      try {
        return await (window as any).storage.delete(key, shared);
      } catch (error) {
        console.error('Claude storage error:', error);
        return null;
      }
    } else {
      // Fallback to localStorage for local development
      try {
        localStorage.removeItem(key);
        return { key, deleted: true, shared };
      } catch (error) {
        console.error('localStorage error:', error);
        return null;
      }
    }
  }

  async list(prefix?: string, shared: boolean = false): Promise<{ keys: string[]; prefix?: string; shared: boolean } | null> {
    if (this.isClaudeEnvironment()) {
      // Use Claude's storage API
      try {
        return await (window as any).storage.list(prefix, shared);
      } catch (error) {
        console.error('Claude storage error:', error);
        return null;
      }
    } else {
      // Fallback to localStorage for local development
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (!prefix || key.startsWith(prefix))) {
            keys.push(key);
          }
        }
        return { keys, prefix, shared };
      } catch (error) {
        console.error('localStorage error:', error);
        return null;
      }
    }
  }

  // Public method to clean up old designs
  async cleanupOldDesigns(maxDesigns: number = 20): Promise<boolean> {
    try {
      const designsData = await this.get('user-designs', false);
      if (!designsData) return false;

      const designs = JSON.parse(designsData.value);
      if (!Array.isArray(designs) || designs.length <= maxDesigns) {
        return true; // Already within limit
      }

      // Sort by lastModified and keep only the most recent ones
      const sortedDesigns = designs
        .sort((a: any, b: any) => 
          new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
        )
        .slice(0, maxDesigns);

      // Save cleaned up designs
      await this.set('user-designs', JSON.stringify(sortedDesigns), false);
      console.log(`Cleaned up old designs: kept ${sortedDesigns.length} most recent`);
      return true;
    } catch (error) {
      console.error('Error cleaning up old designs:', error);
      return false;
    }
  }
}

export const storage = new StorageAdapter();