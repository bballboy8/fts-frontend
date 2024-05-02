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
            marginRight: 100,
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
            title: {
                text: 'OHLC',
                style: {
                    color: '#ffffff',
                    fontSize: 18
                },
            },
            height: '60%',
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
            title: {
                text: 'Volume',
                style: {
                    color: '#ffffff',
                    fontSize: 18
                },
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