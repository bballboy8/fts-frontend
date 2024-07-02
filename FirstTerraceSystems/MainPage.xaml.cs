#if WINDOWS 
using Microsoft.Web.WebView2.Core;
#endif



namespace FirstTerraceSystems
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
        }

        private void MainBlazorWebView_BlazorWebViewInitialized(object sender, Microsoft.AspNetCore.Components.WebView.BlazorWebViewInitializedEventArgs eventArgs)
        {

#if WINDOWS
            if (eventArgs.WebView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
            {     

                //var settings = webView2.CoreWebView2.Settings;

                //settings.AreBrowserAcceleratorKeysEnabled = false;
                //settings.IsZoomControlEnabled = false;
                //settings.AreDefaultContextMenusEnabled = false;
                //settings.AreDefaultScriptDialogsEnabled = false;
                ////settings.AreDevToolsEnabled = false;
                ////settings.AreHostObjectsAllowed = false;
                //settings.HiddenPdfToolbarItems = CoreWebView2PdfToolbarItems.None;
                ////settings.IsBuiltInErrorPageEnabled = false;
                //settings.IsGeneralAutofillEnabled = false;
                //settings.IsPasswordAutosaveEnabled = false;
                //settings.IsPinchZoomEnabled = false;
                //settings.IsStatusBarEnabled = false;
            }
#endif
        }

        private void MainBlazorWebView_BlazorWebViewInitializing(object sender, Microsoft.AspNetCore.Components.WebView.BlazorWebViewInitializingEventArgs eventArgs)
        {
        }
    }
}
