var ohlc = [], volume = [], symbol = "AAPL", dataLength = 0, originalData = [], zoomLevels = [], maxZoom = 5, currentZoomLevel = 0;
var groupingUnits = [
    [
        'millisecond',
        [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]
    ],
    [
        'second',
        [1, 2, 5, 10, 15, 30]
    ],
    [
        'minute',
        [1, 2, 5, 10, 15,]
    ],
    [
        'hour',
        [1, 2, 3, 4, 6, 8, 12]
    ],
    [
        'day',
        [1, 3]
    ],
    [
        'week',
        [1]
    ],
    [
        'month',
        [1, 3, 6]
    ],
    [
        'year',
        null
    ]
];

let ws;
const maxElementsArray = [1000, 2000, 3000, 4000, 5000]; 

// Function to add a chart
function addChart(charContainerId, pOHLC, pVolume, pSymbol, pGroupingUnits, isDragable = true) {
    Highcharts.stockChart(charContainerId, {
        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
        },
        plotOptions: {
            series: {
                turboThreshold: 5000
            }
        },
        rangeSelector: {
            height: 0,
            buttons: [{ type: 'minute', count: 1, text: '1m' },
            { type: 'minute', count: 3, text: '3m' },
            { type: 'minute', count: 30, text: '30m' },
            { type: 'hour', count: 1, text: '1h' },
            { type: 'day', count: 1, text: '1D' },
            { type: 'day', count: 3, text: '3D' },
            ],
            inputEnabled: false,
            buttonTheme: {
                fill: '#272C2F',
                stroke: '#272C2F',
                style: {
                    color: '#FFFFFF',
                },
                states: {
                    hover: {
                        fill: '#5B6970',
                    },
                    select: {
                        fill: '#5b6970',
                        style: {
                            color: '#FFFFFF',
                            fontWeight: 'bold'
                        }
                    },
                    disabled: {
                        fill: '#272C2F',
                        stroke: '#272C2F',
                        style: {
                            color: '#CCCCCC',
                        }
                    }
                }
            },
            labelStyle: {
                visibility: 'hidden'
            },
            buttonSpacing: 10,
            x: 66,
            y: 0
        },
        xAxis: [{
            offset: 0,
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        },
        {
            offset: 0,
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }],
        yAxis: [{
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor // Green color
                }
            },
            height: '65%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        },
        {
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            top: '65%',
            height: '35%',
            offset: 0,
            gridLineWidth: 0,
            lineWidth: 2
        }],
        tooltip: {
            split: true
        },
        series: [
            {
                name: pSymbol,
                data: pOHLC,
                color: '#C01620', // Color for the fall
                upColor: '#16C05A', // Color for the rise
                lineWidth: 0,
                marker: {
                    enabled: true,
                    radius: 2
                },
                tooltip: {
                    valueDecimals: 2
                },
                states: {
                    hover: {
                        lineWidthPlus: 0
                    }
                }
            },
            {
                type: 'column',
                name: 'Volume',
                data: pVolume,
                yAxis: 1,
                dataGrouping: {
                    units: pGroupingUnits
                },
                color: isDarkMode ? '#C01620' : '#16C05A', // Fall or rise color
                upColor: isDarkMode ? '#16C05A' : '#C01620' // Rise or fall color
            }
        ],
        exporting: {
            buttons: {
                contextButton: {
                    enabled: false,
                },
                closeButton: {
                    enabled: true,
                    className: 'btn btn-sm',
                    theme: {
                        fill: '#272C2F',
                        stroke: '#5B6970',
                        style: {
                            color: '#FFFFFF',
                        },
                        states: {
                            select: {
                                fill: '#5b6970',
                                style: {
                                    color: '#FFFFFF',
                                    fontWeight: 'bold'
                                }
                            },
                            hover: {
                                fill: '#5B6970',
                                stroke: '#5B6970',
                            },
                        }
                    },
                    text: `XNYS:${pSymbol} &nbsp &nbsp ✖`,
                    onclick: function (e) {
                        if (isDragable) removeChart(this);
                    },
                },
                zoomInButton: {
                    x: 355,
                    y: 0,
                    enabled: true,
                    theme: {
                        fill: '#272C2F',
                        stroke: '#272C2F',
                        style: {
                            color: '#FFFFFF',
                        },
                        states: {
                            hover: {
                                fill: '#5B6970',
                            },
                        }
                    },
                    useHTML: true,
                    text: '<i class="bi bi-zoom-in"></i>',
                    onclick: function (e) {
                        zoomChart(true, this);
                    },
                },
                zoomOutButton: {
                    x: 389,
                    y: 0,
                    enabled: true,
                    theme: {
                        fill: '#272C2F',
                        stroke: '#272C2F',
                        style: {
                            color: '#FFFFFF',
                        },
                        states: {
                            hover: {
                                fill: '#5B6970',
                            },
                        }
                    },
                    useHTML: true,
                    text: '<i class="bi bi-zoom-out"></i>',
                    onclick: function (e) {
                        zoomChart(false, this);
                    },
                },
                dragButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -30,
                    enabled: isDragable,
                    className: 'btn btn-sm',
                    theme: {
                        fill: '#272C2F',
                        stroke: '#272C2F',
                        style: {
                            color: '#FFFFFF',
                        },
                        states: {
                            hover: {
                                fill: '#5B6970',
                            },
                        }
                    },
                    useHTML: true,
                    text: '<i class="bi bi-window" tabindex="0"></i> ',
                    onclick: async function (e) {
                        var jsObjectReference = DotNet.createJSObjectReference(window);
                        var chartId = $(this.renderTo).data("chart-id");
                        removeChart(this);
                        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, chartId, ohlc, volume, symbol, groupingUnits)
                    },
                },
                closeChartButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -2,
                    enabled: isDragable,
                    className: 'btn btn-sm',
                    theme: {
                        fill: '#272C2F',
                        stroke: '#272C2F',
                        style: {
                            color: '#FFFFFF',
                        },
                        states: {
                            hover: {
                                fill: '#5B6970',
                                stroke: '#5B6970',
                            },
                        }
                    },
                    useHTML: true,
                    text: '<i class="bi bi-x-lg" tabindex="0"></i>',
                    onclick: function (e) {
                        if (isDragable) removeChart(this);
                    },
                }
            },
        },
        navigation: {
            buttonOptions: {
                align: 'left',
                verticalAlign: 'top'
            }
        },
        navigator: {
            enabled: false,
            adaptToUpdateData: false,
        },
        accessibility: {
            keyboardNavigation: {
                focusBorder: {
                    enabled: false
                }
            }
        }
    });
}

