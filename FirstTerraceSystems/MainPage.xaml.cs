using Microsoft.Web.WebView2.Core;
using Windows.UI.Core;

namespace FirstTerraceSystems
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
        }


#if WINDOWS && !DEBUG

        protected override async void OnAppearing()
        {
            if (MainBlazorWebView?.Handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
            {
                await webView2.EnsureCoreWebView2Async();

                webView2.IsTabStop = true;
                webView2.IsDoubleTapEnabled = false;
                webView2.HighContrastAdjustment = Microsoft.UI.Xaml.ElementHighContrastAdjustment.None;

                CoreWebView2Settings settings = webView2.CoreWebView2.Settings;

                settings.IsZoomControlEnabled = false;
                settings.AreBrowserAcceleratorKeysEnabled = false;
                settings.AreDefaultContextMenusEnabled = false;
                settings.AreDefaultScriptDialogsEnabled = false;
                settings.AreDevToolsEnabled = false;
                settings.AreHostObjectsAllowed = false;
                settings.HiddenPdfToolbarItems = Microsoft.Web.WebView2.Core.CoreWebView2PdfToolbarItems.None;
                settings.IsBuiltInErrorPageEnabled = false;
                settings.IsGeneralAutofillEnabled = false;
                settings.IsPasswordAutosaveEnabled = false;
                settings.IsPinchZoomEnabled = false;
                settings.IsStatusBarEnabled = false;
            }
        }

#endif

    }
}
