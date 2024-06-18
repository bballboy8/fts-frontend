using Blazored.LocalStorage;
using FirstTerraceSystems.AuthProviders;
using FirstTerraceSystems.Services;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

#if WINDOWS
using Microsoft.Maui.LifecycleEvents;
#endif

namespace FirstTerraceSystems
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                });

            builder.Services.AddMauiBlazorWebView();
            builder.Services.AddBlazorBootstrap();
            builder.Services.AddBlazorBootstrap();
            builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://52.0.33.126:8000/") });
#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
            builder.Logging.AddDebug();
#endif
            builder.Services.AddBlazoredLocalStorage();
            builder.Services.AddAuthorizationCore();
            builder.Services.AddScoped<AuthenticationStateProvider, AuthStateProvider>();
            builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
            builder.Services.AddScoped<NsdaqService>();
            builder.Services.AddSingleton<StateContainerService>();
            builder.Services.AddSingleton<WindowsSerivce>();

#if WINDOWS
            //builder.ConfigureLifecycleEvents(events =>
            //{
            //    events.AddWindows(windowsLifecycleBuilder =>
            //    {
            //        windowsLifecycleBuilder.OnWindowCreated(window =>
            //        {
            //            window.ExtendsContentIntoTitleBar = false;
            //            var handle = WinRT.Interop.WindowNative.GetWindowHandle(window);
            //            var id = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(handle);
            //            var appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(id);

            //            if (appWindow.Presenter is Microsoft.UI.Windowing.OverlappedPresenter overlappedPresenter)
            //            {
            //                overlappedPresenter.SetBorderAndTitleBar(false, false);
            //                overlappedPresenter.Maximize();
            //                overlappedPresenter.IsResizable = true;
            //                overlappedPresenter.IsMaximizable = true;
            //                overlappedPresenter.IsMinimizable = true;
            //            }
            //        });
            //    });
            //});
#endif

            return builder.Build();
        }
    }
}
