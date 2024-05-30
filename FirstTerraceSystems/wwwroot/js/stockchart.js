﻿
let backgroundColor = '#202527';
let fontColor = '#ffffff';
let isDarkMode = true;
const LayoutChartClasses = {
    1: "single-chart",
    2: "split-chart",
    4: "four-chart",
    6: "six-chart",
    8: "eight-chart"
};

function fnGetLayoutChartClass(numberOfCharts) {
    return LayoutChartClasses[numberOfCharts];
}

window.loadStockChart = async () => {
    const data = await fetch(
        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
    ).then(response => response.json());

    const ohlc = [],
        volume = [],
        dataLength = data.length,
        groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
        volume.push([data[i][0], data[i][5]]);
    }

    Highcharts.stockChart('container', {
        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            //marginRight: 100, //margin after chart
        },
        rangeSelector: {
            selected: 4
        },
        xAxis: [{
            offset: 0,
            labels: {
                align: 'left',
                y: -255,
                x: -10,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }, {
            offset: 0,
            labels: {
                align: 'left',
                y: -255,
                x: -10,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }],
        /*title: {
            text: 'AAPL Historical'
        },*/
        yAxis: [{
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor // Green color
                }
            },
            /* title: {
                 text: 'OHLC',
                 style: {
                     color: '#ffffff',
                     fontSize: 18
                 },
             },*/
            height: '65%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            //title: {
            //    text: 'VOLUME',
            //    style: {
            //        color: '#5B6970',
            //        fontSize: 13,
            //        fontweight:"600"
            //    },
            //},
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
            dataGrouping: {
                units: groupingUnits
            },
            color: '#C01620', // Color for the fall
            upColor: '#16C05A', // Color for the rise
        }, {
            type: 'column',
            name: 'Volume',
            data: volume.map(function (point, i) {
                if (i === 0 || point[1] > volume[i - 1][1]) {
                    return { x: point[0], y: point[1], color: 'green' }; // Higher or first point
                } else {
                    return { x: point[0], y: point[1], color: 'red' }; // Lower
                }
            }),
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            },
            color: isDarkMode ? '#C01620' : '#16C05A', // Fall or rise color
            upColor: isDarkMode ? '#16C05A' : '#C01620' // Rise or fall color
        }],
        exporting: {
            enabled: false // Disable export
        },
        navigator: { enabled: false, adaptToUpdateData: false }
    });
};

window.loadStockChart1 = async () => {
    const data = await fetch(
        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
    ).then(response => response.json());

    // split the data set into ohlc and volume
    const ohlc = [],
        volume = [],
        dataLength = data.length;

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([
            data[i][0], // the date
            data[i][1], // open
            data[i][2], // high
            data[i][3], // low
            data[i][4] // close
        ]);

        volume.push([
            data[i][0], // the date
            data[i][5] // the volume
        ]);
    }

    Highcharts.stockChart('container1', {
        chart: {
            marginTop: 10,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
        },
        xAxis: [{
            gridLineWidth: 0,
            offset: 0,
            labels: {
                align: 'left',
                y: -140,
                x: -20,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }, {
            gridLineWidth: 0,
            offset: 0,
            labels: {
                align: 'left',
                y: -140,
                x: -20,
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
                    color: fontColor
                }
            },
            height: '80%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                gridLineWidth: 0,
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            top: '80%',
            height: '20%',
            offset: 0,
            gridLineWidth: 0,
            lineWidth: 2
        }],
        tooltip: {
            shape: 'square',
            headerShape: 'callout',
            borderWidth: 0,
            shadow: false,
            positioner: function (width, height, point) {
                const chart = this.chart;
                let position;

                if (point.isHeader) {
                    position = {
                        x: Math.max(
                            // Left side limit
                            chart.plotLeft,
                            Math.min(
                                point.plotX + chart.plotLeft - width / 2,
                                // Right side limit
                                chart.chartWidth - width - chart.marginRight
                            )
                        ),
                        y: point.plotY
                    };
                } else {
                    position = {
                        x: point.series.chart.plotLeft,
                        y: point.series.yAxis.top - chart.plotTop
                    };
                }

                return position;
            }
        },
        series: [{
            type: 'ohlc',
            id: 'aapl-ohlc',
            name: 'AAPL Stock Price',
            data: ohlc,
            color: '#C01620', // Color for the fall
            upColor: '#16C05A',
        }, {
            type: 'column',
            id: 'aapl-volume',
            name: 'AAPL Volume',
            data: volume.map(function (point, i) {
                if (i === 0 || point[1] > volume[i - 1][1]) {
                    return { x: point[0], y: point[1], color: 'green' }; // Higher or first point
                } else {
                    return { x: point[0], y: point[1], color: 'red' }; // Lower
                }
            }),
            yAxis: 1,
            gridLineWidth: 0,
            color: isDarkMode ? '#C01620' : '#16C05A', // Fall or rise color
            upColor: isDarkMode ? '#16C05A' : '#C01620' // Rise or fall color
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 800
                },
                chartOptions: {
                    rangeSelector: {
                        inputEnabled: false
                    }
                }
            }]
        },
        exporting: {
            enabled: false // Disable export
        },
        navigator: { enabled: false, adaptToUpdateData: false },
        credits: {
            enabled: false
        }
    });
}

