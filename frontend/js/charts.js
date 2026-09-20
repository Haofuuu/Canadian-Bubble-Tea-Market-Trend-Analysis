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

const chartTypography = {
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#334155"
};

function average(values) {
    return values.reduce((total, value) => total + value, 0) / values.length;
}

function styleAxis(axis, showSplitLine) {
    if (Array.isArray(axis)) {
        return axis.map(item => styleAxis(item, showSplitLine));
    }

    return {
        ...axis,
        axisLine: { lineStyle: { color: "#d8dee9" }, ...axis.axisLine },
        axisTick: { show: false, ...axis.axisTick },
        axisLabel: { color: "#7b8494", fontSize: 10, ...axis.axisLabel },
        nameTextStyle: { color: "#7b8494", fontSize: 10, ...axis.nameTextStyle },
        splitLine: {
            show: showSplitLine,
            lineStyle: { color: "#edf0f4", type: "solid" },
            ...axis.splitLine
        }
    };
}

function createChart(elementId, option) {
    const chart = echarts.init(document.getElementById(elementId));
    chart.setOption({
        ...option,
        animationDuration: 650,
        animationEasing: "cubicOut",
        textStyle: chartTypography,
        aria: { enabled: true },
        tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.96)",
            borderColor: "transparent",
            borderWidth: 0,
            padding: [10, 12],
            textStyle: { color: "#f8fafc", fontSize: 11 },
            extraCssText: "border-radius: 9px; box-shadow: 0 10px 30px rgba(15,23,42,.18);",
            ...option.tooltip
        },
        legend: {
            icon: "circle",
            itemWidth: 8,
            itemHeight: 8,
            itemGap: 18,
            textStyle: { color: "#64748b", fontSize: 10 },
            ...option.legend
        },
        xAxis: styleAxis(option.xAxis, option.xAxis?.type === "value"),
        yAxis: styleAxis(option.yAxis, option.yAxis?.type === "value")
    });
    charts.push(chart);
    return chart;
}

function setCard(id, value, detail) {
    document.querySelector(`#${id} .kpi-value`).textContent = value;
    document.querySelector(`#${id} .kpi-detail`).textContent = detail;
}

function setInsight(id, text) {
    document.getElementById(id).textContent = text;
}

function signed(value) {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatPeriod(start, end) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startLabel = `${monthNames[Number(start.slice(5, 7)) - 1]} ${start.slice(0, 4)}`;
    const endLabel = `${monthNames[Number(end.slice(5, 7)) - 1]} ${end.slice(0, 4)}`;
    return `${startLabel}–${endLabel}`;
}

function formatMonth(month) {
    const date = new Date(`${month}-01T00:00:00`);
    return date.toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatMonthTick(month) {
    const date = new Date(`${month}-01T00:00:00`);
    return date.toLocaleDateString("en-CA", { month: "short", year: "2-digit", timeZone: "UTC" });
}

function formatWeek(week) {
    return new Date(`${week}T00:00:00`).toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
    });
}

function shortBrandName(brand) {
    return brand === "CoCo Fresh Tea & Juice" ? "CoCo" : brand;
}

function renderCards(weekly, monthly, brands, months) {
    const overall = brands.map(brand => ({
        brand,
        interest: average(weekly.filter(row => row.brand === brand).map(row => row.interest))
    })).sort((a, b) => b.interest - a.interest)[0];

    const latestMonth = months[months.length - 1];
    const current = monthly.filter(row => row.month === latestMonth)
        .sort((a, b) => b.interest - a.interest)[0];

    const recentMonths = months.slice(-12);
    const previousMonths = months.slice(-24, -12);
    const growth = brands.map(brand => {
        const recent = average(monthly.filter(row => row.brand === brand && recentMonths.includes(row.month)).map(row => row.interest));
        const previous = average(monthly.filter(row => row.brand === brand && previousMonths.includes(row.month)).map(row => row.interest));
        return { brand, change: ((recent - previous) / previous) * 100 };
    }).sort((a, b) => b.change - a.change)[0];

    const peak = weekly.reduce((highest, row) => row.interest > highest.interest ? row : highest);

    setCard("kpi-overall", overall.brand, `${overall.interest.toFixed(1)} average index`);
    setCard("kpi-current", current.brand, `${formatMonth(latestMonth)} · ${current.interest.toFixed(1)} index`);
    setCard("kpi-growth", growth.brand, `${growth.change >= 0 ? "+" : ""}${growth.change.toFixed(1)}% year over year`);
    setCard("kpi-peak", peak.brand, `${peak.interest.toFixed(0)} index · ${formatWeek(peak.week)}`);
}