function removeChart(chart) {

    if ($("#chartList .chart-box").length == 1)
        return;

    var chartContaner = $(chart.renderTo);
    var chartId = chartContaner.data("chart-id");
    $(".chart-box.chart-box-" + chartId).remove();
    $("#popup-chart-" + chartId).remove();

    chart.destroy();
    var totalCharts = $("#chartList .chart-box").length;

    var cssClass = "col-12";
    if (totalCharts == 1) {
        cssClass = "col-12";
        //$("#chartList").sortable({ disabled: true });
        if (!$(".chart-container").hasClass("chart-popup"))
            $(".chart-container").off("dblclick");
    }
    else if (totalCharts == 5) {
        cssClass = "col-12";
    }
    else if (totalCharts <= 4) {
        cssClass = "col-6";
    }

    else if (totalCharts <= 6) {
        cssClass = "col-4";
    }
    else if (totalCharts <= 8) {
        cssClass = "col-3";
    }

    $("#chartList .chart-box").removeClass('col-3').removeClass('col-4').removeClass('col-6').removeClass('col-12');
    $("#chartList .chart-box").addClass(cssClass);


    if (totalCharts == 5) {
        var chartListCol1 = $('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>');
        var chartListCol2 = $('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>');

        $("#chartList .chart-box").slice(0, 3).appendTo(chartListCol2.find('#chartListCol2'));
        $("#chartList .chart-box").appendTo(chartListCol1.find('#chartListCol1'));

        $("#chartList").append(chartListCol1).append(chartListCol2);

    } else {
        $("#chartList .chart-box").appendTo('#chartList');
        $("#chartListCol1").parent().remove();
        $("#chartListCol2").parent().remove();
    }


    if (totalCharts == 5) {
        $('#chartListCol1 .chart-box').removeClass('chart-height-100').removeClass('chart-height-33').addClass('chart-height-50');
        $('#chartListCol2 .chart-box').removeClass('chart-height-100').removeClass('chart-height-50').addClass('chart-height-33');
    } else if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100').removeClass('chart-height-33');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50').removeClass('chart-height-33');
        $("#chartList .chart-box").addClass('chart-height-100');
    }


}

function addChartBox(totalCharts, chartIndx) {
    var cssClass = "col-12";
    if (totalCharts == 2 || totalCharts == 4) {
        cssClass = "col-6";
    }
    else if (totalCharts == 5) {
        cssClass = "col-12";
    }
    else if (totalCharts == 6) {
        cssClass = "col-4";
    }
    else if (totalCharts == 8) {
        cssClass = "col-3";
    }
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} ${cssClass}"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);

    if (totalCharts == 5) {
        if ($("#chartList .chart-box").length < 3) {
            $('#chartListCol2').append(chartBox);
        } else {
            $('#chartListCol1').append(chartBox);
        }
    } else {
        $("#chartList").append(chartBox);
    }

    if (totalCharts == 5) {
        if ($("#chartList .chart-box").length > 3) {
            chartBox.addClass('chart-height-50');
        } else {
            chartBox.addClass('chart-height-33');
        }
    }
    else if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

    addChart(chartContainerId, ohlc, volume, symbol, groupingUnits);

    if (totalCharts > 1) {
        $(".chart-container", chartBox).on("dblclick", async function () {
            var eleData = $(this).data();
            var chartId = eleData.chartId;
            var jsObjectReference = DotNet.createJSObjectReference(window);
            if (eleData.highchartsChart >= 0) {
                var chart = Highcharts.charts[eleData.highchartsChart]
                if (chart) removeChart(chart);
            }
            await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, chartId, ohlc, volume, groupingUnits);
        });
    }
}

