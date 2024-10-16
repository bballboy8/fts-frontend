using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.Maui.Handlers;
using FirstTerraceSystems.Services;
using FirstTerraceSystems.Platforms.Windows.Extensions;
using Microsoft.UI;
using Microsoft.JSInterop;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Microsoft.AspNetCore.Components;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace FirstTerraceSystems.WinUI
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    public partial class App : MauiWinUIApplication
    {
        /// <summary>
        /// Initializes the singleton application object.  This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public static DateTime startDateDeactivated { get; private set; } = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
        [Inject] private IJSRuntime JSRuntime { get; set; }
        public App()
        {
            this.InitializeComponent();
            Microsoft.Maui.Networking.Connectivity.Current.ConnectivityChanged += Connectivity_ConnectivityChanged;
        }

        protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

        protected override void OnLaunched(LaunchActivatedEventArgs args)
        {
            base.OnLaunched(args);
            Microsoft.Maui.Handlers.WindowHandler.Mapper.AppendToMapping(nameof(IWindow), WindowHandler);
        }

        private void WindowHandler(IWindowHandler handler, IWindow window)
        {
            var mauiWindow = handler.VirtualView;
            var nativeWindow = handler.PlatformView;

            nativeWindow.Activate();
            nativeWindow.ExtendsContentIntoTitleBar = false;

            IntPtr windowHandle = WinRT.Interop.WindowNative.GetWindowHandle(nativeWindow);
            WindowId windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(windowHandle);
            AppWindow appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(windowId);

            appWindow.TitleBar.IconShowOptions = IconShowOptions.HideIconAndSystemMenu;
            appWindow.Hide();

            if (appWindow.Presenter is OverlappedPresenter presenter)
            {
                if (StateContainerService.IsMainPage)
                {
                    presenter.Maximize();
                    presenter.IsResizable = true;
                    presenter.IsMaximizable = true;
                    presenter.IsMinimizable = true;
                    presenter.SetBorderAndTitleBar(false, false);
                }
                else if (StateContainerService.IsMaximizeClikedForChart)
                {
                    presenter.Maximize();
                }
                else
                {
                    nativeWindow.DispatcherQueue.TryEnqueue(() =>
                    {
                        nativeWindow.MinimizeWindow();
                    });
                }
            }
        }

        private void Connectivity_ConnectivityChanged(object sender, Microsoft.Maui.Networking.ConnectivityChangedEventArgs e)
        {
            var access = e.NetworkAccess;

            if (access == Microsoft.Maui.Networking.NetworkAccess.None || access == Microsoft.Maui.Networking.NetworkAccess.Unknown)
            {
                startDateDeactivated = TimeZoneInfo
                    .ConvertTimeFromUtc(
                        DateTime.UtcNow,
                        TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
                Console.WriteLine("Deactivated");
                Console.WriteLine("No internet connection.");
            }
            else if (access == Microsoft.Maui.Networking.NetworkAccess.Internet)
            {
                //JSRuntime?.InvokeVoidAsync("refreshAllChartsIfOffline", startDateDeactivated);
                Console.WriteLine("Internet connection available.");
            }
        }
    }
}