window.loadStockChart2 = async () => {


    const data = await fetch(
        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
    ).then(response => response.json());

    const ohlc = [],
        volume = [],
        dataLength = data.length,
        groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

    for (let i = 0; i < dataLength; i += 1) {

        // 1 = open , 2 = high, 3= low, 4 = close
        ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
        volume.push([data[i][0], data[i][5]]);
    }

    Highcharts.stockChart('container2', {
        chart: {
            type: 'scatter',
            marginTop: 10,
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            //spacing: [0, 0, 0, 0] // Adjust spacing between charts
            //marginRight: 100, //margin after chart
        },
        rangeSelector: {
            buttonTheme: {
                fill: '#272C2F', // Change this to the desired color
                stroke: '#272C2F', // Change this to the desired color
                style: {
                    color: '#FFFFFF' // Change this to the desired color
                },
                states: {
                    hover: {
                        fill: '#5B6970', // Change this to the desired color
                        stroke: '#5B6970' // Change this to the desired color
                    },
                    select: {
                        fill: '#5B6970', // Change this to the desired color
                        stroke: '#5B6970' // Change this to the desired color
                    }
                }
            }
        },
        xAxis: [{
            gridLineWidth: 0, // Remove grid lines
            offset: 0,
            labels: {
                align: 'left',
                y: -255,
                x: -10,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }, {
            gridLineWidth: 0, // Remove grid lines
            offset: 0,
            labels: {
                align: 'left',
                y: -255,
                x: -10,
                style: {
                    color: fontColor
                }
            },
            lineWidth: 0,
            opposite: false
        }],
        /*title: {
            text: 'AAPL Historical'
        },*/
        yAxis: [{
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                },
            },
            //x:-70,
            //x:20,
            //title: {
            //    x:3
            //    //text: 'Price',
            //    //style: {
            //    //    color: fontColor
            //    //}
            //},
            height: '65%',
            lineWidth: 2,
            resize: {
                enabled: true
            },
        }, {
            labels: {
                //gridLineWidth: 0,
                align: 'left',
                x: 5,
                style: {
                    color: fontColor
                }
            },
            //x: -70,
            //title: {
            //    x:3
            //    //text: 'Volume',
            //    //style: {
            //    //    color: '#ffffff'
            //    //}
            //},
            //x:10,
            top: '65%',
            height: '35%',
            offset: 0,
            gridLineWidth: 0,
            lineWidth: 2
        }],
        tooltip: {
            split: true
        },

        navigator: {
            enabled: false // Hide the navigator
        },
        navigation: {
            buttonOptions: {
                enabled: true,
                symbolX: 12,
                symbolY: 11,
                align: 'right',
                verticalAlign: 'top',
                x: 0,
                y: 10
            }
        },
        series: [
            {
                name: 'Stock',
                data: ohlc.map(function (point, i) {
                    if (i === 0 || point[1] > ohlc[i - 1][1]) {
                        return { x: point[0], y: point[1], color: 'green' }; // Higher or first point
                    } else {
                        return { x: point[0], y: point[1], color: 'red' }; // Lower
                    }
                }),
                dataGrouping: {
                    units: groupingUnits
                }
            },
            {
                type: 'column',
                name: 'Volume',
                data: volume.map(function (point, i) {
                    if (i === 0 || point[1] > volume[i - 1][1]) {
                        return { x: point[0], y: point[1], color: 'green' }; // Higher or first point
                    } else {
                        return { x: point[0], y: point[1], color: 'red' }; // Lower
                    }
                }),
                yAxis: 1,
                dataGrouping: {
                    units: groupingUnits
                }
            }],
        tooltip: {
            pointFormat: 'Time: {point.x}  <br/> Price: {point.y}',
            split: true
        },
        exporting: {
            enabled: false // Disable export
        },
        credits: {
            enabled: false
        }
    });
}


