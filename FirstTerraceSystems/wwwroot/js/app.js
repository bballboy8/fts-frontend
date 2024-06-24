//function addChartButton(chart, label, x, y, onClick) {
//    return chart.renderer.button(
//        label,
//        x,
//        y,
//        function () {
//            onClick(label);
//        }
//    ).add();
//}

function updateButtonPositions(chart) {
    const buttons = chart.ButtonNamespace;

    buttons.zoomInButton.style.left = '365px';
    buttons.zoomInButton.style.top = '10.5px';

    buttons.zoomOutButton.style.left = '401px';
    buttons.zoomOutButton.style.top = '10.5px';

    buttons.closeChartButton.style.left = (chart.chartWidth - 40) + 'px';
    buttons.closeChartButton.style.top = '10px';

    buttons.maximizeButton.style.left = (chart.chartWidth - buttons.closeChartButton.offsetWidth - (40 * 1.2)) + 'px';
    buttons.maximizeButton.style.top = '10px';

    buttons.minimizeButton.style.left = (chart.chartWidth - buttons.maximizeButton.offsetWidth - (40 * 2.1)) + 'px';
    buttons.minimizeButton.style.top = '10px';
}

function addHtmlButtonToChart(chart, options) {
    const {
        text = 'Button',
        x = 0,
        y = 0,
        callback = () => { },
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
            'stroke-width': 2,
            r: 5,
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
        true // useHTML
    ).attr({
        width: 12,
        height: 5,
        'text-anchor': 'middle'
    }).css({
        display: 'flex',
        justifyContent: 'center',  
        alignItems: 'center',    
        fontSize: '12px',
        textAlign: 'center',
    });

    //button.addClass('btn btn-sm')
    button.add();

    return button;
}

function addButtonToChart(chart, options) {
    const {
        text = 'Button',
        x = 0,
        y = 0,
        callback = () => { },
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
            'stroke-width': 2,
            r: 5,
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
        'text-anchor': 'middle'
    }).css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
        textAlign: 'center',
    });

    //button.addClass('btn btn-sm')
    button.add();

    return button;
}

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