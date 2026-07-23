"use strict";

/* ──────────────────────────────────────────────────────
   UTILIDADES
────────────────────────────────────────────────────── */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cacheKey(url) {
    return `cache:${url}`;
}

/* Indicador de datos cacheados */
function showOfflineBanner() {

    let banner = document.getElementById("offlineBanner");

    if (!banner) {

        banner = document.createElement("div");
        banner.id = "offlineBanner";

        banner.style.background = "#ffcc00";
        banner.style.color = "#000";
        banner.style.padding = "12px";
        banner.style.fontWeight = "bold";
        banner.style.textAlign = "center";
        document.body.prepend(banner);

    }

    banner.textContent =
        "Mostrando datos almacenados (pueden estar desactualizados).";

}

function hideOfflineBanner() {

    const banner = document.getElementById("offlineBanner");

    if (banner) banner.remove();

}

/* Countdown para 429 */

async function showCountdown(seconds) {

    let box = document.getElementById("retryCountdown");

    if (!box) {

        box = document.createElement("div");

        box.id = "retryCountdown";

        box.style.background = "#ff9800";
        box.style.color = "white";
        box.style.padding = "12px";
        box.style.textAlign = "center";

        document.body.prepend(box);

    }

    for (let i = seconds; i > 0; i--) {

        box.textContent =
            `Demasiadas solicitudes. Reintentando en ${i} segundos...`;
        await sleep(1000);
    }

    box.remove();

}

/* ──────────────────────────────────────────────────────
   CONFIGURACIÓN
────────────────────────────────────────────────────── */
const BASE = "http://worldcup26.ir";

/* ──────────────────────────────────────────────────────
   ESTADOS
────────────────────────────────────────────────────── */
const stateT = {
    teams: []
};

const stateG = {
    games: []
};

const stateS = {
    stadiums: []
};

const stateGr = {
    groups: []
};

/* ──────────────────────────────────────────────────────
   SELECTORES DOM
────────────────────────────────────────────────────── */
const teamSelect = document.getElementById("teamSelect");
const gameSelect = document.getElementById("juegos");
const goleadas = document.getElementById("goleadas");
const btnGoleadas = document.getElementById("btnGoleadas");
const elMuro = document.getElementById("elmuro");
const btnelmuro = document.getElementById("btnelmuro");

/* ──────────────────────────────────────────────────────
   CARGA DE DATOS
────────────────────────────────────────────────────── */
async function init(urlGet, state, property) {

    try {

        const json = await fetchTry(urlGet);

        state[property] = json[property];

    } catch (error) {

        console.error(error);

    }

}

async function fetchTry(urlGet) {
    const token = localStorage.getItem("token");

    for (let attempt = 0; attempt <= 4; attempt++) {
        try {

            const response = await fetch(`${BASE}${urlGet}`);
            if (
                response.status === 500 ||
                response.status === 429
            ) {

                if (attempt === 4) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }

                const delay = Math.pow(2, attempt);

                if (response.status === 429) {

                    await showCountdown(delay);

                } else {

                    await sleep(delay * 1000);

                }

                continue;

            }

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }

            const json = await response.json();

            localStorage.setItem(
                cacheKey(urlGet),
                JSON.stringify(json)
            );

            hideOfflineBanner();

            return json;

        } catch (error) {

            const cached = localStorage.getItem(
                cacheKey(urlGet)
            );

            if (cached) {

                showOfflineBanner();

                return JSON.parse(cached);

            }

            throw error;

        }

    }


}

/* ──────────────────────────────────────────────────────
   CARGA INICIAL
────────────────────────────────────────────────────── */
async function start() {

    teamSelect.disabled = true;
    gameSelect.disabled = true;

    await Promise.all([
        init("/get/teams", stateT, "teams"),
        init("/get/games", stateG, "games"),
        init("/get/stadiums", stateS, "stadiums"),
        init("/get/groups", stateGr, "groups"),

    ]);

    populateTeamSelector();

    addEventToTeamSelect();

    teamSelect.disabled = false;

}

