//window.loadStockChart = async () => {
//    const data = await fetch(
//        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
//    ).then(response => response.json());

//    const ohlc = [],
//        volume = [],
//        dataLength = data.length,
//        groupingUnits = [['week', [1]], ['month', [1, 2, 3, 4, 6]]];

//    for (let i = 0; i < dataLength; i += 1) {
//        ohlc.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4]]);
//        volume.push([data[i][0], data[i][5]]);
//    }

//    Highcharts.stockChart('container', {
//        chart: {
//            backgroundColor: "#202527",
//            borderWidth: 1,
//            borderColor: "#5B6970",
//            //marginRight: 100, //margin after chart
//        },
//        rangeSelector: {
//            selected: 4
//        },
//        xAxis: [{
//            offset: 0,
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            lineWidth: 0,
//            opposite: false
//        }, {
//            offset: 0,
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            lineWidth: 0,
//            opposite: false
//        }],
//        /*title: {
//            text: 'AAPL Historical'
//        },*/
//        yAxis: [{
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff' // Green color
//                }
//            },
//            /* title: {
//                 text: 'OHLC',
//                 style: {
//                     color: '#ffffff',
//                     fontSize: 18
//                 },
//             },*/
//            height: '65%',
//            lineWidth: 2,
//            resize: {
//                enabled: true
//            }
//        }, {
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            //title: {
//            //    text: 'VOLUME',
//            //    style: {
//            //        color: '#5B6970',
//            //        fontSize: 13,
//            //        fontweight:"600"
//            //    },
//            //},
//            top: '65%',
//            height: '35%',
//            offset: 0,
//            gridLineWidth: 0,
//            lineWidth: 2
//        }],
//        tooltip: {
//            split: true
//        },
//        series: [{
//            type: 'candlestick',
//            name: 'AAPL',
//            data: ohlc,
//            dataGrouping: {
//                units: groupingUnits
//            },
//            color: '#C01620', // Color for the fall
//            upColor: '#16C05A', // Color for the rise
//        }, {
//            type: 'column',
//            name: 'Volume',
//            data: volume,
//            yAxis: 1,
//            dataGrouping: {
//                units: groupingUnits
//            }
//        }],
//        exporting: {
//            enabled: false // Disable export
//        }
//    });
//};

//window.loadStockChart1 = async () => {
//    const data = await fetch(
//        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
//    ).then(response => response.json());

//    // split the data set into ohlc and volume
//    const ohlc = [],
//        volume = [],
//        dataLength = data.length;

//    for (let i = 0; i < dataLength; i += 1) {
//        ohlc.push([
//            data[i][0], // the date
//            data[i][1], // open
//            data[i][2], // high
//            data[i][3], // low
//            data[i][4] // close
//        ]);

//        volume.push([
//            data[i][0], // the date
//            data[i][5] // the volume
//        ]);
//    }

//    Highcharts.stockChart('container1', {
//        chart: {
//            backgroundColor: "#202527",
//            borderWidth: 1,
//            borderColor: "#5B6970",
//        },
//        xAxis: [{
//            offset: 0,
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            lineWidth: 0,
//            opposite: false
//        }, {
//            offset: 0,
//            labels: {
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            lineWidth: 0,
//            opposite: false
//        }],
//        yAxis: [{
//            labels: {
//                align: 'left',
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            height: '80%',
//            resize: {
//                enabled: true
//            }
//        }, {
//            labels: {
//                align: 'left',
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            top: '80%',
//            height: '20%',
//            offset: 0
//        }],
//        tooltip: {
//            shape: 'square',
//            headerShape: 'callout',
//            borderWidth: 0,
//            shadow: false,
//            positioner: function (width, height, point) {
//                const chart = this.chart;
//                let position;

//                if (point.isHeader) {
//                    position = {
//                        x: Math.max(
//                            // Left side limit
//                            chart.plotLeft,
//                            Math.min(
//                                point.plotX + chart.plotLeft - width / 2,
//                                // Right side limit
//                                chart.chartWidth - width - chart.marginRight
//                            )
//                        ),
//                        y: point.plotY
//                    };
//                } else {
//                    position = {
//                        x: point.series.chart.plotLeft,
//                        y: point.series.yAxis.top - chart.plotTop
//                    };
//                }

//                return position;
//            }
//        },
//        series: [{
//            type: 'ohlc',
//            id: 'aapl-ohlc',
//            name: 'AAPL Stock Price',
//            data: ohlc,
//            color: '#C01620', // Color for the fall
//            upColor: '#16C05A',
//        }, {
//            type: 'column',
//            id: 'aapl-volume',
//            name: 'AAPL Volume',
//            data: volume,
//            yAxis: 1,
//            gridLineWidth: 0
//        }],
//        responsive: {
//            rules: [{
//                condition: {
//                    maxWidth: 800
//                },
//                chartOptions: {
//                    rangeSelector: {
//                        inputEnabled: false
//                    }
//                }
//            }]
//        },
//        exporting: {
//            enabled: false // Disable export
//        }
//    });
//}

//let readJsonFile = (file, callback) => {
//    var rawFile = new XMLHttpRequest();
//    rawFile.overrideMimeType("application/json");
//    rawFile.open("GET", file, true);
//    rawFile.onreadystatechange = function () {
//        if (rawFile.readyState === 4 && rawFile.status == "200") {
//            callback(rawFile.responseText);
//        }
//    }
//    rawFile.send(null);
//}

