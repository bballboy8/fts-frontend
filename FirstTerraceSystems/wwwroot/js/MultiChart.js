
var ohlc = [], volume = [], dataLength = 0, groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

function addChart(charContainerId, ohlc, volume, groupingUnits, isDragable = true) {
    
    Highcharts.stockChart(charContainerId, {
        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
        },
        rangeSelector: {
            buttons: [
                {
                    type: 'minute',
                    count: 1,
                    text: '1m'
                },
                {
                    type: 'minute',
                    count: 3,
                    text: '3m'
                },
                {
                    type: 'minute',
                    count: 30,
                    text: '30m'
                },
                {
                    type: 'hour',
                    count: 1,
                    text: '1h'
                },
                {
                    type: 'day',
                    count: 1,
                    text: '1D'
                },
                {
                    type: 'day',
                    count: 3,
                    text: '3D'
                },
                //{
                //    type: 'month',
                //    count: 6,
                //    text: '6m'
                //},
                //{
                //    type: 'all',
                //    text: 'All'
                //}
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
            x: 65,
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
                data: ohlc.map(function (point, i) {
                    if (i === 0 || point[1] > ohlc[i - 1][1]) {
                        return { x: point[0], y: point[1], color: 'green' }; // Higher or first point
                    } else {
                        return { x: point[0], y: point[1], color: 'red' }; // Lower
                    }
                }),
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
                data: volume,
                yAxis: 1,
                dataGrouping: {
                    units: groupingUnits
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
                                //style: {
                                //    color: '#ffffff' // Set the button text color on hover
                                //}
                            },
                        }
                    },
                    text: 'XNYS:SPX &nbsp &nbsp ✖',
                    //onclick: function (e) {
                    //    removeChart(this);
                    //},
                    ...(isDragable ? {
                        onclick: function (e) {
                            removeChart(this);
                        }
                    } : {})
                },
                dragButton: {
                    x: 360,
                    y: 0,
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
                    text: '✥',
                    onclick: async function (e) {
                        var jsObjectReference = DotNet.createJSObjectReference(window);
                        console.log(this);

                        var chartId = $(this.renderTo).data("chart-id");
                        removeChart(this);
                        await DotNet.invokeMethodAsync('FirstTerraceSystems', 'DragedChartWindow', jsObjectReference, chartId, ohlc, volume, groupingUnits)
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
        $("#chartList").sortable({ disabled: true });
        if (!$(".chart-container").hasClass("chart-popup"))
            $(".chart-container").off("dblclick");
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

    if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

}

function addChartBox(totalCharts, chartIndx) {
    var cssClass = "col-12";
    if (totalCharts == 2 || totalCharts == 4) {
        cssClass = "col-6";
    }
    else if (totalCharts == 6) {
        cssClass = "col-4";
    }
    else if (totalCharts == 8) {
        cssClass = "col-3";
    }
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} ${cssClass}"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $("#chartList").append(chartBox);

    if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

    addChart(chartContainerId, ohlc, volume, groupingUnits);

    if (totalCharts > 1) {
        //addChartDblClickListener(chartContainerId);


        //chartBox.resizable();
        //chartBox.draggable({
        //    containment: "#chartList",
        //    start: function (event, ui) {
        //        $("#chartList .chart-box").each(function (e, i) {
        //            $(this).css({ zIndex: 0 });
        //        });
        //        $(this).css({ zIndex: 1 });
        //    },
        //    //stop: function (event, ui) {
        //    //}
        //});

        $(".chart-container", chartBox).on("dblclick", function () {
            if ($(this).hasClass("chart-popup")) {
                $(this).removeClass("chart-popup");
                var chartIndx = $(this).data("chart-id");
                $(this).appendTo($(".chart-box-" + chartIndx));
                $("#popup-chart-" + chartIndx).remove();
            }
            else {
                if ($("#chartList .chart-box").length == 1) {
                    $(".chart-container", chartBox).off("dblclick");
                    return;
                }


                $(this).addClass("chart-popup");
                var chartIndx = $(this).data("chart-id");
                var opUpChart = $(`<div id="popup-chart-${chartIndx}" style="height:50vh;width:50vw;position:absolute;top:10Vh;left:10vw;"></div>`);
                $(this).appendTo(opUpChart);
                opUpChart.resizable();
                opUpChart.draggable();
                $("body").append(opUpChart);
            }
        });
    }
}

function popoutChartWindow(element, chartIndx, ohlc, volume, groupingUnits) {
    var chartContainerId = "chart-" + chartIndx, chartBoxClass = "chart-box-" + chartIndx;
    var chartBox = $(`<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`);
    $(element).append(chartBox);
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

    $(".chart-container", chartBox).on("dblclick", function () {
        if ($(this).hasClass("chart-popup")) {
            $(this).removeClass("chart-popup");
            var chartIndx = $(this).data("chart-id");
            $(this).appendTo($(".chart-box-" + chartIndx));
            $("#popup-chart-" + chartIndx).remove();
        }
        else {
            if ($("#chartList .chart-box").length == 1) {
                $(".chart-container", chartBox).off("dblclick");
                return;
            }

            $(this).addClass("chart-popup");
            var chartIndx = $(this).data("chart-id");
            var opUpChart = $(`<div id="popup-chart-${chartIndx}" style="height:50vh;width:50vw;position:absolute;top:10Vh;left:10vw;"></div>`);
            $(this).appendTo(opUpChart);
            opUpChart.resizable();
            opUpChart.draggable();
            $("body").append(opUpChart);
        }
    });
}

function createDashboard(totalCharts) {
    $("#chartList").html('');
    if (Highcharts.charts)
        Highcharts.charts.forEach(c => { if (c) c.destroy() });
    if (ohlc.length > 0) {

        for (var indx = 1; indx <= Number(totalCharts); indx++) {
            addChartBox(totalCharts, indx);
        }
    }

    if (totalCharts != 1) {
        $("#chartList").sortable({ disabled: false });
    }
}

async function LoadData() {
    if (dataLength == 0) {
        const data = await fetch(
            'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
        ).then(response => response.json());

        dataLength = data.length;

        for (let i = 0; i < dataLength; i += 1) {
            ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
            volume.push([data[i][0], data[i][5]]);
        }
    }
}

