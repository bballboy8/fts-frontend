let backgroundColor = '#202527';
let fontColor = '#ffffff';
let isDarkMode = true;

// Class
class ButtonComponent extends Highcharts.AccessibilityComponent {
    constructor(chart, rendererButton) {
        super();
        this.initBase(chart);
        this.rendererButton = rendererButton;
    }

    // Perform tasks to be done when the chart is updated
    onChartUpdate() {
        // Set attributes on the button
        if (this.rendererButton) {
            this.rendererButton.attr({
                role: 'button',
                tabindex: -1
            });
            Highcharts.A11yChartUtilities.unhideChartElementFromAT(
                this.chart, this.rendererButton.element
            );
        }
    }

    // Define keyboard navigation for this component
    getKeyboardNavigation() {
        const { keyCodes: keys } = this;
        const { chart } = this;
        const component = this;

        return new Highcharts.KeyboardNavigationHandler(chart, {
            keyCodeMap: [
                // On arrow/tab we just move to the next chart element.
                [
                    [keys.tab, keys.up, keys.down, keys.left, keys.right],
                    function (keyCode, e) {
                        return this.response[
                            (keyCode === this.tab && e.shiftKey) ||
                                keyCode === keys.left || keyCode === keys.up ?
                                'prev' : 'next'
                        ];
                    }
                ],
                // Space/enter means we click the button
                [
                    [keys.space, keys.enter],
                    function () {
                        // Fake a click event on the button element
                        if (component.rendererButton && component.rendererButton.element) {
                            component.fakeClickEvent(component.rendererButton.element);
                        }
                        return this.response.success;
                    }
                ]
            ],
            // Focus button initially
            init() {
                if (component.rendererButton && component.rendererButton.element && component.rendererButton.element.focus) {
                    component.rendererButton.element.focus();
                }
            }
        });
    }
}

// Functions
function addHtmlButtonToChart(chart, options) {
    const {
        text = 'Button',
        x = 0,
        y = 0,
        callback = () => { },
        hoverColor = '#5B6970'
        //theme = {},
        //hoverState = {},
        //selectState = {},
        //disabledState = {},
    } = options;

    const button = chart.renderer.button(
        text,
        x,
        y,
        callback,
        {
            fill: '#272C2F',
            stroke: '#272C2F',
            //'stroke-width': 2,
            //r: 5,
            style: {
                color: '#FFFFFF',
            },
        }, // theme
        {
            fill: hoverColor,
            //stroke: 'green'
        }, // hoverState
        {
            fill: 'yellow',
            stroke: 'orange'
        }, // selectState
        {
            fill: 'gray',
            stroke: 'darkgray'
        }, // disabledState
        'rect', //shape
        true // useHTML
    ).attr({
        width: 12,
        height: 5,
        'text-anchor': 'middle'
    });

    //button.addClass('btn btn-sm')
    button.add();

    return button;
}

function addButtonToChart(chart, options) {

    debugger
    const {
        text = 'Button',
        x = 0,
        y = 0,
        callback = () => { },
        height = undefined,
        width = undefined,
        title = ''
        //theme = {},
        //hoverState = {},
        //selectState = {},
        //disabledState = {},
    } = options;

    const button = chart.renderer.button(
        text,
        x,
        y,
        callback,
        {
            fill: '#272C2F',
            //stroke: '#272C2F',
            //'stroke-width': 2,
            //r: 5,
            style: {
                color: '#FFFFFF',
            },
        }, // theme
        {
            fill: '#5B6970',
            //stroke: 'green'
        }, // hoverState
        {
            fill: 'yellow',
            stroke: 'orange'
        }, // selectState
        {
            fill: 'gray',
            stroke: 'darkgray'
        }, // disabledState
        'rect', //shape
        false // useHTML
    ).attr({
        width: width,
        height: height,
        title: title 
    });

    //button.addClass('btn btn-sm')
    button.add();

    return button;
}

function removeUnusedElement() {
    $('#dvSymbolInput').remove();
}


