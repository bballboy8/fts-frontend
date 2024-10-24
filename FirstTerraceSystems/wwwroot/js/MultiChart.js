//debugger
Highcharts.setOptions({
  global: {
    useUTC: false,
  },
  boost: {
    useGPUTranslations: true,
    usePreAllocated: true,
  },
  credits: {
    enabled: false,
  },
});

const defaultkeyboardNavigationOrder = [
  "symbolButton",
  "rangeSelector",
  "zoomInButton",
  "zoomOutButton",
  "minimizeButton",
  "maximizeButton",
  "closeChartButton",
  "series",
  "zoom",
  "chartMenu",
  "legend",
];

const singleChartkeyboardNavigationOrder = [
  "symbolButton",
  "rangeSelector",
  "zoomInButton",
  "zoomOutButton",
  "series",
  "zoom",
  "chartMenu",
  "legend",
];

var ChatAppInterop = window.ChatAppInterop || {};
let processingCharts = [];
ChatAppInterop.dotnetReference = null;

ChatAppInterop.setDotNetReference = function (dotnetReference) {
  ChatAppInterop.dotnetReference = dotnetReference;
};

var canZoomOnHandleExtreme = false;
var ChartZooomActivate = [];
function SetChartZoomActivate(chart, value) {
  if (ChartZooomActivate.length == 0) {
    ChartZooomActivate.push({ name: chart.container.id, active: value });
  } else {
    var results = ChartZooomActivate.some((p) => p.name == chart.container.id);
    if (results == true) {
      var index = ChartZooomActivate.findIndex(
        (z) => z.name == chart.container.id
      );
      ChartZooomActivate[index].active = value;
    } else {
      ChartZooomActivate.push({ name: chart.container.id, active: value });
    }
  }
}
function FindChartZoomActivate(chart) {
  var value1 = ChartZooomActivate.find((z) => z.name == chart.container.id);
  if (value1 != null) {
    return value1.active;
  }
  return false;
}
onwheel = function (event) {
  canZoomOnHandleExtreme = true;
};
onmouseleave = function () {
  canZoomOnHandleExtreme = false;
};

// Function to show loading with a spinner
// Function to show loading with a spinner, for a specific chart instance
function showCustomLoading(chart) {
  if (chart) {
    chart.showLoading();

    // Check if spinner already exists to avoid duplicates
    const loadingDiv = chart.container.querySelector(".highcharts-loading");
    if (loadingDiv && !loadingDiv.querySelector(".spinner")) {
      const spinner = document.createElement("div");
      spinner.className = "spinner";
      loadingDiv.appendChild(spinner);
    }
  }
}

