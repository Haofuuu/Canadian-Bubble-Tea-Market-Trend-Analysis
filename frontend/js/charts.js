/**
 * Canadian bubble tea brand trends dashboard.
 */

const brandColors = {
    "Chatime": "#7c3aed",
    "Gong Cha": "#f97316",
    "CoCo Fresh Tea & Juice": "#06b6d4",
    "Molly Tea": "#10b981",
    "HEYTEA": "#f43f5e"
};

const charts = [];

function average(values) {
    return values.reduce((total, value) => total + value, 0) / values.length;
}

function valueFor(rows, locationKey, location, brand) {
    const row = rows.find(item => item[locationKey] === location && item.brand === brand);
    return row ? row.interest : null;
}

function createChart(elementId, option) {
    const chart = echarts.init(document.getElementById(elementId));
    chart.setOption({
        animationDuration: 500,
        textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
        aria: { enabled: true },
        ...option
    });
    charts.push(chart);
}

function setCard(id, value, detail) {
    document.querySelector(`#${id} .kpi-value`).textContent = value;
    document.querySelector(`#${id} .kpi-detail`).textContent = detail;
}

function renderCards(weekly, monthly, brands, months) {
    const overall = brands.map(brand => ({
        brand,
        interest: average(weekly.filter(row => row.brand === brand).map(row => row.interest))
    })).sort((a, b) => b.interest - a.interest)[0];

    const latestMonth = months[months.length - 1];
    const current = monthly.filter(row => row.month === latestMonth)
        .sort((a, b) => b.interest - a.interest)[0];

    const recentMonths = months.slice(-3);
    const previousMonths = months.slice(-6, -3);
    const growth = brands.map(brand => {
        const recent = average(monthly.filter(row => row.brand === brand && recentMonths.includes(row.month)).map(row => row.interest));
        const previous = average(monthly.filter(row => row.brand === brand && previousMonths.includes(row.month)).map(row => row.interest));
        return { brand, change: ((recent - previous) / previous) * 100 };
    }).sort((a, b) => b.change - a.change)[0];

    const peak = weekly.reduce((highest, row) => row.interest > highest.interest ? row : highest);

    setCard("kpi-overall", overall.brand, `${overall.interest.toFixed(1)} average interest`);
    setCard("kpi-current", current.brand, `${latestMonth} · ${current.interest.toFixed(1)} points`);
    setCard("kpi-growth", growth.brand, `${growth.change >= 0 ? "+" : ""}${growth.change.toFixed(1)}% over 3 months`);
    setCard("kpi-peak", peak.brand, `${peak.interest.toFixed(0)} · Week of ${peak.week}`);
}

function renderMonthly(monthly, brands, months) {
    createChart("chart-monthly", {
        color: brands.map(brand => brandColors[brand]),
        tooltip: { trigger: "axis" },
        legend: { top: 4 },
        grid: { left: 52, right: 24, top: 58, bottom: 50 },
        xAxis: { type: "category", data: months, axisLabel: { rotate: 35 } },
        yAxis: { type: "value", name: "Interest", min: 0 },
        series: brands.map(brand => ({
            name: brand,
            type: "line",
            smooth: true,
            symbolSize: 5,
            data: months.map(month => {
                const row = monthly.find(item => item.month === month && item.brand === brand);
                return row ? row.interest : null;
            })
        }))
    });
}

function renderSeasonality(weekly, brands) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    createChart("chart-seasonality", {
        color: brands.map(brand => brandColors[brand]),
        tooltip: { trigger: "axis" },
        legend: { top: 4 },
        grid: { left: 52, right: 24, top: 58, bottom: 38 },
        xAxis: { type: "category", data: monthNames },
        yAxis: { type: "value", name: "Average interest", min: 0 },
        series: brands.map(brand => ({
            name: brand,
            type: "line",
            smooth: true,
            symbolSize: 7,
            data: monthNames.map((month, index) => {
                const monthNumber = String(index + 1).padStart(2, "0");
                const values = weekly
                    .filter(row => row.brand === brand && row.week.slice(5, 7) === monthNumber)
                    .map(row => row.interest);
                return Number(average(values).toFixed(1));
            })
        }))
    });
}