start();

/* ──────────────────────────────────────────────────────
   LLENA EL SELECT DE EQUIPOS
────────────────────────────────────────────────────── */
function populateTeamSelector() {

    const sortedTeamList = [...stateT.teams].sort((a, b) =>
        (a.name_en ?? "").localeCompare(b.name_en ?? "")
    );

    teamSelect.innerHTML =
        `<option value="">— Selecciona un equipo (${sortedTeamList.length}) —</option>`;

    sortedTeamList.forEach(team => {

        const option = document.createElement("option");

        option.value = team.id;
        option.textContent = team.name_en;

        teamSelect.appendChild(option);

    });

}

/* ──────────────────────────────────────────────────────
   EVENTO DEL SELECT DE EQUIPOS
────────────────────────────────────────────────────── */
function addEventToTeamSelect() {

    teamSelect.addEventListener("change", onTeamChange);

}

/* ──────────────────────────────────────────────────────
   CAMBIO DE EQUIPO
────────────────────────────────────────────────────── */
function onTeamChange() {

    const tid = Number(teamSelect.value);
    // Limpiar tarjetas anteriores
    juegos.innerHTML = "";

    if (!tid) {
        juegos.innerHTML = `
            <h3 class="card-title">Partido</h3>
            <p>Seleccione un equipo.</p>
        `;
        return;
    }

    const sortedGameList = [...stateG.games].sort((a, b) =>
        (a.local_date ?? "").localeCompare(b.local_date ?? "")
    );

    sortedGameList.forEach(game => {

        const homeId = Number(game.home_team_id);
        const awayId = Number(game.away_team_id);

        if (homeId === tid || awayId === tid) {
            const stadiumId = Number(game.stadium_id);
            const card = document.createElement("article");
            card.classList.add("card");

            stateS.stadiums.forEach(stadiums => {
                const stadId = Number(stadiums.id);

                if (stadiumId === stadId) {
                    card.innerHTML = `
                <h3 class="card-title">
                    ${game.home_team_name_en} vs ${game.away_team_name_en}
                </h3>
                <p><strong>Fecha:</strong> ${game.local_date}</p>
                <p><strong>Estadio:</strong>${stadiums.fifa_name}</p>
                <p><strong>Ciudad:</strong> ${stadiums.city_en ?? "No disponible"}</p>
                <p><strong>Pais:</strong>${stadiums.country_en ?? "No disponible2"}</p>
                <p><strong>Aforo:</strong>${stadiums.capacity ?? "No disponible3"} </p>
                <p><strong>Resultado:</strong>
                    ${game.home_score ?? 0} - ${game.away_score ?? 0}
                </p>
            `;

                    juegos.appendChild(card);
                }
            })
        }

    });

    // Si el equipo aún no tiene partidos
    if (juegos.children.length === 0) {

        juegos.innerHTML = `
            <article class="card">
                <h3 class="card-title">Sin partidos</h3>
                <p>Este equipo no tiene partidos registrados.</p>
            </article>
        `;

    }

}