// Function to hide loading and remove spinner, for a specific chart instance
function hideCustomLoading(chart) {
  if (chart) {
    chart.hideLoading();
    // Remove the spinner when loading is hidden
    const spinner = chart.container.querySelector(".spinner");
    if (spinner) {
      spinner.remove();
    }
  }
}
var symbolData = {};
function filterData(data, numPoints, startDate, endDate) {
  let filteredData = data;
  if (startDate && endDate) {
    filteredData = data.filter(
      (point) =>
        new Date(point.date).getTime() >= startDate &&
        new Date(point.date).getTime() <= endDate
    );
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

function addChart(
  totalCharts,
  charContainerId,
  data,
  symbol,
  isPopoutChartWindow = false,
  dotNetObject = undefined
) {
  updatingCharts[symbol] = false;
  return Highcharts.stockChart(charContainerId, {
    chart: {
      type: "scatter",
      marginTop: totalCharts == 8 ? 60 : 40,
      boostThreshold: 1,
      backgroundColor: backgroundColor,
      borderWidth: 1,
      animation: false,
      borderColor: "#5B6970",

      events: {
        selection: function (event) {
          // Prevent default zoom behavior (box selection)
          return false;
        },
        load: function () {
          var chart = this;
          SetChartZoomActivate(chart, false);

          // console.log("chart: ", chart);

          // // Check if there are no points or if xAxis or yAxis labels are empty
          // var isEmptyData = chart.series[0].data.length === 0;
          // var isEmptyXAxis =
          //   !chart.xAxis[0].labelFormatter || chart.xAxis[0].ticks.length === 0;
          // var isEmptyYAxis =
          //   !chart.yAxis[0].labelFormatter || chart.yAxis[0].ticks.length === 0;

          // if (isEmptyData || isEmptyXAxis || isEmptyYAxis) {
          //   // Call setRange with '1m' configuration
          //   setRange(chart.series[0].name, 1000); // '1m' corresponds to 60 * 1000 milliseconds
          // }

          // Attach wheel event listener to the chart container
          Highcharts.addEvent(chart.container, "wheel", function (event) {
            event.preventDefault(); // Prevent page scroll only when inside the chart
            const delta = event.deltaY || event.wheelDelta;
            const zoomIn = delta < 0;
            SetChartZoomActivate(chart, true);
            if (zoomIn) debouncedZoomChart(zoomIn, chart, undefined, symbol);
            else debouncedZoomChart_zommOut(zoomIn, chart, undefined, symbol);
          });

          let chartWidth = chart.chartWidth;
          showCustomLoading(chart);

          chart.ButtonNamespace = {};
          chart.ButtonNamespace.symbolButton = addButtonToChart(chart, {
            text: truncateText(`XNYS: <b>${symbol}</b>`, 25, ""),
            x: 0,
            y: 10,
            width: 100,
            height: 10,
            title: `XNYS: ${symbol}`,
            callback: function (e) {
              $("#dvSymbolInput").remove();

              var button = $(e.target);
              var buttonOffset = button.offset();
              if (totalCharts != 8) {
                var divInput = $(
                  `<div id="dvSymbolInput" style="position:absolute;top:${
                    buttonOffset.top + button.outerHeight()
                  }px;left:${
                    buttonOffset.left
                  }px;margin-top: 35px;"><input id="txtSymboleName" type="text" value="${
                    chart.series[0].name
                  }"/><button id="btnUpdateChartSymbol" type="button" datachartid="${charContainerId}">Ok</button><button id="btnCancelChartSymbol" type="button" datachartid="${charContainerId}">Cancel</button></div>`
                );
              } else {
                var divInput = $(
                  `<div id="dvSymbolInput" style="position:absolute;top:${
                    buttonOffset.top + button.outerHeight()
                  }px;left:${
                    buttonOffset.left
                  }px;margin-top: 55px;"><input id="txtSymboleName" type="text" value="${
                    chart.series[0].name
                  }"/><button id="btnUpdateChartSymbol" type="button" datachartid="${charContainerId}">Ok</button><button id="btnCancelChartSymbol" type="button" datachartid="${charContainerId}">Cancel</button></div>`
                );
              }

              var btn = divInput.find("#btnUpdateChartSymbol");
              var cancelBtn = divInput.find("#btnCancelChartSymbol");
              cancelBtn.on("click", function () {
                $(this).closest("#dvSymbolInput");
                $("#dvSymbolInput").remove();
              });
              btn.on("click", function () {
                var dvInput = $(this).closest("#dvSymbolInput");
                symbol = $("#txtSymboleName", dvInput).val();
                symbol = symbol.toUpperCase();

                if (symbol == chart.series[0].name || symbol == "") {
                  $("#dvSymbolInput").remove();
                  return;
                }

                let existingChart = getChartInstanceBySeriesName(symbol);

                if (existingChart) {
                  showCustomLoading(chart);
                  symbol = existingChart.series[0].name;
                  chart.series[0].setData(existingChart.series[0].options.data);
                  // console.log("existing");
                  chart.series[0].update({
                    name: symbol,
                  });

                  chart.ButtonNamespace.symbolButton.attr({
                    text: truncateText(`XNYS: ${symbol}`, 11, ""),
                  });
                  chart.ButtonNamespace.symbolButton.attr({
                    title: `XNYS: ${symbol}`,
                  });

                  if (ChatAppInterop.dotnetReference) {
                    ChatAppInterop.dotnetReference.invokeMethodAsync(
                      "SymbolChanged",
                      chart.renderTo.id,
                      symbol
                    );
                  }
                  hideCustomLoading(chart);
                } else {
                  showCustomLoading(chart);

                  // console.log("place" + chart.series[0].name);
                  updateChartSymbol(chart.renderTo.id, symbol).then(
                    (seriesData) => {
                      // console.log("place1");
                      if (seriesData) {
                        // console.log("place3");
                        if (seriesData.length > 0) {
                          // console.log("dont change data");
                          setDataToChart(chart, seriesData);

                          chart.series[0].update({
                            name: symbol,
                          });
                          chart.ButtonNamespace.symbolButton.attr({
                            text: truncateText(`XNYS: ${symbol}`, 11, ""),
                          });
                          chart.ButtonNamespace.symbolButton.attr({
                            title: `XNYS: ${symbol}`,
                          });
                        }
                        hideCustomLoading(chart);
                      } else {
                        symbol = chart.series[0].name;
                      }

                      hideCustomLoading(chart);
                    }
                  );
                }

                $("#dvSymbolInput").remove();
              });

              $("body").append(divInput);
            },
          });

          const buttonConfigs = [
            { text: "1m", x: 85, duration: 60 * 1000, width: 5, height: 5 },
            {
              text: "3m",
              x: 113,
              duration: 3 * 60 * 1000,
              width: 5,
              height: 5,
            },
            {
              text: "30m",
              x: 143,
              duration: 30 * 60 * 1000,
              width: 5,
              height: 5,
            },
            {
              text: "1h",
              x: 178,
              duration: 60 * 60 * 1000,
              width: 5,
              height: 5,
            },
            {
              text: "1D",
              x: 208,
              duration: 24 * 60 * 60 * 1000,
              width: 5,
              height: 5,
            },
            {
              text: "3D",
              x: 238,
              duration: 3 * 24 * 60 * 60 * 1000,
              width: 5,
              height: 5,
            },
          ];

          buttonConfigs.forEach((config) => {
            chart.ButtonNamespace[config.text] = addButtonToChart(chart, {
              text: config.text,
              callback: function () {
                setButtonActive(this);
                debouncedSetRange(symbol, config.text);
              },
              x: config.x,
              y: 10,
            });
          });

          setButtonActive(chart.ButtonNamespace["3D"]);
          chart.ButtonNamespace.zoomInButton = addHtmlButtonToChart(chart, {
            text: '<i class="bi bi-zoom-in"></i>',
            x: 460,
            y: 10,
            callback: function () {
              debouncedZoomChart(true, chart, dotNetObject, symbol);
            },
          });

          chart.ButtonNamespace.zoomOutButton = addHtmlButtonToChart(chart, {
            text: '<i class="bi bi-zoom-out"></i>',
            x: 500,
            y: 10,
            callback: function () {
              debouncedZoomChart(false, chart, dotNetObject, symbol);
            },
          });

          var customComponents = {
            symbolButton: new ButtonComponent(
              chart,
              chart.ButtonNamespace.symbolButton
            ),
            zoomInButton: new ButtonComponent(
              chart,
              chart.ButtonNamespace.zoomInButton
            ),
            zoomOutButton: new ButtonComponent(
              chart,
              chart.ButtonNamespace.zoomOutButton
            ),
          };

          if (!isPopoutChartWindow) {
            let themeValue =
              document.documentElement.getAttribute("data-sidebar");
            let closeButton = {
              hoverCol: "",
              strokeColor: "",
            };
            if (themeValue == "light") {
              closeButton.hoverCol = "#5B6970";
              closeButton.strokeColor = "#5B6970";
            } else {
              closeButton.hoverCol = "#FB5B31";
              closeButton.strokeColor = "#FFFFFF";
            }
            chart.ButtonNamespace.closeChartButton = addHtmlButtonToChart(
              chart,
              {
                text: '<i class="bi bi-x-lg"></i>',
                hoverColor: closeButton.hoverColor,
                stroke: closeButton.strokeColor,
                x: chartWidth - 40,
                y: 10,
                callback: function () {
                  removeChart(chart);
                },
              }
            );

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
                await DotNet.invokeMethodAsync(
                  "FirstTerraceSystems",
                  "DragedChartWindow",
                  jsObjectReference,
                  true,
                  chartId,
                  extremes.min,
                  extremes.max,
                  symbol
                );
              },
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
                await DotNet.invokeMethodAsync(
                  "FirstTerraceSystems",
                  "DragedChartWindow",
                  jsObjectReference,
                  false,
                  chartId,
                  extremes.min,
                  extremes.max,
                  symbol
                );
              },
            });

            customComponents.minimizeButton = new ButtonComponent(
              chart,
              chart.ButtonNamespace.minimizeButton
            );
            customComponents.maximizeButton = new ButtonComponent(
              chart,
              chart.ButtonNamespace.maximizeButton
            );
            customComponents.closeChartButton = new ButtonComponent(
              chart,
              chart.ButtonNamespace.closeChartButton
            );
          }

          chart.update({
            accessibility: {
              customComponents: customComponents,
              keyboardNavigation: {
                order: !isPopoutChartWindow
                  ? defaultkeyboardNavigationOrder
                  : singleChartkeyboardNavigationOrder,
              },
            },
          });
        },
        render: function () {
          var chart = this;

          chart.ButtonNamespace.symbolButton.align(
            {
              align: "left",
              x: 0,
              y: 0,
            },
            true,
            "spacingBox"
          );
          var defaultchartlayoutchecker = function () {
            var Checker = false;

            try {
              var charthigherparent = $(chart.container)
                .parent()
                .parent()
                .parent();
              if (charthigherparent != null) {
                if (
                  $(charthigherparent).attr("id") == "chartListCol2" &&
                  $(charthigherparent).children().length == 3 &&
                  (totalCharts == 5 || totalChartsCount == 5)
                ) {
                  {
                    Checker = true;
                    // console.log("isDlayout");
                  }
                }
              }
            } catch (ex) {}

            return Checker;
          };

          var totalChartsCount = localStorage.getItem("chartCount");
          if (
            totalCharts == 8 ||
            totalChartsCount == 8 ||
            totalCharts == 6 ||
            totalChartsCount == 6 ||
            defaultchartlayoutchecker() == true
          ) {
            chart.ButtonNamespace.zoomInButton.align(
              {
                align: "left",
                x: 0,
                y: 30,
              },
              true,
              "spacingBox"
            );

            chart.ButtonNamespace.zoomOutButton.align(
              {
                align: "left",
                x: 25,
                y: 30,
              },
              false,
              "spacingBox"
            );
          } else {
            chart.ButtonNamespace.zoomInButton.align(
              {
                align: "left",
                x: 290,
                y: 2,
              },
              true,
              "spacingBox"
            );

            chart.ButtonNamespace.zoomOutButton.align(
              {
                align: "left",
                x: 315,
                y: 2,
              },
              false,
              "spacingBox"
            );
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
            chart.ButtonNamespace.closeChartButton.align(
              {
                align: "right",
                x: closeX,
                y: 2,
              },
              false,
              "spacingBox"
            );

            chart.ButtonNamespace.maximizeButton.align(
              {
                align: "right",
                x: minX,
                y: 2,
              },
              false,
              "spacingBox"
            );

            chart.ButtonNamespace.minimizeButton.align(
              {
                align: "right",
                x: maxX,
                y: 2,
              },
              false,
              "spacingBox"
            );
          }
        },
      },
      zooming: {
        type: "xy",
      },
    },
    loading: {
      labelStyle: {
        display: "none", // Hide default "Loading..." text
      },
    },
    rangeSelector: {
      enabled: false,
      buttons: [
        {
          type: "minute",
          count: 3,
          text: "m",
        },
        {
          type: "day",
          count: 1,
          text: "d",
        },
        {
          type: "hour",
          count: 1,
          text: "h",
        },
      ],
    },
    tooltip: {
      shared: false,
    },
    plotOptions: {
      scatter: {
        color: "green",
        negativeColor: "red",
        tooltip: {
          pointFormatter: function () {
            //   console.log("upper: ", this.x);
            // var date = new Date(this.x);
            return [
              `<b>${symbol} ${Highcharts.numberFormat(this.y / 10000, 2)}</b>`,
            ];
          },
        },
      },
      series: {
        turboThreshold: 0,
        animation: true,

        marker: {
          enabled: false,
        },
      },
    },
    time: {
      timezone: "America/New_York",
      //timezone: 'US/Eastern',
      useUTC: false,
    },
    xAxis: [
      {
        events: {
          afterSetExtremes: function (e) {
            var chart = this.chart;
            if (e.trigger === "zoom" || e.trigger === "pan") {
              SetChartZoomActivate(chart, true);
              var symbol = chart.series[0].name;

              // After zoom, ensure the points maintain their colors
              var data = chart.series[0].data;

              // Initialize the previous price with the first data point's y value or a default value
              var previousPrice = data.length > 0 ? data[0].y : 0;

              data.forEach(function (point, index) {
                // Compare the current point's y value with the previous one
                if (index > 0 && point.y > previousPrice) {
                  point.update({ color: "green" });
                } else {
                  point.update({ color: "red" });
                }

                // Update previousPrice for the next iteration
                previousPrice = point.y;
              });
            }

            // Check if the event is triggered by zoom or pan
            if (e.trigger === "zoom" || e.trigger === "pan") {
              // Get the chart symbol (assuming it's the first series' name)
              var symbol = chart.series[0].name;

              // Determine if it's a zoom-in or zoom-out based on the new range
              var range = e.max - e.min;
              var isZoomIn = range < this.oldMax - this.oltdMin; // Compare with the previous range

              // Call zoomChart with the appropriate parameters
              debouncedZoomChart(isZoomIn, chart, undefined, symbol);
            }

            if (
              !(typeof chart.series[0].dataMax == "undefined") &&
              !(typeof chart.series[0].dataMin == "undefined")
            ) {
              chart.yAxis[0].setExtremes(
                chart.series[0].dataMin,
                chart.series[0].dataMax,
                false,
                false
              );
            }
          },
        },
        ordinal: false,
        type: "datetime",
        plotLines: plotLines,
        plotBands: plotBands,
        breaks: plotbreaks,
        //offset: 0,
        labels: {
          style: { color: fontColor, marginRight: 5 },
          padding: 5,
          allowOverlap: false,
          step: 2,
        },
        dateTimeLabelFormats: {
          second: "%H:%M:%S.%L",
          minute: "%H:%M",
          hour: "%H:%M",
          day: "%e. %b",
          week: "%e. %b",
          month: "%b '%y",
          year: "%Y",
        },
        lineWidth: 0,
        opposite: false,
        tickPixelInterval: 160,
        minRange: 60 * 1000,
      },
    ],
    yAxis: [
      {
        gridLineWidth: 0,
        dataGrouping: {
          enabled: false,
        },
        labels: {
          align: "left",
          x: 5,
          style: {
            color: fontColor, // Green color
          },
          formatter: function () {
            return Highcharts.numberFormat(this.value / 10000, 2);
          },
        },
        height: "65%",

        resize: { enabled: true },
        events: {
          afterSetExtremes: function (e) {
            const values = [];

            // console.log(e.max + "ychanged");
          },
        },
      },
      {
        gridLineWidth: 0,
        labels: {
          align: "left",
          x: 5,
          style: {
            color: fontColor,
          },
        },
        title: {
          text: "Volume",
        },
        top: "65%",
        height: "35%",
        resize: { enabled: true },
        offset: 1,
        lineWidth: 2,
        formatter: function () {
          return Highcharts.numberFormat(this.value / 1000, 2);
        },
      },
    ],
    series: [
      {
        name: symbol,
        lineWidth: 0,
        marker: {
          enabled: true,
          radius: 1,
        },
        tooltip: {
          valueDecimals: 2,
        },
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
        data: [],
        boostThreshold: 10000,
        turboThreshold: 0,
      },
      {
        type: "column",
        name: "Volume",
        data: [],
        yAxis: 1,
      },
    ],
    exporting: {},
    navigation: {
      buttonOptions: {
        align: "left",
        verticalAlign: "top",
      },
    },
    navigator: {
      enabled: false,
    },
    boost: {
      enabled: true,
      useGPUTranslations: true,
    },
    accessibility: {
      highContrastTheme: null,
      keyboardNavigation: {
        enabled: true,
        focusBorder: {
          enabled: false,
          hideBrowserFocusOutline: false,
        },
      },
    },
  });
}

