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

/* Sesión expirada */

function showSessionExpired() {

    localStorage.removeItem("token");

    let modal = document.getElementById("sessionExpired");

    if (modal) return;

    modal = document.createElement("div");

    modal.id = "sessionExpired";

    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.6);
            display:flex;
            justify-content:center;
            align-items:center;
            z-index:9999;
        ">
            <div style="
                background:white;
                padding:30px;
                border-radius:8px;
                text-align:center;
            ">
                <h2>Sesión expirada</h2>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("loginAgain")
        .addEventListener("click", () => {

            window.location.href = "/login.html";

        });

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

            if (response.status === 401) {

                showSessionExpired();

                throw new Error("401");

            }

            if (
                response.status === 500 ||
                response.status === 429
            ) {

                if (attempt === MAX_RETRIES) {

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
                cacheKey(url)
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
        //    init("/get/games", stateG, "games"),
        //   init("/get/stadiums", stateS, "stadiums"),
        //   init("/get/groups", stateGr, "groups")
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

    init("/get/games", stateG, "games");
    init("/get/stadiums", stateS, "stadiums");

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


/*Carga los equipos por grupo junto a su ID, nombre y bandera. Los agrega a una lista de grupos */

function populateTeamGroup() {

    const array = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    for (const group of array) {
        const miLista = document.createElement('ul');
        miLista.textContent = `Grupo ${group}`;

        stateT.teams.forEach(team => {
            if (String(team.groups) === group) {
                const miElemento = document.createElement('li');
                miElemento.textContent = `${team.id} ${team.name_en} `;
                const bandera = document.createElement("img");
                bandera.src = team.flag;
                bandera.alt = `${team.name_en} flag`;
                miElemento.appendChild(bandera);
                miLista.appendChild(miElemento);
                console.log(miLista);
            }

        });
        teamGroup.appendChild(miLista);
    }
}