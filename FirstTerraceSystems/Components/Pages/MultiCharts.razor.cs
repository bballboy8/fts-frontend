using System;
using System.Text.Json;
using System.Xml.Linq;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using Microsoft.Maui;
using Microsoft.VisualBasic;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class MultiCharts
    {
        private const int MarketFeedChunkSize = 5000;
        private const int PointSize = 100;
        private DotNetObjectReference<MultiCharts>? _dotNetMualtiChatsRef;
        public static Dictionary<string, List<MarketFeed>> datasets = new Dictionary<string, List<MarketFeed>>();
        public static Dictionary<string, double> Ranges = new Dictionary<string, double>();
        protected override void OnInitialized()
        {
            _dotNetMualtiChatsRef = DotNetObjectReference.Create(this);
        }

        protected override async Task OnInitializedAsync()
        {
            await InitializedDataBaseAsync();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JSRuntime.InvokeVoidAsync("ChatAppInterop.setDotNetReference", _dotNetMualtiChatsRef).ConfigureAwait(false);
                await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols).ConfigureAwait(false);
                await UpdateAndRenderChartsAsync();

                Logger.LogInformation($"Connecting WebSocketClient");

                await WebSocketClient.ConnectAsync();
                await WebSocketClient.ConnectctaAsync();
                Logger.LogInformation($"Connected WebSocketClient");
                WebSocketClient.ActionRealDataReceived += OnRealDataReceived;
                WebSocketClient.ActionReferenceChart += RefreshCharts;
                Logger.LogInformation($"Listening WebSocketClient");
                var listenTask = WebSocketClient.ListenAsync();
                var listenCtaTask = WebSocketClient.ListenctaAsync();

                await Task.WhenAll(listenTask, listenCtaTask);
            }
        }

        private async Task UpdateAndRenderChartsAsync()
        {
            DateTime defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
            try
            {
                List<Task> tasks = new();

                //    symbolicDatas = await SymbolicRepository.GetChartDataBySymbol(chart.Symbol);
                //    await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", chart.Symbol, symbolicDatas);
                //});
                foreach (var symbol in ChartService.InitialChartSymbols.Where(a => a.IsVisible))
                {
                    tasks.Add(ChartTask(symbol, defaultStartDate));
                }

                Logger.LogInformation("Starting InitialChartSymbols");
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
                var marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(chart.Symbol, defaultStartDate).ConfigureAwait(false);
                Logger.LogInformation($"Got 3day Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");

                try
                {
                    Logger.LogInformation($"Passing Data To Chart: {chart.Symbol}");
                    await SendChartDataInChunks(chart.Symbol, marketFeeds);
                    Logger.LogInformation($"Passed Data To Chart: {chart.Symbol}");
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"For : {chart.Symbol}");
                }
                finally
                {
                    marketFeeds = null;
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"For : {chart.Symbol} ");
            }
        }

        public static List<MarketFeed> FilterData(IEnumerable<MarketFeed> data, int numPoints)
        {
            var filteredData = data;


            if (numPoints > 0 && numPoints < filteredData.Count())
            {
                var step = Math.Max(1, filteredData.Count() / numPoints);
                return filteredData.Where((_, index) => index % step == 0).Take(numPoints).ToList();
            }

            return filteredData.ToList();
        }

        public  async Task SendChartDataInChunks(string symbol, IEnumerable<MarketFeed> marketFeeds)
        {
            datasets[symbol] = marketFeeds.ToList();
            var chunks = FilterData(marketFeeds, PointSize).Chunk(MarketFeedChunkSize);

            foreach (var chunk in chunks)
            {
                try
                {

                    // Invoke JavaScript function asynchronously with chunk of data
                    await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", symbol, chunk, false);

                    var tempChunk = chunk;

                    // Example: Set properties of tempChunk to null or dispose items within it
                    tempChunk = null;

                    // Force garbage collection to release memory
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                }
                catch (Exception ex)
                {
                    // Handle exceptions
                    Logger.LogError(ex, $"For: {symbol}");
                }
            }

            try
            {
                // After all chunks are sent, indicate that all data is loaded
                await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", symbol, null, true);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Error indicating all data loaded for symbol: {symbol}");
            }
        }

        public static DateTime UnixTimeStampToDateTime(double unixTimeStamp)
        {
            // Convert Unix timestamp to UTC DateTime
            DateTime utcDateTime = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(unixTimeStamp)).LocalDateTime;

            return utcDateTime;
        }

        [JSInvokable]
        public IEnumerable<MarketFeed>? GetExtremeDataBySymbol(string symbol, JsonElement? minElement, JsonElement? maxElement)
        {
            if (minElement == null || maxElement == null)
                return [];
            long? min = minElement?.ValueKind == JsonValueKind.Number ? Convert.ToInt64(minElement?.GetDouble()) : (long?)null;
            long? max = maxElement?.ValueKind == JsonValueKind.Number ? Convert.ToInt64(maxElement?.GetDouble()) : (long?)null;
            var startDate = UnixTimeStampToDateTime((long)min);
            var endDate = UnixTimeStampToDateTime((long)max);
            var extremeData = datasets[symbol].FindAll((x) => x.Date >= startDate && x.Date <= endDate);
            var filteredData = FilterData(extremeData, 100);
            return filteredData;
        }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetFilteredDataBySymbol(string symbol, double range)
        {
            Ranges[symbol] = range;
            var RangeDate = DateTime.UtcNow.AddMilliseconds(-range);
            DateTime eastern = TimeZoneInfo
        .ConvertTimeFromUtc(
          RangeDate,
          TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
            var last = datasets[symbol][datasets[symbol].Count - 1];
            var filtered = datasets[symbol].Where((x) => x.Date >= eastern).ToList();
            filtered = FilterData(filtered, PointSize);
            return filtered;
        }

        private async Task InitializedDataBaseAsync()
        {
            if (!TickerRepository.IsTickerTableExists())
            {
                Logger.LogInformation($"Starting API call for GetTickers");
                IEnumerable<NasdaqTicker>? tickers = await NasdaqService.NasdaqGetTickersAsync();
                Logger.LogInformation($"Got Response from API GetTickers");
                Logger.LogInformation($"Inserting Tickers To  SQLite DB");
                TickerRepository.InsertRecords(tickers);
                Logger.LogInformation($"Inserted Tickers To  SQLite DB");
                tickers = null;
            }
        }

        private async Task OnRealDataReceived(NasdaqResponse? response)
        {
            //await Task.Run(async() => { 
            // await MarketFeedRepository.InsertLiveMarketFeedDataFromSocket(response);
            // }).ConfigureAwait(true);
        }

        private async Task RefreshCharts(NasdaqResponse? response)
        {
            foreach (var data in datasets)
            {
                IEnumerable<IGrouping<string?, MarketFeed>>? groupedData = response.Data.Select(data => new MarketFeed(response.Headers, data)).GroupBy(mf => mf.Symbol);

                var dataGot = groupedData.FirstOrDefault((x) => x.Key == data.Key)?.ToList();
                if (dataGot != null)
                {
                    await JSRuntime.InvokeVoidAsync("refreshCharts", data.Key, dataGot);
                }
            }
        }


        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetChartDataBySymbol(string symbol, DataPoint? lastPoint)
        {
            var filtered = FilterData(datasets[symbol],PointSize);
            return filtered;
            
        }

        [JSInvokable]
        public void SymbolChanged(string chartId, string symbol)
        {
            ChartService.UpdateSymbol(chartId, symbol);
        }

        [JSInvokable]
        public async Task RefreshChartBySymbol(string symbol)
        {
            IEnumerable<MarketFeed>? marketFeeds = null;
            if (datasets.ContainsKey(symbol))
                marketFeeds = datasets[symbol];
            else
                marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3)).ConfigureAwait(false);
            await SendChartDataInChunks(symbol, marketFeeds).ConfigureAwait(false);
            marketFeeds = null;
        }



        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> UpdateChartSymbol(string chartId, string symbol)
        {
            if (!TickerRepository.IsTickerExists(symbol))
            {
                Toast.ShowDangerMessage($"Ticker '{symbol}' does not exist.");
                return null;
            }
            var defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
            MarketFeed? lastMarketFeed = MarketFeedRepository.GetLastRecordBySymbol(symbol);
            DateTime startDate = lastMarketFeed?.Date ?? defaultStartDate;

            Logger.LogInformation($"Starting API call for symbol: {symbol}");
            IEnumerable<MarketFeed>? marketFeeds = await NasdaqService.NasdaqGetDataAsync(startDate, symbol).ConfigureAwait(false);
            Logger.LogInformation($"Got Response from API for symbol: {symbol}");

            if (marketFeeds != null && marketFeeds.Any())
            {
                Logger.LogInformation($"Adding Historical Data to SQL Lite for symbol: {symbol}");

                MarketFeedRepository.InsertMarketFeedDataFromApi(symbol, marketFeeds);
                Logger.LogInformation($"Added Historical Data to SQL Lite for symbol: {symbol} total: {marketFeeds.Count()}");
                marketFeeds = null;
            }

            Logger.LogInformation($"Getting 3day Historical Data to SQL Lite for symbol: {symbol}");
            marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, defaultStartDate).ConfigureAwait(false);

            datasets[symbol] = marketFeeds.ToList();
            var filtered = FilterData(marketFeeds, PointSize);
            SymbolChanged(chartId, symbol);
            return filtered;
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
            return await Task.FromResult(chartId).ConfigureAwait(false);
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