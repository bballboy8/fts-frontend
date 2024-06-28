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
