
var ohlc = [], volume = [], dataLength = 0, groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];


function addChart(charContainerId) {
    Highcharts.stockChart(charContainerId, {
        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
        },
        rangeSelector: {
            selected: 4,
            inputEnabled: false,
            buttonTheme: {
                visibility: 'hidden'
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
        series: [{
            type: 'candlestick',
            name: 'AAPL',
            data: ohlc,
            color: '#C01620', // Color for the fall
            upColor: '#16C05A', // Color for the rise
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
        }],
        exporting: {
            buttons: {
                contextButton: {
                    enabled: false,
                },
                closeButton: {
                    x: 0,
                    y: 0,
                    enabled: true,
                    className: 'btn btn-sm',
                    text: 'XNYS:SPX &nbsp &nbsp ✖',
                    onclick: function (e) {
                        removeChart(this);
                    }
                }
            }
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

    $(chart.renderTo).closest(".chart-box").remove();
    chart.destroy();
    var totalCharts = $("#chartList .chart-box").length;

    debugger;
    var cssClass = "col-12";
    if (totalCharts == 1) {
        cssClass = "col-12";
        $("#chartList").sortable({
            disabled: true
        });
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
    var chartContainerId = "chart-" + chartIndx
    var chartBox = $(`<div class="chart-box ${cssClass}"><div class="chart-container" id=${chartContainerId}></div></div>`);
    $("#chartList").append(chartBox);
    if (totalCharts > 2) {
        $("#chartList .chart-box").removeClass('chart-height-100');
        $("#chartList .chart-box").addClass('chart-height-50');
    }
    else {
        $("#chartList .chart-box").removeClass('chart-height-50');
        $("#chartList .chart-box").addClass('chart-height-100');
    }

    addChart(chartContainerId);


   

    if (totalCharts > 1) {
        addChartDblClickListener(chartContainerId);
    }

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
        $("#chartList").sortable({
            disabled: false
        });
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

