# Rojas Impresiones · Mostrador

Aplicación React para Puesto 1, Puesto 2 y Caja. Los pedidos se centralizan en Google Sheets mediante Google Apps Script; `localStorage` se usa solamente para recordar el puesto de cada computadora.

## Arquitectura

`React → Google Apps Script Web App → Google Sheets`

El frontend consulta la API cada 5 segundos sin recargar la página. La URL y el intervalo están centralizados en `src/config/config.ts`. Mientras la URL conserve el texto `PEGAR_AQUI_URL_GOOGLE_APPS_SCRIPT`, la aplicación funciona en modo demostración con datos en memoria.

## Configurar Google Sheets

1. Creá una planilla de Google vacía.
2. Abrí **Extensiones → Apps Script** y reemplazá el contenido por `google-apps-script/Code.gs`.
3. Ejecutá una vez `configurarHojas` desde el editor y autorizá el acceso. Esto crea automáticamente `PEDIDOS_MOSTRADOR` y `HISTORIAL_OPERACIONES` con todas sus columnas.
4. Elegí **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: vos. Acceso: cualquier usuario con el enlace.
5. Copiá la URL terminada en `/exec` y pegala en `src/config/config.ts` como valor de `GOOGLE_SHEETS_API_URL`.

## Ejecutar

```bash
npm install
npm run dev
```

Abrí la URL local en cada computadora. En el primer ingreso elegí `Puesto 1`, `Puesto 2` o `Caja`. La opción **Cambiar puesto** permite reconfigurarla.
