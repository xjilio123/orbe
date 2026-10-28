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
      diario: {
        Row: {
          animo: number | null
          creado: string
          fecha: string
          pagina_id: string | null
          user_id: string
        }
        Insert: {
          animo?: number | null
          creado?: string
          fecha: string
          pagina_id?: string | null
          user_id?: string
        }
        Update: {
          animo?: number | null
          creado?: string
          fecha?: string
          pagina_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_pagina_id_user_id_fkey"
            columns: ["pagina_id", "user_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      fechas_importantes: {
        Row: {
          color: string
          creado: string
          fecha: string
          icono: string
          id: string
          pagina_id: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          color?: string
          creado?: string
          fecha: string
          icono?: string
          id?: string
          pagina_id?: string | null
          titulo: string
          user_id?: string
        }
        Update: {
          color?: string
          creado?: string
          fecha?: string
          icono?: string
          id?: string
          pagina_id?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechas_importantes_pagina_fkey"
            columns: ["pagina_id", "user_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      habitos: {
        Row: {
          archivado: boolean
          color: string
          creado: string
          dias_semana: number
          icono: string
          id: string
          nombre: string
          orden: number
          user_id: string
        }
        Insert: {
          archivado?: boolean
          color?: string
          creado?: string
          dias_semana?: number
          icono?: string
          id?: string
          nombre: string
          orden?: number
          user_id?: string
        }
        Update: {
          archivado?: boolean
          color?: string
          creado?: string
          dias_semana?: number
          icono?: string
          id?: string
          nombre?: string
          orden?: number
          user_id?: string
        }
        Relationships: []
      }
      habitos_marcas: {
        Row: {
          creado: string
          fecha: string
          habito_id: string
          user_id: string
        }
        Insert: {
          creado?: string
          fecha: string
          habito_id: string
          user_id?: string
        }
        Update: {
          creado?: string
          fecha?: string
          habito_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habitos_marcas_habito_id_user_id_fkey"
            columns: ["habito_id", "user_id"]
            isOneToOne: false
            referencedRelation: "habitos"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ia_guardado: {
        Row: {
          clave: string
          creado: string
          datos: Json
          fecha: string
          user_id: string
        }
        Insert: {
          clave: string
          creado?: string
          datos: Json
          fecha: string
          user_id?: string
        }
        Update: {
          clave?: string
          creado?: string
          datos?: Json
          fecha?: string
          user_id?: string
        }
        Relationships: []
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
      metas: {
        Row: {
          actual: number
          anio: number
          color: string
          creado: string
          id: string
          lista_id: string | null
          objetivo: number | null
          orden: number
          tipo: string
          titulo: string
          unidad: string
          user_id: string
        }
        Insert: {
          actual?: number
          anio: number
          color?: string
          creado?: string
          id?: string
          lista_id?: string | null
          objetivo?: number | null
          orden?: number
          tipo?: string
          titulo: string
          unidad?: string
          user_id?: string
        }
        Update: {
          actual?: number
          anio?: number
          color?: string
          creado?: string
          id?: string
          lista_id?: string | null
          objetivo?: number | null
          orden?: number
          tipo?: string
          titulo?: string
          unidad?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_lista_id_user_id_fkey"
            columns: ["lista_id", "user_id"]
            isOneToOne: false
            referencedRelation: "listas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      paginas: {
        Row: {
          actualizado: string
          borrado_en: string | null
          busqueda: unknown
          contenido: Json
          creado: string
          curso: boolean
          enlaces: string[]
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
          curso?: boolean
          enlaces?: string[]
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
          curso?: boolean
          enlaces?: string[]
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
      sesiones_foco: {
        Row: {
          creado: string
          id: string
          inicio: string
          minutos: number
          tarea_id: string | null
          user_id: string
        }
        Insert: {
          creado?: string
          id?: string
          inicio: string
          minutos: number
          tarea_id?: string | null
          user_id?: string
        }
        Update: {
          creado?: string
          id?: string
          inicio?: string
          minutos?: number
          tarea_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_foco_tarea_id_user_id_fkey"
            columns: ["tarea_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id", "user_id"]
          },
        ]
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
          cuadrante: number | null
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
          cuadrante?: number | null
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
          cuadrante?: number | null
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
      vectores: {
        Row: {
          pagina_id: string
          texto: string
          trozo: number
          user_id: string
          vector: string
        }
        Insert: {
          pagina_id: string
          texto: string
          trozo: number
          user_id: string
          vector: string
        }
        Update: {
          pagina_id?: string
          texto?: string
          trozo?: number
          user_id?: string
          vector?: string
        }
        Relationships: []
      }
      vistas_guardadas: {
        Row: {
          config: Json
          creado: string
          id: string
          lista_id: string
          nombre: string
          user_id: string
        }
        Insert: {
          config?: Json
          creado?: string
          id?: string
          lista_id: string
          nombre: string
          user_id?: string
        }
        Update: {
          config?: Json
          creado?: string
          id?: string
          lista_id?: string
          nombre?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vistas_guardadas_lista_id_user_id_fkey"
            columns: ["lista_id", "user_id"]
            isOneToOne: false
            referencedRelation: "listas"
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
      mi_uso_ia: { Args: never; Returns: Json }
      reservar_ia: { Args: { p_funcion: string }; Returns: number }
      terminar_ia: { Args: { p_id: number; p_ok: boolean }; Returns: undefined }
      mis_enlaces: {
        Args: never
        Returns: {
          destino: string
          origen: string
        }[]
      }
      mis_estadisticas: {
        Args: { p_semanas?: number }
        Returns: {
          minutos: number
          semana: string
          tareas: number
        }[]
      }
      mis_habitos: {
        Args: { hoy: string }
        Returns: {
          color: string
          dias_semana: number
          hecho_hoy: boolean
          icono: string
          id: string
          marcas_semana: string[]
          nombre: string
          racha: number
        }[]
      }
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
      mis_metas: {
        Args: { p_anio: number }
        Returns: {
          actual: number
          color: string
          id: string
          lista: string
          lista_id: string
          objetivo: number
          tipo: string
          titulo: string
          unidad: string
        }[]
      }
      paginas_que_enlazan: {
        Args: { p_id: string }
        Returns: {
          icono: string
          id: string
          titulo: string
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