function renderMonthly(monthly, brands, months) {
    createChart("chart-monthly", {
        color: brands.map(brand => brandColors[brand]),
        tooltip: { trigger: "axis" },
        legend: { top: 4 },
        grid: { left: 48, right: 18, top: 58, bottom: 48, containLabel: true },
        xAxis: { type: "category", data: months, axisLabel: { formatter: formatMonthTick, rotate: 32 } },
        yAxis: { type: "value", name: "Interest", min: 0 },
        series: brands.map(brand => ({
            name: brand,
            type: "line",
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2.25 },
            emphasis: { focus: "series" },
            data: months.map(month => {
                const row = monthly.find(item => item.month === month && item.brand === brand);
                return row ? row.interest : null;
            })
        }))
    });
}

function renderYearOverYear(monthly, brands, months) {
    const firstIndex = 14;
    const chartMonths = months.slice(firstIndex);
    const latest = [];

    const series = brands.map(brand => {
        const data = chartMonths.map((month, chartIndex) => {
            const index = chartIndex + firstIndex;
            const currentMonths = months.slice(index - 2, index + 1);
            const priorYearMonths = months.slice(index - 14, index - 11);
            const current = average(monthly
                .filter(row => row.brand === brand && currentMonths.includes(row.month))
                .map(row => row.interest));
            const priorYear = average(monthly
                .filter(row => row.brand === brand && priorYearMonths.includes(row.month))
                .map(row => row.interest));
            return Number((current - priorYear).toFixed(1));
        });

        latest.push({ brand, change: data[data.length - 1] });
        return {
            name: brand,
            type: "line",
            smooth: true,
            symbol: "none",
            data
        };
    });

    const rising = [...latest].sort((a, b) => b.change - a.change)[0];
    const falling = [...latest].sort((a, b) => a.change - b.change)[0];
    setInsight(
        "yoy-insight",
        `${rising.brand} leads current year-over-year growth at ${signed(rising.change)} points; ` +
        `${falling.brand} has the softest comparison at ${signed(falling.change)} points.`
    );

    createChart("chart-yoy", {
        color: brands.map(brand => brandColors[brand]),
        tooltip: {
            trigger: "axis",
            valueFormatter: value => `${value > 0 ? "+" : ""}${value} points`
        },
        legend: { top: 4 },
        grid: { left: 48, right: 18, top: 58, bottom: 48, containLabel: true },
        xAxis: { type: "category", data: chartMonths, axisLabel: { formatter: formatMonthTick, rotate: 32 } },
        yAxis: {
            type: "value",
            name: "YoY change (points)",
            nameLocation: "middle",
            nameGap: 42,
            axisLabel: { formatter: value => `${value > 0 ? "+" : ""}${value}` }
        },
        series: series.map(item => ({
            ...item,
            markLine: {
                silent: true,
                symbol: "none",
                label: { show: false },
                lineStyle: { color: "#94a3b8", type: "dashed" },
                data: [{ yAxis: 0 }]
            }
        }))
    });
}