const updatingCharts = {};

function removeChart(chart) {
  if ($("#chartList .chart-box").length == 1) {
    return;
  }

  var chartContaner = $(chart.renderTo);
  var chartId = chartContaner.data("chart-id");
  $(".chart-box.chart-box-" + chartId).remove();
  //$("#popup-chart-" + chartId).remove();
  Highcharts.removeEvent(chart.container, "wheel"); // Remove wheel event listener

  chart.destroy();
  var totalCharts = $("#chartList .chart-box").length;

  var cssClass = "col-12";
  if (totalCharts == 1) {
    cssClass = "col-12";
    //$("#chartList").sortable({ disabled: true });
    //if (!$(".chart-container").hasClass("chart-popup"))
    /*$(".chart-container").off("dblclick");*/
    removeWindowControlButtonsFromChart();
  } else if (totalCharts == 5) {
    cssClass = "col-12";
  } else if (totalCharts <= 4) {
    cssClass = "col-6";
  } else if (totalCharts <= 6) {
    cssClass = "col-4";
  } else if (totalCharts <= 8) {
    cssClass = "col-3";
  }

  $("#chartList .chart-box")
    .removeClass("col-3")
    .removeClass("col-4")
    .removeClass("col-6")
    .removeClass("col-12");
  $("#chartList .chart-box").addClass(cssClass);

  var chartBoxes = $("#chartList").find(".chart-box");

  chartBoxes.sort(function (a, b) {
    var counterA = $(".chart-container", a).data("chart-id");
    var counterB = $(".chart-container", b).data("chart-id");
    return counterA - counterB;
  });

  if (totalCharts == 5) {
    var chartListCol1 = $(
      '<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>'
    );
    var chartListCol2 = $(
      '<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'
    );

    chartBoxes.slice(0, 3).appendTo(chartListCol2.find("#chartListCol2"));
    chartBoxes.slice(3).appendTo(chartListCol1.find("#chartListCol1"));

    $("#chartList").append(chartListCol1).append(chartListCol2);
  } else {
    chartBoxes.appendTo("#chartList");
    $("#chartListCol1").parent().remove();
    $("#chartListCol2").parent().remove();
  }

  if (totalCharts == 5) {
    $("#chartListCol1 .chart-box")
      .removeClass("chart-height-100")
      .removeClass("chart-height-33")
      .addClass("chart-height-50");
    $("#chartListCol2 .chart-box")
      .removeClass("chart-height-100")
      .removeClass("chart-height-50")
      .addClass("chart-height-33");
  } else if (totalCharts > 2) {
    $("#chartList .chart-box")
      .removeClass("chart-height-100")
      .removeClass("chart-height-33");
    $("#chartList .chart-box").addClass("chart-height-50");
  } else {
    $("#chartList .chart-box")
      .removeClass("chart-height-50")
      .removeClass("chart-height-33");
    $("#chartList .chart-box").addClass("chart-height-100");
  }
}

