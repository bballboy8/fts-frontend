using FirstTerraceSystems.Components.Pages;
using FirstTerraceSystems.Services;
using Microsoft.JSInterop;

namespace FirstTerraceSystems;

public partial class ChartWindowPage : ContentPage
{

    private readonly object _ohlcData;
    private readonly object _chartIndx;
    private readonly object _volumeData;
    private readonly object _groupingUnits;
    private readonly object _min;
    private readonly object _max;
    private readonly object _symbol;
    private readonly IJSObjectReference _jsObjectReference;

    public delegate void RefreshChart();


    public ChartWindowPage(IJSObjectReference jsObjectReference, object chartIndx, object ohlc, object volume, object groupingUnits, object min, object max, object symbol)
    {
        InitializeComponent();
        _ohlcData = ohlc;
        _chartIndx = chartIndx;
        _volumeData = volume;
        _groupingUnits = groupingUnits;
        _jsObjectReference = jsObjectReference;
        _min = min;
        _max = max;
        _symbol = symbol;
    }

    protected override void OnAppearing()
    {
        ChartComponent.ComponentType = typeof(ChartWindow);
        ChartComponent.Parameters = new Dictionary<string, object?>
        {
            { "OhlcData", _ohlcData },
            { "GroupingUnits", _groupingUnits },
            { "VolumeData", _volumeData },
            { "ChartIndx", _chartIndx },
            { "MinPoint", _min },
            { "MaxPoint", _max },
            { "Symbol", _symbol }
        };

        base.OnAppearing();
    }

    protected override void OnDisappearing()
    {
        if (!StateContainerService.IsAllowCloseAllWindows)
        {
            var chartPage  = StateContainerService.ChartPages.FirstOrDefault(a => a.ChartId == _chartIndx?.ToString());
            _jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, _ohlcData, _volumeData, _groupingUnits, chartPage?.UpdatedMinExtreme, chartPage?.UpdatedMaxExtreme, _symbol);
        }

        StateContainerService.RemoveChartPage(_chartIndx.ToString());
        base.OnDisappearing();
    }
}