function loadTemplates(e) {
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

function truncateText(text, maxWidth, ellipsis = '...') {
    if (!text || typeof text !== 'string') {
        return '';
    }
    if (text.length <= maxWidth) {
        return text;
    } else {
        return text.slice(0, maxWidth - ellipsis.length) + ellipsis;
    }
}

// Global Functions

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

window.showLoader = () => {
    var loader = document.getElementById('pageLoader');
    loader.style.display = 'flex';
    setTimeout(function () {
        loader.style.display = 'none';
    }, 1600);
}

window.LoadKeyBordEventToDisplayOptions = function (element, dotNetObject) {

    const dropdownItems = $(element).find('.dropdown-item');
    const itemCount = dropdownItems.length;

    if (dropdownItems.length === 0) return;
    $(element).on('keydown', async function (event) {

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {

            event.preventDefault();

            if (itemCount === 0) return;

            var currentIndex = dropdownItems.index(document.activeElement);
            var isArrowDown = event.key === 'ArrowDown';

            if (currentIndex === -1) {
                dropdownItems.eq(isArrowDown ? 0 : itemCount - 1).focus();
            } else {
                dropdownItems.eq((currentIndex + (isArrowDown ? 1 : -1) + itemCount) % itemCount).focus();
            }
        }
        else if (event.key === 'Enter' || event.key === ' ') {
            var itemType = $(document.activeElement).data('item-type');

            if (itemType == 'savelayout') {
                await dotNetObject.invokeMethodAsync('SaveLayout');
            } else if (itemType = 'template') {
                var totalCharts = $(document.activeElement).data('load-template');
                var num = parseInt(totalCharts, 10);

                if (!isNaN(num) && num > 0) {
                    createDashboard(totalCharts);
                }
            }
        } else if (event.key === 'Escape') {
            $('.dropdown-toggle', this).eq(0).dropdown('toggle');
        }
    });
}

$(document).ready(function () {

    $("body").on("click", ".password-toggle", function () {
        var inputType = $(".txt-password-input", $(this).closest(".password-input")).prop("type");
        if (inputType == 'text') {
            $(".txt-password-input", $(this).closest(".password-input")).prop("type", "password");
            $(this).removeClass("bi-eye-slash");
            $(this).addClass("bi-eye");
        }
        else {
            $(".txt-password-input", $(this).closest(".password-input")).prop("type", "text");
            $(this).addClass("bi-eye-slash");
            $(this).removeClass("bi-eye");
        }
    })

    $('body').on('keydown', '.dropdown-toggle', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();

            var isOpen = $(this).attr('aria-expanded') === 'true';

            if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                $(this).dropdown('toggle');
            }
        }
    });

});

//document.addEventListener('DOMContentLoaded', async function () {

//    const data = await fetch(
//        'https://demo-live-data.highcharts.com/aapl-ohlc.json'
//    ).then(response => response.json());


//    Highcharts.setOptions({
//        lang: {
//            rangeSelectorZoom: ""
//        }
//    });

//    Highcharts.stockChart('container', {
//        rangeSelector: {
//            selected: 2,
//            buttons: [
//                {
//                    type: 'month',
//                    count: 1,
//                    text: '1m',
//                    title: '1 month'
//                },
//                {
//                    type: 'month',
//                    count: 3,
//                    text: '3m',
//                    title: '3 months'
//                },
//                {
//                    type: 'month',
//                    count: 6,
//                    text: '6m',
//                    title: '6 months'
//                },
//                {
//                    type: 'ytd',
//                    text: 'YTD',
//                    title: 'View year to date'
//                },
//                {
//                    type: 'year',
//                    count: 1,
//                    text: '1y',
//                    title: '1 year'
//                }, {
//                    type: 'all',
//                    text: 'All',
//                    title: 'View all'
//                }
//            ]
//        },

//        title: {
//            text: 'AAPL Stock Price'
//        },

//        series: [{
//            type: 'ohlc',
//            name: 'AAPL Stock Price',
//            data: data,
//            dataGrouping: {
//                units: [[
//                    'week', // unit name
//                    [1] // allowed multiples
//                ], [
//                    'month',
//                    [1, 2, 3, 4, 6]
//                ]]
//            }
//        }],
//        chart: {
//            events: {
//                load: function () {

//                    var chart = this;

//                    const minimizeButton = addChartButton(chart, "minimizeButton", 60, 10, function () {
//                        alert('minimizeButton Pressed');
//                    });

//                    const maximizeButton = addChartButton(chart, "maximizeButton", 100, 10, function () {
//                        alert('maximizeButton Pressed');
//                    });

//                    this.update({
//                        accessibility: {
//                            customComponents: {
//                                minimizeButtonComponent: new ButtonComponent(chart, minimizeButton),
//                                maximizeButtonComponent: new ButtonComponent(chart, maximizeButton)
//                            },
//                            keyboardNavigation: {
//                                enabled: true,
//                                focusBorder: {
//                                    enabled: true,
//                                    hideBrowserFocusOutline: false
//                                },
//                                order: ['minimizeButtonComponent', 'maximizeButtonComponent', 'zoom', 'rangeSelector', 'series', 'chartMenu', 'legend']
//                            }
//                        }
//                    });

//                    window.addEventListener('resize', function () {
//                        chart.reflow();
//                    });

//                    var chart = this,
//                        rangeSelector = chart.rangeSelector,
//                        buttonGroup = rangeSelector && rangeSelector.buttonGroup;


//                    if (buttonGroup) {
//                        var buttons = buttonGroup.element.childNodes;

//                        buttons.forEach(function (button) {
//                            button.setAttribute('style', 'display: none'); // Hide all buttons initially
//                        });

//                        var visibleButtons = [];

//                        // Determine which buttons to show based on the chart width
//                        if (chart.chartWidth < 500) {
//                            visibleButtons.push(0, 3); // Show the first and last buttons
//                        } else if (chart.chartWidth < 800) {
//                            visibleButtons.push(1, 3); // Show the second last button
//                        } else {
//                            visibleButtons.push(0, 1, 2, 3); // Show all buttons
//                        }

//                        // Show the selected buttons
//                        visibleButtons.forEach(function (index) {
//                            buttons[index].setAttribute('style', 'display: block');
//                        });
//                    }
//                }
//            }
//        },
//    });
//});