function zoomChart(zoomIn, chart, dotNetObject = undefined, symbol) {
  showCustomLoading(chart);
  if (!chart.series[0].data || chart.series[0].data.length === 0) {
    setRange(symbol, "3D");
    console.warn(`No data available for zooming on chart: ${symbol}`);
    return; // Prevent zoom if no data is available
  }

  var xAxis = chart.xAxis[0];
  var extremes = xAxis.getExtremes();
  var range = extremes.max - extremes.min;
  var oldMin = extremes.min;
  var oldMax = extremes.max;

  var newMin, newMax;

  if (zoomIn) {
    // Zoom in by reducing the range by 20%
    newMin = extremes.min + range * 0.2;
    newMax = extremes.max - range * 0.2;
  } else {
    // Zoom out logic based on the specified ranges
    if (range <= 1000 * 30) {
      // Less than or equal to 30 seconds
      newMin = oldMin - 1000 * 15; // Zoom out by 15 seconds
      newMax = oldMax + 1000 * 15;
    } else if (range <= 1000 * 60) {
      // Less than or equal to 1 minute
      newMin = oldMin - 1000 * 30; // Zoom out by 30 seconds
      newMax = oldMax + 1000 * 30;
    } else if (range <= 1000 * 60 * 3) {
      // Less than or equal to 3 minutes
      newMin = oldMin - 1000 * 60 * 1.5; // Zoom out by 1.5 minutes
      newMax = oldMax + 1000 * 60 * 1.5;
    } else if (range <= 1000 * 60 * 5) {
      // Less than or equal to 5 minutes
      newMin = oldMin - 1000 * 60 * 2.5; // Zoom out by 2.5 minutes
      newMax = oldMax + 1000 * 60 * 2.5;
    } else if (range <= 1000 * 60 * 15) {
      // Less than or equal to 15 minutes
      newMin = oldMin - 1000 * 60 * 7.5; // Zoom out by 7.5 minutes
      newMax = oldMax + 1000 * 60 * 7.5;
    } else if (range <= 1000 * 60 * 30) {
      // Less than or equal to 30 minutes
      newMin = oldMin - 1000 * 60 * 15; // Zoom out by 15 minutes
      newMax = oldMax + 1000 * 60 * 15;
    } else if (range <= 1000 * 60 * 60) {
      // Less than or equal to 1 hour
      newMin = oldMin - 1000 * 60 * 30; // Zoom out by 30 minutes
      newMax = oldMax + 1000 * 60 * 30;
    } else if (range <= 1000 * 60 * 60 * 3) {
      // Less than or equal to 3 hours
      newMin = oldMin - 1000 * 60 * 60 * 1.5; // Zoom out by 1.5 hours
      newMax = oldMax + 1000 * 60 * 60 * 1.5;
    } else if (range <= 1000 * 60 * 60 * 6) {
      // Less than or equal to 6 hours
      newMin = oldMin - 1000 * 60 * 60 * 3; // Zoom out by 3 hours
      newMax = oldMax + 1000 * 60 * 60 * 3;
    } else if (range <= 1000 * 60 * 60 * 12) {
      // Less than or equal to 12 hours
      newMin = oldMin - 1000 * 60 * 60 * 6; // Zoom out by 6 hours
      newMax = oldMax + 1000 * 60 * 60 * 6;
    } else if (range <= 1000 * 60 * 60 * 18) {
      // Less than or equal to 18 hours
      newMin = oldMin - 1000 * 60 * 60 * 9; // Zoom out by 9 hours
      newMax = oldMax + 1000 * 60 * 60 * 9;
    } else if (range <= 1000 * 60 * 60 * 24) {
      // Less than or equal to 24 hours
      newMin = oldMin - 1000 * 60 * 60 * 12; // Zoom out by 12 hours
      newMax = oldMax + 1000 * 60 * 60 * 12;
    } else if (range <= 1000 * 60 * 60 * 36) {
      // Less than or equal to 36 hours
      newMin = oldMin - 1000 * 60 * 60 * 18; // Zoom out by 18 hours
      newMax = oldMax + 1000 * 60 * 60 * 18;
    } else {
      // For larger ranges, expand by 20% as usual
      newMin = extremes.min - range * 0.2;
      newMax = extremes.max + range * 0.2;
    }
  }

  // Calculate the 4 AM timestamp for the last three business days
  var lastThreeBusinessDays = getLastThreeBusinessDays();

  // Ensure newMin is not less than the timestamp of the last three business days at 4 AM
  newMin = Math.max(newMin, lastThreeBusinessDays);

  // Ensure the difference between newMin and newMax is at least 5 seconds
  if (zoomIn && newMax - newMin < 5000) {
    // If the range is less than 5 seconds, adjust newMax to be 5 seconds greater than newMin
    newMax = newMin + 5000; // Set newMax to newMin + 5 seconds
  }

  // Only apply zoom if the range is valid
  if (newMin < newMax) {
    setRangeByDate(symbol, newMin, newMax, extremes.min, extremes.max);
    // Get the current time and calculate the timestamp for 4 days ago
    var currentTime = new Date().getTime();
    var fourDaysAgo = currentTime - 4 * 24 * 60 * 60 * 1000; // 4 days in milliseconds

    // Ensure newMin is >= dataMin and newMax is <= dataMax
    if (newMin < fourDaysAgo) {
      newMin = Math.max(chart.xAxis[0].dataMin, newMin);
    }
    newMax = Math.min(chart.xAxis[0].dataMax, newMax);
    // xAxis.setExtremes(newMin, newMax);
    // Smooth animation (optional for better UX)
    chart.xAxis[0].update({ min: newMin, max: newMax }, true, {
      duration: 300, // Animation duration in milliseconds for smooth zoom
      easing: "easeOutQuad", // Use an easing function for smoother transitions
    });

    if (dotNetObject) {
      dotNetObject.invokeMethodAsync("ZoomingChanged", newMin, newMax);
    }

    // chart.xAxis.min = chart.xAxis[0].dataMin;
    // chart.xAxis.max = chart.xAxis[0].dataMax;
  } else {
    console.warn("Invalid zoom range. No zoom action performed.");
  }
  hideCustomLoading(chart);
}