window.changeBackgroundColor = (mode) => {
    isDarkMode = mode;
    // Change HTML body background color based on the isDarkMode parameter
    fontColor = isDarkMode ? '#ffffff' : '#202527';
    backgroundColor = isDarkMode ? '#202527' : '#ffffff';
    document.body.style.backgroundColor = isDarkMode ? '#202527' : '#ffffff';
    //document.getElementById("headbar").style.backgroundColor = isDarkMode ? '#202527' : '#ffffff';
    document.documentElement.setAttribute('data-sidebar', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
        document.body.className = '';
        document.body.classList.add("dark-body");
    }
    else {
        document.body.className = '';
        document.body.classList.add("light-body");
    }

    // Update text color for all axes labels
    document.querySelectorAll('.highcharts-xaxis-labels text, .highcharts-yaxis-labels text').forEach(label => {
        label.style.fill = fontColor;
    });

    // Update chart backgrounds and series colors for all Highcharts charts

    Highcharts.charts.forEach(chart => {
        debugger
        if (chart) {
            chart.update({
                chart: {
                    backgroundColor: backgroundColor,
                    borderColor: isDarkMode ? "#ffffff" : "#5B6970",
                    borderWidth: 1,
                },
                xAxis: [{
                    labels: {
                        style: {
                            color: fontColor
                        }
                    }
                }, {
                    labels: {
                        style: {
                            color: fontColor
                        }
                    }
                }],
                yAxis: [{
                    labels: {
                        style: {
                            color: fontColor
                        }
                    }
                }, {
                    labels: {
                        style: {
                            color: fontColor
                        }
                    }
                }],
                series: chart.series.map(series => ({
                    ...series.options,
                    color: isDarkMode ? '#C01620' : '#16C05A', // Fall or rise color
                    upColor: isDarkMode ? '#16C05A' : '#C01620' // Rise or fall color
                }))
            });
        }

    });
};


