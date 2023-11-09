import { checkVictory, createBoard, getEntityPos, resetHighlights, updateBoard, updateHighlights } from "./src/board/index.js";
import { Entity, Highlight } from "./src/constants/index.js";
import { getLevelById } from "./src/services/api-level.js";
import { getSpellsByIds } from "./src/services/api-spell.js";
import { createSpells, doAction } from "./src/spells/index.js";

const path = window.location.pathname;
// Regex chatgpt to get level id: 
const match = path.match(/\/level\/(\d+)/);

let slug = 1;

if (match) {
    slug = match[1];
}

// REQUETE

let level = await getLevelById(slug);  

if (level == null) {
    throw new Error("Erreur dans la requête de level");
}

let spells = await getSpellsByIds(level.spells);

if (spells == null) {
    throw new Error("Erreur dans la requête de sorts");
}

// Populate
level.spells = spells;

// INIT GAME

//? ----------- PLAYER POS -----------
function updatePlayerPos(pos) {
    playerPos = pos;  
    playerPosHtml.innerText = `player position: ${playerPos ? `${playerPos.x}, ${playerPos.y}` : "-"}`;
}

let playerPos = null;
const playerPosHtml = document.getElementById("playerPos");
updatePlayerPos(getEntityPos(level.board, Entity.Player));

const playerHtml = document.createElement("div");
playerHtml.classList.add(Entity.Player);

//? ----------- PM -----------
function updatePlayerPm(pm) {
    playerPm = pm;
    playerPmHtml.innerText = `pm: ${playerPm}`;
}

let playerPm = level.pm;
const playerPmHtml = document.getElementById("playerPm");
updatePlayerPm(playerPm);

//? ----------- ACTION -----------
function updateAction(spell, fromPlayerHtml = false) {
    action = spell;
    actionHtml.innerText = `action: ${action ? `id: ${action.id}, name: ${action.name}, range: ${action.range}, ${action.description}` : "-"}`;
    if (action != null) {  
        updateHighlights(level.board, action.range, action.aligned, playerPos, Highlight.Spell, playerHtml);
    } else {
        if (fromPlayerHtml) {
            updateHighlights(level.board, playerPm, null, playerPos, Highlight.Pm, playerHtml);
        } else {
            resetHighlights(level.board, playerHtml);
        }
    }
}

let action = null;
const actionHtml = document.getElementById("action");
// updateAction(action);

//? ----------- TARGET POS -----------
function updateTargetPos(pos) {
    targetPos = pos;  
    targetPosHtml.innerText = `target position: ${targetPos ? `${targetPos.x}, ${targetPos.y}` : "-"}`;
    // if on player
    if (playerPos.x == targetPos.x && playerPos.y == targetPos.y) {
        updateAction(null, true);
    } else {
        doAction(
            level.board,
            playerPos,
            updatePlayerPos,
            playerHtml,
            targetPos,
            action,
            playerPm,
            updatePlayerPm
        );
        updateAction(null);

        checkVictory(level.board)  
    }
}

let targetPos = null;
const targetPosHtml = document.getElementById("targetPos");

const retryHtml = document.getElementById("retry");
retryHtml.addEventListener("click", function(event) {
    window.location.reload();
});

// CREATE HTML

createBoard(level.board, updateTargetPos, playerHtml);

createSpells(level.spells, updateAction);