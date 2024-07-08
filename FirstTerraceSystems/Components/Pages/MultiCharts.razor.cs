using System.Text.Json;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class MultiCharts
    {
        private const int MarketFeedChunkSize = 20000;
        private DotNetObjectReference<MultiCharts>? _dotNetMualtiChatsRef;

        protected override void OnInitialized()
        {
            _dotNetMualtiChatsRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JSRuntime.InvokeVoidAsync("ChatAppInterop.setDotNetReference", _dotNetMualtiChatsRef);
                await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols);
                await RenderChartsAsync();

                //Logger.LogInformation($"Connecting WebSocketClient");
                //await WebSocketClient.ConnectAsync();
                //Logger.LogInformation($"Connected WebSocketClient");
                //WebSocketClient.ActionRealDataReceived += OnRealDataReceived;
                //WebSocketClient.ActionReferenceChart += RefreshCharts;
                //Logger.LogInformation($"Listening WebSocketClient");
                //await WebSocketClient.ListenAsync();
                //Logger.LogInformation($"WebSocketClient Close");
            }
        }

        private async Task RenderChartsAsync()
        {
            DateTime defaultStartDate = DateTime.Now.GetPastBusinessDay(3);

            Logger.LogInformation("Starting InitialChartSymbols");

            try
            {
                List<Task> tasks = new();

                foreach (var symbol in ChartService.InitialChartSymbols.Where(a => a.IsVisible))
                {
                    tasks.Add(ChartTask(symbol, defaultStartDate));
                    //await ChartTask(symbol, defaultStartDate);
                }

                while (tasks.Any())
                {
                    Task completedTask = await Task.WhenAny(tasks);
                    tasks.Remove(completedTask);
                }
            }
            catch (Exception ex)
            {
                Logger.LogInformation(ex, $"Error in UpdateAndRenderChartsAsync");
            }

            Logger.LogInformation($"End InitialChartSymbols");
        }

        private async Task ChartTask(ChartModal chart, DateTime defaultStartDate)
        {

            try
            {
                Logger.LogInformation($"Getting 3day Historical Data to SQL Lite for symbol: {chart.Symbol}");
                IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(chart.Symbol, DateTime.Now.GetPastBusinessDay(3));
                Logger.LogInformation($"Got 3day Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");
                try
                {
                    Logger.LogInformation($"Passing Data To Chart: {chart.Symbol}");
                    await SendChartDataInChunks(chart.Symbol, marketFeeds);
                    Logger.LogInformation($"Passed Data To Chart: {chart.Symbol}");
                    marketFeeds = null;
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"For : {chart.Symbol}");
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"For : {chart.Symbol} ");
            }
        }

        private async Task SendChartDataInChunks(string symbol, IEnumerable<MarketFeed> marketFeeds)
        {
            int totalCount = marketFeeds.Count();
            int processedCount = 0;
            foreach (MarketFeed[] chunk in marketFeeds.Chunk(MarketFeedChunkSize))
            {
                processedCount += chunk.Count();
                await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", symbol, chunk, processedCount == totalCount);
            }
        }


        private void OnRealDataReceived(NasdaqResponse? response)
        {
            MarketFeedRepository.InsertLiveMarketFeedDataFromSocket(response);
        }

        private async Task RefreshCharts()
        {
            await JSRuntime.InvokeVoidAsync("refreshCharts");
        }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetChartDataByLastFeedPoint(string symbol, DataPoint lastPoint)
        {
            IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, lastPoint.TrackingID);
            return marketFeeds;
        }

        [JSInvokable]
        public void SymbolChanged(string chartId, string symbol)
        {
            ChartService.UpdateSymbol(chartId, symbol);
        }

        [JSInvokable]
        public async Task RefreshChartBySymbol(string symbol)
        {
            IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3));
            await SendChartDataInChunks(symbol, marketFeeds);
            marketFeeds = null;
        }

        [JSInvokable]
        public async Task<bool> UpdateChartSymbol(string chartId, string symbol)
        {
            if (!TickerRepository.IsTickerExists(symbol))
            {
                Toast.ShowDangerMessage($"Ticker '{symbol}' does not exist.");
                return false;
            }

            ChartService.UpdateSymbol(chartId, symbol);

            IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3));

            await SendChartDataInChunks(symbol, marketFeeds);

            //IEnumerable<MarketFeed>? data = await HistoricalDataService.ProcessHistoricalNasdaqMarketFeedAsync(symbol);

            return true;
        }

        [JSInvokable]
        public static async Task<object?> DragedChartWindow(IJSObjectReference jsObject, bool isMaximizeClicked, object chartId, object minPoint, object maxPoint, string symbol)
        {
            StateContainerService.IsAllowCloseAllWindows = false;
            StateContainerService.IsMainPage = false;
            StateContainerService.IsMaximizeClikedForChart = isMaximizeClicked;
            ChartWindowPage? chartWindow = new ChartWindowPage(jsObject, chartId, minPoint, maxPoint, symbol);
            Window? window = new Window(chartWindow);
            Application.Current?.OpenWindow(window);
            return await Task.FromResult(chartId);
        }

        public async ValueTask DisposeAsync()
        {
            //_dotNetMualtiChatsRef?.Dispose();

            WebSocketClient.ActionRealDataReceived -= OnRealDataReceived;
            WebSocketClient.ActionReferenceChart -= RefreshCharts;
            await WebSocketClient.CloseAsync();
        }
    }
}
