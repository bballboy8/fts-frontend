using FirstTerraceSystems.Features;
using FirstTerraceSystems.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Net.WebSockets;

namespace FirstTerraceSystems
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();

            MainPage = new MainPage();
        }

        protected override void OnResume()
        {

            base.OnResume();
        }

        protected override void OnSleep()
        {
            base.OnSleep();
        }

        protected override Window CreateWindow(IActivationState? activationState)
        {
            Window window = base.CreateWindow(activationState);

            window.Created += (s, e) =>
            {
                Console.WriteLine("Created");
            };

            window.Destroying += async (s, e) =>
            {
                await WebSocketClient.CloseCta();
                await WebSocketClient.CloseUtp();

                var windowsToClose = Application.Current!.Windows.Where(w => w != window).ToList();

                foreach (var window in windowsToClose)
                {
                    Application.Current?.CloseWindow(window);
                }

                Console.WriteLine("Destroying");
            };

            window.Deactivated += (s, e) =>
            {
               
                Console.WriteLine("Deactivated");
            };

            return window;
        }
    }
}
