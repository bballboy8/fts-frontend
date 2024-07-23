Highcharts.setOptions({
    global: {
        useUTC: false
    },
    boost: {
        useGPUTranslations: true,
        usePreAllocated: true
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


function filterData(data, numPoints, startDate, endDate) {
    let filteredData = data;
    if (startDate && endDate) {
        filteredData = data.filter(point => new Date(point.date).getTime() >= startDate && new Date(point.date).getTime() <= endDate);
    }
    if (filteredData.length <= numPoints) {
        return filteredData;
    }

    // Select a specified number of points evenly distributed
    const step = filteredData.length / numPoints;
    const result = [];
    for (let i = 0; i < numPoints; i++) {
        result.push(filteredData[Math.floor(i * step)]);
    }
    return result;
}

function addChart(charContainerId, data, symbol, isPopoutChartWindow = false, dotNetObject = undefined) {


    updatingCharts[symbol] = false;
    return Highcharts.stockChart(charContainerId, {

        chart: {
            boostThreshold: 1,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            events: {
                load: function () {
                    var chart = this;
                    let chartWidth = chart.chartWidth;
                    chart.showLoading();
                    chart.ButtonNamespace = {};
                    chart.ButtonNamespace.symbolButton = addButtonToChart(chart, {
                        text: truncateText(`XNYS: ${symbol}`, 11, ''),
                        x: 0,
                        y:10,
                        width: 85,
                        height: 10,
                        title: `XNYS: ${symbol}`,
                        callback: function (e) {
                            $("#dvSymbolInput").remove();

                            var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${e.y}px;left:${e.x}px;"><input id="txtSymboleName" type="text" value="${chart.series[0].name}"/><button id="btnUpdateChartSymbol" type="button" datachartid="${charContainerId}">Ok</button><button id="btnCancelChartSymbol" type="button" datachartid="${charContainerId}">Cancel</button></div>`);

                            var btn = divInput.find('#btnUpdateChartSymbol');
                            var cancelBtn = divInput.find('#btnCancelChartSymbol');
                            cancelBtn.on("click", function () {
                                var dvInput = $(this).closest("#dvSymbolInput");
                                $("#dvSymbolInput").remove();
                            });
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
                                    chart.showLoading();
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
                                    chart.hideLoading();

                                } else {
                                    chart.showLoading();
                                    updateChartSymbol(chart.renderTo.id, symbol).then((seriesData) => {

                                        if (seriesData) {
                                            setDataToChart(chart, seriesData);

                                            chart.series[0].update({
                                                name: symbol,
                                            })
                                            chart.ButtonNamespace.symbolButton.attr({ text: truncateText(`XNYS: ${symbol}`, 11, '') });
                                            chart.ButtonNamespace.symbolButton.attr({ title: `XNYS: ${symbol}` });
                                            chart.hideLoading();
                                        }

                                        if (ChatAppInterop.dotnetReference) {
                                            ChatAppInterop.dotnetReference.invokeMethodAsync('SymbolChanged', chart.renderTo.id, symbol);
                                        }
                                        chart.hideLoading();
                                    });

                                }

                                $("#dvSymbolInput").remove();
                            });

                            $("body").append(divInput);
                        }
                    });

                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1m', callback: function () { setRange(symbol, 60 * 1000) }, x: 120, y: 10});
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '3m', callback: function () { setRange(symbol,3* 60 * 1000) }, x: 155, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '30m', callback: function () { setRange(symbol,30* 60 * 1000) }, x: 190, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1h', callback: function () { setRange(symbol,60* 60 * 1000) }, x: 230, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1D', callback: function () { setRange(symbol,24*60* 60 * 1000) }, x: 265, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '3D', callback: function () { setRange(symbol,3* 24 * 60 * 60 * 1000) }, x: 300, y: 10 });
                       
                    chart.ButtonNamespace.zoomInButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-in"></i>',
                        x: 360,
                        y:10,
                        callback: function () {
                            zoomChart(true, chart, dotNetObject);
                        }
                    });

                    chart.ButtonNamespace.zoomOutButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-out"></i>',
                        x: 400,
                        y:10,
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
                            x: chartWidth-40,
                            y:10,
                            callback: function () {
                                removeChart(chart);
                            }
                        });

                        chart.ButtonNamespace.maximizeButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-window"></i>',
                            x: chartWidth - 70,
                            y: 10,
                            callback: async function (e) {
                                removeUnusedElement();
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(chart.renderTo).data("chart-id");
                                var extremes = chart.xAxis[0].getExtremes();
                                //var data = chart.options.series[0].data;
                                removeChart(chart);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, true, chartId, extremes.min, extremes.max, symbol);
                            }
                        });

                        chart.ButtonNamespace.minimizeButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-dash-lg"></i>',
                            x: chartWidth - 100,
                            y: 10,
                            callback: async function () {
                                removeUnusedElement();
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(chart.renderTo).data("chart-id");
                                var extremes = chart.xAxis[0].getExtremes();
                                //var data = chart.options.series[0].data;
                                removeChart(chart);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, false, chartId, extremes.min, extremes.max, symbol)
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
            enabled:false
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
                turboThreshold: 0,
                marker: {
                    enabled: true,
                    radius: 2,
                    lineWidthPlus: 0,
                    lineWidth: 0,
                    states: {
                        hover: {
                            enabled: true

                        }
                    }
                }
            }
        },
        time: {
            timezone: 'America/New_York',
            //timezone: 'US/Eastern',
            useUTC: false
        },
        xAxis: [
            {
                events: {
                    afterSetExtremes: function (e) {
                        //if (!updatingCharts[symbol])
                        handleExtremesChange(symbol,this.chart, e.min, e.max);
                        // Remove points that are outside the new extremes
                        /*series.data.forEach(function (point) {
                            if (point.x >= e.min && point.x <= e.max) {
                                point.remove(false);
                            }
                        });*/

                        
                    }
                },
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
                },
                data: [],
                boostThreshold: 10000,
                turboThreshold: 0

            }
        ],
        exporting: {
            
        },
        navigation: {
            buttonOptions: {
                align: 'left',
                verticalAlign: 'top'
            }
        },
        navigator: {
            enabled: false
        },
        boost: {
            enabled: true,
            useGPUTranslations: true
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
const updatingCharts = {};
function handleExtremesChange(symbol,chart, min, max) {
    setTimeout(async function () {
        updatingCharts[symbol] = true;
        /*for (let i = chart.series[0].data.length - 1; i >= 0; i--) {
            let point = chart.series[0].data[i];
            if (point.x >= min && point.x <= max) {
                console.log("point to be remove");
                point.remove();
            }
        }*/
        let filterData = await getExtremeDataBySymbol(chart.series[0].name, min, max);
        addPointToChart(chart, filterData, false, false);
        updatingCharts[symbol] = false;
    }, 0);
}
function createButtonConfig(text, action, x, isRight) {
    const useHtml = text.includes('<i');

    return {
        text: text,
        onclick: action,
        useHTML: useHtml,
        theme: {
            fill: '#272C2F',
            stroke: useHtml ? 'none' : 'white',
            //r: 5,
            style: {
                color: '#FFFFFF',
            }
        },
        align: isRight?'right': 'left',
        verticalAlign: 'top',
        x: x,
        y: 0
    };
}

function SymbolClicked(symbol) {

    var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${0}px;left:${0}px;"><input id="txtSymboleName" type="text" value="${symbol}"/><button id="btnUpdateChartSymbol" type="button">Ok</button></div>`);

    $("body").append(divInput);
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

async function getChartDataByLastFeedPoint(symbol, lastPoint) {
    return await ChatAppInterop.dotnetReference.invokeMethodAsync("GetChartDataByLastFeedPoint", symbol, lastPoint);
}

async function getFilteredDataBySymbol(symbol,  range = undefined) {
    
    return await ChatAppInterop.dotnetReference.invokeMethodAsync("GetFilteredDataBySymbol", symbol, range);
}

async function getExtremeDataBySymbol(symbol, min = undefined, max = undefined) {

    return await ChatAppInterop.dotnetReference.invokeMethodAsync("GetExtremeDataBySymbol", symbol, min,max);
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

function setDataToChart(chart, seriesData) {
    //if (seriesData.length < 2) return;
    let series = chart.series[0];
    const dataPoints = seriesData.slice(1).map((data, index) =>
        processDataPoint(data, seriesData[index].price)
    );

    series.setData(dataPoints, false, false);
    chart.redraw();
    if (seriesData.length>1)
    chart.xAxis[0].setExtremes(dataPoints[0].x, dataPoints[dataPoints.length - 1].x);
}

function addPointToChart(chart, seriesData, redraw = false, animateOnUpdate = false) {
    if (seriesData.length < 2) return;
    let lastPoint = null;
    let series = chart.series[0];
    seriesData.slice(1).forEach((data, index) => {
        const point = processDataPoint(data, seriesData[index].price);
        series.addPoint(point, redraw, animateOnUpdate);
        lastPoint = point;
    });
    var extreme = series.getExtremes();
    //chart.xAxis[0].setExtremes(extreme.min, lastPoint.x);
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
let debounceTimer;
async function refreshCharts(symbol, seriesData) {
    
        let chart = getChartInstanceBySeriesName(symbol);
    if (chart) {
        addPointToChart(chart, seriesData, false, false);
        chart.redraw();
    }
        //removeOldPoints(chart, 3);
        //chart.redraw();
    
}

function handleChartRefresh(chart) {
    setTimeout(async function () {
        let series = chart.series[0];
        let lastPoint = series.options.data[series.options.data.length - 1];
        let seriesData = await getChartDataBySymbol(series.name, lastPoint);

        addPointToChart(chart, seriesData, false, false);
    }, 0);
        //removeOldPoints(chart, 3);
        //chart.redraw();
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

function popoutChartWindow(dotNetObject, element, chartIndx, symbol) {
    removeUnusedElement();

    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);

    addChart(chartContainerId, [], symbol, false, dotNetObject);

    removeWindowControlButtonsFromChart();

    /*if (dataPoints) {
        chart.series[0].setData(dataPoints, true, true)
    } else {
        getChartDataBySymbol(symbol).then((seriesData) => {
            setDataToChart(chart, seriesData);
            if (minPoint && maxPoint) {
                chart.xAxis[0].setExtremes(minPoint, maxPoint);
            }
        });
    }*/
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

    let existingChart = getChartInstanceBySeriesName(symbol)

    let chart = addChart(chartContainerId, [], symbol);

    addWindowControlButtonsToChart();

    getChartDataBySymbol(symbol).then((seriesData) => {
        setDataToChart(chart, seriesData);
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

function setMinMaxPointToPopoutChart(minPoint, maxPoint) {
    if (minPoint && maxPoint) {
        Highcharts.charts[0].xAxis[0].setExtremes(minPoint, maxPoint);
    }
}

function setDataToChartBySymbol(symbol, seriesData, isAllLoaded) {
    let chart = getChartInstanceBySeriesName(symbol);
    if (chart) {
        let series = chart.series[0];
        if (!seriesData) {
            // Handle case where no series data is provided (indicating all data loaded)
            chart.redraw();
            chart.hideLoading();
            return;
        }
        
        setTimeout(addPointToChart(chart, seriesData, false, false), 0);


        if (isAllLoaded) {
            chart.redraw();
            chart.hideLoading();
        }
    }
}

async function setRange(symbol, range) {
    let chart = getChartInstanceBySeriesName(symbol);
    if (chart) {

        let filtereddata = await getFilteredDataBySymbol(symbol, range);
        setDataToChart(chart, filtereddata);
        //chart.redraw();
    }
}