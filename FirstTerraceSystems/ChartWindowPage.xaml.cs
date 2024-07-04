using FirstTerraceSystems.Components.Pages;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.JSInterop;

#if WINDOWS
using Microsoft.Web.WebView2.Core;
#endif

namespace FirstTerraceSystems;

public partial class ChartWindowPage : ContentPage
{

    private readonly object _chartIndx;
    private readonly object _min;
    private readonly object _max;
    private readonly string _symbol;
    private readonly IJSObjectReference _jsObjectReference;

    public delegate void RefreshChart();


    public ChartWindowPage(IJSObjectReference jsObjectReference, object chartIndx, object min, object max, string symbol)
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
        base.OnAppearing();

        ChartComponent.ComponentType = typeof(FirstTerraceSystems.Components.Pages.ChartWindow);
        ChartComponent.Parameters = new Dictionary<string, object?>
        {
            { "ChartIndx", _chartIndx },
            { "MinPoint", _min },
            { "MaxPoint", _max },
            { "Symbol", _symbol },
        };
    }

    protected override void OnDisappearing()
    {
        if (!StateContainerService.IsAllowCloseAllWindows)
        {
            var chartPage = StateContainerService.ChartPages.FirstOrDefault(a => a.ChartId == _chartIndx?.ToString());
            _jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, chartPage?.UpdatedMinExtreme, chartPage?.UpdatedMaxExtreme, chartPage?.Symbol);
            //_jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, chartPage?.UpdatedMinExtreme, chartPage?.UpdatedMaxExtreme, chartPage?.Symbol);
        }

        StateContainerService.RemoveChartPage(_chartIndx.ToString());
        base.OnDisappearing();
    }

    private void BlazorWebView_BlazorWebViewInitialized(object sender, Microsoft.AspNetCore.Components.WebView.BlazorWebViewInitializedEventArgs eventArgs)
    {

#if WINDOWS
        if (eventArgs.WebView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        {
            var settings = webView2.CoreWebView2.Settings;

            settings.AreBrowserAcceleratorKeysEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.AreDefaultContextMenusEnabled = false;
            settings.AreDefaultScriptDialogsEnabled = false;
            //settings.AreDevToolsEnabled = false;
            //settings.AreHostObjectsAllowed = false;
            settings.HiddenPdfToolbarItems = CoreWebView2PdfToolbarItems.None;
            //settings.IsBuiltInErrorPageEnabled = false;
            settings.IsGeneralAutofillEnabled = false;
            settings.IsPasswordAutosaveEnabled = false;
            settings.IsPinchZoomEnabled = false;
            settings.IsStatusBarEnabled = false;
        }
#endif
    }
}