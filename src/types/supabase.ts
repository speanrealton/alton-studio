// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          price_cents: number
          category: string
          creator_id: string
          file_url: string
          preview_image: string
          sales_count: number
          revenue_cents: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          price_cents: number
          category: string
          creator_id: string
          file_url: string
          preview_image: string
          sales_count?: number
          revenue_cents?: number
          active?: boolean
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          product_id: string
          buyer_id: string
          amount_cents: number
          status: string
          download_token: string
          created_at: string
        }
      }
    }
  }
}