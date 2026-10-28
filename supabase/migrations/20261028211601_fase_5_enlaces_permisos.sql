-- El índice paginas_titulo_normal_idx calcula private.normalizar_titulo(titulo) con los permisos de
-- quien guarda la página. Son funciones puras de texto (no leen tablas): se pueden ejecutar.
-- OJO: las migraciones que terminan con "revoke all on all functions in schema private" deben
-- volver a dar este permiso, o guardar páginas falla.
grant execute on function private.sin_tildes(text), private.normalizar_titulo(text) to authenticated;