// Function to get the 4 AM timestamp of the last three business days
function getLastThreeBusinessDays() {
  const today = new Date();
  const lastThreeBusinessDays = [];

  for (let i = 0; i < 3; i++) {
    let date = new Date(today);
    date.setDate(today.getDate() - (i + 1)); // Go back i+1 days

    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() - 1); // Move back one day if it's a weekend
    }

    // Set time to 4 AM
    date.setHours(4, 0, 0, 0);
    lastThreeBusinessDays.push(date.getTime());
  }

  // Return the minimum timestamp of the last three business days at 4 AM
  return Math.min(...lastThreeBusinessDays);
}

function removeWindowControlButtonsFromChart() {
  let chart = Highcharts.charts.filter((c) => c)[0];
  if (chart) {
    chart.ButtonNamespace.closeChartButton.hide();
    chart.ButtonNamespace.minimizeButton.hide();
    chart.ButtonNamespace.maximizeButton.hide();

    chart.update({
      accessibility: {
        keyboardNavigation: {
          order: singleChartkeyboardNavigationOrder,
        },
      },
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
            order: defaultkeyboardNavigationOrder,
          },
        },
      });
    }
  });
}

async function getChartDataByLastFeedPoint(symbol, lastPoint) {
  return await ChatAppInterop.dotnetReference.invokeMethodAsync(
    "GetChartDataByLastFeedPoint",
    symbol,
    lastPoint
  );
}

async function getFilteredDataBySymbol(
  symbol,
  duration = undefined,
  xAxisPixels = 0,
  yAxisPixels = 0
) {
  try {
    return await ChatAppInterop.dotnetReference.invokeMethodAsync(
      "GetFilteredDataBySymbol",
      symbol,
      duration,
      xAxisPixels,
      yAxisPixels
    );
  } catch (error) {
    console.error("Error fetching filtered data: ", error);
  }
}

async function GetFilteredDataBySymbolAndDateRange(
  symbol,
  startDate,
  endDate,
  oldStartDate,
  oldEndDate,
  xAxisPixels = 0,
  yAxisPixels = 0
) {
  try {
    return await ChatAppInterop.dotnetReference.invokeMethodAsync(
      "GetFilteredDataBySymbolAndDateRange",
      symbol,
      startDate,
      endDate,
      oldStartDate,
      oldEndDate,
      xAxisPixels,
      yAxisPixels
    );
  } catch (error) {
    console.error("Error fetching filtered data: ", error);
  }
}
async function getChartDataBySymbol(symbol, lastPoint = undefined) {
  return await ChatAppInterop.dotnetReference.invokeMethodAsync(
    "GetChartDataBySymbol",
    symbol,
    lastPoint
  );
}

// async function getExtremeDataBySymbol(
//   symbol,
//   min = undefined,
//   max = undefined
// ) {
//   return await ChatAppInterop.dotnetReference.invokeMethodAsync(
//     "GetExtremeDataBySymbol",
//     symbol,
//     min,
//     max
//   );
// }

async function updateChartSymbol(chartId, symbol) {
  return await ChatAppInterop.dotnetReference.invokeMethodAsync(
    "UpdateChartSymbol",
    chartId,
    symbol
  );
}

