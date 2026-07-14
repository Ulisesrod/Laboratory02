"use strict";

/* ──────────────────────────────────────────────────────
   CONFIGURACIÓN
────────────────────────────────────────────────────── */
const BASE = "http://worldcup26.ir";

/* ──────────────────────────────────────────────────────
   GET /get/teams, GET /get/games, GET /get/stadiums. GET /get/groups
────────────────────────────────────────────────────── */
const stateT = {
  teams: [],            // Array<{id, name, flag_url, ...}>
  //
};
const stateG = {
  games: [],            // Array<{id, name, flag_url, ...}>
  //
};
const stateS = {
  stadiums: [],            // Array<{id, name, flag_url, ...}>
  //
};
const stateGr = {
  groups: [],            // Array<{id, name, flag_url, ...}>
  //
};

/* ──────────────────────────────────────────────────────
   SELECTORES DOM
────────────────────────────────────────────────────── */

/*
const teamSelect = document.getElementById("teamSelect");
const teamInfo = document.getElementById("teamInfo");
const cardsGrid = document.getElementById("cardsGrid");
const statsBar = document.getElementById("statsBar");
const sectionEyebrow = document.getElementById("sectionEyebrow");
const citiesSection = document.getElementById("citiesSection");
const apiStatus = document.getElementById("apiStatus");
const teamGroup = document.getElementById("teamGroup");*/


/* ──────────────────────────────────────────────────────
   Init: carga inicial de los tres endpoints
────────────────────────────────────────────────────── */


async function init(urlGet, state, data) {

  await fetch(`${BASE}${urlGet}`)
    .then(response => response.json())
    .then(jsondata => {
      // guardo los datos de equipos en el estado global
      state[data] = jsondata[data];
      // Llamar a las funciones de carga

      //populateTeamGroup();
      //example cargaRequest1();
    })
    .catch(err => {
      console.error("Error al cargar equipos:", err);
    });
}
init("/get/teams", stateT, "teams");
init("/get/games", stateG, "games");
init("/get/stadiums", stateS, "stadiums");
init("/get/groups", stateGr, "groups");

console.log(stateT.teams)

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