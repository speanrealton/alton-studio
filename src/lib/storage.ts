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
          console.error('localStorage quota exceeded, attempting aggressive cleanup...');
          // Try cleanup multiple times
          this.cleanupThumbnails();
          
          // Wait a brief moment and retry
          return new Promise((resolve) => {
            setTimeout(() => {
              try {
                localStorage.setItem(key, value);
                resolve({ key, value, shared });
              } catch (retryError) {
                console.error('localStorage still full after cleanup, trying to save without full data');
                // If still failing, try to save only essential metadata
                if (key === 'user-designs' && typeof value === 'string') {
                  try {
                    const data = JSON.parse(value);
                    if (Array.isArray(data)) {
                      // Remove large fields before saving
                      const minimalData = data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        lastModified: item.lastModified
                      }));
                      localStorage.setItem(key, JSON.stringify(minimalData));
                      resolve({ key, value: JSON.stringify(minimalData), shared });
                    }
                  } catch (e) {
                    console.error('Failed to save minimal data:', e);
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              }
            }, 100);
          });
        }
        console.error('localStorage error:', error);
        return null;
      }
    }
  }

  private cleanupThumbnails(): void {
    try {
      // Remove ALL old/temporary data first
      const keysToRemove = [
        'collaboration-state', 
        'temp-canvas', 
        'chat-history', 
        'undo-history',
        'redo-history',
        'drawing-state',
        'page-state'
      ];
      for (const key of keysToRemove) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      }

      // Aggressively clean up designs
      const designsData = localStorage.getItem('user-designs');
      if (designsData) {
        try {
          const designs = JSON.parse(designsData);
          if (Array.isArray(designs)) {
            // Keep only 2 most recent designs - minimal metadata only
            const cleanedDesigns = designs
              .sort((a: any, b: any) => 
                new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
              )
              .slice(0, 2)
              .map((design: any) => ({
                id: design.id,
                name: design.name,
                lastModified: design.lastModified
              }));

            localStorage.setItem('user-designs', JSON.stringify(cleanedDesigns));
            console.log(`Cleaned up designs: kept 2 most recent, removed all large data`);
          }
        } catch (e) {
          console.error('Error parsing designs:', e);
          try {
            localStorage.removeItem('user-designs');
          } catch (removeError) {
            // Ignore
          }
        }
      }

      // Remove all cache-like keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp') || key.includes('draft'))) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore
          }
        }
      }

      console.log('Storage cleanup completed');
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