using FirstTerraceSystems.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Components
{
    public partial class Header
    {
        private bool IsDarkMode = true;

        private ElementReference Er_BtnDisplayOptions { get; set; }

        private DotNetObjectReference<Header>? _dotNetHeaderRef;

        protected override void OnInitialized()
        {
            _dotNetHeaderRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JSRuntime.InvokeVoidAsync("initializeKeyBordEventToDisplayOptions", Er_BtnDisplayOptions, ChartService.InitialChartSymbols, _dotNetHeaderRef);
            }
        }

        private void ToggleDarkMode(bool value)
        {
            IsDarkMode = value;

            foreach (var chartPage in StateContainerService.ChartPages)
            {
                chartPage?.JSRuntime?.InvokeVoidAsync("changeBackgroundColor", IsDarkMode);
            }

            JSRuntime.InvokeVoidAsync("changeBackgroundColor", IsDarkMode);
            StateContainerService.IsDarkMode = IsDarkMode;
        }

        private async Task LoadTemplate(int totalCharts)
        {
            ChartService.UpdateChartLayout(totalCharts);
            await JSRuntime.InvokeVoidAsync("createDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols);
            StateContainerService.IsAllowCloseAllWindows = true;
            //WindowsSerivce.CloseAllOpenedWindows();
            //await JSRuntime.InvokeVoidAsync("RefreshChartBySymbol");
        }

        private async Task Logout()
        {
            await AuthenticationService.Logout();
            WindowsSerivce.CloseAllOpenedWindows();
            NavigationManager.NavigateTo("/login");
        }

        [JSInvokable]
        public void SaveLayout()
        {
            ChartService.SaveChartLayout();
            Toast.ShowSuccessMessage("Layout Saved!");
        }
    }
}
