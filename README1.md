# Elemento 09 – Causas de muerte en México por entidad


Visualización web interactiva que presenta las principales causas de muerte en México por entidad federativa. El sitio muestra un mapa de México con estados seleccionables y, al elegir uno, actualiza un panel con el total de muertes, el top 5 de causas y la distribución por género.

## Demo



## Capturas

![alt text](image1.png)
![alt text](image2.png)


## Qué incluye
- Mapa de México con entidades clicables.
- Panel con nombre de la entidad y total de muertes.
- Top 5 de causas con cantidades y barras horizontales proporcionales.
- Distribución por género con cifras, porcentajes y barras verticales.

## Estructura del proyecto
- `ele09.html`: estructura principal y SVG del mapa con los elementos del panel.
- `ele09.css`: estilos de maquetación y visuales.
- `ele09.js`: lógica de interacción, carga de datos y animaciones.
- `datos.json`: dataset con causas, totales y género por entidad.
- `favicon.svg`: ícono del sitio.

## Tecnologías
- HTML
- CSS
- JavaScript

## Cómo usarlo
1. Abre `ele09.html` en un navegador.
2. Haz clic en una entidad del mapa para ver sus datos.

## Datos
La visualización utiliza las Estadísticas de Defunciones Registradas (EDR) 2023 del INEGI como fuente base.

## Créditos
- Fuente de datos: INEGI (EDR 2023).
- Diseño y desarrollo: Milton Herrera