function renderPeakPeriods(monthly, brands, months) {
    const peaks = brands.map(brand => {
        let peak = { brand, value: -Infinity, start: "", end: "" };
        for (let index = 2; index < months.length; index += 1) {
            const periodMonths = months.slice(index - 2, index + 1);
            const value = average(monthly
                .filter(row => row.brand === brand && periodMonths.includes(row.month))
                .map(row => row.interest));
            if (value > peak.value) {
                peak = { brand, value, start: periodMonths[0], end: periodMonths[2] };
            }
        }
        return peak;
    }).sort((a, b) => a.value - b.value);

    const chronological = [...peaks].sort((a, b) => a.end.localeCompare(b.end));
    const earliest = chronological.slice(0, 2).map(item => item.brand).join(" and ");
    const latest = chronological.slice(-2).map(item => item.brand).join(" and ");
    setInsight(
        "peak-insight",
        `${earliest} reached their strongest sustained periods first; the newest peaks belong to ${latest}.`
    );

    createChart("chart-peaks", {
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: params => {
                const item = peaks[params[0].dataIndex];
                return `${item.brand}<br>${formatPeriod(item.start, item.end)}: ${item.value.toFixed(1)} average interest`;
            }
        },
        grid: { left: 24, right: 180, top: 24, bottom: 26, containLabel: true },
        xAxis: { type: "value", name: "Average interest", min: 0 },
        yAxis: { type: "category", data: peaks.map(item => item.brand) },
        series: [{
            type: "bar",
            data: peaks.map(item => ({
                value: Number(item.value.toFixed(1)),
                itemStyle: { color: brandColors[item.brand] }
            })),
            label: {
                show: true,
                position: "right",
                formatter: params => {
                    const item = peaks[params.dataIndex];
                    return `${params.value} · ${formatPeriod(item.start, item.end)}`;
                }
            }
        }]
    });
}

function renderAcceleration(monthly, brands, months) {
    const earlierMonths = months.slice(-9, -6);
    const previousMonths = months.slice(-6, -3);
    const recentMonths = months.slice(-3);
    const acceleration = brands.map(brand => {
        const earlier = average(monthly.filter(row => row.brand === brand && earlierMonths.includes(row.month)).map(row => row.interest));
        const previous = average(monthly.filter(row => row.brand === brand && previousMonths.includes(row.month)).map(row => row.interest));
        const recent = average(monthly.filter(row => row.brand === brand && recentMonths.includes(row.month)).map(row => row.interest));
        const priorChange = previous - earlier;
        const recentChange = recent - previous;
        return {
            brand,
            priorChange: Number(priorChange.toFixed(1)),
            recentChange: Number(recentChange.toFixed(1)),
            acceleration: Number((recentChange - priorChange).toFixed(1))
        };
    }).sort((a, b) => a.acceleration - b.acceleration);

    const improving = [...acceleration].sort((a, b) => b.acceleration - a.acceleration)[0];
    setInsight(
        "acceleration-insight",
        `${improving.brand} shows the strongest improvement: its three-month change accelerated by ${signed(improving.acceleration)} points.`
    );

    createChart("chart-acceleration", {
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            valueFormatter: value => `${value > 0 ? "+" : ""}${value} points`
        },
        legend: { top: 0 },
        grid: { left: 20, right: 36, top: 48, bottom: 26, containLabel: true },
        xAxis: {
            type: "value",
            axisLabel: { formatter: value => `${value > 0 ? "+" : ""}${value}` }
        },
        yAxis: { type: "category", data: acceleration.map(item => item.brand) },
        series: [
            {
                name: "Prior 3-month change",
                type: "bar",
                data: acceleration.map(item => item.priorChange),
                itemStyle: { color: "#94a3b8" }
            },
            {
                name: "Latest 3-month change",
                type: "bar",
                itemStyle: { color: "#10b981" },
                data: acceleration.map(item => ({
                    value: item.recentChange,
                    itemStyle: { color: item.recentChange >= 0 ? "#10b981" : "#ef4444" }
                })),
                label: {
                    show: true,
                    position: "right",
                    formatter: params => `${params.value > 0 ? "+" : ""}${params.value}`
                }
            }
        ]
    });
}

