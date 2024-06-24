using System.Net;
using Blazored.LocalStorage;
using FirstTerraceSystems.AuthProviders;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Repositories;
using FirstTerraceSystems.Services;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SQLite;


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
            builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://52.0.33.126:8000/") });
            builder.Services.AddScoped(sp =>
            {
                var client = new HttpClient(new HttpClientHandler { AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate, })
                {
                    BaseAddress = new Uri("https://restapi.clouddataservice.nasdaq.com")
                };
                return new NasdaqRestService(client);
            });
#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
            builder.Logging.AddDebug();
#endif
            builder.Services.AddBlazoredLocalStorage();
            builder.Services.AddAuthorizationCore();

            builder.Services.AddSingleton<StateContainerService>();
            builder.Services.AddSingleton<WindowsSerivce>();
            //builder.Services.AddSingleton<DatabaseService>(serviceProvider =>
            //{
            //    string dbpath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FTS.db");
            //    return new(dbpath);
            //});

            builder.Services.AddSingleton<DatabaseService>(serviceProvider =>
            {
                string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FTS.db");
                return new (dbPath);
            });

            builder.Services.AddSingleton<SymbolicRepository>(serviceProvider =>
            {
                return serviceProvider.GetRequiredService<DatabaseService>().SymbolicRepository;
            });

            //builder.Services.AddScoped<SqlLiteService>();
            builder.Services.AddScoped<AuthenticationStateProvider, AuthStateProvider>();
            builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
            builder.Services.AddScoped<NasdaqService>();
            builder.Services.AddScoped<BsToastService>();

            return builder.Build();
        }
    }
}
