// Generado desde Supabase (generate_typescript_types). No editar a mano: se regenera tras cada migración.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      adjuntos: {
        Row: {
          creado: string
          id: string
          nombre: string
          pagina_id: string
          ruta: string
          tamano: number
          tipo: string
          user_id: string
        }
        Insert: {
          creado?: string
          id?: string
          nombre?: string
          pagina_id: string
          ruta: string
          tamano: number
          tipo: string
          user_id?: string
        }
        Update: {
          creado?: string
          id?: string
          nombre?: string
          pagina_id?: string
          ruta?: string
          tamano?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjuntos_pagina_id_user_id_fkey"
            columns: ["pagina_id", "user_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      listas: {
        Row: {
          color: string
          creado: string
          id: string
          nombre: string
          orden: number
          user_id: string
        }
        Insert: {
          color?: string
          creado?: string
          id?: string
          nombre: string
          orden?: number
          user_id?: string
        }
        Update: {
          color?: string
          creado?: string
          id?: string
          nombre?: string
          orden?: number
          user_id?: string
        }
        Relationships: []
      }
      paginas: {
        Row: {
          actualizado: string
          borrado_en: string | null
          busqueda: unknown
          contenido: Json
          creado: string
          favorita: boolean
          icono: string
          id: string
          padre_id: string | null
          plantilla: boolean
          titulo: string
          user_id: string
        }
        Insert: {
          actualizado?: string
          borrado_en?: string | null
          busqueda?: unknown
          contenido?: Json
          creado?: string
          favorita?: boolean
          icono?: string
          id?: string
          padre_id?: string | null
          plantilla?: boolean
          titulo?: string
          user_id?: string
        }
        Update: {
          actualizado?: string
          borrado_en?: string | null
          busqueda?: unknown
          contenido?: Json
          creado?: string
          favorita?: boolean
          icono?: string
          id?: string
          padre_id?: string | null
          plantilla?: boolean
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paginas_padre_id_user_id_fkey"
            columns: ["padre_id", "user_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado: string
          calendario_ics: string | null
          creado: string
          id: string
          nombre: string
          ultima_prueba_push: string | null
          zona_horaria: string
        }
        Insert: {
          actualizado?: string
          calendario_ics?: string | null
          creado?: string
          id: string
          nombre?: string
          ultima_prueba_push?: string | null
          zona_horaria?: string
        }
        Update: {
          actualizado?: string
          calendario_ics?: string | null
          creado?: string
          id?: string
          nombre?: string
          ultima_prueba_push?: string | null
          zona_horaria?: string
        }
        Relationships: []
      }
      suscripciones_push: {
        Row: {
          auth: string
          creado: string
          dispositivo: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          creado?: string
          dispositivo?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          creado?: string
          dispositivo?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      tareas: {
        Row: {
          actualizado: string
          avisado_en: string | null
          avisar_en: string | null
          borrado_en: string | null
          busqueda: unknown
          aviso: number | null
          creado: string
          estado: string
          fecha: string | null
          hecha_en: string | null
          hora: string | null
          id: string
          lista_id: string | null
          notas: string
          orden: number
          padre_id: string | null
          prioridad: number
          repetir: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          actualizado?: string
          avisado_en?: string | null
          avisar_en?: string | null
          borrado_en?: string | null
          busqueda?: unknown
          aviso?: number | null
          creado?: string
          estado?: string
          fecha?: string | null
          hecha_en?: string | null
          hora?: string | null
          id?: string
          lista_id?: string | null
          notas?: string
          orden?: number
          padre_id?: string | null
          prioridad?: number
          repetir?: string | null
          titulo: string
          user_id?: string
        }
        Update: {
          actualizado?: string
          avisado_en?: string | null
          avisar_en?: string | null
          borrado_en?: string | null
          busqueda?: unknown
          aviso?: number | null
          creado?: string
          estado?: string
          fecha?: string | null
          hecha_en?: string | null
          hora?: string | null
          id?: string
          lista_id?: string | null
          notas?: string
          orden?: number
          padre_id?: string | null
          prioridad?: number
          repetir?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_lista_id_user_id_fkey"
            columns: ["lista_id", "user_id"]
            isOneToOne: false
            referencedRelation: "listas"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tareas_padre_id_user_id_fkey"
            columns: ["padre_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      versiones_pagina: {
        Row: {
          contenido: Json
          creado: string
          hueco: number
          icono: string
          pagina_id: string
          titulo: string
          user_id: string
        }
        Insert: {
          contenido: Json
          creado?: string
          hueco: number
          icono: string
          pagina_id: string
          titulo: string
          user_id: string
        }
        Update: {
          contenido?: Json
          creado?: string
          hueco?: number
          icono?: string
          pagina_id?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar: {
        Args: { consulta: string }
        Returns: {
          detalle: string
          icono: string
          id: string
          rango: number
          tipo: string
          titulo: string
        }[]
      }
      clave_publica_push: { Args: never; Returns: string }
      invitar: { Args: { p_email: string }; Returns: undefined }
      mis_invitados: {
        Args: never
        Returns: {
          activo: boolean
          creado: string
          email: string
          registrado: boolean
        }[]
      }
      quitar_invitado: { Args: { p_email: string }; Returns: undefined }
      soy_admin: { Args: never; Returns: boolean }
      guardar_suscripcion_push: {
        Args: {
          p_auth: string
          p_dispositivo: string
          p_endpoint: string
          p_p256dh: string
        }
        Returns: undefined
      }
      mi_espacio: {
        Args: never
        Returns: {
          archivos: number
          archivos_max: number
          texto: number
          texto_max: number
        }[]
      }
      probar_avisos: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