function renderMomentum(monthly, brands, months) {
    const recentMonths = months.slice(-3);
    const previousMonths = months.slice(-6, -3);
    const momentum = brands.map(brand => {
        const recent = average(monthly.filter(row => row.brand === brand && recentMonths.includes(row.month)).map(row => row.interest));
        const previous = average(monthly.filter(row => row.brand === brand && previousMonths.includes(row.month)).map(row => row.interest));
        return { brand, change: Number((((recent - previous) / previous) * 100).toFixed(1)) };
    }).sort((a, b) => a.change - b.change);

    createChart("chart-momentum", {
        tooltip: { trigger: "axis", valueFormatter: value => `${value}%` },
        grid: { left: 128, right: 38, top: 22, bottom: 34 },
        xAxis: { type: "value", name: "% change", axisLabel: { formatter: "{value}%" } },
        yAxis: { type: "category", data: momentum.map(item => item.brand) },
        series: [{
            type: "bar",
            data: momentum.map(item => ({
                value: item.change,
                itemStyle: { color: item.change >= 0 ? "#10b981" : "#ef4444" }
            })),
            label: { show: true, position: "right", formatter: "{c}%" }
        }]
    });
}

function renderProvinceStacked(provinceRows, brands, provinces) {
    createChart("chart-province-stacked", {
        color: brands.map(brand => brandColors[brand]),
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: value => value == null ? "No data" : `${value}%` },
        legend: { top: 0, type: "scroll" },
        grid: { left: 128, right: 20, top: 58, bottom: 28 },
        xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
        yAxis: { type: "category", data: provinces },
        series: brands.map(brand => ({
            name: brand,
            type: "bar",
            stack: "total",
            data: provinces.map(province => valueFor(provinceRows, "province", province, brand)),
            label: {
                show: true,
                formatter: params => params.value >= 10 ? `${params.value}%` : ""
            }
        }))
    });
}

function renderHeatmap(elementId, rows, locationKey, locations, brands) {
    const data = [];
    rows.forEach(row => {
        const x = brands.indexOf(row.brand);
        const y = locations.indexOf(row[locationKey]);
        if (x >= 0 && y >= 0) {
            data.push([x, y, row.interest]);
        }
    });

    createChart(elementId, {
        tooltip: {
            formatter: params => `${locations[params.data[1]]}<br>${brands[params.data[0]]}: ${params.data[2]}%`
        },
        grid: { left: 128, right: 35, top: 28, bottom: 42 },
        xAxis: { type: "category", data: brands, axisLabel: { rotate: 25 } },
        yAxis: { type: "category", data: locations },
        visualMap: {
            show: false,
            min: 0,
            max: 100,
            inRange: { color: ["#f5f3ff", "#c4b5fd", "#7c3aed", "#3b0764"] }
        },
        series: [{
            type: "heatmap",
            data,
            label: { show: true, formatter: params => params.data[2] < 1 ? "<1" : params.data[2] }
        }]
    });
}

Promise.all([
    fetch("/api/weekly").then(response => response.json()),
    fetch("/api/monthly").then(response => response.json()),
    fetch("/api/provinces").then(response => response.json()),
    fetch("/api/cities").then(response => response.json())
]).then(([weekly, monthly, provinceRows, cityRows]) => {
    const brands = [...new Set(monthly.map(row => row.brand))];
    const months = [...new Set(monthly.map(row => row.month))];
    const provinces = [...new Set(provinceRows.map(row => row.province))].sort();

    const cityCounts = {};
    cityRows.forEach(row => {
        cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
    });
    const cities = Object.keys(cityCounts).filter(city => cityCounts[city] >= 3).sort();

    renderCards(weekly, monthly, brands, months);
    renderMonthly(monthly, brands, months);
    renderSeasonality(weekly, brands);
    renderMomentum(monthly, brands, months);
    renderProvinceStacked(provinceRows, brands, provinces);
    renderHeatmap("chart-city-heatmap", cityRows, "city", cities, brands);
}).catch(error => {
    console.error(error);
    const message = document.getElementById("dashboard-error");
    message.hidden = false;
    message.textContent = "The dashboard data could not be loaded. Please confirm that the Flask server is running.";
});

window.addEventListener("resize", () => charts.forEach(chart => chart.resize()));
