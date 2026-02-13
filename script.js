function runSimulation() {

    const frames = parseInt(document.getElementById("frames").value);
    const refString = document.getElementById("reference").value
                        .trim()
                        .split(" ")
                        .map(Number);

    if (!frames || refString.length === 0) {
        alert("Enter valid input");
        return;
    }

    const fifoResult = fifo(refString, frames);
    const lruResult = lru(refString, frames);
    const optimalResult = optimal(refString, frames);

    document.getElementById("results").innerHTML =
        createTable("FIFO", fifoResult) +
        createTable("LRU", lruResult) +
        createTable("Optimal", optimalResult) +
        compare(fifoResult.faults, lruResult.faults, optimalResult.faults);
        drawChart(fifoResult.faults, lruResult.faults, optimalResult.faults);

}

function createTable(name, result) {

    let html = `<h2>${name} Algorithm</h2>`;
    html += "<table>";
    html += "<tr><th>Step</th><th>Page</th>";

    for (let i = 0; i < result.frames[0].length; i++) {
        html += `<th>Frame ${i+1}</th>`;
    }
    html += "<th>Status</th></tr>";

    for (let i = 0; i < result.frames.length; i++) {
        html += "<tr>";
        html += `<td>${i+1}</td>`;
        html += `<td>${result.pages[i]}</td>`;

        result.frames[i].forEach(f => {
            html += `<td>${f === null ? "-" : f}</td>`;
        });

        html += `<td class="${result.status[i] === 'Fault' ? 'fault':'hit'}">${result.status[i]}</td>`;
        html += "</tr>";
    }

    html += "</table>";
    html += `<p><b>Total Page Faults:</b> ${result.faults}</p>`;
    return html;
}

function compare(fifo, lru, opt) {

    const min = Math.min(fifo, lru, opt);
    let best = "";

    if (min === fifo) best = "FIFO";
    else if (min === lru) best = "LRU";
    else best = "Optimal";

    return `
        <h2>Comparison</h2>
        <p>FIFO Faults: ${fifo}</p>
        <p>LRU Faults: ${lru}</p>
        <p>Optimal Faults: ${opt}</p>
        <h3>Best Algorithm: ${best}</h3>
    `;
}

/* ================= FIFO ================= */

function fifo(ref, frameCount) {

    let frames = Array(frameCount).fill(null);
    let pointer = 0;
    let faults = 0;

    let history = [];
    let status = [];

    ref.forEach(page => {

        if (!frames.includes(page)) {
            frames[pointer] = page;
            pointer = (pointer + 1) % frameCount;
            faults++;
            status.push("Fault");
        } else {
            status.push("Hit");
        }

        history.push([...frames]);
    });

    return { frames: history, faults, status, pages: ref };
}

/* ================= LRU ================= */

function lru(ref, frameCount) {

    let frames = [];
    let faults = 0;

    let history = [];
    let status = [];

    ref.forEach(page => {

        if (!frames.includes(page)) {

            if (frames.length < frameCount) {
                frames.push(page);
            } else {
                frames.shift();
                frames.push(page);
            }

            faults++;
            status.push("Fault");
        } else {
            frames.splice(frames.indexOf(page), 1);
            frames.push(page);
            status.push("Hit");
        }

        let temp = Array(frameCount).fill(null);
        for (let i = 0; i < frames.length; i++) temp[i] = frames[i];

        history.push([...temp]);
    });

    return { frames: history, faults, status, pages: ref };
}

/* ================= OPTIMAL ================= */

function optimal(ref, frameCount) {

    let frames = [];
    let faults = 0;

    let history = [];
    let status = [];

    for (let i = 0; i < ref.length; i++) {

        const page = ref[i];

        if (!frames.includes(page)) {

            if (frames.length < frameCount) {
                frames.push(page);
            } else {

                let farthest = -1;
                let replaceIndex = -1;

                for (let j = 0; j < frames.length; j++) {

                    let nextUse = ref.slice(i+1).indexOf(frames[j]);

                    if (nextUse === -1) {
                        replaceIndex = j;
                        break;
                    }

                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIndex = j;
                    }
                }

                frames[replaceIndex] = page;
            }

            faults++;
            status.push("Fault");
        } else {
            status.push("Hit");
        }

        let temp = Array(frameCount).fill(null);
        for (let i2 = 0; i2 < frames.length; i2++) temp[i2] = frames[i2];

        history.push([...temp]);
    }

    return { frames: history, faults, status, pages: ref };
}
let chartInstance = null;

function drawChart(fifo, lru, optimal) {

    const ctx = document.getElementById("faultChart").getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["FIFO", "LRU", "Optimal"],
            datasets: [{
                label: "Page Faults",
                data: [fifo, lru, optimal]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

