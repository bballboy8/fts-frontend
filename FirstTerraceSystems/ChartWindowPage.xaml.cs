using FirstTerraceSystems.Components.Pages;
using Microsoft.JSInterop;

namespace FirstTerraceSystems;

public partial class ChartWindowPage : ContentPage
{

    private readonly object _ohlcData;
    private readonly object _chartIndx;
    private readonly object _volumeData;
    private readonly object _groupingUnits;
    private readonly IJSObjectReference _jsObjectReference;


    public ChartWindowPage(IJSObjectReference jsObjectReference, object chartIndx, object ohlc, object volume, object groupingUnits)
    {
        InitializeComponent();
        _ohlcData = ohlc;
        _chartIndx = chartIndx;
        _volumeData = volume;
        _groupingUnits = groupingUnits;
        _jsObjectReference = jsObjectReference;
    }

    protected override async void OnAppearing()
    {
        ChartComponent.ComponentType = typeof(ChartWindow);
        ChartComponent.Parameters = new Dictionary<string, object?>
        {
            { "OhlcData", _ohlcData },
            { "GroupingUnits", _groupingUnits },
            { "VolumeData", _volumeData },
            { "ChartIndx", _chartIndx }
        };

        //var jsRuntime = BlazorWebView.Handler?.MauiContext?.Services.GetService<IJSRuntime>();
        var wasDispatchCalled = await BlazorWebView.TryDispatchAsync(sp =>
        {
            var jsRuntime = sp.GetRequiredService<IJSRuntime>();
            jsRuntime?.InvokeVoidAsync("changeBackgroundColor", false);
        });


        base.OnAppearing();
    }

    protected override void OnDisappearing()
    {
        _jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, _ohlcData, _volumeData, _groupingUnits);
        base.OnDisappearing();
    }
}