function processDataPoint(data, previousPrice) {
  const timeStamp = new Date(data.date).getTime(); // Convert date to timestamp once
  const color =
    data.msgtype == "H"
      ? "yellow"
      : data.price > previousPrice
      ? "green"
      : "red"; // Determine color based on price change
  return {
    primaryKey: data.id,
    x: timeStamp, // Use the computed timestamp
    y: data.price == 0 ? previousPrice : data.price,
    color: color, // Use the computed color,
    marker: { enabled: data.price == 0 ? false : true },
  };
}

function processDataChart(data) {
  return [[new Date(data.date).getTime(), Number(data.size)]];
}

function setDataToChart(
  chart,
  seriesData,
  newmin = 0,
  newmax = 0,
  update_extreme = true
) {
  if (seriesData.length < 1) return; // Return early if there isn't enough data

  const dataPoints = [];
  const volumePoints = [];
  let previousPrice = seriesData[0].price;

  seriesData.forEach((data, index) => {
    dataPoints.push(processDataPoint(data, previousPrice));
    if (data.size && Number(data.size) > 0) {
      volumePoints.push({
        x: new Date(data.date).getTime(),
        y: Number(data.size),
        color:
          data.msgtype === "H"
            ? "yellow"
            : data.price > previousPrice
            ? "green"
            : "red",
      });
    }
    previousPrice = data.price;
  });

  chart.series[0].setData(dataPoints, false); // Set data without redrawing
  chart.series[1].setData(volumePoints, false); // Set data without redrawing

  // Redraw once after all data is set
  chart.redraw();

  if (update_extreme && dataPoints.length > 1) {
    const minX = newmin !== 0 ? newmin : dataPoints[0].x;
    const maxX = newmax !== 0 ? newmax : dataPoints[dataPoints.length - 1].x;
    chart.xAxis[0].setExtremes(minX, maxX, false);
  }
  // Redraw once after all data is set
  chart.redraw();
}

//debugger
function addPointToChart(
  chart,
  seriesData,
  redraw = false,
  animateOnUpdate = false,
  isAddVolume = false
) {
  if (seriesData.length < 1) return;
  let lastPoint = null;
  let series = chart.series[0];
  let volumeSeries = chart.series[1];

  // Case for handling a single point with price 0
  if (seriesData.length === 1 && seriesData[0].price === 0) {
    const data = seriesData[0]; // Get the single data point
    const lastPoint = series.data[series.data.length - 1]; // Get the last point in the series
    // Process the point with price 0 and add it if last point is different
    const point = processDataPoint(data, lastPoint.y); // Use 0 as the previous price since there's no previous point
    point.marker = { enabled: false }; // Hide the marker (point)
    point.color = "transparent"; // Make the point invisible
    point.enableMouseTracking = false; // Disable interaction for the point
    series.addPoint(point, redraw, animateOnUpdate, {
      visible: false, // Set the point as invisible
    });
    return; // Exit early since we're done with the single point
  }

  // console.log(chart);
  seriesData.slice(1).forEach((data, index) => {
    const previousPrice = seriesData[index].price; // Get the previous price
    const currentPrice = data.price; // Get the current price

    // Create the point for the main series
    const point = processDataPoint(data, previousPrice);

    // Add the volume data to the volume series with color based on the price comparison
    if (data.size && Number(data.size) > 0) {
      const volumePoint = {
        x: new Date(data.date).getTime(),
        y: Number(data.size),
        color:
          data.msgtype == "H"
            ? "yellow"
            : currentPrice > previousPrice
            ? "green"
            : "red", // Set color conditionally,
        marker: { enabled: data.price == 0 ? false : true },
      };
      volumeSeries.addPoint(volumePoint, redraw, animateOnUpdate);
    }
    series.addPoint(point, redraw, animateOnUpdate);
  });
}

// async function RefreshChartBySymbol() {
//   for (let chart of Highcharts.charts) {
//     if (!chart) continue;

//     await ChatAppInterop.dotnetReference.invokeMethodAsync(
//       "RefreshChartBySymbol",
//       chart.series[0].name
//     );
//   }
// }
function debounce(func, delay) {
  let debounceTimer;
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}
const debouncedZoomChart = debounce(zoomChart, 1000);
const debouncedZoomChart_zommOut = debounce(zoomChart, 300);

const debouncedSetRange = debounce(setRange, 500);
const debouncedSetRangeByDate = debounce(setRangeByDate, 1000);

var counter2 = 0;
async function refreshCharts(symbol, seriesData) {
  setTimeout(async function () {
    let chart = getChartInstanceBySeriesName(symbol);
    if (!processingCharts.includes(symbol)) {
      debugger;
      if (chart) {
        //    console.log("refresh" + JSON.stringify(seriesData) + "ley "+symbol);
        addPointToChart(chart, seriesData, false, false, true);
        // if (!FindChartZoomActivate(chart)) {
        //   // console.log("Chart is not zommed!");
        //   chart.redraw();
        // }

        // Check if the chart is in the processingCharts array

        // If the chart is not being processed, redraw it
        chart.redraw();

        // // Fetch the min and max x values from the updated series data
        // const series = chart.series[0];
        // if (series && series.data.length > 0) {
        //   const minX = series.data[0].x; // First data point on the x-axis
        //   const maxX = series.data[series.data.length - 1].x; // Last data point on the x-axis

        //   // Set the new extremes on the x-axis based on the updated data
        //   chart.xAxis[0].setExtremes(minX, maxX);

        //   // // Redraw again after setting the new extremes
        //   // chart.redraw();
        // }
      }
    } else {
      console.log("Chart is being processed, skipping redraw.");
    }
  }, 50);
  //removeOldPoints(chart, 3);
  //chart.redraw();
}

function addClassToChartBoxes(totalCharts) {
  let cssClass = "col-12";

  if (totalCharts == 2 || totalCharts == 4) {
    cssClass = "col-6";
  } else if (totalCharts == 5) {
    cssClass = "col-12";
  } else if (totalCharts == 6) {
    cssClass = "col-4";
  } else if (totalCharts == 8) {
    cssClass = "col-3";
  }

  $("#chartList .chart-box").addClass(cssClass);
}

function addChartBoxToChartList(totalCharts, chartBox) {
  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length < 3) {
      $("#chartListCol2").append(chartBox);
    } else {
      $("#chartListCol1").append(chartBox);
    }
  } else {
    $("#chartList").append(chartBox);
  }

  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length > 3) {
      chartBox.addClass("chart-height-50");
    } else {
      chartBox.addClass("chart-height-33");
    }
  } else if (totalCharts > 2) {
    $("#chartList .chart-box").removeClass("chart-height-100");
    $("#chartList .chart-box").addClass("chart-height-50");
  } else {
    $("#chartList .chart-box").removeClass("chart-height-50");
    $("#chartList .chart-box").addClass("chart-height-100");
  }
}

