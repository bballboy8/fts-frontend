using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class MultiCharts
    {
        private DotNetObjectReference<MultiCharts>? _dotNetMualtiChatsRef;

        protected override void OnInitialized()
        {
            _dotNetMualtiChatsRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnInitializedAsync()
        {
            await InitializedDataBaseAsync();
            await JSRuntime.InvokeVoidAsync("refreshCharts");
        }

        private async Task InitializedDataBaseAsync()
        {

            await HistoricalDataService.InsertHistoricalNasdaqMarketFeedsAsync();
            if (!TickerRepository.IsTickerTableExists())
            {
                var tickers = await NasdaqService.NasdaqGetTickersAsync();
                TickerRepository.CreateTableAndIndexes();
                TickerRepository.InsertRecords(tickers);
            }
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JSRuntime.InvokeVoidAsync("ChatAppInterop.setDotNetReference", _dotNetMualtiChatsRef);
                await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols);
                await JSRuntime.InvokeVoidAsync("refreshCharts");
                await WebSocketClient.ConnectAsync();
                WebSocketClient.ActionRealDataReceived += OnRealDataReceived;
                WebSocketClient.ActionReferenceChart += RefreshCharts;
                await WebSocketClient.ListenAsync();
            }
        }

        private void OnRealDataReceived(string jsonString)
        {
            if (!string.IsNullOrEmpty(jsonString))
            {
                SymbolicRepository.InsertLiveMarketFeedDataFromSocket(jsonString);
            }
        }

        private async Task RefreshCharts()
        {
            await JSRuntime.InvokeVoidAsync("refreshCharts");
        }

        [JSInvokable]
        public void SymbolChanged(string chartId, string symbol)
        {
            ChartService.UpdateSymbol(chartId, symbol);
        }

        [JSInvokable]
        public async Task<IEnumerable<SymbolicData>?> GetChartDataBySymbol(string symbol, DataPoint? lastPoint)
        {
            if (lastPoint == null)
            {
                var symbolics = await SymbolicRepository.GetChartDataBySymbol(symbol);
                return symbolics;
            }
            else
            {
                var symbolics = await SymbolicRepository.GetChartDataBySymbol(symbol, lastPoint.PrimaryKey);
                return symbolics;
            }
        }

        [JSInvokable]
        public async Task<IEnumerable<SymbolicData>?> UpdateChartSymbol(string chartId, string symbol)
        {
            if (!TickerRepository.IsTickerExists(symbol))
            {
                Toast.ShowDangerMessage($"Ticker '{symbol}' does not exist.");
                return null;
            }

            await HistoricalDataService.ProcessHistoricalNasdaqMarketFeedAsync(symbol);
            
            var symbolics = await SymbolicRepository.GetChartDataBySymbol(symbol);

            return symbolics;
        }

        [JSInvokable]
        public static async Task<object?> DragedChartWindow(IJSObjectReference jsObject, bool isMaximizeClicked, object chartId, object minPoint, object maxPoint, string symbol, List<DataPoint> dataPoints)
        {
            StateContainerService.IsAllowCloseAllWindows = false;
            StateContainerService.IsMainPage = false;
            StateContainerService.IsMaximizeClikedForChart = isMaximizeClicked;
            var chartWindow = new ChartWindowPage(jsObject, chartId, minPoint, maxPoint, symbol, dataPoints);
            var window = new Window(chartWindow);
            Application.Current?.OpenWindow(window);
            return await Task.FromResult(chartId);
        }

        public async ValueTask DisposeAsync()
        {
            _dotNetMualtiChatsRef?.Dispose();

            WebSocketClient.ActionRealDataReceived -= OnRealDataReceived;
            WebSocketClient.ActionReferenceChart -= RefreshCharts;
            await WebSocketClient.CloseAsync();
        }
    }
}
