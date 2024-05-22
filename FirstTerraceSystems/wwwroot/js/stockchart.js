﻿let backgroundColor = '#202527';
let fontColor = '#ffffff';
let isDarkMode = true;

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
                x: 5,
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
                x: 5,
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
            data: volume,
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
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: "#5B6970",
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
        }, {
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
                style: {
                    color: fontColor
                }
            },
            height: '80%',
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'left',
                style: {
                    color: fontColor
                }
            },
            top: '80%',
            height: '20%',
            offset: 0
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
            data: volume,
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
        navigator: { enabled: false, adaptToUpdateData: false }
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
                    borderColor: isDarkMode ? "#5B6970" : "#ffffff",
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

    const ohlc = [],
        volume = [],
        dataLength = data.length,
        groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
        volume.push([data[i][0], data[i][5]]);
    }

    Highcharts.stockChart(id, {
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
                x: 5,
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
                x: 5,
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
            data: volume,
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
/*function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}*/


function dragdropchart () {
    $("#sortable").sortable({
        revert: true
    });
    $("#draggable").draggable({
        connectToSortable: "#sortable",
        helper: "clone",
        revert: "invalid"
    });
    $("div").disableSelection();
}

function addChartDblClickListener(chartContainer) {
    var chart = document.getElementById(chartContainer);
    var originalPosition = chart.style.position;
    var originalWidth = chart.style.width;
    var originalHeight = chart.style.height;
    var originalLeft = chart.style.left;
    var originalTop = chart.style.top;

    chart.addEventListener('dblclick', function openFullChart(e) {
        e.stopPropagation(); // Prevents the event from bubbling up the DOM tree, preventing any parent handlers from being notified of the event

        if (chart.classList.contains('fullscreen')) {
            // If the chart is already in fullscreen, reset it to its original size and position
            chart.classList.remove('fullscreen');
            chart.style.position = originalPosition;
            chart.style.width = originalWidth;
            chart.style.height = originalHeight;
            chart.style.left = originalLeft;
            chart.style.top = originalTop;
        } else {
            // Otherwise, enlarge the chart and save its original size and position
            chart.classList.add('fullscreen');
            originalPosition = chart.style.position;
            originalWidth = chart.style.width;
            originalHeight = chart.style.height;
            originalLeft = chart.style.left;
            originalTop = chart.style.top;
        }
        document.removeEventListener('dblclick', openFullChart); // Remove the event listener
        // Add a click event listener to the document
        document.addEventListener('dblclick', function resetChart(e) {
            // If the clicked target is not the chart, reset the chart
            if (e.target !== chart) {
                chart.classList.remove('fullscreen'); // Remove the fullscreen class to reset the chart
                chart.style.position = originalPosition;
                chart.style.width = originalWidth;
                chart.style.height = originalHeight;
                chart.style.left = originalLeft;
                chart.style.top = originalTop;
                document.removeEventListener('dblclick', resetChart); // Remove the event listener
            }
        });
    });
}

