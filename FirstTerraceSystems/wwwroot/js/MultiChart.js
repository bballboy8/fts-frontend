//debugger
Highcharts.setOptions({
    global: {
        useUTC: false
    },
    boost: {
        useGPUTranslations: true,
        usePreAllocated: true
    },
    credits: {
        enabled: false
    },
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

var symbolData = {};
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

function addChart(totalCharts , charContainerId, data, symbol, isPopoutChartWindow = false, dotNetObject = undefined) {


    updatingCharts[symbol] = false;
    return Highcharts.stockChart(charContainerId, {

        chart: {
            type: 'scatter',
            marginTop: 40,
            boostThreshold: 1,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",

            events: {
                load: function () {
                    var chart = this;
                    console.log('chart: ', chart)
                    let chartWidth = chart.chartWidth;
                    chart.showLoading();
                    chart.ButtonNamespace = {};
                    chart.ButtonNamespace.symbolButton = addButtonToChart(chart, {
                        text: truncateText(`XNYS: <b>${symbol}</b>`, 25, ''),
                        x: 0,
                        y:10,
                        width: 100,
                        height: 10,
                        title: `XNYS: ${symbol}`,
                        callback: function (e) {

                            $("#dvSymbolInput").remove();

                            var button = $(e.target);
                            var buttonOffset = button.offset();
                            if (totalCharts != 8) {
                                var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${buttonOffset.top + button.outerHeight()}px;left:${buttonOffset.left}px;margin-top: 35px;"><input id="txtSymboleName" type="text" value="${chart.series[0].name}"/><button id="btnUpdateChartSymbol" type="button" datachartid="${charContainerId}">Ok</button><button id="btnCancelChartSymbol" type="button" datachartid="${charContainerId}">Cancel</button></div>`);
                            }
                            else {
                                var divInput = $(`<div id="dvSymbolInput" style="position:absolute;top:${buttonOffset.top + button.outerHeight()}px;left:${buttonOffset.left}px;margin-top: 55px;"><input id="txtSymboleName" type="text" value="${chart.series[0].name}"/><button id="btnUpdateChartSymbol" type="button" datachartid="${charContainerId}">Ok</button><button id="btnCancelChartSymbol" type="button" datachartid="${charContainerId}">Cancel</button></div>`);

                            }
                            

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

                                        
                                        chart.hideLoading();
                                    });

                                }

                                $("#dvSymbolInput").remove();
                            });

                            $("body").append(divInput);
                        }
                    });

                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1m', callback: function () { setButtonActive(this); setRange(symbol, 60 * 1000) }, x: 90, y: 10});
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '3m', callback: function () { setButtonActive(this); setRange(symbol,3* 60 * 1000) }, x: 125  , y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '30m', callback: function () { setButtonActive(this); setRange(symbol,30* 60 * 1000) }, x: 160, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1h', callback: function () { setButtonActive(this); setRange(symbol,60* 60 * 1000) }, x: 200, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '1D', callback: function () { setButtonActive(this); setRange(symbol,24*60* 60 * 1000) }, x: 232, y: 10 });
                    chart.ButtonNamespace.customButton1 = addButtonToChart(chart, { text: '3D', callback: function () { setButtonActive(this); setRange(symbol,3* 24 * 60 * 60 * 1000) }, x: 267, y: 10 });
                    setButtonActive(chart.ButtonNamespace.customButton1);
                    chart.ButtonNamespace.zoomInButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-in"></i>',
                        x: 460,
                        y:10,
                        callback: function () {
                            zoomChart(true, chart, dotNetObject);
                        }
                    });

                    chart.ButtonNamespace.zoomOutButton = addHtmlButtonToChart(chart, {
                        text: '<i class="bi bi-zoom-out"></i>',
                        x: 500,
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
                        let themeValue = document.documentElement.getAttribute('data-sidebar');
                        let closeButton = {
                            hoverCol: '',
                            strokeColor:''
                        }
                        if (themeValue == 'light') {
                            closeButton.hoverCol = '#5B6970';
                            closeButton.strokeColor = '#5B6970';

                        } else {
                            closeButton.hoverCol = '#FB5B31';
                            closeButton.strokeColor = '#FFFFFF';
                        }
                        chart.ButtonNamespace.closeChartButton = addHtmlButtonToChart(chart, {
                            text: '<i class="bi bi-x-lg"></i>',
                            hoverColor: closeButton.hoverColor,
                            stroke: closeButton.strokeColor,
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
                        y: 0
                    }, true, 'spacingBox');

                    var totalChartsCount = localStorage.getItem('chartCount');
                    if (totalCharts == 8 || totalChartsCount == 8) {
                        chart.ButtonNamespace.zoomInButton.align({
                            align: 'left',
                            x: 0,
                            y: 30
                        }, true, 'spacingBox');

                        chart.ButtonNamespace.zoomOutButton.align({
                            align: 'left',
                            x: 25,
                            y: 30
                        }, false, 'spacingBox');
                    }
                    else {
                        chart.ButtonNamespace.zoomInButton.align({
                            align: 'left',
                            x: 290,
                            y: 2
                        }, true, 'spacingBox');

                        chart.ButtonNamespace.zoomOutButton.align({
                            align: 'left',
                            x: 315,
                            y: 2
                        }, false, 'spacingBox');
                    }
                    if (!isPopoutChartWindow) {

                        var closeX = -30;
                        var minX = -60;
                        var maxX = -90;
                        if (totalCharts == 8) {
                            closeX = -25;
                            minX = -50;
                                maxX = -75;
                        }
                        chart.ButtonNamespace.closeChartButton.align({
                            align: 'right',
                            x: closeX,
                            y: 2
                        }, false, 'spacingBox');

                        chart.ButtonNamespace.maximizeButton.align({
                            align: 'right',
                            x: minX,
                            y: 2
                        }, false, 'spacingBox');

                        chart.ButtonNamespace.minimizeButton.align({
                            align: 'right',
                            x: maxX,
                            y: 2
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
        tooltip:
        {
            split: true,
            formatter: function ()
            {
               return [
                   `<b>${Highcharts.dateFormat('%A, %e %b. %H:%M:%S.%L', this.x, false)}</b>`,
                   ...(this.points ? this.points.map(point => `${point.series.name}: ${Highcharts.numberFormat(point.y / 10000, 2)}`) : [])
               ]
            },
        },
        plotOptions: {
            scatter: {
                color: 'green',
                negativeColor: 'red',
                tooltip: {
                    pointFormatter: function () {
                        console.log('upper: ', this.x)
                        return [
                            `<b>${symbol} ${Highcharts.numberFormat(this.y, 2)}</b>`,
                        ]
                    }
                }
            },
            //column: {
            //    label: {
            //        format: 'Volume'
            //    },
            //    tooltip: {
            //        pointFormatter: function () {
            //            console.log('lower', this.x)
            //            return this.y
            //        }
            //    }
            //},
            series: {
                turboThreshold: 0,
                marker: {
                    enabled: false
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
                ordinal: false,
                type: 'datetime',
                plotLines: plotLines,
                plotBands: plotBands,
                //offset: 0,
                labels: {
                    style: { color: fontColor }
                },
                dateTimeLabelFormats: {
                    second: '%H:%M:%S.%L',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%e. %b',
                    week: '%e. %b',
                    month: '%b \'%y',
                    year: '%Y'
                },
                lineWidth: 0,
                opposite: false,
                tickPixelInterval: 150
            },
        ],
        yAxis: [
            {
                gridLineWidth: 0,
                labels: {
                    align: 'left',
                    x: 5,
                    style: {
                        color: fontColor // Green color
                    },
                    formatter: function () {
                        console.log('third: ', this)
                        return ' abcd' ;
                    }
                },
                height: '65%',
                resize: { enabled: true },
            },
            {
                gridLineWidth: 0,
                labels: {
                    align: 'left',
                    x: 5,
                    style: {
                        color: fontColor
                    },
                },
                title: {
                    text: 'Volume'
                },

                top: '65%',
                height: '35%',
                resize: { enabled: true },
                offset: 1,
                lineWidth: 2,
                formatter: function () {
                    console.log('forth: ', this)
                    return Highcharts.numberFormat(this.value / 10000, 2);
                }
            }
        ],
        tooltip: {
            split: true
        },
        series: [
            {
                name: symbol,
                lineWidth: 0,
                marker: {
                    enabled: true,
                    radius: 1
                },
                tooltip: {
                    valueDecimals: 2,
                    
                },
                states: {
                    hover: {
                        lineWidthPlus: 0
                    }
                },
                data: [],
                boostThreshold: 10000,
                turboThreshold: 0
            }, {
                type: 'column',
                name: 'Volume',
                data: [],
                yAxis: 1,
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
            enabled:false
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
        addPointToChart(chart, filterData, false, false,false);
        updatingCharts[symbol] = false;
    }, 0);
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

async function getChartDataBySymbol(symbol, lastPoint = undefined) {

    return await ChatAppInterop.dotnetReference.invokeMethodAsync("GetChartDataBySymbol", symbol, lastPoint);
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
        color: data.price > previousPrice ? 'green' : 'red',
    };
}

function processDataChart(data) {
    return [[
        new Date(data.date).getTime(),
        Number(data.size),
    ], ]
};

function setDataToChart(chart, seriesData) {
    //if (seriesData.length < 2) return;
    let series = chart.series[0];
    dataMap.clear();
    const dataPoints = seriesData.slice(1).map((data, index) => {
        var timeStamp = new Date(data.date).getTime();
        dataMap.set(timeStamp, null);
        return processDataPoint(data, seriesData[index].price);
    }
    );
    //symbolData[chart.series[0].name] = dataPoints;
    series.setData(dataPoints, false, false);

    const volumePoints = seriesData.slice(1).map((data, index) => {
        const currentPrice = data.price; // Get the current price
        const previousPrice = seriesData[index].price; // Get the previous price

        const volumePoint = {
            x: new Date(data.date).getTime(),
            y: Number(data.size),
            color: currentPrice > previousPrice ? 'green' : 'red', // Set color conditionally
        };
        return volumePoint;
    }
    );


    chart.series[1].setData(volumePoints, false, false);
    chart.redraw();
    if (seriesData.length > 1)
        chart.xAxis[0].setExtremes(dataPoints[0].x, dataPoints[dataPoints.length - 1].x);
}

//debugger
let dataMap = new Map();
function addPointToChart(chart, seriesData, redraw = false, animateOnUpdate = false, isAddVolume = false) {
    if (seriesData.length < 1) return;
    let lastPoint = null;
    let series = chart.series[0];
    let volumeSeries = chart.series[1];
    seriesData.slice(1).forEach((data, index) => {
        const previousPrice = seriesData[index].price; // Get the previous price
        const currentPrice = data.price; // Get the current price

        // Create the point for the main series
        const point = processDataPoint(data, previousPrice);
       
        // Add the volume data to the volume series with color based on the price comparison
        if (data.size)
        {
            const volumePoint = {
                x: new Date(data.date).getTime(),
                y: Number(data.size),
                color: currentPrice > previousPrice ? 'green' : 'red', // Set color conditionally
            };
            volumeSeries.addPoint(volumePoint, redraw, animateOnUpdate);
        }  
            series.addPoint(point, redraw, animateOnUpdate);
      
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
let debounceTimer;
async function refreshCharts(symbol, seriesData) {
    setTimeout(async function () {
        let chart = getChartInstanceBySeriesName(symbol);
        if (chart) {
            addPointToChart(chart, seriesData, false, true,true);
            chart.redraw();
        }
    }, 100);
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

    var chart = addChart(totalCharts , chartContainerId, [], symbol);

    if (totalCharts == 1) {
        removeWindowControlButtonsFromChart();
    }

    return chart
}

function createDashboard(totalCharts, initialChartSymbols) {
    localStorage.setItem("chartCount", totalCharts);
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

function updateButtonColour() {
    document.querySelectorAll('.highcharts-button-box').forEach(button => {
        button.style.fill = backgroundColor;
        button.style.stroke = fontColor;
    });

    // Update text color for the buttons.
    document.querySelectorAll('.highcharts-button text').forEach(text => {
        text.style.fill = fontColor;
    });

    // Update symbol color for the buttons.
    document.querySelectorAll('.highcharts-button i').forEach(i => {
        i.style.setProperty('color', fontColor, 'important');
    });
}

var plotLines = [];
var plotBands = [];


function loadDashboard(totalCharts, initialChartSymbols) {

        // Assuming your data starts and ends on specific dates
    var endDate = new Date(); // Current date and time

    // Calculate the start date as 3 days before the current date
    var startDate = new Date();
    startDate.setDate(endDate.getDate() - 3); // Subtract 3 days

    // Helper function to convert local EST/EDT time to UTC timestamp
    function toESTorEDTTimestamp(year, month, day, hour, minute) {
        var localDate = new Date(year, month, day, hour, minute);
        var isDST = localDate.getTimezoneOffset() < 240; // Check if DST is in effect
        var offset = isDST ? -4 * 60 * 60 * 1000 : -5 * 60 * 60 * 1000; // EDT (UTC-4) or EST (UTC-5)
        var utcOffset = localDate.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
        return localDate.getTime() + utcOffset + offset;
    }


    // Iterate over each day in the date range
    for (var date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        var dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        if (dayOfWeek === 5) { 
            // Cover the whole day as a plotBand for weekends
            plotBands.push({
                color: 'rgba(68, 170, 213, 0.1)', // Light blue shading
                from: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0), // Start of the day
                to: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3, 4, 0), // End of the day
                zIndex: 3
            });
        } else if (dayOfWeek !== 6 && dayOfWeek!==0) {
            // 8 PM EST/EDT on the current day
            plotLines.push({
                color: 'red',
                width: 2,
                value: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0), // 8 PM
                zIndex: 5
            });

            // 4 AM EST/EDT on the next day
            plotLines.push({
                color: 'green',
                width: 2,
                value: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 4, 0), // 4 AM
                zIndex: 5
            });
        }
    }

    localStorage.setItem("chartCount", null);
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

    addChart(1, chartContainerId, [], symbol, false, dotNetObject);

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

    let chart = addChart(1, chartContainerId, [], symbol);

    addWindowControlButtonsToChart();
    var data = await getChartDataBySymbol(symbol, null);
    setDataToChart(chart, data);
    chart.hideLoading();
    
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
        
        setTimeout(addPointToChart(chart, seriesData, false, false,true), 0);


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
        chart.redraw();
    }
}

async function setButtonActive(e) {
    //debugger
    var chartContainer = e.element.closest(".chart-container");
    if (chartContainer) {
        var activeButtons = chartContainer.getElementsByClassName("active");

        // Convert HTMLCollection to an array using Array.from
        Array.from(activeButtons).forEach(function (el) {
            el.classList.remove("active");
        });
    }
    e.element.classList.add('active');

} 