function addChartBox(totalCharts, chartIndx, symbol) {
  var cssClass = "col-12";

  if (totalCharts == 2 || totalCharts == 4) {
    cssClass = "col-6";
  } else if (totalCharts == 5) {
    cssClass = "col-12";
  } else if (totalCharts == 6) {
    cssClass = "col-4";
  } else if (totalCharts == 8) {
    cssClass = "col-3";
  }

  var chartContainerId = "chart-" + chartIndx,
    chartBoxClass = "chart-box-" + chartIndx;
  var chartBox = $(
    `<div class="chart-box ${chartBoxClass} ${cssClass}"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`
  );

  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length < 3) {
      $("#chartListCol2").append(chartBox);
    } else {
      $("#chartListCol1").append(chartBox);
    }
  } else {
    $("#chartList").append(chartBox);
  }

  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length > 3) {
      chartBox.addClass("chart-height-50");
    } else {
      chartBox.addClass("chart-height-33");
    }
  } else if (totalCharts > 2) {
    $("#chartList .chart-box").removeClass("chart-height-100");
    $("#chartList .chart-box").addClass("chart-height-50");
  } else {
    $("#chartList .chart-box").removeClass("chart-height-50");
    $("#chartList .chart-box").addClass("chart-height-100");
  }

  var chart = addChart(totalCharts, chartContainerId, [], symbol);

  if (totalCharts == 1) {
    removeWindowControlButtonsFromChart();
  }

  return chart;
}

function createDashboard(totalCharts, initialChartSymbols) {
  totalCharts = 1;
  localStorage.setItem("chartCount", totalCharts);
  removeUnusedElement();

  let charts = Highcharts.charts.filter((hc) => hc);

  if (charts.length == totalCharts) return;

  let chartList = $("#chartList");

  chartList.html("");

  charts.forEach((c) => {
    if (c) {
      c.destroy();
    }
  });

  if (totalCharts == 5) {
    chartList
      .append(
        $(
          '<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>'
        )
      )
      .append(
        $(
          '<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'
        )
      );
  }
  // Create a Set to keep track of seen symbols
  let seenSymbols = new Set();
  for (let indx = 1; indx <= totalCharts; indx++) {
    let symbolInfo = initialChartSymbols[indx - 1];
    // Iterate over the first 8 records of initialChartSymbols and remove duplicates (Task 86cw3n1ph)
    for (let i = 0; i < 8; i++) {
      let symbolInfo = initialChartSymbols[i];

      // Check if the symbol is already in the set
      if (seenSymbols.has(symbolInfo.symbol)) {
        // If a duplicate is found, remove it from initialChartSymbols
        initialChartSymbols.splice(i, 1);
        // Decrement i to check the new element at this index
        i--;
      } else {
        // Add the symbol to the set if it's not seen yet
        seenSymbols.add(symbolInfo.symbol);
      }
    }
    addChartBox(totalCharts, indx, symbolInfo.symbol);
  }
}

function updateButtonColour() {
  document.querySelectorAll(".highcharts-button-box").forEach((button) => {
    button.style.fill = backgroundColor;
    button.style.stroke = fontColor;
  });

  // Update text color for the buttons.
  document.querySelectorAll(".highcharts-button text").forEach((text) => {
    text.style.fill = fontColor;
  });

  // Update symbol color for the buttons.
  document.querySelectorAll(".highcharts-button i").forEach((i) => {
    i.style.setProperty("color", fontColor, "important");
  });
}

var plotLines = [];
var plotBands = [];
var plotbreaks = [];
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function generatePlotLinesAndBreaks(startDate, endDate) {
  const plotLines = []; // Array to store vertical lines
  const plotbreaks = []; // Array to store breaks

  // Iterate over each day in the date range
  for (
    var date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    var dayOfWeek = date.getDay(); // Get the day of the week

    // Add vertical line at 8 PM on weekdays (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      plotLines.push({
        color: "white", // Color of the line
        width: 2, // Width of the line
        dashStyle: "Dot",
        value: new Date( // Value where to draw the line
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          20, // 8 PM
          0 // 0 minutes
        ).getTime(),
        zIndex: 5, // z-index for stacking order
      });

      // Calculate the 'todate' for breaks
      var todate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        4,
        0
      );
      if (dayOfWeek != 5) {
        todate.setDate(todate.getDate() + 1); // Move to the next day (for weekdays)
      } else {
        todate.setDate(todate.getDate() + 3); // Move to Monday (for Friday)
      }

      plotbreaks.push({
        from: Math.floor(
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            20,
            0
          ).getTime()
        ), // 8 PM
        to: Math.floor(todate.getTime()), // 'todate'
        breakSize: 0, // Size of the break
      });
    }
  }

  return { plotLines, plotbreaks }; // Return both arrays
}

function loadDashboard(totalCharts, initialChartSymbols) {
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

  // Call the function to get new plotLines and plotbreaks
  const { plotLines: newPlotLines, plotbreaks: newPlotbreaks } =
    generatePlotLinesAndBreaks(startDate, endDate);

  // Clear existing arrays and assign new values
  plotLines = newPlotLines; // Assign the new plot lines to the existing variable
  plotbreaks = newPlotbreaks; // Assign the new plot breaks to the existing variable

  localStorage.setItem("chartCount", null);
  let chartList = $("#chartList");

  if (totalCharts == 5) {
    chartList
      .append(
        $(
          '<div class="col-sm-8"><div id="chartListCol1" class="row"></div></div>'
        )
      )
      .append(
        $(
          '<div class="col-sm-4"><div id="chartListCol2" class="row"></div></div>'
        )
      );
  }

  initialChartSymbols.slice(0, totalCharts).forEach((chartSymbol, index) => {
    addChartBox(totalCharts, index + 1, chartSymbol.symbol);
  });
}

function popoutChartWindow(dotNetObject, element, chartIndx, symbol) {
  removeUnusedElement();

  var chartContainerId = "chart-" + chartIndx,
    chartBoxClass = "chart-box-" + chartIndx;
  var chartBox = $(
    `<div class="chart-box ${chartBoxClass} vh-100"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`
  );

  $(element).append(chartBox);

  var chart = addChart(1, chartContainerId, [], symbol, false, dotNetObject);

  var endDate = new Date(); // Current date and time

  // Calculate the start date as 3 days before the current date
  var startDate = new Date();
  startDate.setDate(endDate.getDate() - 3); // Subtract 3 days

  // Call the function to get new plotLines and plotbreaks
  const { plotLines: newPlotLines, plotbreaks: newPlotbreaks } =
    generatePlotLinesAndBreaks(startDate, endDate);

  // Add plotLines and plotBands to the chart
  chart.xAxis[0].update({
    plotLines: newPlotLines,
    plotBands: plotBands,
    breaks: newPlotbreaks,
  });

  removeWindowControlButtonsFromChart();
}

