export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number;
          user_id: string | null;
          action: string | null;
          table_name: string | null;
          record_id: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action?: string | null;
          table_name?: string | null;
          record_id?: number | null;
          description?: string | null;
        };
        Update: {
          user_id?: string | null;
          action?: string | null;
          table_name?: string | null;
          record_id?: number | null;
          description?: string | null;
        };
      };
      commissions: {
        Row: {
          id: number;
          sale_id: number;
          percent?: number | null;
          amount?: number | null;
          created_at: string;
        };
        Insert: {
          sale_id: number;
          percent?: number | null;
          amount?: number | null;
        };
        Update: {
          sale_id?: number;
          percent?: number | null;
          amount?: number | null;
        };
      };
      crop_sales: {
        Row: {
          id: number;
          farmer_id: number;
          sold_to?: string | null;
          total_value?: number | null;
          commission_percent?: number | null;
          commission_amount?: number | null;
          net_payable?: number | null;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          farmer_id: number;
          sold_to?: string | null;
          total_value?: number | null;
          commission_percent?: number | null;
          date?: string;
          created_by?: string | null;
        };
        Update: {
          farmer_id?: number;
          sold_to?: string | null;
          total_value?: number | null;
          commission_percent?: number | null;
          date?: string;
          created_by?: string | null;
        };
      };
      farmers: {
        Row: {
          id: number;
          name: string;
          father_name?: string | null;
          address?: string | null;
          phone_number?: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          father_name?: string | null;
          address?: string | null;
          phone_number?: string | null;
        };
        Update: {
          name?: string;
          father_name?: string | null;
          address?: string | null;
          phone_number?: string | null;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          unit?: string | null;
          rate?: number | null;
          created_at: string;
        };
        Insert: {
          name: string;
          unit?: string | null;
          rate?: number | null;
        };
        Update: {
          name?: string;
          unit?: string | null;
          rate?: number | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role_id: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role_id?: number | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role_id?: number | null;
        };
      };
      purchase_items: {
        Row: {
          id: number;
          purchase_id: number;
          product_id: number | null;
          quantity?: number | null;
          rate?: number | null;
          total?: number | null;
        };
        Insert: {
          purchase_id: number;
          product_id?: number | null;
          quantity?: number | null;
          rate?: number | null;
        };
        Update: {
          purchase_id?: number;
          product_id?: number | null;
          quantity?: number | null;
          rate?: number | null;
        };
      };
      purchases: {
        Row: {
          id: number;
          farmer_id: number;
          payment_type?: string | null;
          total_amount?: number | null;
          date: string;
          receipt_path?: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          farmer_id: number;
          payment_type?: string | null;
          total_amount?: number | null;
          date?: string;
          receipt_path?: string | null;
          created_by?: string | null;
        };
        Update: {
          farmer_id?: number;
          payment_type?: string | null;
          total_amount?: number | null;
          date?: string;
          receipt_path?: string | null;
          created_by?: string | null;
        };
      };
      roles: {
        Row: {
          id: number;
          role_name: string;
          created_at: string;
        };
        Insert: {
          role_name: string;
        };
        Update: {
          role_name?: string;
        };
      };
      transactions: {
        Row: {
          id: number;
          farmer_id: number;
          type: string;
          amount: number;
          description?: string | null;
          date: string;
          related_purchase?: number | null;
          related_sale?: number | null;
          created_at: string;
        };
        Insert: {
          farmer_id: number;
          type: string;
          amount: number;
          description?: string | null;
          date?: string;
          related_purchase?: number | null;
          related_sale?: number | null;
        };
        Update: {
          farmer_id?: number;
          type?: string;
          amount?: number;
          description?: string | null;
          date?: string;
          related_purchase?: number | null;
          related_sale?: number | null;
        };
      };
    };
    Views: {
      farmer_balances: {
        Row: {
          farmer_id: number;
          farmer_name: string;
          total_debit: number;
          total_credit: number;
          balance: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
