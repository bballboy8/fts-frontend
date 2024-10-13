using System.Collections.Concurrent;
using System.Text.Json;
using BlazorBootstrap;
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
        private const int MarketFeedChunkSize = 100000;
        private const int PointSize = 1000;
        private bool IsLoading { get; set; } = false;
        private bool OnWait { get; set; } = false;

        private DotNetObjectReference<MultiCharts>? _dotNetMualtiChatsRef;
        public static ConcurrentDictionary<string, List<MarketFeed>> datasets = new();
        private ConcurrentDictionary<string, List<MarketFeed>> collection = new();
        public static ConcurrentDictionary<string, double> Ranges = new();
        private CancellationTokenSource _cancellationTokenSource = new();
        private readonly object _lock = new object();

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
                await JSRuntime.InvokeVoidAsync("ChatAppInterop.setDotNetReference", _dotNetMualtiChatsRef);
                IsLoading = true;
                preloadService.Show(SpinnerColor.Light, "Loading data...");

                await Task.Run(async () =>
                {
                    await MainThread.InvokeOnMainThreadAsync(async () =>
                    {
                        await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols.Where(x => x.IsVisible));
                    });

                    await UpdateAndRenderChartsAsync();
                    await MainThread.InvokeOnMainThreadAsync(async () =>
                    {
                        await JSRuntime.InvokeVoidAsync("updateAllSymbols", ChartService.InitialChartSymbols.Where(x => x.IsVisible));
                    });
                    await MainThread.InvokeOnMainThreadAsync(() => preloadService.Hide());
                    IsLoading = false;
                    Logger.LogInformation($"Connecting WebSocketClient");

                    await WebSocketClient.ConnectUtp().ConfigureAwait(false);
                    await WebSocketClient.ConnectCta().ConfigureAwait(false);
                    Logger.LogInformation($"Connected WebSocketClient");

                    WebSocketClient.ActionReferenceChart += RefreshCharts;

                    Logger.LogInformation($"Listening WebSocketClient");
                    await WebSocketClient.ListenCta().ConfigureAwait(false);
                    await WebSocketClient.ListenUtp().ConfigureAwait(false);

                    await UpdateUI();
                });
            }
        }

        private async Task UpdateAndRenderChartsAsync()
        {
            DateTime defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
            try
            {
                List<Task> tasks = new();

                Logger.LogInformation("Starting InitialChartSymbols");
                foreach (var symbol in ChartService.InitialChartSymbols.Where(a => a.IsVisible))
                {
                    tasks.Add(ChartTask(symbol, defaultStartDate));
                }

                while (tasks.Any())
                {
                    Task completedTask = await Task.WhenAny(tasks);
                    tasks.Remove(completedTask);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in UpdateAndRenderChartsAsync");
            }

            Logger.LogInformation($"End InitialChartSymbols");
        }

        private async Task ChartTask(ChartModal chart, DateTime defaultStartDate)
        {
            try
            {
                Logger.LogInformation($"Getting 3-day Historical Data from SQL Lite for symbol: {chart.Symbol}");
                var marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(chart.Symbol, defaultStartDate).ConfigureAwait(false);
                Logger.LogInformation($"Got 3-day Historical Data from SQL Lite for symbol: {chart.Symbol}, total: {marketFeeds.Count()}");

                try
                {
                    Logger.LogInformation($"Passing Data To Chart: {chart.Symbol}");
                    await SendChartDataInChunks(chart.Symbol, marketFeeds, false);
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
                Logger.LogError(ex, $"For : {chart.Symbol}");
            }
        }

        public static IEnumerable<MarketFeed> FilterByEasternTime(IEnumerable<MarketFeed> data)
        {
            var utcNow = DateTime.UtcNow;
            DateTime currentEasternTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
            return data.Where(x => x.Date < currentEasternTime);
        }

        public static List<MarketFeed> FilterData(IEnumerable<MarketFeed> data, int numPoints)
        {
            var filteredData = FilterByEasternTime(data);

            if (numPoints > 0 && numPoints < filteredData.Count())
            {
                var step = Math.Max(1, filteredData.Count() / numPoints);
                return filteredData.Where((_, index) => index % step == 0).ToList();
            }

            return filteredData.ToList();
        }

        public async Task SendChartDataInChunks(string symbol, IEnumerable<MarketFeed> marketFeeds, bool load_data_in_chart = true)
        {
            datasets[symbol] = marketFeeds.ToList();
            if (load_data_in_chart)
            {
                var chunks = FilterData(marketFeeds, 10000).Chunk(MarketFeedChunkSize);

                foreach (var chunk in chunks)
                {
                    try
                    {
                        await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", symbol, chunk, false);
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex, $"For: {symbol}");
                    }
                }

                try
                {
                    await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", symbol, null, true);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"Error indicating all data loaded for symbol: {symbol}");
                }
            }

        }

        public static DateTime UnixTimeStampToDateTime(double unixTimeStamp)
        {
            return DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(unixTimeStamp)).LocalDateTime;
        }

        [JSInvokable]
        public IEnumerable<MarketFeed>? GetExtremeDataBySymbol(string symbol, JsonElement? minElement, JsonElement? maxElement)
        {
            if (minElement == null || maxElement == null)
                return Enumerable.Empty<MarketFeed>();

            long? min = minElement?.ValueKind == JsonValueKind.Number ? Convert.ToInt64(minElement?.GetDouble()) : (long?)null;
            long? max = maxElement?.ValueKind == JsonValueKind.Number ? Convert.ToInt64(maxElement?.GetDouble()) : (long?)null;

            var startDate = UnixTimeStampToDateTime(min.GetValueOrDefault());
            var endDate = UnixTimeStampToDateTime(max.GetValueOrDefault());

            if (datasets.ContainsKey(symbol))
            {
                var extremeData = datasets[symbol].Where(x => x.Date >= startDate && x.Date <= endDate).ToList();
                return FilterData(extremeData, 300);
            }

            return Enumerable.Empty<MarketFeed>();
        }

        public static List<MarketFeed> FilteredDataBySymbol(string symbol, double range)
        {
            var RangeDate = DateTime.UtcNow.AddMilliseconds(-range);
            DateTime eastern = TimeZoneInfo.ConvertTimeFromUtc(RangeDate, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
            var filtered = datasets[symbol].Where(x => x.Date >= eastern).ToList();
            return FilterData(filtered, PointSize);
        }

        private async Task InitializedDataBaseAsync()
        {
            if (!TickerRepository.IsTickerTableExists())
            {
                Logger.LogInformation("Starting API call for GetTickers");
                var tickers = await NasdaqService.NasdaqGetTickersAsync();
                Logger.LogInformation("Got Response from API GetTickers");
                Logger.LogInformation("Inserting Tickers To SQLite DB");
                TickerRepository.InsertRecords(tickers);
                Logger.LogInformation("Inserted Tickers To SQLite DB");
            }
        }

        private async Task RefreshCharts(NasdaqResponse? response)
        {
            await Task.Run(async () =>
            {
                try
                {
                    foreach (var data in datasets)
                    {
                        var groupedData = response.Data
                            .Select(d => new MarketFeed(response.Headers, d))
                            .GroupBy(mf => mf.Symbol);

                        var dataGot = groupedData.FirstOrDefault(x => x.Key == data.Key)?.ToList();

                        if (dataGot != null)
                        {
                            if (OnWait)
                                await Task.Delay(1000);

                            var filteredData = FilterByEasternTime(dataGot);

                            lock (_lock)
                            {
                                datasets[data.Key] = datasets[data.Key].Concat(dataGot).ToList();
                                if (!collection.ContainsKey(data.Key))
                                    collection[data.Key] = filteredData.ToList();
                                else
                                    collection[data.Key].AddRange(filteredData);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Error in RefreshCharts");
                }
            });
        }

        private async Task UpdateUI()
        {
            while (true)
            {
                await Task.Delay(1000);
                OnWait = true;

                var visibleSymbols = ChartService.InitialChartSymbols
                                    .Where(x => x.IsVisible)
                                    .Select(x => x.Symbol)
                                    .ToHashSet();

                lock (_lock)
                {
                    foreach (var data in collection)
                    {
                        if (data.Value.Count != 0 && visibleSymbols.Contains(data.Key))
                        {
                            JSRuntime.InvokeVoidAsync("refreshCharts", data.Key, data.Value.ToList());
                            collection[data.Key].Clear();
                        }
                    }
                }

                OnWait = false;
            }
        }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetChartDataBySymbol(string symbol, DataPoint? lastPoint)
        {
            var filtered = FilterData(datasets[symbol], PointSize);
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
            //    await JSRuntime.InvokeVoidAsync("setRange", symbol, 3 * 24 * 60 * 60 * 1000);
            marketFeeds = null;
        }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> UpdateChartSymbol(string chartId, string symbol)
        {
            // Cancel any ongoing background tasks
            lock (_lock)
            {
                _cancellationTokenSource.Cancel();
                _cancellationTokenSource.Dispose();
                _cancellationTokenSource = new CancellationTokenSource();
            }

            if (!TickerRepository.IsTickerExists(symbol))
            {
                Toast.ShowDangerMessage($"Ticker '{symbol}' does not exist.");
                return null;
            }

            if (datasets.ContainsKey(symbol))
            {
                var filtered = FilterData(datasets[symbol], PointSize);
                SymbolChanged(chartId, symbol);
                return filtered;
            }


            var defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
            // var defaultStartDate=   DateTime.Now.AddHours(-10);
            Logger.LogInformation($"Getting 3-day Historical Data to SQL Lite for symbol: {symbol}");
            var dbmarketFeeds = await MarketFeedRepository.GetChartDataBySymbol1(symbol, defaultStartDate, false, false).ConfigureAwait(false);
            //  dbmarketFeeds = dbmarketFeeds.OrderBy((x) => x.Date);
            if (dbmarketFeeds != null && dbmarketFeeds.Count() > 0)
            {
                datasets[symbol] = dbmarketFeeds.ToList();
                var filtered = FilterData(dbmarketFeeds, PointSize);
                SymbolChanged(chartId, symbol);
                return filtered;
            }
            else
            {
                var UTCDate = DateTime.UtcNow.AddHours(-1);
                DateTime easternOneHour = TimeZoneInfo
                    .ConvertTimeFromUtc(
                        UTCDate,
                        TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));


                Logger.LogInformation($"Starting API call for symbol for 1 hour: {symbol}");
                IEnumerable<MarketFeed>? marketFeeds = await NasdaqService.NasdaqGetDataAsync(easternOneHour, symbol).ConfigureAwait(false);
                Logger.LogInformation($"Got Response from API for symbol for 1 hour: {symbol}");

                if (marketFeeds == null || marketFeeds.Count() == 0)
                {
                    // Start a background task to load the last 3 days of data
                    var token = _cancellationTokenSource.Token;
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            Logger.LogInformation($"Starting background task to load 3-day data for symbol: {symbol}");
                            var threeDayMarketFeeds = await NasdaqService.NasdaqGetDataAsync(defaultStartDate, symbol).ConfigureAwait(false);

                            if (token.IsCancellationRequested)
                            {
                                Logger.LogInformation($"Background task canceled for symbol: {symbol}");
                                return;
                            }

                            if (threeDayMarketFeeds != null && threeDayMarketFeeds.Any())
                            {
                                Loading._symbolSet.Add(symbol);
                                datasets[symbol] = threeDayMarketFeeds.ToList();
                                await SendChartDataInChunks(symbol, FilterData(threeDayMarketFeeds, PointSize));
                                Logger.LogInformation($"Adding 3-day Historical Data to SQL Lite for symbol: {symbol}, total: {threeDayMarketFeeds.Count()}");
                                MarketFeedRepository.InsertMarketFeedDataFromApi(symbol, threeDayMarketFeeds);
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            Logger.LogInformation($"Background task was canceled for symbol: {symbol}");
                        }
                    }, token);

                    return marketFeeds; // Return the market feeds retrieved from the initial API call
                }
                else
                {
                    datasets[symbol] = marketFeeds.ToList();
                    var filteredData = FilterData(marketFeeds, PointSize);
                    SymbolChanged(chartId, symbol);

                    var token = _cancellationTokenSource.Token;
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            Logger.LogInformation($"Starting background task to load 3-day data for symbol: {symbol}");
                            var threeDayMarketFeeds = await NasdaqService.NasdaqGetDataAsync(defaultStartDate, symbol).ConfigureAwait(false);

                            if (token.IsCancellationRequested)
                            {
                                Logger.LogInformation($"Background task canceled for symbol: {symbol}");
                                return;
                            }

                            if (threeDayMarketFeeds != null && threeDayMarketFeeds.Any())
                            {
                                Loading._symbolSet.Add(symbol);
                                datasets[symbol] = threeDayMarketFeeds.ToList();
                                await SendChartDataInChunks(symbol, FilterData(threeDayMarketFeeds, PointSize));
                                Logger.LogInformation($"Adding 3-day Historical Data to SQL Lite for symbol: {symbol}, total: {threeDayMarketFeeds.Count()}");
                                MarketFeedRepository.InsertMarketFeedDataFromApi(symbol, threeDayMarketFeeds);
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            Logger.LogInformation($"Background task was canceled for symbol: {symbol}");
                        }
                    }, token);

                    return filteredData;
                }
            }
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

            WebSocketClient.ActionReferenceChart -= RefreshCharts;
            await WebSocketClient.CloseCta();
            await WebSocketClient.CloseUtp();
        }
        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetFilteredDataBySymbol(string symbol, double range, int xAxisPixels, int yAxisPixels)
        {
            var filtered = await GetChartData(symbol);

            // Update the range for the symbol
            Ranges[symbol] = range;

            var RangeDate = DateTime.UtcNow.AddMilliseconds(-range);

            // Convert UTC to Eastern Time
            DateTime eastern = TimeZoneInfo.ConvertTimeFromUtc(RangeDate, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));

            // Get the last data point
            var last = filtered.LastOrDefault();

            // Filter the data by time range
            filtered = filtered.Where((x) => x.Date >= eastern && x.Price >= 0).ToList();



            // Calculate the number of data points to display
            filtered = FilterData(filtered, xAxisPixels, yAxisPixels);

            return filtered;
        }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetFilteredDataBySymbolAndDateRange(string symbol, double startDate, double endDate, double oldStartDate, double oldEndDate, int xAxisPixels, int yAxisPixels)

        {

            // Convert timestamps to DateTime objects
            var startDateRange = UnixTimeStampToDateTime((long)startDate);
            var endDateRange = UnixTimeStampToDateTime((long)endDate);

            var oldStartDateRange = UnixTimeStampToDateTime((long)oldStartDate);
            var oldEndDateRange = UnixTimeStampToDateTime((long)oldEndDate);

            // Check if datasets[symbol] contains data
            if (datasets.ContainsKey(symbol) && datasets[symbol].Any())
            {
                // Get the minimum date present in the dataset
                var minDateInDataset = datasets[symbol].Min(x => x.Date);

                // Ensure startDateRange is not less than the minimum date in the dataset
                if (startDateRange < minDateInDataset)
                {
                    startDateRange = minDateInDataset;
                }
            }


            // // // Fetch data in the old range but exclude data within the new range
            var filteredOldData = datasets[symbol]
                .Where(x => x.Date >= oldStartDateRange && x.Date <= oldEndDateRange && (x.Date < startDateRange || x.Date > endDateRange) && x.Price >= 0)
                .OrderBy(x => x.Date)
                .ToList();

            // // Calculate the number of data points to display using FilterData function
            var oldFiltered = FilterData(filteredOldData, xAxisPixels, yAxisPixels);


            // Fetch and sort additional data in the extended range (startDateRange to endDateRange)
            var newData = datasets[symbol]
                .Where(x => x.Date >= startDateRange && x.Date <= endDateRange && x.Price >= 0)
                .OrderBy(x => x.Date)
                .ToList();
            var newFiltered = FilterData(newData, xAxisPixels, yAxisPixels);

            // Combine both datasets (old and new data) ensuring there is no duplication
            var combinedFiltered = oldFiltered.Union(newFiltered).ToList();

            var finalFiltered = FilterByEasternTime(combinedFiltered).OrderBy(x => x.Date).ToList();


            return finalFiltered;

        }

        public static List<MarketFeed> FilterData(IEnumerable<MarketFeed> data, int xAxisPixels, int yAxisPixels)

        {

            // var currentTime = DateTime.Now.TimeOfDay;


            if (PointSize > xAxisPixels)
            {
                xAxisPixels = PointSize;
            }


            // Total number of data points

            var totalPoints = data.Count();



            // Determine if we need to reduce the number of points based on xAxisPixels

            int numPointsToShow = Math.Min(totalPoints, xAxisPixels);

            if (totalPoints <= numPointsToShow)
            {
                return data.ToList();
            }


            // Determine step size for selecting points

            int step = totalPoints > numPointsToShow ? (int)Math.Ceiling((double)totalPoints / numPointsToShow) : 1;



            // Filter data to have at least one point per x-axis pixel

            var filteredData = FilterByEasternTime(data).Where((_, index) => index % step == 0).ToList();

            return filteredData.ToList();
            // Additional filtering to ensure at least 10 distinct y-axis points for each time pixel

            // var groupedByTimePixel = filteredData

            //     .GroupBy(point => point.Date.Ticks / (TimeSpan.TicksPerMillisecond * xAxisPixels))

            //     .SelectMany(g =>

            //     {

            //         // If fewer than 10 points in this time group, show them all

            //         if (g.Count() <= 10)

            //             return g;



            //         // Otherwise, distribute points across y-axis

            //         var pointsByPriceRange = g

            //             .GroupBy(point => point.Price / (yAxisPixels * 10)) // Divide prices into y-axis pixels

            //             .SelectMany(pg => pg.Take(10)) // Take up to 10 per pixel group

            //             .Take(yAxisPixels);


            //         return pointsByPriceRange;

            //     });


            // return groupedByTimePixel.OrderBy(x => x.Date).ToList();

        }

        //[JSInvokable]
        //public async Task<IEnumerable<MarketFeed>?> UpdateChartSymbol(string chartId, string symbol)
        //{
        //    // Cancel any ongoing background tasks
        //    lock (_lock)
        //    {
        //        _cancellationTokenSource.Cancel();
        //        _cancellationTokenSource.Dispose();
        //        _cancellationTokenSource = new CancellationTokenSource();
        //    }

        //    if (!TickerRepository.IsTickerExists(symbol))
        //    {
        //        Toast.ShowDangerMessage($"Ticker '{symbol}' does not exist.");
        //        return null;
        //    }

        //    return await GetChartData(chartId, symbol);
        //}

        private async Task<IEnumerable<MarketFeed>?> GetChartData(string symbol)
        {


            if (!datasets.ContainsKey(symbol) || !datasets[symbol].Any())
            {
                var defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
                Logger.LogInformation($"Getting 3-day Historical Data to SQL Lite for symbol: {symbol}");
                var dbmarketFeeds = await MarketFeedRepository.GetChartDataBySymbol1(symbol, defaultStartDate, false, false).ConfigureAwait(false);

                if (dbmarketFeeds != null && dbmarketFeeds.Count() > 0)
                {
                    datasets[symbol] = dbmarketFeeds.ToList();
                    var filtered = FilterData(dbmarketFeeds, PointSize);
                    return filtered;
                }
                else
                {
                    await LoadThreeDayData(symbol, defaultStartDate);
                }
            }
            return datasets[symbol];

        }

        private async Task<IEnumerable<MarketFeed>?> LoadThreeDayData(string symbol, DateTime defaultStartDate)
        {
            var token = _cancellationTokenSource.Token;
            await Task.Run(async () =>
            {
                try
                {
                    Logger.LogInformation($"Starting background task to load 3-day data for symbol: {symbol}");
                    var threeDayMarketFeeds = await NasdaqService.NasdaqGetDataAsync(defaultStartDate, symbol).ConfigureAwait(false);

                    if (token.IsCancellationRequested)
                    {
                        Logger.LogInformation($"Background task canceled for symbol: {symbol}");
                        return;
                    }

                    if (threeDayMarketFeeds != null && threeDayMarketFeeds.Any())
                    {
                        Loading._symbolSet.Add(symbol);
                        datasets[symbol] = threeDayMarketFeeds.ToList();
                        Logger.LogInformation($"Adding 3-day Historical Data to SQL Lite for symbol: {symbol}, total: {threeDayMarketFeeds.Count()}");
                        MarketFeedRepository.InsertMarketFeedDataFromApi(symbol, threeDayMarketFeeds);
                    }
                }
                catch (OperationCanceledException)
                {
                    Logger.LogInformation($"Background task was canceled for symbol: {symbol}");
                }
            }, token);

            return null;
        }

    }
}