//let loadScatterChart = (data) => {

//    Highcharts.setOptions({
//        colors: ['rgba(5,141,199,0.5)', 'rgba(80,180,50,0.5)', 'rgba(237,86,27,0.5)']
//    });


//    const series = [{
//        name: 'Down',
//        id: 'basketball',
//        marker: {
//            symbol: 'circle',
//            width: 15,
//            height: 15
//        },
//        color: 'red'
//    },
//    {
//        name: 'Up',
//        id: 'volleyball',
//        marker: {
//            symbol: 'circle',
//            width: 15,
//            height: 15
//        },
//        color: 'green'
//    }];


//    const getData = sportName => {
//        const temp = [];
//        data.forEach(elm => {
//            if (elm.sport === sportName && elm.weight > 0 && elm.height > 0) {
//                temp.push([elm.height, elm.weight]);
//            }
//        });
//        return temp;
//    };
//    series.forEach(s => {
//        s.data = getData(s.id);
//    });

//    Highcharts.chart('container2', {

//        chart: {
//            type: 'scatter',
//            zoomType: 'xy',
//            backgroundColor: "#202527",
//            borderWidth: 1,
//            borderColor: "#5B6970",
//            //marginRight: 100, //margin after chart
//        },
//        rangeSelector: {
//            allButtonsEnabled: true,
//            buttons: [{
//                type: 'month',
//                count: 3,
//                text: 'Day',
//                dataGrouping: {
//                    forced: true,
//                    units: [['day', [1]]]
//                }
//            }, {
//                type: 'year',
//                count: 1,
//                text: 'Week',
//                dataGrouping: {
//                    forced: true,
//                    units: [['week', [1]]]
//                }
//            }, {
//                type: 'all',
//                text: 'Month',
//                dataGrouping: {
//                    forced: true,
//                    units: [['month', [1]]]
//                }
//            }],
//            buttonTheme: {
//                width: 60
//            },
//            selected: 2
//        },
//        title: {
//            text: '',
//            align: 'left'
//        },
//        subtitle: {
//            text:
//                '',
//            align: 'left'
//        },
//        xAxis: {
//            title: {
//                text: ''
//            },
//            labels: {
//                format: '{value}',
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            startOnTick: true,
//            endOnTick: true,
//            showLastLabel: true
//        },
//        yAxis: {
//            title: {
//                text: ''
//            },
//            labels: {
//                format: '{value}',
//                align: 'left',
//                x: 5,
//                style: {
//                    color: '#ffffff'
//                }
//            },
//            opposite: true
//        },
//        legend: {
//            enabled: true
//        },
//        plotOptions: {
//            scatter: {
//                marker: {
//                    radius: 2.5,
//                    symbol: 'circle',
//                    states: {
//                        hover: {
//                            enabled: true,
//                            lineColor: 'rgb(100,100,100)'
//                        }
//                    }
//                },
//                states: {
//                    hover: {
//                        marker: {
//                            enabled: false
//                        }
//                    }
//                },
//                jitter: {
//                    x: 0.005
//                }
//            }
//        },
//        tooltip: {
//            pointFormat: 'Time: {point.x}  <br/> Price: {point.y}'
//        },
//        series,
//        exporting: {
//            enabled: false // Disable export
//        }
//    });
//}

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
            backgroundColor: "#202527",
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
                    color: '#ffffff'
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
                    color: '#ffffff'
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
                    color: '#ffffff' // Green color
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
                    color: '#ffffff'
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
            }
        }],
        exporting: {
            enabled: false // Disable export
        }
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
            backgroundColor: "#202527",
            borderWidth: 1,
            borderColor: "#5B6970",
        },
        xAxis: [{
            offset: 0,
            labels: {
                align: 'left',
                x: 5,
                style: {
                    color: '#ffffff'
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
                    color: '#ffffff'
                }
            },
            lineWidth: 0,
            opposite: false
        }],
        yAxis: [{
            labels: {
                align: 'left',
                style: {
                    color: '#ffffff'
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
                    color: '#ffffff'
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
            gridLineWidth: 0
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
            backgroundColor: "#202527",
            borderWidth: 1,
            borderColor: "#5B6970",
            spacing: [0, 0, 0, 0] // Adjust spacing between charts
            //marginRight: 100, //margin after chart
        },
        xAxis: [{
            gridLineWidth: 0, // Remove grid lines
            offset: 0,
            labels: {
                align: 'left',
                y: -290,
                x: -20,
                style: {
                    color: '#ffffff'
                }
            },
            lineWidth: 0,
            opposite: false
        }, {
            gridLineWidth: 0, // Remove grid lines
            offset: 0,
            labels: {
                align: 'left',
                y: -290,
                x: -20,
                style: {
                    color: '#ffffff'
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
                align: 'right',
                x: -3,
                style: {
                    color: '#ffffff'
                },
            },
            title: {
                text: 'Price',
                style: {
                    color: '#ffffff'
                }
            },
            height: '60%',
            lineWidth: 2,
            resize: {
                enabled: true
            },
        }, {
            labels: {
                gridLineWidth: 0,
                align: 'right',
                x: -3,
                style: {
                    color: '#ffffff'
                }
            },
            title: {
                text: 'Volume',
                style: {
                    color: '#ffffff'
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

        navigator: {
            enabled: false // Hide the navigator
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


    //readJsonFile("json/scatterChartData.json", function (text) {
    //    var data = JSON.parse(text);
    //    loadScatterChart(data);
    //});
}