function popoutChartWindow(element, chartIndx, ohlc, volume, symbol, groupingUnits) {
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);
    calculateZoomLevels(ohlc);
    addChart(chartContainerId, ohlc, volume, symbol, groupingUnits, false);
}

function popinChartWindow(chartIndx, ohlc, volume, symbol, groupingUnits) {
    var totalCharts = $("#chartList .chart-box").length + 1;

    // Reset Chart Box
    var cssClass = "col-12";
    if (totalCharts == 1) {
        cssClass = "col-12";
    }
    else if (totalCharts == 5) {
        cssClass = "col-12";
    }
    else if (totalCharts <= 4) {
        cssClass = "col-6";
    }
    else if (totalCharts <= 6) {
        cssClass = "col-4";
    }
    else if (totalCharts <= 8) {
        cssClass = "col-3";
    }

    $("#chartList .chart-box").removeClass('col-3').removeClass('col-4').removeClass('col-6').removeClass('col-12');
    $("#chartList .chart-box").addClass(cssClass);

    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} ${cssClass}"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);

    $("#chartList").append(chartBox);

    if (totalCharts == 5) {
        var chartListCol1 = $('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>');
        var chartListCol2 = $('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>');

        $("#chartList .chart-box").slice(0, 3).appendTo(chartListCol2.find('#chartListCol2'));
        $("#chartList .chart-box").appendTo(chartListCol1.find('#chartListCol1'));

        $("#chartList").append(chartListCol1).append(chartListCol2);

    } else {
        $("#chartList .chart-box").appendTo('#chartList');
        $("#chartListCol1").parent().remove();
        $("#chartListCol2").parent().remove();
    }

    if (totalCharts == 5) {
        $('#chartListCol1 .chart-box').removeClass('chart-height-100').removeClass('chart-height-33').addClass('chart-height-50');
        $('#chartListCol2 .chart-box').removeClass('chart-height-100').removeClass('chart-height-50').addClass('chart-height-33');
    } else if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100').removeClass('chart-height-33');
        $("#chartList .chart-box").addClass('chart-height-50');
    } else {
        $("#chartList .chart-box").removeClass('chart-height-50').removeClass('chart-height-33');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

    addChart(chartContainerId, ohlc, volume, symbol, groupingUnits);

    $(".chart-container", chartBox).off("dblclick").on("dblclick", async function () {
        var eleData = $(this).data();
        var chartId = eleData.chartId;
        var jsObjectReference = DotNet.createJSObjectReference(window);
        if (eleData.highchartsChart >= 0) {
            var chart = Highcharts.charts[eleData.highchartsChart]
            if (chart) removeChart(chart);
        }
        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, chartId, ohlc, volume, symbol, groupingUnits);
    });
}

function createDashboard(totalCharts) {
    var chartList = $("#chartList");

    chartList.html('');

    if (Highcharts.charts) Highcharts.charts.forEach(c => { if (c) c.destroy() });

    if (totalCharts == 5) {
        chartList.append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>')).append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    for (var indx = 1; indx <= Number(totalCharts); indx++) {
        addChartBox(totalCharts, indx);
    }
}

function loadDashboard() {
    var totalCharts = localStorage.getItem('SavedLayout') ?? 5;

    var chartList = $("#chartList");

    chartList.html('');

    if (Highcharts.charts) Highcharts.charts.forEach(c => { if (c) c.destroy() });

    if (totalCharts == 5) {
        chartList.append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>')).append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    for (var indx = 1; indx <= Number(totalCharts); indx++) {
        addChartBox(totalCharts, indx);
    }
}

function calculateZoomLevels(data) {
    zoomLevels = [];
    const pointsCount = window.innerWidth / 2;
    const minDate = data[0].x;
    const maxDate = data[data.length - 1].x;
    const range = maxDate - minDate;
    const step = range / pointsCount;

    for (let i = 0; i < pointsCount && i < data.length; i++) {
        zoomLevels.push({ min: minDate, max: minDate + step * (i + 1) });
    }

    if (data.length < pointsCount) {
        zoomLevels.push({ min: minDate, max: maxDate }); // Show all if less data than screen width can accommodate
    }

}

