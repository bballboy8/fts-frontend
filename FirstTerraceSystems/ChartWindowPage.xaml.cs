using FirstTerraceSystems.Components.Pages;
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
        base.OnAppearing();

        ChartComponent.ComponentType = typeof(FirstTerraceSystems.Components.Pages.ChartWindow);
        ChartComponent.Parameters = new Dictionary<string, object?>
        {
            { "ChartIndx", _chartIndx },
            { "MinPoint", _min },
            { "MaxPoint", _max },
            { "Symbol", _symbol }
        };

        //#if WINDOWS

        //if (BlazorWebView?.Handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        //{
        //    await webView2.EnsureCoreWebView2Async();

        //    webView2.IsTabStop = true;
        //    webView2.IsDoubleTapEnabled = false;
        //    webView2.HighContrastAdjustment = Microsoft.UI.Xaml.ElementHighContrastAdjustment.None;

        //    CoreWebView2Settings settings = webView2.CoreWebView2.Settings;

        //    settings.IsZoomControlEnabled = false;
        //    settings.AreBrowserAcceleratorKeysEnabled = false;
        //    settings.AreDefaultContextMenusEnabled = false;
        //    settings.AreDefaultScriptDialogsEnabled = false;
        //    settings.AreDevToolsEnabled = false;
        //    settings.AreHostObjectsAllowed = false;
        //    settings.HiddenPdfToolbarItems = Microsoft.Web.WebView2.Core.CoreWebView2PdfToolbarItems.None;
        //    settings.IsBuiltInErrorPageEnabled = false;
        //    settings.IsGeneralAutofillEnabled = false;
        //    settings.IsPasswordAutosaveEnabled = false;
        //    settings.IsPinchZoomEnabled = false;
        //    settings.IsStatusBarEnabled = false;
        //}
        //#endif

    }

    protected override void OnDisappearing()
    {
        if (!StateContainerService.IsAllowCloseAllWindows)
        {
            var chartPage = StateContainerService.ChartPages.FirstOrDefault(a => a.ChartId == _chartIndx?.ToString());
            _jsObjectReference.InvokeVoidAsync("popinChartWindow", _chartIndx, chartPage?.UpdatedMinExtreme, chartPage?.UpdatedMaxExtreme, chartPage?.Symbol);
        }

        StateContainerService.RemoveChartPage(_chartIndx.ToString());
        base.OnDisappearing();
    }
}