
//async function LoadData() {
//    if (dataLength == 0) {
//        const data = await fetch(
//            'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
//        ).then(response => response.json());

//        dataLength = data.length;

//        for (let i = 0; i < dataLength; i += 1) {
//            ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
//            volume.push([data[i][0], data[i][5]]);
//        }
//    }
//}

//var ohlc = [], volume = [], dataLength = 0, groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];
var ohlc = [], volume = [], dataLength = 0, zoomLevels = [], maxZoom = 5, currentZoomLevel = 0;
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


function addChart(charContainerId, pOHLC, pVolume, pGroupingUnits, isDragable = true) {

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
            buttons: [{ type: 'minute', count: 1, text: '1m' },
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
                fill: '#272C2F', // Background color of the buttons
                stroke: '#272C2F', // Border color of the buttons
                style: {
                    color: '#FFFFFF', // Text color of the buttons
                    //fontWeight: 'bold' // Bold font weight
                },
                states: {
                    hover: {
                        fill: '#5B6970', // Background color when hovered
                        //style: {
                        //    color: '#000000' // Text color when hovered
                        //}
                    },
                    select: {
                        fill: '#272C2F', // Background color when selected
                        style: {
                            color: '#FFFFFF', // Text color when selected
                            fontWeight: 'bold'
                        }
                    },
                    //disabled: {
                    //    style: {
                    //        color: '#CCCCCC', // Text color when disabled
                    //    }
                    //}
                }
            },
            labelStyle: {
                visibility: 'hidden'
            },
            /*verticalAlign: 'top',*/
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
                name: 'AAPL',
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
                        fill: '#272C2F', // Set the button background color
                        stroke: '#5B6970', // Set the button border color
                        //'stroke-width': 2, // Set the button border width
                        style: {
                            color: '#FFFFFF', // Set the button text color
                            //fontWeight: 'bold' // Set the button text font weight
                        },
                        states: {
                            hover: {
                                fill: '#5B6970', // Set the button background color on hover
                                stroke: '#5B6970', // Set the button border color on hover
                                //style: {
                                //    color: '#ffffff' // Set the button text color on hover
                                //}
                            },
                        }
                    },
                    text: 'XNYS:AAPL &nbsp &nbsp ✖',
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
                            select: {
                                fill: '#272C2F',
                                style: {
                                    color: '#FFFFFF',
                                    fontWeight: 'bold'
                                }
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
                            select: {
                                fill: '#272C2F',
                                style: {
                                    color: '#FFFFFF',
                                    fontWeight: 'bold'
                                }
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
                    className: 'btn btn-sm btn-drag ',
                    theme: {
                        fill: '#5B6970', // Set the button background color
                        stroke: '#5B6970', // Set the button border color
                        //'stroke-width': 2, // Set the button border width
                        style: {
                            color: '#FFFFFF', // Set the button text color
                            //fontWeight: 'bold' // Set the button text font weight
                        },
                        states: {
                            hover: {
                                fill: '#5B6970', // Set the button background color on hover
                                stroke: '#5B6970', // Set the button border color on hover
                            },
                        }
                    },
                    useHTML: true,
                    text: ' <i class="bi bi-window"></i> ',
                    onclick: async function (e) {
                        var jsObjectReference = DotNet.createJSObjectReference(window);
                        var chartId = $(this.renderTo).data("chart-id");
                        removeChart(this);
                        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, chartId, ohlc, volume, groupingUnits)
                    },
                },
                closeChartButton: {
                    align: 'right',
                    verticalAlign: 'top',
                    x: -2,
                    enabled: isDragable,
                    className: 'btn btn-sm btn-drag ',
                    theme: {
                        fill: '#5B6970', // Set the button background color
                        stroke: '#5B6970', // Set the button border color
                        //'stroke-width': 2, // Set the button border width
                        style: {
                            color: '#FFFFFF', // Set the button text color
                            //fontWeight: 'bold' // Set the button text font weight
                        },
                        states: {
                            hover: {
                                fill: '#5B6970', // Set the button background color on hover
                                stroke: '#5B6970', // Set the button border color on hover
                            },
                        }
                    },
                    useHTML: true,
                    text: ' <i class="bi bi-x-lg"></i> ',

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
    });
}

function zoomChart(zoomIn, chart) {
    if (zoomIn)
        currentZoomLevel++;
    else
        currentZoomLevel--;
    if (currentZoomLevel > 5)
        currentZoomLevel = 5
    if (currentZoomLevel < 1)
        currentZoomLevel = 1

    if (currentZoomLevel >= 1 && currentZoomLevel <= 5) {
        chart.xAxis.forEach(xAxes => xAxes.setExtremes(zoomLevels[currentZoomLevel - 1].min, zoomLevels[currentZoomLevel - 1].max));
    }
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
        debugger
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

    addChart(chartContainerId, ohlc, volume, groupingUnits);

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
function popoutChartWindow(element, chartIndx, ohlc, volume, groupingUnits) {
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);
    calculateZoomLevels(ohlc);
    addChart(chartContainerId, ohlc, volume, groupingUnits, false);
}

function popinChartWindow(chartIndx, ohlc, volume, groupingUnits) {

    var totalCharts = $("#chartList .chart-box").length + 1;

    //Reset Chart Box
    var cssClass = "col-12";
    if (totalCharts == 1) {
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

    //Add Chart Height Class
    if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

    addChart(chartContainerId, ohlc, volume, groupingUnits);

    $(".chart-container", chartBox).off("dblclick").on("dblclick", async function () {
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
    var minDate = data[0].x;
    var maxDate = data[data.length - 1].x;
    var range = maxDate - minDate;
    zoomLevels = [
        { min: minDate, max: minDate + range * 0.2 },  // Zoom Level 1 (20% of the range)
        { min: minDate, max: minDate + range * 0.4 },  // Zoom Level 2 (40% of the range)
        { min: minDate, max: minDate + range * 0.6 },  // Zoom Level 3 (60% of the range)
        { min: minDate, max: minDate + range * 0.8 },  // Zoom Level 4 (80% of the range)
        { min: minDate, max: maxDate }                 // Zoom Level 5 (100% of the range)
    ];
}

function LoadData(resultData) {
    debugger
    var result = JSON.parse(resultData);
    var data = result.data;
    dataLength = data.length;

    //for (let i = 0; i < dataLength; i += 1) {
    //    ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
    //    volume.push([data[i][0], data[i][5]]);
    //}

    ohlc = []; volume = [];
    data.forEach(item => {
        const date = new Date(item[1]);

        // Add the timestamp (which is in milliseconds) to the date
        const newDate = new Date(date.getTime() + item[0]);

        var ohlcPoint = { x: newDate, y: item[4], color: 'green' };
        var volumPoint = { x: newDate, y: item[4], color: 'green' };
        //if (item.o < item.c) {
        //    ohlcPoint.color = 'red';
        //    volumPoint.color = 'red';
        //}
        ohlc.push(ohlcPoint);
        volume.push(volumPoint);
    });

    calculateZoomLevels(ohlc);
}

function saveLayout() {
    localStorage.setItem('SavedLayout', $("#chartList .chart-box").length);
    console.log(localStorage.getItem('SavedLayout'));
}