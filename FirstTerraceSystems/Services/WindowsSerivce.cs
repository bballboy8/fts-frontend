using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

#if WINDOWS
using Microsoft.UI.Windowing;
using Microsoft.UI;
#endif

namespace FirstTerraceSystems.Services
{
    internal class WindowsSerivce
    {
        public void UnlockWindowResize()
        {
#if WINDOWS
            if (App.Current?.MainPage?.Window.Handler.PlatformView is Microsoft.UI.Xaml.Window window)
            {
                var windowHandle = WinRT.Interop.WindowNative.GetWindowHandle(window);
                var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(windowHandle);
                var appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(windowId);
                appWindow.TitleBar.IconShowOptions = IconShowOptions.ShowIconAndSystemMenu;
                if (appWindow.Presenter is Microsoft.UI.Windowing.OverlappedPresenter presenter)
                {
                    presenter.IsResizable = true;
                    presenter.IsMaximizable = true;
                    presenter.IsMinimizable = true;
                    presenter.SetBorderAndTitleBar(true, true);
                }
            }
#endif
        }

        public void LockWindowResize()
        {
#if WINDOWS
            if (App.Current?.MainPage?.Window.Handler.PlatformView is Microsoft.UI.Xaml.Window window)
            {
                var windowHandle = WinRT.Interop.WindowNative.GetWindowHandle(window);
                var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(windowHandle);
                var appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(windowId);
                appWindow.TitleBar.IconShowOptions = IconShowOptions.HideIconAndSystemMenu;
                if (appWindow.Presenter is Microsoft.UI.Windowing.OverlappedPresenter presenter)
                {
                    presenter.Maximize();
                    presenter.IsResizable = false;
                    presenter.IsMaximizable = false;
                    presenter.IsMinimizable = false;
                    presenter.SetBorderAndTitleBar(false, false);
                }
            }
#endif
        }

        public void CloseAllOpenedWindows()
        {
            var parentWindow = Application.Current!.Windows[0];
            var needToCloseWindows = Application.Current.Windows.OfType<Window>().Where(w => w != parentWindow).ToList();

            foreach (var window in needToCloseWindows)
            {
                Application.Current?.CloseWindow(window);
            }
        }
    }
}
