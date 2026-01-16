let map = L.map('map', { zoomControl: false }).setView([20, 78], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let allAirports = [];
let selectedFrom = null, selectedTo = null;
let flightPath = null, planeMarker = null;
let airportLayer = L.layerGroup().addTo(map);

// 1. Load Airports & Search Functionality
async function init() {
    try {
        const res = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
        const data = await res.json();
        allAirports = Object.values(data).filter(ap => ap.iata && ap.iata.length === 3);
        
        setupSearch('fromInput', 'fromSuggestions', 'from');
        setupSearch('toInput', 'toSuggestions', 'to');
        renderMarkers();
    } catch (e) { console.error(e); }
}

function renderMarkers() {
    map.on('moveend', () => {
        airportLayer.clearLayers();
        const zoom = map.getZoom();
        allAirports.forEach(ap => {
            if (zoom >= 6 || ["LHR", "JFK", "DEL", "MAA", "BOM", "SIN"].includes(ap.iata)) {
                if (map.getBounds().contains([ap.lat, ap.lon])) {
                    const m = L.circleMarker([ap.lat, ap.lon], { color: '#4fc3f7', radius: zoom >= 6 ? 4 : 2 });
                    m.on('click', () => handleMapClick(ap));
                    airportLayer.addLayer(m);
                }
            }
        });
    });
}

function setupSearch(inputId, suggestionId, type) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestionId);
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        box.innerHTML = '';
        if (val.length < 2) { box.classList.add('hidden'); return; }
        const matches = allAirports.filter(ap => ap.city.toLowerCase().includes(val) || ap.iata.toLowerCase().includes(val)).slice(0, 10);
        matches.forEach(ap => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerText = `${ap.city} (${ap.iata})`;
            item.onclick = () => {
                input.value = ap.city;
                box.classList.add('hidden');
                if (type === 'from') selectedFrom = ap; else selectedTo = ap;
                checkBoarding();
            };
            box.appendChild(item);
        });
        box.classList.remove('hidden');
    });
}

function handleMapClick(ap) {
    if (!selectedFrom) {
        selectedFrom = ap;
        document.getElementById('fromInput').value = ap.city;
    } else if (!selectedTo && ap.iata !== selectedFrom.iata) {
        selectedTo = ap;
        document.getElementById('toInput').value = ap.city;
        checkBoarding();
    }
}

function checkBoarding() {
    if (selectedFrom && selectedTo) {
        document.getElementById('boardingBtn').disabled = false;
        drawFlightPath();
    }
}

// 2. Flight Path & Tilted Icon Alignment
function getBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function drawFlightPath() {
    if (flightPath) map.removeLayer(flightPath);
    if (planeMarker) map.removeLayer(planeMarker);
    const latlngs = [[selectedFrom.lat, selectedFrom.lon], [selectedTo.lat, selectedTo.lon]];
    flightPath = L.polyline(latlngs, { color: '#fbbf24', weight: 2, dashArray: '10, 10' }).addTo(map);
    map.flyToBounds(flightPath.getBounds(), { padding: [50, 50] });
}

// 3. 50 Row 1-2-1 Cabin Generation
document.getElementById("boardingBtn").onclick = () => {
    document.getElementById("airplaneView").classList.remove("hidden");
    document.getElementById("routeDisplay").innerText = `${selectedFrom.iata} ✈ ${selectedTo.iata}`;
    const seatMap = document.getElementById("seatMap");
    seatMap.innerHTML = "";
    
    for (let i = 1; i <= 50; i++) {
        const rowNum = document.createElement("div");
        rowNum.style.color = "#64748b"; rowNum.innerText = i;
        seatMap.appendChild(rowNum);

        ["A", "GAP", "B", "C", "GAP", "D"].forEach(type => {
            if (type === "GAP") { seatMap.appendChild(document.createElement("div")); return; }
            const box = document.createElement("div");
            box.className = "seat-box";
            if (Math.random() < 0.25) box.classList.add("taken");
            else {
                box.onclick = () => {
                    document.querySelectorAll(".seat-box").forEach(s => s.classList.remove("selected"));
                    box.classList.add("selected");
                    document.getElementById("confirmSeatBtn").disabled = false;
                    document.getElementById("selectedSeatLabel").innerText = `Seat ${i}${type} `;
                };
            }
            seatMap.appendChild(box);
        });
    }
};

// 4. Real-Time Navigation
document.getElementById("confirmSeatBtn").onclick = () => {
    document.getElementById("airplaneView").classList.add("hidden");
    document.querySelector(".panel").classList.add("hidden");
    document.getElementById("flightTrackerUI").classList.remove("hidden");

    const start = [selectedFrom.lat, selectedFrom.lon];
    const end = [selectedTo.lat, selectedTo.lon];
    const angle = getBearing(start[0], start[1], end[0], end[1]);

    const planeIcon = L.divIcon({
        html: `<i class="fa-solid fa-plane" style="transform: rotate(${angle - 45}deg); color: #fbbf24; font-size: 32px;"></i>`,
        className: 'plane-marker', iconSize: [32, 32], iconAnchor: [16, 16]
    });

    const marker = L.marker(start, { icon: planeIcon }).addTo(map);
    let startTime = performance.now();
    const duration = 15000; // 15s flight

    function animate(time) {
        let progress = Math.min((time - startTime) / duration, 1);
        const curLat = start[0] + (end[0] - start[0]) * progress;
        const curLon = start[1] + (end[1] - start[1]) * progress;
        marker.setLatLng([curLat, curLon]);
        map.setView([curLat, curLon], 7);
        const rem = Math.max(0, Math.ceil((duration - (time - startTime)) / 1000));
        document.getElementById("timerDisplay").innerText = `00:00:${rem < 10 ? '0' + rem : rem}`;
        if (progress < 1) requestAnimationFrame(animate);
        else { alert("Arrival!"); location.reload(); }
    }
    requestAnimationFrame(animate);
};

document.getElementById("backToMapBtn").onclick = () => document.getElementById("airplaneView").classList.add("hidden");


init();
