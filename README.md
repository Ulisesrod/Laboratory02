# Laboratory02
Second lab from ISW-521
Created by Ulises Rodriguez Navarro


2.1. La Ruta del Campeón
Objetivo Técnico: practicar el cruce de tres colecciones distintas (equipos, partidos y estadios) para construir una vista derivada que no existe como tal en la API.
Endpoints a Consumir: GET /get/teams, GET /get/games, GET /get/stadiums.
Funcionalidades Exigidas:
•	Un selector poblado con los 48 equipos obtenidos de /get/teams.
•	Al elegir un equipo, filtrar en /get/games todos los partidos donde su id coincida con home_team_id o away_team_id, ordenados por local_date.
•	Por cada partido filtrado, cruzar el campo stadium_id contra /get/stadiums para mostrar ciudad, país y aforo del recinto.
•	Renderizar el resultado como un itinerario de tarjetas (una por partido), no como una tabla plana.
•	Calcular y mostrar el número de ciudades distintas (city_en) que ese equipo visitaría según los partidos encontrados.
El Reto de Resiliencia: si la petición a /get/stadiums falla después de que el itinerario ya se renderizó con los partidos, las tarjetas existentes no deben desaparecer. El campo de estadio en cada tarjeta afectada debe mostrar "Estadio no disponible" y solo esa petición entra en backoff exponencial; los partidos ya obtenidos no se vuelven a pedir.

2.2. Rastreador de Goleadas
Objetivo Técnico: practicar filtrado y ordenamiento sobre un conjunto de datos numérico, separando la lógica de cálculo de la lógica de presentación.
Endpoints a Consumir: GET /get/games, GET /get/teams.
Funcionalidades Exigidas:
•	Tomar únicamente los partidos con finished: true.
•	Calcular la diferencia absoluta entre home_score y away_score para cada uno.
•	Filtrar los partidos con diferencia mayor o igual a 3 goles.
•	Ordenar la lista de mayor a menor diferencia.
•	Cruzar home_team_id y away_team_id contra /get/teams para mostrar nombre real y bandera, nunca el id crudo.
•	Mostrar en la cabecera el total de goleadas encontradas.
El Reto de Resiliencia: si /get/teams falla pero /get/games respondió correctamente, la lista de goleadas debe renderizarse igual, mostrando los ids de los equipos como respaldo temporal en lugar de bloquear toda la vista. La petición de equipos se reintenta en segundo plano con backoff, sin que el usuario tenga que recargar la página para ver los nombres reales una vez se recupere.

2.3. El Muro
Objetivo Técnico: practicar la combinación de datos agregados (/get/groups) con datos de detalle (/get/games) para construir un ranking compuesto.
Endpoints a Consumir: GET /get/groups, GET /get/teams, GET /get/games.
Funcionalidades Exigidas:
•	Recorrer los 12 grupos de /get/groups y extraer, de cada equipo dentro de teams, el team_id y su valor ga (goles en contra).
•	Unificar esos 48 registros en un solo arreglo y ordenarlo de forma ascendente por ga.
•	Tomar los 5 primeros y cruzarlos contra /get/teams para mostrar nombre y bandera.
•	Para cada uno de esos 5 equipos, buscar en /get/games su próximo partido con finished: false, ordenado por local_date, y mostrar contra qué equipo juega.
El Reto de Resiliencia: la búsqueda del próximo rival se evalúa equipo por equipo. Si esa búsqueda falla para uno solo de los 5 equipos del ranking, ese registro muestra "Próximo rival no disponible" mientras los otros 4 siguen mostrando su dato completo con normalidad.

2.4. Analítica de Estadios
Objetivo Técnico: practicar agregación de datos (conteos y sumas) cruzando un catálogo fijo de recintos contra un catálogo dinámico de partidos.
Endpoints a Consumir: GET /get/stadiums, GET /get/games.
Funcionalidades Exigidas:
•	Por cada uno de los 16 estadios, contar cuántos registros de /get/games tienen ese stadium_id.
•	Calcular una "asistencia potencial total" multiplicando capacity por el número de partidos albergados ahí.
•	Ordenar los estadios de mayor a menor asistencia potencial.
•	Renderizar una gráfica de barras comparando capacidad contra partidos albergados por estadio.
El Reto de Resiliencia: si los estadios se cargaron primero y la petición de partidos falla después, la gráfica debe entrar en un estado de "esperando datos de partidos" sin destruir las barras de estadios ya dibujadas. Solo la petición de partidos entra en backoff exponencial.

2.5. Radar de Empates
Objetivo Técnico: practicar filtrado condicional combinado con agrupación visual de resultados.
Endpoints a Consumir: GET /get/games, GET /get/teams.
Funcionalidades Exigidas:
•	Filtrar partidos donde home_score === away_score y finished === true.
•	Agrupar el resultado por group (A a L).
•	Renderizar una matriz visual donde cada celda representa un empate, mostrando los dos equipos cruzados contra /get/teams.
•	Mostrar un contador de empates por grupo.
El Reto de Resiliencia: si llega un 429 mientras se está construyendo la matriz grupo por grupo, el backoff exponencial se activa solo para la petición pendiente, mostrando el countdown correspondiente, mientras los grupos ya dibujados permanecen visibles. La interfaz debe informar visualmente (sin alert()) que está reintentando.
