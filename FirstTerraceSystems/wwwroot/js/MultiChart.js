Highcharts.setOptions({
    global: {
        useUTC: false
    }
});

const defaultkeyboardNavigationOrder = [
    'symbolButton',
    'rangeSelector',
    'zoomInButton',
    'zoomOutButton',
    'minimizeButton',
    'maximizeButton',
    'closeChartButton',
    'series',
    'zoom',
    'chartMenu',
    'legend'
];

const singleChartkeyboardNavigationOrder = [
    'symbolButton',
    'rangeSelector',
    'zoomInButton',
    'zoomOutButton',
    'series',
    'zoom',
    'chartMenu',
    'legend'
];

var ChatAppInterop = window.ChatAppInterop || {};

ChatAppInterop.dotnetReference = null;

ChatAppInterop.setDotNetReference = function (dotnetReference) {
    ChatAppInterop.dotnetReference = dotnetReference;
};

function addChart(charContainerId, data, symbol, isPopoutChartWindow = false, dotNetObject = undefined) {

    

    return Highcharts.stockChart(charContainerId, {

        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            events: {
                load: function () {
                    var chart = this;

                    chart.showLoading();

                    chart.ButtonNamespace = {};

                    chart.ButtonNamespace.symbolButton = addButtonToChart(chart, {
                        text: truncateText(`XNYS: ${symbol}`, 11, ''),
                        width: 85,
                        height: 10,
                        title: `XNYS: ${symbol}`,
                        callback: function (e) {
                            $("#dvSymbolInput").remove();

                            var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${e.y}px;left:${e.x}px;"><input id="txtSymboleName" type="text" value="${chart.series[0].name}"/><button id="btnUpdateChartSymbol" type="button" data-chart-id="${charContainerId}">Ok</button></div>`);

                            var btn = divInput.find('#btnUpdateChartSymbol');

                            btn.on("click", function () {

                                var dvInput = $(this).closest("#dvSymbolInput")
                                symbol = $("#txtSymboleName", dvInput).val();
                                symbol = symbol.toUpperCase();

                                if (symbol == chart.series[0].name || symbol == '') {
                                    $("#dvSymbolInput").remove();
                                    return;
                                }

                                let existingChart = getChartInstanceBySeriesName(symbol)

                                if (existingChart) {
                                    symbol = existingChart.series[0].name;
                                    chart.series[0].setData(existingChart.series[0].options.data);

                                    chart.series[0].update({
                                        name: symbol,
                                    })
                                    chart.ButtonNamespace.symbolButton.attr({ text: truncateText(`XNYS: ${symbol}`, 11, '') });
                                    chart.ButtonNamespace.symbolButton.attr({ title: `XNYS: ${symbol}` });

                                    if (ChatAppInterop.dotnetReference) {
                                        ChatAppInterop.dotnetReference.invokeMethodAsync('SymbolChanged', chart.renderTo.id, symbol);
                                    }

                                } else {
                                    updateChartSymbol(chart.renderTo.id, symbol).then((seriesData) => {

                                        if (seriesData) {
                                            setDataToChart(chart.series[0], seriesData);

                                            chart.series[0].update({
                                                name: symbol,
                                            })
                                            chart.ButtonNamespace.symbolButton.attr({ text: truncateText(`XNYS: ${symbol}`, 11, '') });
                                            chart.ButtonNamespace.symbolButton.attr({ title: `XNYS: ${symbol}` });

                                            if (ChatAppInterop.dotnetReference) {
                                                ChatAppInterop.dotnetReference.invokeMethodAsync('SymbolChanged', chart.renderTo.id, symbol);
                                            }
                                        }
                                    });

                                }

                                $("#dvSymbolInput").remove();
                            });

                            $("body").append(divInput);
                        }
                    });

                    chart.ButtonNamespace.zoomInButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-in"></i>',
                        callback: function () {
                            zoomChart(true, chart, dotNetObject);
                        }
                    });

                    chart.ButtonNamespace.zoomOutButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-out"></i>',
                        callback: function () {
                            zoomChart(false, chart, dotNetObject);
                        }
                    });

                    var customComponents = {
                        symbolButton: new ButtonComponent(chart, chart.ButtonNamespace.symbolButton),
                        zoomInButton: new ButtonComponent(chart, chart.ButtonNamespace.zoomInButton),
                        zoomOutButton: new ButtonComponent(chart, chart.ButtonNamespace.zoomOutButton),
                    };

                    if (!isPopoutChartWindow) {

                        chart.ButtonNamespace.closeChartButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-x-lg"></i>',
                            hoverColor: '#FF0000',
                            callback: function () {
                                removeChart(chart);
                            }
                        });

                        chart.ButtonNamespace.maximizeButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-window"></i>',
                            callback: async function (e) {
                                removeUnusedElement();
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(chart.renderTo).data("chart-id");
                                var extremes = chart.xAxis[0].getExtremes();
                                var data = chart.options.series[0].data;
                                removeChart(chart);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, true, chartId, extremes.min, extremes.max, symbol, data);
                            }
                        });

                        chart.ButtonNamespace.minimizeButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-dash-lg"></i>',
                            callback: async function () {
                                removeUnusedElement();
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(chart.renderTo).data("chart-id");
                                var extremes = chart.xAxis[0].getExtremes();
                                var data = chart.options.series[0].data;
                                removeChart(chart);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, false, chartId, extremes.min, extremes.max, symbol, data)
                            }
                        });

                        customComponents.minimizeButton = new ButtonComponent(chart, chart.ButtonNamespace.minimizeButton);
                        customComponents.maximizeButton = new ButtonComponent(chart, chart.ButtonNamespace.maximizeButton);
                        customComponents.closeChartButton = new ButtonComponent(chart, chart.ButtonNamespace.closeChartButton);
                    }

                    chart.update({
                        accessibility: {
                            customComponents: customComponents,
                            keyboardNavigation: {
                                order: !isPopoutChartWindow ? defaultkeyboardNavigationOrder : singleChartkeyboardNavigationOrder
                            }
                        }
                    });
                },
                //redraw: function () {
                //    var chart = this;
                //},
                render: function () {
                    var chart = this;

                    chart.ButtonNamespace.symbolButton.align({
                        align: 'left',
                        x: 0,
                        y: -2
                    }, true, 'spacingBox');

                    chart.ButtonNamespace.zoomInButton.align({
                        align: 'left',
                        x: 360, //360
                        y: 0
                    }, false, 'spacingBox');

                    chart.ButtonNamespace.zoomOutButton.align({
                        align: 'left',
                        x: 400, //400
                        y: 0
                    }, false, 'spacingBox');

                    if (!isPopoutChartWindow) {
                        chart.ButtonNamespace.closeChartButton.align({
                            align: 'right',
                            x: -30,
                            y: 0
                        }, false, 'spacingBox');

                        chart.ButtonNamespace.maximizeButton.align({
                            align: 'right',
                            x: -70,
                            y: 0
                        }, false, 'spacingBox');

                        chart.ButtonNamespace.minimizeButton.align({
                            align: 'right',
                            x: -110,
                            y: 0
                        }, false, 'spacingBox');
                    }
                }
            },
            zooming: {
                type: 'x'
            }
        },
        rangeSelector: {
            //height: 0,
            //allButtonsEnabled: true,
            buttons: [
                { type: 'minute', count: 1, text: '1m' },
                { type: 'minute', count: 3, text: '3m' },
                { type: 'minute', count: 30, text: '30m' },
                { type: 'hour', count: 1, text: '1h' },
                { type: 'day', count: 1, text: '1D' },
                { type: 'day', count: 3, text: '3D' },
            ],
            selected: 0,
            dropdown: 'responsive', //'always', 'responsive', 'never'
            inputEnabled: false,
            buttonTheme: {
                //visibility: 'hidden',
                fill: '#272C2F',
                stroke: '#272C2F',
                style: {
                    color: '#FFFFFF',
                },
                states: {
                    hover: { fill: '#5B6970' },
                    select: {
                        fill: '#5b6970',
                        style: {
                            color: '#FFFFFF',
                            fontWeight: 'normal'
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
            verticalAlign: 'top',
            buttonSpacing: 10,
            buttonPosition: {
                align: 'left',
                x: 35,
                y: 0
            },
        },
        tooltip: {
            split: true,
            formatter: function () {
                return [
                    `<b>${Highcharts.dateFormat('%A, %e %b. %H:%M:%S', this.x, false)}</b>`,
                    ...(this.points ? this.points.map(point => `${point.series.name}: ${Highcharts.numberFormat(point.y / 10000, 2)}`) : [])
                ]
            },
        },
        plotOptions: {
            series: {
                turboThreshold: 0
            }
        },
        time: {
            //timezone: 'America/New_York',
            //timezone: 'US/Eastern',
            useUTC: false
        },
        xAxis: [
            {
                type: 'datetime',
                //offset: 0,
                labels: {
                    align: 'left',
                    x: 5,
                    style: { color: fontColor },
                    formatter: function () {
                        return Highcharts.dateFormat('%H:%M:%S', this.value, false);
                    }
                },
                dateTimeLabelFormats: {
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%e. %b',
                    week: '%e. %b',
                    month: '%b \'%y',
                    year: '%Y'
                },
                lineWidth: 0,
                opposite: false,
            },
        ],
        yAxis: [
            {
                labels: {
                    align: 'left',
                    x: 5,
                    style: {
                        color: fontColor // Green color
                    },
                    formatter: function () {
                        return Highcharts.numberFormat(this.value / 10000, 2);
                    }
                },
                //height: '65%',
                lineWidth: 2,
                resize: { enabled: true },
            }
        ],
        series: [
            {
                name: symbol,
                data: data,
                dataGrouping: {
                    enabled: false
                },
                color: '#C01620',
                upColor: '#16C05A',
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
            }
        ],
        exporting: {
            enabled: false,
            accessibility: {
                enabled: false
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
            highContrastTheme: null,
            keyboardNavigation: {
                enabled: true,
                focusBorder: {
                    enabled: false,
                    hideBrowserFocusOutline: false
                },
            },
        }
    });
}

function removeChart(chart) {

    if ($("#chartList .chart-box").length == 1) {
        return;
    }

    var chartContaner = $(chart.renderTo);
    var chartId = chartContaner.data("chart-id");
    $(".chart-box.chart-box-" + chartId).remove();
    //$("#popup-chart-" + chartId).remove();

    chart.destroy();
    var totalCharts = $("#chartList .chart-box").length;


    var cssClass = "col-12";
    if (totalCharts == 1) {
        cssClass = "col-12";
        //$("#chartList").sortable({ disabled: true });
        //if (!$(".chart-container").hasClass("chart-popup"))
        /*$(".chart-container").off("dblclick");*/
        removeWindowControlButtonsFromChart()
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


    var chartBoxes = $('#chartList').find('.chart-box');

    chartBoxes.sort(function (a, b) {
        var counterA = $('.chart-container', a).data('chart-id');
        var counterB = $('.chart-container', b).data('chart-id');
        return counterA - counterB;
    });


    if (totalCharts == 5) {
        var chartListCol1 = $('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>');
        var chartListCol2 = $('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>');

        chartBoxes.slice(0, 3).appendTo(chartListCol2.find('#chartListCol2'));
        chartBoxes.slice(3).appendTo(chartListCol1.find('#chartListCol1'));

        $("#chartList").append(chartListCol1).append(chartListCol2);

    } else {
        chartBoxes.appendTo('#chartList');
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

function zoomChart(zoomIn, chart, dotNetObject = undefined) {

    var xAxis = chart.xAxis[0];
    var extremes = chart.xAxis[0].getExtremes();
    var range = extremes.max - extremes.min;
    var newMin, newMax;

    if (zoomIn) {
        newMin = extremes.min + range * 0.2;
        newMax = extremes.max - range * 0.2;
    } else {
        newMin = extremes.min - range * 0.2;
        newMax = extremes.max + range * 0.2;
    }

    newMin = Math.max(xAxis.dataMin, newMin);
    newMax = Math.min(xAxis.dataMax, newMax);
    xAxis.setExtremes(newMin, newMax);

    if (dotNetObject) {
        dotNetObject.invokeMethodAsync('ZoomingChanged', newMin, newMax);
    }
}


function removeWindowControlButtonsFromChart() {
    let chart = Highcharts.charts.filter(c => c)[0];
    if (chart) {

        chart.ButtonNamespace.closeChartButton.hide();
        chart.ButtonNamespace.minimizeButton.hide();
        chart.ButtonNamespace.maximizeButton.hide();

        chart.update({
            accessibility: {
                keyboardNavigation: {
                    order: singleChartkeyboardNavigationOrder
                }
            }
        });
    }
}

function addWindowControlButtonsToChart() {
    Highcharts.charts.forEach(function (chart) {
        if (chart) {

            chart.ButtonNamespace.closeChartButton.show();
            chart.ButtonNamespace.minimizeButton.show();
            chart.ButtonNamespace.maximizeButton.show();

            chart.update({
                accessibility: {
                    keyboardNavigation: {
                        order: defaultkeyboardNavigationOrder
                    }
                }
            });
        };
    });
}

async function getChartDataBySymbol(symbol, lastPoint = undefined) {
    return await ChatAppInterop.dotnetReference.invokeMethodAsync("GetChartDataBySymbol", symbol, lastPoint);
}

async function updateChartSymbol(chartId, symbol) {
    return await ChatAppInterop.dotnetReference.invokeMethodAsync("UpdateChartSymbol", chartId, symbol);
}

function processDataPoint(data, previousPrice) {
    return {
        primaryKey: data.id,
        x: new Date(data.date).getTime(),
        y: data.price,
        color: data.price > previousPrice ? 'green' : 'red'
    };
}

function setDataToChart(series, seriesData) {
    if (seriesData.length < 2) return;

    const dataPoints = seriesData.slice(1).map((data, index) =>
        processDataPoint(data, seriesData[index].price)
    );

    series.setData(dataPoints, true, true);
}

function addPointToChart(series, seriesData) {
    if (seriesData.length < 2) return;

    seriesData.slice(1).forEach((data, index) => {
        const point = processDataPoint(data, seriesData[index].price);
        series.addPoint(point, false, false);
    });
}

function removeOldPoints(chart, daysToKeep) {
    var now = Date.now();
    var cutoffTime = now - daysToKeep * 24 * 60 * 60 * 1000;
    var series = chart.series[0];
    var data = series.options.data;

    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].x.getTime() < cutoffTime) {
            //if (data[i].x < cutoffTime) {
            series.removePoint(i, false);
        } else {
            break;
        }
    }
}

async function RefreshChartBySymbol() {
    for (let chart of Highcharts.charts) {
        if (!chart) continue;

        await ChatAppInterop.dotnetReference.invokeMethodAsync("RefreshChartBySymbol", chart.series[0].name);
    }
}

async function refreshCharts() {
    for (let chart of Highcharts.charts) {
        if (!chart) continue;

        let series = chart.series[0];
        let lastPoint = series.options.data[series.options.data.length - 1];
        let seriesData = await getChartDataBySymbol(series.name, lastPoint);
        addPointToChart(series, seriesData, false, false);
        //removeOldPoints(chart, 3);
        chart.redraw();
    }
}


function addClassToChartBoxes(totalCharts) {
    let cssClass = "col-12";

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

    $("#chartList .chart-box").addClass(cssClass);
}




function addChartBoxToChartList(totalCharts, chartBox) {
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
}

function addChartBox(totalCharts, chartIndx, symbol) {

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

    var chart = addChart(chartContainerId, [], symbol);

    if (totalCharts == 1) {
        removeWindowControlButtonsFromChart();
    }

    return chart
}

function createDashboard(totalCharts, initialChartSymbols) {

    removeUnusedElement();

    let charts = Highcharts.charts.filter(hc => hc)

    if (charts.length == totalCharts) return;

    let chartList = $("#chartList");

    chartList.html('');

    charts.forEach(c => c.destroy());

    if (totalCharts == 5) {
        chartList
            .append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>'))
            .append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    for (let indx = 1; indx <= totalCharts; indx++) {

        let symbolInfo = initialChartSymbols[indx - 1];

        let chart = addChartBox(totalCharts, indx, symbolInfo.symbol);
    }
}

function loadDashboard(totalCharts, initialChartSymbols) {

    let chartList = $("#chartList");

    if (totalCharts == 5) {
        chartList
            .append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>'))
            .append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    initialChartSymbols.slice(0, totalCharts).forEach((chartSymbol, index) => {
        const chart = addChartBox(totalCharts, index + 1, chartSymbol.symbol);
    });
    //var seriesData = await getChartDataBySymbol(rec.symbol);
    //setDataToChart(chart, seriesData);
}

async function popoutChartWindow(dotNetObject, element, chartIndx, minPoint, maxPoint, symbol, dataPoints) {
    removeUnusedElement();

    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);

    var chart = addChart(chartContainerId, [], symbol, false, dotNetObject);

    removeWindowControlButtonsFromChart();

    if (dataPoints) {
        chart.series[0].setData(dataPoints, true, true)
    } else {
        getChartDataBySymbol(symbol).then((seriesData) => {
            setDataToChart(chart.series[0], seriesData);
            if (minPoint && maxPoint) {
                chart.xAxis[0].setExtremes(minPoint, maxPoint);
            }
        });
    }
}

async function popinChartWindow(chartIndx, minPoint, maxPoint, symbol) {

    var totalCharts = $("#chartList .chart-box").length + 1;

    //Reset Chart Box
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

    var chartBoxes = $('#chartList').find('.chart-box');

    chartBoxes.sort(function (a, b) {
        var counterA = $('.chart-container', a).data('chart-id');
        var counterB = $('.chart-container', b).data('chart-id');
        return counterA - counterB;
    });


    if (totalCharts == 5) {
        var chartListCol1 = $('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>');
        var chartListCol2 = $('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>');

        chartBoxes.slice(0, 3).appendTo(chartListCol2.find('#chartListCol2'));
        chartBoxes.slice(3).appendTo(chartListCol1.find('#chartListCol1'));

        $("#chartList").append(chartListCol1).append(chartListCol2);

    } else {
        chartBoxes.appendTo('#chartList');
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


    var chart = addChart(chartContainerId, [], symbol);

    addWindowControlButtonsToChart();

    getChartDataBySymbol(symbol).then((seriesData) => {
        setDataToChart(chart.series[0], seriesData);
    });

    if (minPoint && maxPoint) {
        chart.xAxis[0].setExtremes(minPoint, maxPoint);
    }
}


function getChartInstance(chartId) {
    let chart = Highcharts.charts.find(c => c && c.renderTo.id === chartId);
    return chart || null;
}

function getChartInstanceBySeriesName(seriesName) {
    let chart = Highcharts.charts.find(c => c && c.series[0]?.name === seriesName);
    return chart || null;
}

function setDataToChartBySymbol(symbol, seriesData, isAllLoaded) {
    let chart = getChartInstanceBySeriesName(symbol);
    if (chart) {
        let series = chart.series[0];
        if (series.data.length === 0) {
            setDataToChart(series, seriesData);
        } else {
            addPointToChart(series, seriesData);
        }
        if (isAllLoaded) {
            chart.redraw();
            chart.hideLoading()
        }
    }
}