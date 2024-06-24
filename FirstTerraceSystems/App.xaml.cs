using FirstTerraceSystems.Services;
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

            window.Destroying += (s, e) =>
            {

                var windowsToClose = Application.Current!.Windows.Where(w => w != window).ToList();
                StateContainerService.webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "close", CancellationToken.None);
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
