using Microsoft.UI.Windowing;
using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.Maui.Handlers;
using FirstTerraceSystems.Services;
using System.Runtime.InteropServices;
using WinRT.Interop;
using Window = Microsoft.UI.Xaml.Window;
using Windows.UI.Core;
using Microsoft.UI.Xaml.Input;
using FirstTerraceSystems.Platforms.Windows.Extensions;

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
        public App()
        {
            this.InitializeComponent();
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
                    //presenter.Minimize();
                    nativeWindow.DispatcherQueue.TryEnqueue(() =>
                    {
                        nativeWindow.MinimizeWindow();
                    });
                }
            }
        }
    }
}