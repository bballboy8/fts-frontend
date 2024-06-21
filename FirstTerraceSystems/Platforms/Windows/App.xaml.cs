using Microsoft.UI.Windowing;
using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.Maui.Handlers;
using FirstTerraceSystems.Services;
using System.Runtime.InteropServices;
using WinRT.Interop;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace FirstTerraceSystems.WinUI
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    public partial class App : MauiWinUIApplication
    {

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        private const int SW_MINIMIZE = 6;

        /// <summary>
        /// Initializes the singleton application object.  This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public App()
        {
            this.InitializeComponent();
            Microsoft.Maui.Handlers.WindowHandler.Mapper.AppendToMapping(nameof(IWindow), WindowHandler);
        }

        protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

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
                        ShowWindow(windowHandle, SW_MINIMIZE);
                    });
                }
            }
        }
    }

}
