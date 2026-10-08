class Building {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.level = data.level;
        this.cost = data.cost;
        this.production = data.production;
        this.resource = data.resource;
    }
    upgradeCost() {
        return this.cost * this.level;
    }
    getProduction() {
        return this.production * this.level;
    }
}
class MarsEvent {
    constructor(title, description, type, value) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.value = value;
    }
}
class Colony {
    constructor(name, population, credits) {
        this.day = 1;
        this.oxygen = 1000;
        this.water = 1000;
        this.energy = 1000;
        this.food = 1000;
        this.buildings = [];
        this.events = [];
        this.oxygenCriticalDays = 0;
        this.name = name;
        this.population = population;
        this.credits = credits;
    }
}
const BUILDING_TYPES = [
    { id: 1, name: "Elektrownia", level: 1, cost: 1000, production: 120, resource: "energy" },
    { id: 2, name: "Generator tlenu", level: 1, cost: 800, production: 80, resource: "oxygen" },
    { id: 3, name: "Szklarnia", level: 1, cost: 1200, production: 50, resource: "food" },
    { id: 4, name: "Oczyszczalnia wody", level: 1, cost: 1000, production: 50, resource: "water" }
];
let colony = null;
function showMessage(text, type = "info") {
    $("#message").html(`
        <div class="alert alert-${type} alert-dismissible fade show">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
}
function addLog(text) {
    if (!colony)
        return;
    colony.events.unshift(`Dzień ${colony.day} - ${text}`);
    colony.events = colony.events.slice(0, 30);
}
function getResourcePercent(value) {
    return Math.max(0, Math.min(100, (value / 1000) * 100));
}
function updateBar(id, value) {
    const percent = getResourcePercent(value);
    const bar = $(`#${id}Bar`);
    bar.css("width", `${percent}%`);
    bar.removeClass("bg-success bg-warning bg-danger");
    if (percent > 50) {
        bar.addClass("bg-success");
    }
    else if (percent >= 20) {
        bar.addClass("bg-warning");
    }
    else {
        bar.addClass("bg-danger");
    }
}
function updateDashboard() {
    if (!colony)
        return;
    $("#colonyTitle").text(colony.name);
    $("#day").text(colony.day);
    $("#population").text(colony.population);
    $("#oxygen").text(Math.max(0, Math.floor(colony.oxygen)));
    $("#water").text(Math.max(0, Math.floor(colony.water)));
    $("#energy").text(Math.max(0, Math.floor(colony.energy)));
    $("#food").text(Math.max(0, Math.floor(colony.food)));
    $("#credits").text(Math.max(0, Math.floor(colony.credits)));
    updateBar("oxygen", colony.oxygen);
    updateBar("water", colony.water);
    updateBar("energy", colony.energy);
    updateBar("food", colony.food);
    renderBuildings();
    renderLog();
}
function renderBuildings() {
    if (!colony)
        return;
    const list = $("#buildingList");
    list.empty();
    if (colony.buildings.length === 0) {
        list.append(`<p class="text-muted">Nie masz jeszcze żadnych budynków.</p>`);
    }
    colony.buildings.forEach(building => {
        list.append(`
            <div class="building-row d-flex justify-content-between align-items-center">
                <div>
                    <strong>${building.name}</strong>
                    <div class="small text-muted">
                        Poziom ${building.level} · Produkcja: +${building.getProduction()} ${building.resource}
                    </div>
                </div>
                <div class="text-end">
                    <button class="btn btn-sm btn-success build-upgrade" data-id="${building.id}">
                        Rozbuduj (${building.upgradeCost()} 💰)
                    </button>
                </div>
            </div>
        `);
    });
    list.append(`
        <hr>
        <h6>Wybuduj nowy budynek</h6>
        <div class="row g-2">
            ${BUILDING_TYPES.map(type => `
                <div class="col-md-6">
                    <button class="btn btn-outline-primary w-100 build-new" data-type="${type.id}">
                        ${type.name}<br><small>${type.cost} 💰</small>
                    </button>
                </div>
            `).join("")}
        </div>
    `);
}
function renderLog() {
    if (!colony)
        return;
    const log = $("#eventLog");
    log.empty();
    colony.events.forEach(event => {
        log.append(`<li class="list-group-item">${event}</li>`);
    });
}
function buildBuilding(typeId) {
    if (!colony)
        return;
    const type = BUILDING_TYPES.find(b => b.id === typeId);
    if (!type)
        return;
    if (colony.credits < type.cost) {
        showMessage("Nie masz wystarczającej liczby kredytów.", "danger");
        return;
    }
    colony.credits -= type.cost;
    colony.buildings.push(new Building(type));
    addLog(`Zbudowano ${type.name}.`);
    updateDashboard();
}
function upgradeBuilding(id) {
    if (!colony)
        return;
    const building = colony.buildings.find(b => b.id === id);
    if (!building)
        return;
    const cost = building.upgradeCost();
    if (colony.credits < cost) {
        showMessage("Nie masz wystarczającej liczby kredytów na rozbudowę.", "danger");
        return;
    }
    colony.credits -= cost;
    building.level++;
    addLog(`Rozbudowano ${building.name} do poziomu ${building.level}.`);
    updateDashboard();
}
function randomEvent() {
    if (!colony || Math.random() > 0.20)
        return;
    const events = [
        new MarsEvent("Burza piaskowa", "Kolonia straciła 50 energii.", "energy", -50),
        new MarsEvent("Awaria generatora", "Kolonia straciła 100 tlenu.", "oxygen", -100),
        new MarsEvent("Odkrycie lodu", "Otrzymano 200 wody.", "water", 200),
        new MarsEvent("Dotacja z Ziemi", "Otrzymano 1000 kredytów.", "credits", 1000),
        new MarsEvent("Przybycie kolonistów", "Przybyło 10 mieszkańców.", "population", 10)
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    if (event.type === "energy")
        colony.energy += event.value;
    if (event.type === "oxygen")
        colony.oxygen += event.value;
    if (event.type === "water")
        colony.water += event.value;
    if (event.type === "credits")
        colony.credits += event.value;
    if (event.type === "population")
        colony.population += event.value;
    addLog(`${event.title} - ${event.description}`);
}
function nextDay() {
    if (!colony)
        return;
    colony.day++;
    // Zużycie mieszkańców.
    colony.oxygen -= colony.population * 2;
    colony.water -= colony.population;
    colony.food -= colony.population;
    // Podstawowe zużycie energii.
    colony.energy -= 10;
    // Produkcja budynków.
    colony.buildings.forEach(building => {
        if (building.resource === "oxygen")
            colony.oxygen += building.getProduction();
        if (building.resource === "water")
            colony.water += building.getProduction();
        if (building.resource === "food")
            colony.food += building.getProduction();
        if (building.resource === "energy")
            colony.energy += building.getProduction();
    });
    // Co 10 dni przybywa 5 mieszkańców, jeśli zasoby są wystarczające.
    if (colony.day % 10 === 0 &&
        colony.oxygen > 0 &&
        colony.water > colony.population &&
        colony.food > colony.population) {
        colony.population += 5;
        addLog("Przybyło 5 nowych mieszkańców.");
    }
    randomEvent();
    colony.oxygen = Math.max(0, colony.oxygen);
    colony.water = Math.max(0, colony.water);
    colony.energy = Math.max(0, colony.energy);
    colony.food = Math.max(0, colony.food);
    if (colony.oxygen <= 0) {
        colony.oxygenCriticalDays++;
    }
    else {
        colony.oxygenCriticalDays = 0;
    }
    // Przy braku któregoś z podstawowych zasobów część populacji może umrzeć.
    if (colony.oxygen <= 0 || colony.water <= 0 || colony.food <= 0) {
        const loss = Math.min(colony.population, Math.max(1, Math.floor(colony.population * 0.1)));
        colony.population -= loss;
        addLog(`Z powodu braku zasobów populacja zmniejszyła się o ${loss}.`);
    }
    updateDashboard();
    checkGameEnd();
}
function checkGameEnd() {
    if (!colony)
        return;
    if (colony.population <= 0 || colony.oxygenCriticalDays >= 3) {
        showMessage("Misja zakończona niepowodzeniem. Kolonia nie przetrwała.", "danger");
        $("#nextDayBtn").prop("disabled", true);
        return;
    }
    if (colony.day >= 100 || colony.population >= 500) {
        showMessage(`Gratulacje! Kolonia osiągnęła warunek zwycięstwa. Dzień: ${colony.day}, populacja: ${colony.population}.`, "success");
        $("#nextDayBtn").prop("disabled", true);
    }
}
function saveGame() {
    if (!colony) {
        showMessage("Najpierw utwórz kolonię.", "warning");
        return;
    }
    localStorage.setItem("marsColonySave", JSON.stringify(colony));
    showMessage("Gra została zapisana.", "success");
}
function loadGame() {
    const saved = localStorage.getItem("marsColonySave");
    if (!saved) {
        showMessage("Nie znaleziono zapisu gry.", "warning");
        return;
    }
    const data = JSON.parse(saved);
    colony = new Colony(data.name, data.population, data.credits);
    colony.day = data.day;
    colony.oxygen = data.oxygen;
    colony.water = data.water;
    colony.energy = data.energy;
    colony.food = data.food;
    colony.events = data.events || [];
    colony.oxygenCriticalDays = data.oxygenCriticalDays || 0;
    colony.buildings = (data.buildings || []).map((b) => new Building(b));
    $("#newColonyPanel").addClass("d-none");
    $("#gamePanel").removeClass("d-none");
    $("#nextDayBtn").prop("disabled", false);
    updateDashboard();
    showMessage("Gra została wczytana.", "success");
}
function createColony() {
    const name = String($("#colonyName").val()).trim();
    const population = Number($("#startPopulation").val());
    const credits = Number($("#startCredits").val());
    if (!name) {
        showMessage("Nazwa kolonii nie może być pusta.", "danger");
        return;
    }
    if (population <= 0 || credits <= 0) {
        showMessage("Liczba mieszkańców i budżet muszą być większe od zera.", "danger");
        return;
    }
    colony = new Colony(name, population, credits);
    addLog(`Założono kolonię ${name}.`);
    $("#newColonyPanel").addClass("d-none");
    $("#gamePanel").removeClass("d-none");
    $("#nextDayBtn").prop("disabled", false);
    updateDashboard();
}
function newColony() {
    colony = null;
    $("#gamePanel").addClass("d-none");
    $("#newColonyPanel").removeClass("d-none");
    $("#nextDayBtn").prop("disabled", false);
    $("#message").empty();
}
$(document).ready(() => {
    $("#createBtn").on("click", createColony);
    $("#nextDayBtn").on("click", nextDay);
    $("#saveBtn").on("click", saveGame);
    $("#loadBtn").on("click", loadGame);
    $("#newBtn").on("click", newColony);
    $("#buildingList").on("click", ".build-new", function () {
        buildBuilding(Number($(this).data("type")));
    });
    $("#buildingList").on("click", ".build-upgrade", function () {
        upgradeBuilding(Number($(this).data("id")));
    });
});
