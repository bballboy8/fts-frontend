using System.Net;
using FirstTerraceSystems.AuthProviders;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Services;
using FirstTerraceSystems.Services.IServices;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.Logging;
using Serilog;


namespace FirstTerraceSystems
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            Log.Logger = new LoggerConfiguration().MinimumLevel.Verbose().WriteTo.File(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "FTS", "logs", "log.txt"), rollingInterval: RollingInterval.Day).CreateLogger();

            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                });


            builder.Services.AddMauiBlazorWebView();
            builder.Services.AddBlazorBootstrap();
#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
            builder.Logging.AddDebug();
#endif
            builder.Services.AddScoped(sp =>
            {
                var client = new HttpClient
                {
                    BaseAddress = new Uri(ApiEndpoints.RestAPIUri)
                };
                client.Timeout = TimeSpan.FromSeconds(3600);
                return client;
            });
            builder.Services.AddScoped(sp =>
            {
                var client = new HttpClient(new HttpClientHandler { AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate, })
                {
                    BaseAddress = new Uri(ApiEndpoints.CloudDataServiceUri)
                };
                return new NasdaqRestService(client);
            });
#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
            //builder.Logging.AddDebug();
            builder.Services.AddLogging(logging =>
            {
                logging.AddFilter("Microsoft.AspNetCore.Components.WebView", LogLevel.Trace);
                logging.AddDebug();
                logging.AddSerilog();
            });
#else
            builder.Services.AddLogging(logging =>
            {
                logging.AddSerilog();
            });
#endif

            builder.Services.AddAuthorizationCore();
            builder.Services.AddDatabaseService();

            builder.Services.AddSingleton(serviceProvider =>
            {
                return serviceProvider.GetRequiredService<DatabaseService>().MarketFeedRepository;
            });

            builder.Services.AddSingleton(serviceProvider =>
            {
                return serviceProvider.GetRequiredService<DatabaseService>().TickerRepository;
            });

            builder.Services.AddSingleton<StateContainerService>();
            builder.Services.AddSingleton<WindowsSerivce>();
            builder.Services.AddSingleton<ChartService>();

            builder.Services.AddScoped<AuthenticationStateProvider, AuthStateProvider>();
            builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
            builder.Services.AddScoped<NasdaqService>();
            builder.Services.AddScoped<BsToastService>();
            builder.Services.AddScoped<NasdaqHistoricalDataService>();

            var app = builder.Build();

            Initialize(app);

            return app;
        }

        private static void Initialize(MauiApp app)
        {
            app.Services.GetRequiredService<ChartService>().LoadChartSettings();
        }
    }
}