function renderRegionalIndex(provinceRows, weekly, brands) {
    const nationalAverages = {};
    brands.forEach(brand => {
        nationalAverages[brand] = average(weekly.filter(row => row.brand === brand).map(row => row.interest));
    });
    const nationalTotal = Object.values(nationalAverages).reduce((total, value) => total + value, 0);
    const nationalShare = {};
    brands.forEach(brand => {
        nationalShare[brand] = nationalAverages[brand] / nationalTotal * 100;
    });

    const provinceCounts = {};
    provinceRows.forEach(row => {
        provinceCounts[row.province] = (provinceCounts[row.province] || 0) + 1;
    });
    const provinces = Object.keys(provinceCounts)
        .filter(province => provinceCounts[province] >= 3)
        .sort();

    const data = provinceRows
        .filter(row => provinces.includes(row.province))
        .map(row => [
            brands.indexOf(row.brand),
            provinces.indexOf(row.province),
            Number((row.interest / nationalShare[row.brand]).toFixed(1)),
            row.interest
        ]);

    const strongestMarkets = brands.map(brand => {
        const cells = data.filter(item => brands[item[0]] === brand);
        const strongest = cells.sort((a, b) => b[2] - a[2])[0];
        return { brand, province: provinces[strongest[1]], index: strongest[2] };
    });
    const highlights = strongestMarkets
        .filter(item => ["Gong Cha", "CoCo Fresh Tea & Juice", "HEYTEA"].includes(item.brand))
        .map(item => `${item.brand} in ${item.province} (${item.index.toFixed(1)}×)`)
        .join(", ");
    setInsight("regional-insight", `Distinct regional strengths emerge: ${highlights}.`);

    createChart("chart-regional-index", {
        tooltip: {
            formatter: params => {
                const brand = brands[params.data[0]];
                const province = provinces[params.data[1]];
                return `${province}<br>${brand}: ${params.data[3]}% share<br>Index: ${params.data[2]}× national`;
            }
        },
        grid: { left: 16, right: 16, top: 28, bottom: 86, containLabel: true },
        xAxis: { type: "category", data: brands.map(shortBrandName), axisLabel: { rotate: 25 } },
        yAxis: { type: "category", data: provinces },
        visualMap: {
            type: "piecewise",
            dimension: 2,
            orient: "horizontal",
            left: "center",
            bottom: 0,
            selectedMode: false,
            pieces: [
                { lte: 0.74, label: "Below 0.75", color: "#fecaca" },
                { gt: 0.74, lte: 1.24, label: "0.75–1.24", color: "#f1f5f9" },
                { gt: 1.24, lte: 1.74, label: "1.25–1.74", color: "#a7f3d0" },
                { gt: 1.74, label: "1.75+", color: "#10b981" }
            ]
        },
        series: [{
            type: "heatmap",
            data,
            label: { show: true, formatter: params => params.data[2] },
            emphasis: { itemStyle: { borderColor: "#334155", borderWidth: 1 } }
        }]
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
        grid: { left: 18, right: 24, top: 28, bottom: 42, containLabel: true },
        xAxis: { type: "category", data: brands.map(shortBrandName), axisLabel: { rotate: 20 } },
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
    const cityCounts = {};
    cityRows.forEach(row => {
        cityCounts[row.city] = (cityCounts[row.city] || 0) + 1;
    });
    const cities = Object.keys(cityCounts).filter(city => cityCounts[city] >= 3).sort();

    renderCards(weekly, monthly, brands, months);
    renderMonthly(monthly, brands, months);
    renderYearOverYear(monthly, brands, months);
    renderPeakPeriods(monthly, brands, months);
    renderAcceleration(monthly, brands, months);
    renderRegionalIndex(provinceRows, weekly, brands);
    renderHeatmap("chart-city-heatmap", cityRows, "city", cities, brands);
}).catch(error => {
    console.error(error);
    const message = document.getElementById("dashboard-error");
    message.hidden = false;
    message.textContent = "The dashboard data could not be loaded. Please confirm that the Flask server is running.";
});

window.addEventListener("resize", () => charts.forEach(chart => chart.resize()));
