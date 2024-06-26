var groupingUnits = [['millisecond', [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]],
['second', [1, 2, 5, 10, 15, 30]],
['minute', [1, 2, 5, 10, 15,]],
['hour', [1, 2, 3, 4, 6, 8, 12]],
['day', [1, 3]],
['week', [1]],
['month', [1, 3, 6]],
['year', null]
];

const initialChartSymbols = [
    { id: 'chart-1', symbol: 'AAPL' },
    { id: 'chart-2', symbol: 'GOOGL' },
    { id: 'chart-3', symbol: 'MSFT' },
    { id: 'chart-4', symbol: 'TSLA' },
    { id: 'chart-5', symbol: 'AMD' },
    { id: 'chart-6', symbol: 'AMZN' },
    { id: 'chart-7', symbol: 'META' },
    { id: 'chart-8', symbol: 'GOOG' }
];

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

function addChart(charContainerId, data, symbol, isPopoutChartWindow = false, dotNetObject = undefined) {

    //Highcharts.setOptions({
    //    lang: {
    //        rangeSelectorZoom: ""
    //    }
    //});

    return Highcharts.stockChart(charContainerId, {

        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            time: {
                //timezone: 'America/New_York',
                useUTC: false
            },
            plotOptions: {
                series: {
                    turboThreshold: 0
                }
            },
            events: {
                load: function () {
                    var chart = this;
                    chart.ButtonNamespace = {};

                    chart.ButtonNamespace.symbolButton = addButtonToChart(chart, {
                        text: truncateText(`XNYS: ${symbol}`, 11, ''),
                        width: 85,
                        height: 10,
                        title: `XNYS: ${symbol}`,
                        callback: function (e) {
                            let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;

                            if (symbolList == null) {
                                symbolList = initialChartSymbols;
                            }

                            $("#dvSymbolInput").remove();

                            var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${e.y}px;left:${e.x}px;"><input id="txtSymboleName" type="text" value="${symbolList[Number(charContainerId.split("-")[1]) - 1].symbol}"/><button id="btnUpdateChartSymbol" type="button" data-chart-id="${charContainerId}">Ok</button></div>`);

                            var btn = divInput.find('#btnUpdateChartSymbol');

                            btn.on("click", function () {
                                var dvInput = $(this).closest("#dvSymbolInput")
                                symbol = $("#txtSymboleName", dvInput).val();
                                var chartId = $(chart.renderTo).data("chart-id");
                                //var chartBoxData = $('#' + chartId).data();

                                loadSymbolData(symbol, function (seriesData) {
                                    chart.series[0].update({
                                        name: symbol,
                                        data: seriesData,
                                        color: '#C01620',
                                        upColor: '#16C05A',
                                        lineWidth: 0,
                                        marker: { enabled: true, radius: 4 },
                                        tooltip: { valueDecimals: 2 },
                                        states: { hover: { lineWidthPlus: 0 } }
                                    });

                                    removeWindowControlButtonsFromChart();
                                });

                                let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;

                                if (symbolList == null) {
                                    symbolList = initialChartSymbols;
                                }

                                var indx = Number(chartId);
                                symbolList[indx - 1].symbol = symbol;
                                localStorage.setItem('ChartSymbols', JSON.stringify(symbolList));

                                chart.ButtonNamespace.symbolButton.attr({ text: truncateText(`XNYS: ${symbol}`, 11, '') });
                                chart.ButtonNamespace.symbolButton.attr({ title: `XNYS: ${symbol}` });

                                $("#dvSymbolInput").remove();

                                if (dotNetObject) {
                                    dotNetObject.invokeMethodAsync('SymbolChanged', symbol);
                                }
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
                                removeChart(chart);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, true, chartId, extremes.min, extremes.max, symbol)
                            }
                        });

                        chart.ButtonNamespace.minimizeButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-dash-lg"></i>',
                            callback: async function () {
                                removeUnusedElement();
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(chart.renderTo).data("chart-id");
                                var extremes = chart.xAxis[0].getExtremes();
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
                        x: 360,
                        y: 0
                    }, false, 'spacingBox');

                    chart.ButtonNamespace.zoomOutButton.align({
                        align: 'left',
                        x: 400,
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
        },
        rangeSelector: {
            //height: 0,
            allButtonsEnabled: true,
            buttons: [
                { type: 'minute', count: 1, text: '1m' },
                { type: 'minute', count: 3, text: '3m' },
                { type: 'minute', count: 30, text: '30m' },
                { type: 'hour', count: 1, text: '1h' },
                { type: 'day', count: 1, text: '1D' },
                { type: 'day', count: 3, text: '3D' },
            ],
            //selected: 0,
            //dropdown: 'responsive', //'always', 'responsive', 'never'
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
                align: 'left', // Horizontal alignment (left, center, right)
                x: 35, // Horizontal offset
                y: 0 // Vertical offset
            },
        },
        xAxis: [
            {
                type: 'datetime',
                offset: 0,
                labels: {
                    align: 'left',
                    x: 5,
                    style: { color: fontColor },

                    //formatter: function () {
                    //    //return Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.value);
                    //    //return Highcharts.dateFormat('%H:%M:%S', this.value);
                    //    debugger;

                    //}
                },
                lineWidth: 0,
                opposite: false,
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
            }
        ],
        yAxis: [
            {
                labels: {
                    align: 'left',
                    x: 5,
                    style: {
                        color: fontColor // Green color
                    }
                },
                //height: '65%',
                lineWidth: 2,
                resize: { enabled: true }
            }
        ],
        tooltip: { split: true },
        series: [
            {
                name: symbol,
                data: data,
                color: '#C01620', // Color for the fall
                upColor: '#16C05A', // Color for the rise
                lineWidth: 0,
                marker: {
                    enabled: true,
                    radius: 4
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

function RefreshChartData() {
    let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;
    if (symbolList == null) {
        symbolList = initialChartSymbols;
    }
    Highcharts.charts.forEach(chart => {
        if (chart) {
            let chartId = chart.renderTo.id;
            var symbol = symbolList[Number(chartId.split("-")[1]) - 1].symbol;
            loadSymbolData(symbol, function (seriesData) {
                chart.series[0].update({
                    name: symbol,
                    data: seriesData,
                    color: '#C01620', // Color for the fall
                    upColor: '#16C05A', // Color for the rise
                    lineWidth: 0,
                    marker: { enabled: true, radius: 4 },
                    tooltip: { valueDecimals: 2 },
                    states: { hover: { lineWidthPlus: 0 } }
                });
            });

            console.log("Refreshed data");
        }
    });
}

function removeWindowControlButtonsFromChart() {
    var chart = Highcharts.charts.filter(c => c)[0];
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

    loadSymbolData(symbol, function (seriesData, currSymbol) {
        addChart(chartContainerId, seriesData, currSymbol);
        if (totalCharts == 1) {
            removeWindowControlButtonsFromChart();
        }
    });
}

function popoutChartWindow(dotNetObject, element, chartIndx, minPoint, maxPoint, symbol) {
    removeUnusedElement();

    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);

    loadSymbolData(symbol, function (seriesData, currSymbol) {
        var chart = addChart(chartContainerId, seriesData, currSymbol, false, dotNetObject);
        if (minPoint && maxPoint) {
            chart.xAxis[0].setExtremes(minPoint, maxPoint);
        }
        removeWindowControlButtonsFromChart();
    });

}

function popinChartWindow(chartIndx, minPoint, maxPoint, symbol) {

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


    loadSymbolData(symbol, function (seriesData, currSymbol) {
        var chart = addChart(chartContainerId, seriesData, currSymbol);
        if (minPoint && maxPoint) {
            chart.xAxis[0].setExtremes(minPoint, maxPoint);
        }
        addWindowControlButtonsToChart();
    });
}

function createDashboard(totalCharts) {

    removeUnusedElement();

    let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;
    if (symbolList == null) {
        localStorage.setItem('ChartSymbols', JSON.stringify(initialChartSymbols));
        symbolList = initialChartSymbols;
    }

    var chartList = $("#chartList");
    chartList.html('');
    if (Highcharts.charts) Highcharts.charts.forEach(c => { if (c) c.destroy() });

    if (totalCharts == 5) {
        chartList.append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>')).append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    for (var indx = 1; indx <= Number(totalCharts); indx++) {
        var rec = symbolList[indx - 1]; //symbolList.find(item => item.id === "chart+" + indx);
        addChartBox(totalCharts, indx, rec.symbol);
    }
}

function loadDashboard() {

    var totalCharts = localStorage.getItem('SavedLayout') ?? 5;
    let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;
    if (symbolList == null) {
        localStorage.setItem('ChartSymbols', JSON.stringify(initialChartSymbols));
        symbolList = initialChartSymbols;
    }

    var chartList = $("#chartList");

    chartList.html('');

    if (Highcharts.charts) Highcharts.charts.forEach(c => { if (c) c.destroy() });

    if (totalCharts == 5) {
        chartList.append($('<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>')).append($('<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'));
    }

    for (var indx = 1; indx <= Number(totalCharts); indx++) {
        var rec = symbolList[indx - 1]; //symbolList.find(item => item.id === "chart+" + indx);
        addChartBox(totalCharts, indx, rec.symbol);
    }
}

function loadSymbolData(symbol, onLoaded) {
    T5.dotReference.invokeMethodAsync("GetStockBySymbol", symbol).then(resultData => {
        var seriesData = [];
        for (var i = 1; i < resultData.length; i++) {
            var color = resultData[i].p > resultData[i - 1].p ? 'green' : 'red';
            seriesData.push({ x: new Date(resultData[i].t), y: resultData[i].p, color: color });
            //seriesData.push({ x: new Date(resultData[i].t).getTime(), y: resultData[i].p, color: color });

        }
        onLoaded(seriesData, symbol);
    });
}

function saveLayout() {
    localStorage.setItem('SavedLayout', $("#chartList .chart-box").length);
    for (var i = 0; i < $("#chartList .chart-box").length; i++) {
        localStorage.setItem('SaveSymbol', null);
    }
    console.log(localStorage.getItem('SavedLayout'));
}

var T5 = window.T5 || {};
T5.dotReference = null;
T5.SetDotNetReference = function (ldotreference) {
    T5.dotReference = ldotreference;
}