async function popinChartWindow(chartIndx, minPoint, maxPoint, symbol) {
  var totalCharts = $("#chartList .chart-box").length + 1;

  var cssClass = "col-12";

  if (totalCharts == 2 || totalCharts == 4) {
    cssClass = "col-6";
  } else if (totalCharts == 5) {
    cssClass = "col-12";
  } else if (totalCharts == 6) {
    cssClass = "col-4";
  } else if (totalCharts == 8) {
    cssClass = "col-3";
  }

  var chartContainerId = "chart-" + chartIndx,
    chartBoxClass = "chart-box-" + chartIndx;
  var chartBox = $(
    `<div class="chart-box ${chartBoxClass} ${cssClass}"><div class="chart-container" id="${chartContainerId}" data-chart-id="${chartIndx}" ></div></div>`
  );

  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length < 3) {
      $("#chartListCol2").append(chartBox);
    } else {
      $("#chartListCol1").append(chartBox);
    }
  } else {
    $("#chartList").append(chartBox);
  }

  if (totalCharts == 5) {
    if ($("#chartList .chart-box").length > 3) {
      chartBox.addClass("chart-height-50");
    } else {
      chartBox.addClass("chart-height-33");
    }
  } else if (totalCharts > 2) {
    $("#chartList .chart-box").removeClass("chart-height-100");
    $("#chartList .chart-box").addClass("chart-height-50");
  } else {
    $("#chartList .chart-box").removeClass("chart-height-50");
    $("#chartList .chart-box").addClass("chart-height-100");
  }

  var chart = addChart(totalCharts, chartContainerId, [], symbol);

  if (totalCharts == 1) {
    removeWindowControlButtonsFromChart();
  }

  addWindowControlButtonsToChart();
  // var data = await getChartDataBySymbol(symbol, null);
  // setDataToChart(chart, data);
  hideCustomLoading(chart);
}

function getChartInstance(chartId) {
  let chart = Highcharts.charts.find((c) => c && c.renderTo.id === chartId);
  return chart || null;
}

function getChartInstanceBySeriesName(seriesName) {
  let chart = Highcharts.charts.find(
    (c) => c && c.series[0]?.name === seriesName
  );
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
      hideCustomLoading(chart);
      return;
    }

    setTimeout(addPointToChart(chart, seriesData, false, false, true), 0);

    if (isAllLoaded) {
      chart.redraw();
      hideCustomLoading(chart);
    }
  }
}

async function updateAllSymbols(symbols) {
  for (let data of symbols) {
    await updateBySymbolName(data.symbol);
  }
}

async function updateBySymbolName(symbol) {
  let chart = getChartInstanceBySeriesName(symbol);
  if (chart) {
    await setRange(symbol, "");
    chart.redraw();
    hideCustomLoading(chart);
  }
}

async function refreshAllChartsIfOffline(startdate) {
  let charts = Highcharts.charts.filter((hc) => hc);

  for (let chart of charts) {
    if (chart) {
      showCustomLoading(chart);

      try {
        var xAxis = chart.xAxis[0];
        var extremes = xAxis.getExtremes();
        var mindate = extremes.min;

        // Append the chart's symbol to processingCharts before calling filtereddata
        var chartSymbol = chart.series[0].name;
        processingCharts.push(chartSymbol);

        let filtereddata =
          await ChatAppInterop.dotnetReference.invokeMethodAsync(
            "RefreshDataBasedOnStartDate",
            chartSymbol,
            mindate,
            startdate,
            chart.xAxis[0].width,
            chart.yAxis[0].height
          );

        setDataToChart(chart, filtereddata);

        if (filtereddata.length > 0) {
          SetChartZoomActivate(chart, false);
        }
      } catch (error) {
        console.error("Error fetching filtered data: ", error);
      }

      hideCustomLoading(chart);
      // Remove the chart's symbol from the processing list after setting the data
      processingCharts = processingCharts.filter(
        (symbol) => symbol !== chart.series[0].name
      );

      console.log("Remaining charts to process: ", processingCharts.length);
    }
  }
}

async function setRange(symbol, duration) {
  let chart = getChartInstanceBySeriesName(symbol);

  if (chart) {
    showCustomLoading(chart);

    let filtereddata = await getFilteredDataBySymbol(
      symbol,
      duration,
      chart.xAxis[0].width,
      chart.yAxis[0].height
    );

    // console.log("points filtered " + filtereddata.length);
    setDataToChart(chart, filtereddata);
    if (filtereddata.length > 0) {
      SetChartZoomActivate(chart, false);
    }
    hideCustomLoading(chart);
  }
}

async function setRangeByDate(
  symbol,
  startDate,
  endDate,
  oldStartDate,
  oldEndDate
) {
  let chart = getChartInstanceBySeriesName(symbol);
  if (chart) {
    //    let filtereddata = await getFilteredDataBySymbol(symbol, range, chart.chartWidth - 50, Math.floor((chart.chartHeight * 65) / 100));
    //  console.log("setRange" + JSON.stringify(filtereddata));
    let filtereddata = await GetFilteredDataBySymbolAndDateRange(
      symbol,
      startDate,
      endDate,
      oldStartDate,
      oldEndDate,
      chart.xAxis[0].width,
      chart.yAxis[0].height
    );
    if (filtereddata.length > 0)
      setDataToChart(chart, filtereddata, (update_extreme = false));
  }
}

async function setButtonActive(e) {
  //debugger
  if (e) {
    var chartContainer = e.element.closest(".chart-container");
    if (chartContainer) {
      var activeButtons = chartContainer.getElementsByClassName("active");

      // Convert HTMLCollection to an array using Array.from
      Array.from(activeButtons).forEach(function (el) {
        el.classList.remove("active");
      });
    }
    e.element.classList.add("active");
  }
}

// Function to fetch new data (this is just a placeholder)
function fetchData() {
  let charts = Highcharts.charts.filter((hc) => hc);

  for (let chart of charts) {
    if (
      chart &&
      chart.series[0]?.name &&
      !processingCharts.includes(chart.series[0]?.name)
    ) {
      symbol = chart.series[0].name;
      var extremes = chart.xAxis[0].getExtremes();
      setRangeByDate(
        symbol,
        extremes.min,
        extremes.max,
        chart.xAxis[0].dataMin,
        chart.xAxis[0].dataMax
      );
    }
  }
}

// Call fetchData every 8 seconds
setInterval(fetchData, 60000);
