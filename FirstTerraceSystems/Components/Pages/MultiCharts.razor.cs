using System.Collections.Concurrent;
using System.Reflection.PortableExecutable;
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
        private const int MarketFeedChunkSize = 5000;
        private const int PointSize = 800;
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

                    MainThread.BeginInvokeOnMainThread(async () =>
                    {
                        await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols.Where(x => x.IsVisible == true));
                        // Code to run on the main thread
                    });


                    await UpdateAndRenderChartsAsync();
                    MainThread.BeginInvokeOnMainThread(() => { preloadService.Hide(); });
                    IsLoading = false;
                    Logger.LogInformation($"Connecting WebSocketClient");

                    await WebSocketClient.ConnectUtp().ConfigureAwait(false);
                    await WebSocketClient.ConnectCta().ConfigureAwait(false);
                    Logger.LogInformation($"Connected WebSocketClient");


                    // WebSocketClient.ActionRealDataReceived += OnRealDataReceived;

                    WebSocketClient.ActionReferenceChart += RefreshCharts;

                    Logger.LogInformation($"Listening WebSocketClient");

                    await WebSocketClient.ListenCta().ConfigureAwait(false);
                    await WebSocketClient.ListenUtp().ConfigureAwait(false);


                    await Task.Run(async () =>
                    {
                        await UpdateUI();
                    });
                });

                //await Task.WhenAll(Task1, Task2);
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
                Logger.LogInformation(ex, $"Error in UpdateAndRenderChartsAsync");
            }

            Logger.LogInformation($"End InitialChartSymbols");
        }

        private async Task ChartTask(ChartModal chart, DateTime defaultStartDate)
        {
            try
            {
                Logger.LogInformation($"Getting 3day Historical Data to SQL Lite for symbol: {chart.Symbol}");
                var marketFeeds = await  MarketFeedRepository.GetChartDataBySymbol(chart.Symbol, defaultStartDate).ConfigureAwait(false);
                Logger.LogInformation($"Got 3day Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");

                try
                {
                    Logger.LogInformation($"Passing Data To Chart: {chart.Symbol}");
                    await SendChartDataInChunks(chart.Symbol, marketFeeds);
                //    await JSRuntime.InvokeVoidAsync("setRange", chart.Symbol, 3 * 24 * 60 * 60 * 1000);

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
            var currentTime = DateTime.Now.TimeOfDay;
            //data = data.Where((x) => x.Date.TimeOfDay < currentTime);
            var filteredData = data;


            if (numPoints > 0 && numPoints < filteredData.Count())
            {
                var step = Math.Max(1, filteredData.Count() / numPoints);
                return filteredData.Where((_, index) => index % step == 0).Take(numPoints).ToList();
            }

            return filteredData.ToList();
        }

        public async Task SendChartDataInChunks(string symbol, IEnumerable<MarketFeed> marketFeeds)
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
            if (datasets.ContainsKey(symbol))
            {
                var extremeData = datasets[symbol].FindAll((x) => x.Date >= startDate && x.Date <= endDate);
                var filteredData = FilterData(extremeData, 300);
                return filteredData;
            }
            return [];
        }

        /* [JSInvokable]
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
         }*/
        public static List<MarketFeed> FilteredDataBySymbol(string symbol, double range)
        {

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

        /*   private async Task OnRealDataReceived(NasdaqResponse? response)
           {
               //await Task.Run(async() => { 
               // await MarketFeedRepository.InsertLiveMarketFeedDataFromSocket(response);
               // }).ConfigureAwait(true);
           }*/  

        private async Task RefreshCharts(NasdaqResponse? response)
        {
            await Task.Run(async () =>
            {
                try
                {
                    //Logger.LogInformation($"...............Socket call start...............");
                    //Logger.LogInformation($"{DateTime.Now:HH:mm:ss.fff}");

                    foreach (var data in datasets)
                    {
                        IEnumerable<IGrouping<string?, MarketFeed>>? groupedData = response.Data
                            .Select(data => new MarketFeed(response.Headers, data))
                            .GroupBy(mf => mf.Symbol);

                        var dataGot = groupedData.FirstOrDefault(x => x.Key == data.Key)?.ToList();

                        //Logger.LogInformation("...................System.............................");
                        //Logger.LogInformation($"...................{data.Key}.............................");
                        //Logger.LogInformation("...................end.............................");

                        //Logger.LogInformation("...................socket.............................");
                        //Logger.LogInformation($"...............{JsonSerializer.Serialize(groupedData)}...............");
                        //Logger.LogInformation("...................end.............................");

                        if (dataGot != null)
                        {

                            if (OnWait)
                            {
                                await Task.Delay(1000);  // Non-blocking delay
                            }

                            lock (_lock)  // Use lock for thread safety
                            {
                                datasets[data.Key] = datasets[data.Key].Concat(dataGot).ToList();

                                if (collection.ContainsKey(data.Key))
                                {
                                    collection[data.Key].AddRange(dataGot);
                                }
                                else
                                {
                                    collection[data.Key] = dataGot;
                                }
                            }
                        }
                    }

                    Logger.LogInformation($"...............Socket call end...............");
                    Logger.LogInformation($"{DateTime.Now:HH:mm:ss.fff}");
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
                await Task.Delay(1000);  // Non-blocking delay
                OnWait = true;

                lock (_lock)  // Ensure thread safety when accessing shared collection
                {
                    foreach (var data in collection)
                    {
                        if (data.Value.Count != 0)
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
            var dbmarketFeeds = await MarketFeedRepository.GetChartDataBySymbol1(symbol, defaultStartDate,false,false).ConfigureAwait(false);
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

            //   WebSocketClient.ActionRealDataReceived -= OnRealDataReceived;//Commented out because it's not in use
            WebSocketClient.ActionReferenceChart -= RefreshCharts;
            await WebSocketClient.CloseCta();
            await WebSocketClient.CloseUtp();
        }
        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetFilteredDataBySymbol(string symbol, double range, int xAxisPixels, int yAxisPixels)

        {

            // Update the range for the symbol

            Ranges[symbol] = range;

            var RangeDate = DateTime.UtcNow.AddMilliseconds(-range);

            // Convert UTC to Eastern Time

            DateTime eastern = TimeZoneInfo.ConvertTimeFromUtc(RangeDate, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));



            // Get the last data point

            var last = datasets[symbol][datasets[symbol].Count - 1];


            // Filter the data by time range

            var filtered = datasets[symbol].Where((x) => x.Date >= eastern && x.Price >= 0).ToList();



            // Calculate the number of data points to display

            filtered = FilterData(filtered, xAxisPixels, yAxisPixels);


            return filtered;

        }


        public static List<MarketFeed> FilterData(IEnumerable<MarketFeed> data, int xAxisPixels, int yAxisPixels)

        {

            var currentTime = DateTime.Now.TimeOfDay;

           


            // Total number of data points

            var totalPoints = data.Count();



            // Determine if we need to reduce the number of points based on xAxisPixels

            int numPointsToShow = Math.Min(totalPoints, xAxisPixels);



            // Determine step size for selecting points

            int step = totalPoints > numPointsToShow ? (int)Math.Ceiling((double)totalPoints / numPointsToShow) : 1;



            // Filter data to have at least one point per x-axis pixel

            var filteredData = data.Where((_, index) => index % step == 0).ToList();


            // Additional filtering to ensure at least 10 distinct y-axis points for each time pixel

            var groupedByTimePixel = filteredData

                .GroupBy(point => point.Date.Ticks / (TimeSpan.TicksPerMillisecond * xAxisPixels))

                .SelectMany(g =>

                {

                    // If fewer than 10 points in this time group, show them all

                    if (g.Count() <= 10)

                        return g;



                    // Otherwise, distribute points across y-axis

                    var pointsByPriceRange = g

                        .GroupBy(point => point.Price / (yAxisPixels * 10)) // Divide prices into y-axis pixels

                        .SelectMany(pg => pg.Take(10)) // Take up to 10 per pixel group

                        .Take(yAxisPixels);


                    return pointsByPriceRange;

                });


            return groupedByTimePixel.ToList();

        }


    }
}
