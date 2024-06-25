var ohlc = [], volume = [], dataLength = 0, zoomLevels = [], maxZoom = 5, currentZoomLevel = 0;
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

function addChart(charContainerId, pOHLC, pVolume, pGroupingUnits, symbol, isDraggable = true, dotNetObject = undefined) {

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
            events: {
                load: function () {
                    var chart = this;
                }
            }
        },
        plotOptions: {
            series: {
                turboThreshold: 0
            }
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
            //height: '65%',
            lineWidth: 2,
            resize: { enabled: true }
        }],
        tooltip: { split: true },
        series: [
            {
                name: symbol,
                data: pOHLC,
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
            /*{
                type: 'column',
                name: 'Volume',
                data: pVolume,
                yAxis: 1,
                dataGrouping: {
                    units: pGroupingUnits
                },
                color: isDarkMode ? '#C01620' : '#16C05A', // Fall or rise color
                upColor: isDarkMode ? '#16C05A' : '#C01620' // Rise or fall color
            }*/
        ],
        exporting: {
            enabled: true,
            accessibility: {
                enabled: false
            },
            buttons: {
                contextButton: {
                    enabled: false,
                },

                closeButton: {
                    useHTML: true,
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
                                }
                            },
                            hover: {
                                fill: '#5B6970',
                                stroke: '#5B6970',
                            },
                        }
                    },
                    text: `XNYS:${symbol} &nbsp &nbsp`,
                    onclick: function (e) {
                        let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;
                        if (symbolList == null) {
                            symbolList = initialChartSymbols;
                        }
                        $("#dvSymbolInput").remove();
                        var input = $(`<div id="dvSymbolInput" style="position:absolute;top:${e.y}px;left:${e.x}px;"><input id="txtSymboleName" type="text" value="${symbolList[Number(charContainerId.split("-")[1]) - 1].symbol}"/><button id="btnUpdateChartSymbol" type="button" data-chart-id="${charContainerId}">Ok</button></div>`)
                        $("body").append(input);
                    },
                },
                zoomInButton: {
                    x: 355,
                    y: 0,
                    enabled: true,
                    className: 'btn btn-sm btn-zoom-in btn-custom-exporting',
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
                        zoomChart(true, this, dotNetObject);
                    },
                },
                zoomOutButton: {
                    x: 389,
                    y: 0,
                    enabled: true,
                    className: 'btn btn-sm btn-zoom-out btn-custom-exporting',
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
                        zoomChart(false, this, dotNetObject);
                    },
                },
                minimizeButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -60,
                    enabled: isDraggable,
                    className: 'btn btn-sm btn-minimize btn-custom-exporting',
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
                    text: '<i class="bi bi-dash-lg"></i>',
                    onclick: async function (e) {
                        var jsObjectReference = DotNet.createJSObjectReference(window);
                        var chartId = $(this.renderTo).data("chart-id");
                        var extremes = this.xAxis[0].getExtremes();
                        removeChart(this);
                        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, false, chartId, ohlc, volume, groupingUnits, extremes.min, extremes.max, symbol);
                    },
                },
                maximizeButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -30,
                    enabled: isDraggable,
                    className: 'btn btn-sm btn-maximize btn-custom-exporting',
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
                    text: '<i class="bi bi-window"></i> ',
                    onclick: async function (e) {
                        var jsObjectReference = DotNet.createJSObjectReference(window);
                        var chartId = $(this.renderTo).data("chart-id");
                        var extremes = this.xAxis[0].getExtremes();
                        removeChart(this);
                        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, true, chartId, ohlc, volume, groupingUnits, extremes.min, extremes.max, symbol)
                    },
                },
                closeChartButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -2,
                    enabled: isDraggable,
                    className: 'btn btn-sm btn-close-chart btn-custom-exporting',
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
                    text: '<i class="bi bi-x-lg"></i>',

                    onclick: function (e) {
                        if (isDraggable) removeChart(this);
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
                enabled: true,
                focusBorder: {
                    enabled: false,
                    hideBrowserFocusOutline: false
                },
            },
        }
    });

    $("body").off("click", "#btnUpdateChartSymbol").on("click", "#btnUpdateChartSymbol", function () {
        var dvInput = $(this).closest("#dvSymbolInput")
        symbol = $("#txtSymboleName", dvInput).val();
        var chartId = $(this).data("chartId");
        var chartBoxData = $('#' + chartId).data();
        if (chartBoxData.highchartsChart) {
            var chart = Highcharts.charts[chartBoxData.highchartsChart];
            if (chart) {
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
                let symbolList = JSON.parse(localStorage.getItem('ChartSymbols')) || null;
                if (symbolList == null) {
                    symbolList = initialChartSymbols;
                }
                var indx = Number(chartId.split("-")[1]);
                symbolList[indx - 1].symbol = symbol;
                // Save the updated list back to localStorage
                localStorage.setItem('ChartSymbols', JSON.stringify(symbolList));
            }
        }
        $("#dvSymbolInput").remove();
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
    if (chart && chart.exportSVGElements) {
        chart.exportSVGElements.filter(f => f).slice(-3).forEach(function (element) {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        chart.exportSVGElements = chart.exportSVGElements.slice(0, -3);
        chart.exportSVGElements.length = 0;
        chart.isDirtyBox = true;
        chart.redraw();
    }
}

function addWindowControlButtonsToChart() {
    Highcharts.charts.forEach(function (chart) {
        if (chart && chart.exportSVGElements && chart.exportSVGElements.length < 3) {
            chart.update({
                exporting: {
                    buttons: {
                        minimizeButton: {
                            align: 'right',
                            verticalAlign: 'top',
                            x: -60,
                            enabled: true,
                            className: 'btn btn-sm btn-minimize btn-custom-exporting',
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
                            text: '<i class="bi bi-dash-lg"></i>',
                            onclick: async function (e) {
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(this.renderTo).data("chart-id");
                                var extremes = this.xAxis[0].getExtremes();
                                removeChart(this);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, false, chartId, ohlc, volume, groupingUnits, extremes.min, extremes.max);
                            },
                        },
                        maximizeButton: {
                            align: 'right',
                            verticalAlign: 'top',
                            x: -30,
                            enabled: true,
                            className: 'btn btn-sm btn-maximize btn-custom-exporting',
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
                            text: '<i class="bi bi-window"></i> ',
                            onclick: async function (e) {
                                var jsObjectReference = DotNet.createJSObjectReference(window);
                                var chartId = $(this.renderTo).data("chart-id");
                                var extremes = this.xAxis[0].getExtremes();
                                removeChart(this);
                                await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, true, chartId, ohlc, volume, groupingUnits, extremes.min, extremes.max);
                            },
                        },
                        closeChartButton: {
                            align: 'right',
                            verticalAlign: 'top',
                            x: -2,
                            enabled: true,
                            className: 'btn btn-sm btn-close-chart btn-custom-exporting',
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
                            text: '<i class="bi bi-x-lg"></i>',

                            onclick: function (e) {
                                removeChart(this);
                            },
                        }
                    }
                }
            });
        };
    });
}

function zoomChart(zoomIn, chart, dotNetObject = undefined) {
    //if (zoomIn)
    //    currentZoomLevel++;
    //else
    //    currentZoomLevel--;
    //if (currentZoomLevel > 5)
    //    currentZoomLevel = 5
    //if (currentZoomLevel < 1)
    //    currentZoomLevel = 1

    //if (currentZoomLevel >= 1 && currentZoomLevel <= 5) {
    //    chart.xAxis.forEach(xAxes => xAxes.setExtremes(zoomLevels[currentZoomLevel - 1].min, zoomLevels[currentZoomLevel - 1].max));
    //}

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
        addChart(chartContainerId, seriesData, volume, groupingUnits, currSymbol);
        if (totalCharts == 1) {
            removeWindowControlButtonsFromChart();
        }
    });
}

