using FirstTerraceSystems.Components.Pages;
using FirstTerraceSystems.Services;
using Microsoft.JSInterop;

namespace FirstTerraceSystems;

public partial class ChartWindowPage : ContentPage
{

    private readonly object _chartIndx;
    private readonly object _min;
    private readonly object _max;
    private readonly object _symbol;
    private readonly IJSObjectReference _jsObjectReference;

    public delegate void RefreshChart();


    public ChartWindowPage(IJSObjectReference jsObjectReference, object chartIndx, object min, object max, object symbol)
    {
        InitializeComponent();
        _chartIndx = chartIndx;
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
            _jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, chartPage?.UpdatedMinExtreme, chartPage?.UpdatedMaxExtreme, chartPage?.Symbol);
        }

        StateContainerService.RemoveChartPage(_chartIndx.ToString());
        base.OnDisappearing();
    }
}