/* ──────────────────────────────────────────────────────
   MOSTRAR GOLEADAS
────────────────────────────────────────────────────── */
function show_goleadas() {

    goleadas.innerHTML = "";

    // Mapa para encontrar equipos rápidamente por id
    const teamsMap = new Map();

    stateT.teams.forEach(team => {
        teamsMap.set(Number(team.id), team);
    });

    console.log(teamsMap);
    const partidos_goleados = [];

    stateG.games.forEach(game => {

        const homescore = Number(game.home_score);
        const awayscore = Number(game.away_score);
        const difference = Math.abs(homescore - awayscore);
        if (difference >= 3) {
            partidos_goleados.push({game, diferencia: difference});
        }
        
    })
    console.log(partidos_goleados);

    // Cabecera
    const title = document.createElement("h2");
    title.textContent = `Goleadas encontradas: ${partidos_goleados.length}`;
    goleadas.appendChild(title);

    if (partidos_goleados.length === 0) {

        goleadas.innerHTML += `
            <article class="card">
                <h3>No hay goleadas registradas.</h3>
            </article>
        `;
        return;
    }

    partidos_goleados.sort((a, b) => a.diferencia - b.diferencia);

    // Cards
    partidos_goleados.forEach(game => {

        const home = teamsMap.get(Number(game.game.home_team_id));
        const away = teamsMap.get(Number(game.game.away_team_id));

        const card = document.createElement("article");
        card.classList.add("card");

        card.innerHTML = `
            <h3 class="card-title">
                <img src="${home?.flag || ""}"
                     width="30"
                     alt="${home?.name_en}">
                ${home?.name_en ?? "Equipo"}

                vs

                <img src="${away?.flag || ""}"
                     width="30"
                     alt="${away?.name_en}">
                ${away?.name_en ?? "Equipo"}
            </h3>

            <p>
                <strong>Resultado:</strong>
                ${game.game.home_score} - ${game.game.away_score}
            </p>

            <p>
                <strong>Diferencia:</strong>
                ${game.diferencia} goles
            </p>

            <p>
                <strong>Fecha:</strong>
                ${game.game.local_date}
            </p>
        `;

        goleadas.appendChild(card);

    });

}

btnGoleadas.addEventListener("click", show_goleadas);

/* ──────────────────────────────────────────────────────
   El muro
────────────────────────────────────────────────────── */
function elmuro() {

    elMuro.innerHTML = "";

    // Mapear equipos para búsquedas rápidas, obtenemos el id del equipo y el objeto del mismo con toda su informacion
    const teamsMap = new Map();

    stateT.teams.forEach(team => {
        teamsMap.set(Number(team.id), team);
    });

    // Obtener el team ID y el GA de la tabla de grupos
    const allTeams = [];

    stateGr.groups.forEach(group => {

        group.teams.forEach(team => {

            allTeams.push({
                team_id: Number(team.team_id),
                ga: Number(team.ga)
            });

        });

    });

    // Ordenar por goles en contra
    allTeams.sort((a, b) => a.ga - b.ga);

    // Top 5, hacemos una variable con solo los primeros 5 lugares.
    const top5 = allTeams.slice(0, 5);

    // Cabecera
    const title = document.createElement("h2");
    title.textContent = "Top 5";
    elMuro.appendChild(title);

    // Mostrar equipos
    top5.forEach(item => {

        const team = teamsMap.get(item.team_id);

        // Buscar próximo partido (actualmente no hay partidos disponibles)
        const nextGame = stateG.games
            .filter(game =>
                game.finished === false &&
                (
                    Number(game.home_team_id) === item.team_id ||
                    Number(game.away_team_id) === item.team_id
                )
            )
            .sort((a, b) =>
                new Date(a.local_date) - new Date(b.local_date)
            )[0];

        let rival = "Sin partido programado";
        let fecha = "";

        if (nextGame) {

            const rivalId =
                Number(nextGame.home_team_id) === item.team_id
                    ? Number(nextGame.away_team_id)
                    : Number(nextGame.home_team_id);

            const rivalTeam = teamsMap.get(rivalId);

            rival = rivalTeam?.name_en ?? "Desconocido";
            fecha = nextGame.local_date;
        }

        const card = document.createElement("article");
        card.classList.add("card");

        card.innerHTML = `
            <h3 class="card-title">
                <img src="${team?.flag}" width="35">
                ${team?.name_en}
            </h3>

            <p><strong>Goles en contra:</strong> ${item.ga}</p>

            <p>
                <strong>Próximo partido:</strong>
                ${rival}
            </p>

            <p>
                <strong>Fecha:</strong>
                ${fecha || "No disponible"}
            </p>
        `;

        elMuro.appendChild(card);

    });

}
btnelmuro.addEventListener("click", elmuro);