window.loadMultiStockChart = async (id) => {
    const data = await fetch(
        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
    ).then(response => response.json());

    const ohlc = [], volume = [], dataLength = data.length, groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
        volume.push([data[i][0], data[i][5]]);
    }


    const singleDataStockChart = Highcharts.stockChart(id, {
        chart: {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
            //marginRight: 100, //margin after chart

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
        //title: {
        //    text: 'aapl historical'
        //},
        yAxis: [{
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: fontColor // Green color
                }
            },
            /* title: {
                 text: 'OHLC',
                 style: {
                     color: '#ffffff',
                     fontSize: 18
                 },
             },*/
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
            //title: {
            //    text: 'VOLUME',
            //    style: {
            //        color: '#5B6970',
            //        fontSize: 13,
            //        fontweight:"600"
            //    },
            //},
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
            //dataGrouping: {
            //    units: groupingUnits
            //},
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
                    //symbolX: 100,
                    //symbolY: 10,
                    //width: 210,
                    //height: 28,
                    enabled: true,
                    className: 'btn btn-sm',
                    text: 'XNYS:SPX &nbsp &nbsp ✖',
                    onclick: function (e) {
                        let count = Highcharts.charts.filter(item => item !== undefined).length;
                        if (count > 1) {
                            this.container.parentNode.remove();
                            this.destroy();
                            let count = Highcharts.charts.filter(item => item !== undefined).length;
                            let cssClass = fnGetLayoutChartClass(count);
                            if (cssClass) window.loadTemplates(count, cssClass);
                        }
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

};


function dragdropchart() {
    $("#chartList").sortable({
        revert: true
    });
    //$("#draggable").draggable({
    //    connectToSortable: "#chartList",
    //    helper: "clone",
    //    revert: "invalid"
    //});
    $(".chart-container").disableSelection();
}

function addChartDblClickListener(chartContainer) {
    var chart = document.getElementById(chartContainer);
    var originalPosition = chart.style.position;
    var originalWidth = chart.style.width;
    var originalHeight = chart.style.height;
    var originalLeft = chart.style.left;
    var originalTop = chart.style.top;

    chart.addEventListener('dblclick', function openFullChart(e) {
        debugger
        e.stopPropagation();
        var totalCharts = Highcharts.charts.filter(item => item !== undefined).length
        if (totalCharts == 1) {
            return;
        }
        if (chart.classList.contains('fullscreen')) {
            chart.classList.remove('fullscreen');
            chart.style.position = originalPosition;
            chart.style.width = originalWidth;
            chart.style.height = originalHeight;
            chart.style.left = originalLeft;
            chart.style.top = originalTop;

        }
        else {
            chart.classList.add('fullscreen');
            originalPosition = chart.style.position;
            originalWidth = chart.style.width;
            originalHeight = chart.style.height;
            originalLeft = chart.style.left;
            originalTop = chart.style.top;
        }
        document.removeEventListener('dblclick', openFullChart);

        document.addEventListener('dblclick', function resetChart(e) {

            if (e.target !== chart) {
                chart.classList.remove('fullscreen');
                chart.style.position = originalPosition;
                chart.style.width = originalWidth;
                chart.style.height = originalHeight;
                chart.style.left = originalLeft;
                chart.style.top = originalTop;
                document.removeEventListener('dblclick', resetChart);
            }
        });
    });
}


let loadTemplates = (e) => {
    let showDropDownClass = 'show';
    let templateDropDown = document.getElementById("load-template-dropdown");
    if (templateDropDown.classList.contains(showDropDownClass)) {
        templateDropDown.classList.remove(showDropDownClass);
        e.currentTarget.classList.remove("display-Option-clicked-color");
        templateDropDown.querySelectorAll('.dropdown-item.load-template').forEach(ct => {
            ct.classList.remove('display-Option-clicked-color');
        });
    } else {
        templateDropDown.classList.add(showDropDownClass);
        e.currentTarget.classList.add("display-Option-clicked-color");
        templateDropDown.querySelectorAll('.dropdown-item.load-template').forEach(ct => {
            ct.classList.add('display-Option-clicked-color');
        });
    }
    e.stopPropagation();
}



window.loadTemplates = function (numberOfCharts, cssClass) {

    try {
        if (cssClass != 'single-chart') {
            $("#sortable").sortable({
                revert: true
            });
            $("#draggable").draggable({
                connectToSortable: "#sortable",
                helper: "clone",
                revert: "invalid"
            });
            $(".chartBox").disableSelection();
        }
        else {
            $("#draggable").draggable("disable");
            $("#sortable").sortable("disable");
        }
    } catch (e) {

    }

    Highcharts.charts.forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });


    var chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.remove();
    });

    var gridly = document.getElementById('sortable');
    gridly.innerHTML = '';
    for (var i = 1; i <= numberOfCharts; i++) {
        var chartBox = document.createElement('div');
        chartBox.className = cssClass;

        var brick = document.createElement('div');
        brick.className = 'brick large';
        brick.id = 'chartContainer' + i;
        chartBox.appendChild(brick);
        gridly.appendChild(chartBox);
        loadMultiStockChart(brick.id);
        if (cssClass != 'single-chart') {
            addChartDblClickListener(brick.id);
        }
    }
};


window.showLoader = () => {
    var loader = document.getElementById('pageLoader');
    loader.style.display = 'flex';
    setTimeout(function () {
        loader.style.display = 'none';
    }, 1600);
}