function popoutChartWindow(dotNetObject, element, chartIndx, ohlc, volume, groupingUnits, minPoint, maxPoint, symbol) {
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);

    loadSymbolData(symbol, function (seriesData, currSymbol) {
        var chart = addChart(chartContainerId, seriesData, volume, groupingUnits, currSymbol, false, dotNetObject);
        if (minPoint && maxPoint) {
            chart.xAxis[0].setExtremes(minPoint, maxPoint);
        }
    });

}

function popinChartWindow(chartIndx, ohlc, volume, groupingUnits, minPoint, maxPoint, symbol) {

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
        var chart = addChart(chartContainerId, seriesData, volume, groupingUnits, currSymbol);
        if (minPoint && maxPoint) {
            chart.xAxis[0].setExtremes(minPoint, maxPoint);
        }
        addWindowControlButtonsToChart();
    });
}

function createDashboard(totalCharts) {

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
            seriesData.push({ x: new Date(resultData[i].t).getTime(), y: resultData[i].p, color: color });
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

//function calculateZoomLevels(data) {
//    zoomLevels = [];
//    var minDate = data[0].x;
//    var maxDate = data[data.length - 1].x;
//    var range = maxDate - minDate;
//    zoomLevels = [
//        { min: minDate, max: minDate + range * 0.2 },  // Zoom Level 1 (20% of the range)
//        { min: minDate, max: minDate + range * 0.4 },  // Zoom Level 2 (40% of the range)
//        { min: minDate, max: minDate + range * 0.6 },  // Zoom Level 3 (60% of the range)
//        { min: minDate, max: minDate + range * 0.8 },  // Zoom Level 4 (80% of the range)
//        { min: minDate, max: maxDate }                 // Zoom Level 5 (100% of the range)
//    ];
//}

//function LoadData(resultData) {
//    //for (let i = 0; i < dataLength; i += 1) {
//    //    ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
//    //    volume.push([data[i][0], data[i][5]]);
//    //}
//    ohlc = [];
//    for (var i = 1; i < resultData.length; i++) {
//        var color = resultData[i].p > resultData[i - 1].p ? 'green' : 'red';
//        ohlc.push({ x: new Date(resultData[i].t).getTime(), y: resultData[i].p, color: color });
//    }
//    calculateZoomLevels(ohlc);
//}
