// Generated from the Supabase schema (project lxjzfyavgiilgjgpcqbb).
// Regenerate after schema changes — keep in sync with supabase/migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          actor: string | null
          actor_label: string | null
          created_at: string
          id: string
          internal_note: string | null
          message: string
          parent_id: string | null
          student_id: string | null
          type: string
        }
        Insert: {
          actor?: string | null
          actor_label?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          message: string
          parent_id?: string | null
          student_id?: string | null
          type: string
        }
        Update: {
          actor?: string | null
          actor_label?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          message?: string
          parent_id?: string | null
          student_id?: string | null
          type?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          emel: string | null
          id: string
          nama: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emel?: string | null
          id: string
          nama: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emel?: string | null
          id?: string
          nama?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      announcement_comments: {
        Row: {
          announcement_id: string
          author_id: string | null
          author_name: string | null
          author_type: Database["public"]["Enums"]["comment_author"]
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
        }
        Insert: {
          announcement_id: string
          author_id?: string | null
          author_name?: string | null
          author_type: Database["public"]["Enums"]["comment_author"]
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
        }
        Update: {
          announcement_id?: string
          author_id?: string | null
          author_name?: string | null
          author_type?: Database["public"]["Enums"]["comment_author"]
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string | null
          created_at: string
          created_by: string | null
          cta_type: Database["public"]["Enums"]["announcement_cta"] | null
          id: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_type?: Database["public"]["Enums"]["announcement_cta"] | null
          id?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta_type?: Database["public"]["Enums"]["announcement_cta"] | null
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: { key: string; updated_at: string; value: Json }
        Insert: { key: string; updated_at?: string; value: Json }
        Update: { key?: string; updated_at?: string; value?: Json }
        Relationships: []
      }
      bank_soalan_files: {
        Row: {
          created_at: string
          created_by: string | null
          file_size: number | null
          file_url: string | null
          folder_id: string
          id: string
          mime_type: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_id: string
          id?: string
          mime_type?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          title?: string
        }
        Relationships: []
      }
      bank_soalan_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          sort_order: number
          tingkatan: Database["public"]["Enums"]["tingkatan"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          sort_order?: number
          tingkatan: Database["public"]["Enums"]["tingkatan"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          sort_order?: number
          tingkatan?: Database["public"]["Enums"]["tingkatan"]
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          created_by: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          target: Database["public"]["Enums"]["target_tingkatan"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          target?: Database["public"]["Enums"]["target_tingkatan"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          target?: Database["public"]["Enums"]["target_tingkatan"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          baca: boolean
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at: string
          id: string
          message: string | null
          parent_id: string | null
          provider_response: Json | null
          status: Database["public"]["Enums"]["notif_status"]
          student_id: string | null
          type: string
        }
        Insert: {
          baca?: boolean
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          message?: string | null
          parent_id?: string | null
          provider_response?: Json | null
          status?: Database["public"]["Enums"]["notif_status"]
          student_id?: string | null
          type: string
        }
        Update: {
          baca?: boolean
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          message?: string | null
          parent_id?: string | null
          provider_response?: Json | null
          status?: Database["public"]["Enums"]["notif_status"]
          student_id?: string | null
          type?: string
        }
        Relationships: []
      }
      package_change_requests: {
        Row: {
          code: string
          created_at: string
          dari_pakej: Database["public"]["Enums"]["pakej"]
          id: string
          ke_pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          dari_pakej: Database["public"]["Enums"]["pakej"]
          id?: string
          ke_pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          status?: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Update: {
          code?: string
          created_at?: string
          dari_pakej?: Database["public"]["Enums"]["pakej"]
          id?: string
          ke_pakej?: Database["public"]["Enums"]["pakej"]
          parent_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          auth_user_id: string | null
          code: string
          created_at: string
          duplicate_parent_id: string | null
          emel: string | null
          id: string
          lokasi: string | null
          marketing_opt_in: boolean
          nama: string
          tarikh_daftar: string
          telefon: string | null
          updated_at: string
          username_display: string | null
        }
        Insert: {
          auth_user_id?: string | null
          code?: string
          created_at?: string
          duplicate_parent_id?: string | null
          emel?: string | null
          id?: string
          lokasi?: string | null
          marketing_opt_in?: boolean
          nama: string
          tarikh_daftar?: string
          telefon?: string | null
          updated_at?: string
          username_display?: string | null
        }
        Update: {
          auth_user_id?: string | null
          code?: string
          created_at?: string
          duplicate_parent_id?: string | null
          emel?: string | null
          id?: string
          lokasi?: string | null
          marketing_opt_in?: boolean
          nama?: string
          tarikh_daftar?: string
          telefon?: string | null
          updated_at?: string
          username_display?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          code: string
          created_at: string
          id: string
          jumlah: number
          pakej: Database["public"]["Enums"]["pakej"] | null
          parent_id: string
          ref: string | null
          refunded_by_refund_id: string | null
          resit_url: string | null
          saluran: Database["public"]["Enums"]["saluran_bayaran"] | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string | null
          tarikh: string
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          jumlah: number
          pakej?: Database["public"]["Enums"]["pakej"] | null
          parent_id: string
          ref?: string | null
          refunded_by_refund_id?: string | null
          resit_url?: string | null
          saluran?: Database["public"]["Enums"]["saluran_bayaran"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          tarikh?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          jumlah?: number
          pakej?: Database["public"]["Enums"]["pakej"] | null
          parent_id?: string
          ref?: string | null
          refunded_by_refund_id?: string | null
          resit_url?: string | null
          saluran?: Database["public"]["Enums"]["saluran_bayaran"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          tarikh?: string
        }
        Relationships: []
      }
      profile_change_requests: {
        Row: {
          code: string
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          parent_id: string
          requested_by: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          parent_id: string
          requested_by?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          parent_id?: string
          requested_by?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          target: Database["public"]["Enums"]["target_tingkatan"]
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          target?: Database["public"]["Enums"]["target_tingkatan"]
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          target?: Database["public"]["Enums"]["target_tingkatan"]
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          akaun: string | null
          code: string
          completed_at: string | null
          created_at: string
          id: string
          jumlah: number
          kaedah: Database["public"]["Enums"]["refund_kaedah"]
          notified: boolean
          parent_id: string
          payment_id: string | null
          processed_by: string | null
          qr_url: string | null
          requested_by: string | null
          resit_refund_url: string | null
          sebab: string | null
          status: Database["public"]["Enums"]["refund_status"]
          student_id: string | null
        }
        Insert: {
          akaun?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          jumlah: number
          kaedah: Database["public"]["Enums"]["refund_kaedah"]
          notified?: boolean
          parent_id: string
          payment_id?: string | null
          processed_by?: string | null
          qr_url?: string | null
          requested_by?: string | null
          resit_refund_url?: string | null
          sebab?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          student_id?: string | null
        }
        Update: {
          akaun?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          jumlah?: number
          kaedah?: Database["public"]["Enums"]["refund_kaedah"]
          notified?: boolean
          parent_id?: string
          payment_id?: string | null
          processed_by?: string | null
          qr_url?: string | null
          requested_by?: string | null
          resit_refund_url?: string | null
          sebab?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          student_id?: string | null
        }
        Relationships: []
      }
      renewal_requests: {
        Row: {
          code: string
          created_at: string
          id: string
          jumlah: number
          lulus_masa: string | null
          lulus_oleh: string | null
          pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          resit_url: string | null
          sebab_tolak: string | null
          status: Database["public"]["Enums"]["renewal_status"]
          student_id: string
          sumber: Database["public"]["Enums"]["renewal_sumber"]
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          jumlah: number
          lulus_masa?: string | null
          lulus_oleh?: string | null
          pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          resit_url?: string | null
          sebab_tolak?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          student_id: string
          sumber?: Database["public"]["Enums"]["renewal_sumber"]
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          jumlah?: number
          lulus_masa?: string | null
          lulus_oleh?: string | null
          pakej?: Database["public"]["Enums"]["pakej"]
          parent_id?: string
          resit_url?: string | null
          sebab_tolak?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          student_id?: string
          sumber?: Database["public"]["Enums"]["renewal_sumber"]
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          permission: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          allowed?: boolean
          permission: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          allowed?: boolean
          permission?: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      student_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          student_id: string | null
          telefon: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          student_id?: string | null
          telefon: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          student_id?: string | null
          telefon?: string
        }
        Relationships: []
      }
      student_reports: {
        Row: {
          bulan: string
          created_at: string
          created_by: string | null
          guru: string | null
          id: string
          ringkasan: string | null
          tarikh_publish: string
          tingkatan: Database["public"]["Enums"]["tingkatan"]
        }
        Insert: {
          bulan: string
          created_at?: string
          created_by?: string | null
          guru?: string | null
          id?: string
          ringkasan?: string | null
          tarikh_publish?: string
          tingkatan: Database["public"]["Enums"]["tingkatan"]
        }
        Update: {
          bulan?: string
          created_at?: string
          created_by?: string | null
          guru?: string | null
          id?: string
          ringkasan?: string | null
          tarikh_publish?: string
          tingkatan?: Database["public"]["Enums"]["tingkatan"]
        }
        Relationships: []
      }
      students: {
        Row: {
          aktif: boolean
          block_reason: string | null
          code: string
          created_at: string
          id: string
          nama: string
          pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          saluran_bayaran: Database["public"]["Enums"]["saluran_bayaran"] | null
          tarikh_mula: string | null
          tarikh_tamat: string | null
          telefon: string | null
          tingkatan: Database["public"]["Enums"]["tingkatan"]
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          block_reason?: string | null
          code?: string
          created_at?: string
          id?: string
          nama: string
          pakej: Database["public"]["Enums"]["pakej"]
          parent_id: string
          saluran_bayaran?: Database["public"]["Enums"]["saluran_bayaran"] | null
          tarikh_mula?: string | null
          tarikh_tamat?: string | null
          telefon?: string | null
          tingkatan: Database["public"]["Enums"]["tingkatan"]
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          block_reason?: string | null
          code?: string
          created_at?: string
          id?: string
          nama?: string
          pakej?: Database["public"]["Enums"]["pakej"]
          parent_id?: string
          saluran_bayaran?: Database["public"]["Enums"]["saluran_bayaran"] | null
          tarikh_mula?: string | null
          tarikh_tamat?: string | null
          telefon?: string | null
          tingkatan?: Database["public"]["Enums"]["tingkatan"]
          updated_at?: string
        }
        Relationships: []
      }
      waba_blasts: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          schedule_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["waba_blast_status"]
          template_id: string | null
        }
        Insert: {
          audience: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          schedule_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["waba_blast_status"]
          template_id?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          schedule_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["waba_blast_status"]
          template_id?: string | null
        }
        Relationships: []
      }
      waba_devices: {
        Row: {
          created_at: string
          daily_quota: number | null
          id: string
          name: string
          phone_number: string | null
          quality_rating: string | null
          status: Database["public"]["Enums"]["waba_device_status"]
        }
        Insert: {
          created_at?: string
          daily_quota?: number | null
          id?: string
          name: string
          phone_number?: string | null
          quality_rating?: string | null
          status?: Database["public"]["Enums"]["waba_device_status"]
        }
        Update: {
          created_at?: string
          daily_quota?: number | null
          id?: string
          name?: string
          phone_number?: string | null
          quality_rating?: string | null
          status?: Database["public"]["Enums"]["waba_device_status"]
        }
        Relationships: []
      }
      waba_messages: {
        Row: {
          baca: boolean
          body: string | null
          created_at: string
          direction: Database["public"]["Enums"]["waba_msg_direction"]
          id: string
          parent_id: string | null
          status: string | null
          template_id: string | null
          wa_message_id: string | null
        }
        Insert: {
          baca?: boolean
          body?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["waba_msg_direction"]
          id?: string
          parent_id?: string | null
          status?: string | null
          template_id?: string | null
          wa_message_id?: string | null
        }
        Update: {
          baca?: boolean
          body?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["waba_msg_direction"]
          id?: string
          parent_id?: string | null
          status?: string | null
          template_id?: string | null
          wa_message_id?: string | null
        }
        Relationships: []
      }
      waba_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["waba_template_category"]
          created_at: string
          id: string
          language: string
          meta_template_id: string | null
          name: string
          rejection_note: string | null
          status: Database["public"]["Enums"]["waba_template_status"]
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["waba_template_category"]
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["waba_template_status"]
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["waba_template_category"]
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["waba_template_status"]
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      zoom_links: {
        Row: {
          tingkatan: Database["public"]["Enums"]["tingkatan"]
          updated_at: string
          url: string | null
        }
        Insert: {
          tingkatan: Database["public"]["Enums"]["tingkatan"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          tingkatan?: Database["public"]["Enums"]["tingkatan"]
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      students_admin: {
        Row: {
          aktif: boolean | null
          code: string | null
          created_at: string | null
          days_left: number | null
          id: string | null
          nama: string | null
          pakej: Database["public"]["Enums"]["pakej"] | null
          parent_code: string | null
          parent_emel: string | null
          parent_id: string | null
          parent_nama: string | null
          parent_telefon: string | null
          saluran_bayaran: Database["public"]["Enums"]["saluran_bayaran"] | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tarikh_mula: string | null
          tarikh_tamat: string | null
          telefon: string | null
          tingkatan: Database["public"]["Enums"]["tingkatan"] | null
        }
        Relationships: []
      }
      students_with_status: {
        Row: {
          aktif: boolean | null
          block_reason: string | null
          code: string | null
          created_at: string | null
          days_left: number | null
          id: string | null
          nama: string | null
          pakej: Database["public"]["Enums"]["pakej"] | null
          parent_id: string | null
          saluran_bayaran: Database["public"]["Enums"]["saluran_bayaran"] | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tarikh_mula: string | null
          tarikh_tamat: string | null
          telefon: string | null
          tingkatan: Database["public"]["Enums"]["tingkatan"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calc_expiry: {
        Args: { p_pakej: Database["public"]["Enums"]["pakej"]; p_start: string }
        Returns: string
      }
      current_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      current_parent_id: { Args: Record<PropertyKey, never>; Returns: string }
      has_permission: { Args: { perm: string }; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
      package_months: {
        Args: { p_pakej: Database["public"]["Enums"]["pakej"] }
        Returns: number
      }
      package_price: {
        Args: {
          p_pakej: Database["public"]["Enums"]["pakej"]
          p_tingkatan: Database["public"]["Enums"]["tingkatan"]
        }
        Returns: number
      }
      student_status: {
        Args: { p_aktif: boolean; p_tarikh_tamat: string }
        Returns: Database["public"]["Enums"]["subscription_status"]
      }
    }
    Enums: {
      admin_role: "Pemilik" | "Pembantu" | "Finance"
      announcement_audience: "Semua" | "T4" | "T5"
      announcement_cta: "zoom" | "bahan" | "rakaman" | "bank"
      comment_author: "parent" | "student" | "admin"
      notif_channel: "Portal" | "Email" | "WhatsApp"
      notif_status: "Berjaya" | "Gagal" | "Menunggu"
      pakej: "Bulanan" | "3 Bulan" | "6 Bulan"
      payment_status: "Berjaya" | "Menunggu" | "Ditolak" | "Refunded"
      refund_kaedah: "Akaun bank" | "QR DuitNow"
      refund_status: "Dimohon" | "Selesai"
      renewal_status: "Menunggu" | "Diluluskan" | "Ditolak"
      renewal_sumber: "Portal" | "BayarCash" | "Manual"
      request_status: "Baharu" | "Selesai" | "Ditolak"
      saluran_bayaran: "BCL" | "BayarCash" | "Manual" | "Pindahan Bank"
      subscription_status: "Aktif" | "Akan Tamat" | "Tamat" | "Disekat"
      target_tingkatan: "T4" | "T5" | "Kedua-dua"
      tingkatan: "T4" | "T5" | "T4&5"
      waba_blast_status: "Scheduled" | "Sending" | "Completed" | "Failed"
      waba_device_status: "connected" | "disconnected"
      waba_msg_direction: "in" | "out"
      waba_template_category: "Utility" | "Marketing" | "Authentication"
      waba_template_status: "Draft" | "Pending" | "Approved" | "Rejected"
    }
    CompositeTypes: Record<PropertyKey, never>
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