// Function to downsample data
function downsampleData(data, maxElements) {
    if (data.length <= maxElements) return data;

    const step = data.length / maxElements;
    const downsampledData = [];
    for (let i = 0; i < maxElements; i++) {
        downsampledData.push(data[Math.floor(i * step)]);
    }
    return downsampledData;
}

function zoomChart(zoomIn, chart) {
    var xAxis = chart.xAxis[0];
    var extremes = xAxis.getExtremes();
    var range = extremes.max - extremes.min;
    var newMin, newMax;

    // Check if the current zoom level is within valid range
    if ((zoomIn && currentZoomLevel >= maxZoom) || (!zoomIn && currentZoomLevel <= 0)) {
        return;
    }

    // Adjust the zoom level
    if (zoomIn) {
        currentZoomLevel = Math.min(currentZoomLevel + 1, maxZoom);
    } else {
        currentZoomLevel = Math.max(currentZoomLevel - 1, 0);
    }

    // Calculate new range
    if (zoomIn) {
        newMin = extremes.min + range * 0.2;
        newMax = extremes.max - range * 0.2;
    } else {
        newMin = extremes.min - range * 0.2;
        newMax = extremes.max + range * 0.2;
    }

    // Clamp the new range to the data bounds
    newMin = Math.max(xAxis.dataMin, newMin);
    newMax = Math.min(xAxis.dataMax, newMax);

    // Determine the maximum number of elements for the current zoom level
    const maxElements = maxElementsArray[currentZoomLevel];
    const filteredData = originalData.filter(d => d.ohlcPoint.x >= newMin && d.ohlcPoint.x <= newMax);
    const downsampledData = downsampleData(filteredData, maxElements);

    ohlc = downsampledData.map(d => d.ohlcPoint);
    volume = downsampledData.map(d => d.volumePoint);

    // Set new extremes and update the chart
    xAxis.setExtremes(newMin, newMax);
}

function LoadData(resultData, FirstSymbol) {
    ohlc = [];
    volume = [];
    symbol = FirstSymbol;
    originalData = [];
    let previousPrice = null;

    resultData.forEach(item => {
        const date = new Date(item.date).getTime();
        const price = item.price / 10000;

        const color = previousPrice === null || price >= previousPrice ? 'green' : 'red';
        previousPrice = price; // Update previousPrice for the next iteration

        const ohlcPoint = { x: date, y: price, color: color };
        const volumePoint = { x: date, y: 0, color: color }; // Volume is 0 for all

        originalData.push({ ohlcPoint, volumePoint });
    });

    const initialData = downsampleData(originalData, 5000);
    ohlc = initialData.map(d => d.ohlcPoint);
    volume = initialData.map(d => d.volumePoint);

    calculateZoomLevels(ohlc);
    
}

function saveLayout() {
    localStorage.setItem('SavedLayout', $("#chartList .chart-box").length);
    console.log(localStorage.getItem('SavedLayout'));
}

function connectWebSocket() {
    ws = new WebSocket("wss://52.0.33.126:8000/nasdaq/get_real_data");

    ws.onopen = function () {
        console.log("WebSocket connection established");
    };

    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        updateChartData(message);
    };

    ws.onclose = function () {
        console.log("WebSocket connection closed. Reconnecting...");
        setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
    };

    ws.onerror = function (error) {
        console.error("WebSocket error:", error);
        ws.close();
    };
}

function updateChartData(message) {
    const date = new Date(message.date).getTime();
    const price = message.price / 10000;
    const volumeValue = message.volume; // Assuming volume is provided in the message

    const color = ohlc.length === 0 || price >= ohlc[ohlc.length - 1].y ? 'green' : 'red';

    const ohlcPoint = { x: date, y: price, color: color };
    const volumePoint = { x: date, y: volumeValue, color: color };

    ohlc.push(ohlcPoint);
    volume.push(volumePoint);

    originalData.push({ ohlcPoint, volumePoint });

    // Limit the number of stored data points
    if (ohlc.length > maxElementsArray[maxZoom - 1]) ohlc.shift();
    if (volume.length > maxElementsArray[maxZoom - 1]) volume.shift();

    // Update the chart with the new data
    Highcharts.charts.forEach(chart => {
        if (chart) {
            const ohlcSeries = chart.series.find(s => s.name === symbol);
            const volumeSeries = chart.series.find(s => s.name === 'Volume');

            if (ohlcSeries && volumeSeries) {
                ohlcSeries.addPoint(ohlcPoint, true, ohlc.length > maxElementsArray[maxZoom - 1]);
                volumeSeries.addPoint(volumePoint, true, volume.length > maxElementsArray[maxZoom - 1]);
            }
        }
    });
}