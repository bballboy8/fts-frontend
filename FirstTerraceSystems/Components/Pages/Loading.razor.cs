using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using Microsoft.Extensions.Logging;
using System.Timers; // Ensure this is used for System.Timers.Timer

namespace FirstTerraceSystems.Components.Pages
{
    public partial class Loading : IDisposable
    {
        private int progress = 0;
        public static HashSet<string> _symbolSet = new HashSet<string>();

        int intCompletedTasks = 0, totalTasks = 0;
        private string ellipsis = "";
        private System.Timers.Timer ellipsisTimer;  // Fully qualify the Timer with System.Timers.Timer

        protected override async Task OnInitializedAsync()
        {
            // Set up the ellipsis animation timer
            ellipsisTimer = new System.Timers.Timer(500); // Fully qualify here as well
            ellipsisTimer.Elapsed += OnEllipsisTimerElapsed;
            ellipsisTimer.AutoReset = true;
            ellipsisTimer.Start();

            Task tickerTask = TickerTask();

            List<Task> tasks = new List<Task> { tickerTask };
            totalTasks += 1;
            List<Task> nonAwaitableTasks = new List<Task> { };
            DateTime currentDate = DateTime.Now;
            DateTime defaultStartDate = currentDate.GetPastBusinessDay(3);
            DateTime defaultStartDateForBackground = defaultStartDate;
            await ChartService.ChartModals();
            IEnumerable<ChartModal> recordsToFetch = ChartService.InitialChartSymbols.Where(x => x.IsVisible == true);
            IEnumerable<ChartModal> recordsToFetchInBackGround = ChartService.InitialChartSymbols.Where(x => x.IsVisible == false).Take(1);

            foreach (ChartModal chart in recordsToFetch)
            {
                totalTasks += 1;
                Task chartTask = ChartTask(chart, defaultStartDate);
                tasks.Add(chartTask);
                _symbolSet.Add(chart.Symbol);
            }

            while (tasks.Any())
            {
                Task completedTask = await Task.WhenAny(tasks);
                intCompletedTasks++;
                await UpdateProgress(intCompletedTasks, totalTasks);  // Update progress incrementally
                tasks.Remove(completedTask);
            }
            await UpdateProgress(totalTasks, totalTasks);

            _ = Task.Run(async () =>
            {
                await Task.Delay(5000);
                await ProcessInBatches(recordsToFetchInBackGround, defaultStartDate, 10);  // Process in batches of 10
            });

            WindowsSerivce.UnlockWindowResize();

            NavigationManager.NavigateTo("/multi-charts");
        }

        private void OnEllipsisTimerElapsed(object? sender, ElapsedEventArgs e)
        {
            ellipsis = ellipsis switch
            {
                "" => ".",
                "." => "..",
                ".." => "...",
                _ => ""
            };
            InvokeAsync(StateHasChanged);  // Trigger UI update
        }

        private async Task TickerTask()
        {
            try
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
            catch (Exception ex)
            {
                Logger.LogError($"Error in InitializeTickerTask: {ex.Message}");
            }
        }

        private async Task ChartTask(ChartModal chart, DateTime defaultStartDate)
        {
            try
            {
                MarketFeed? lastMarketFeed = MarketFeedRepository.GetLastRecordBySymbol(chart.Symbol);
                DateTime startDate = lastMarketFeed?.Date ?? defaultStartDate;

                Logger.LogInformation($"Starting API call for symbol: {chart.Symbol}");
                IEnumerable<MarketFeed>? marketFeeds = await NasdaqService.NasdaqGetDataAsync(startDate, chart.Symbol);

                Logger.LogInformation($"Got Response from API for symbol: {chart.Symbol}");

                if (marketFeeds != null && marketFeeds.Any())
                {
                    Logger.LogInformation($"Adding Historical Data to SQL Lite for symbol: {chart.Symbol}");
                    MarketFeedRepository.InsertMarketFeedDataFromApi(chart.Symbol, marketFeeds);
                    Logger.LogInformation($"Added Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"For : {chart.Symbol}");
            }
        }

        // Helper method to process records in batches of a specified size
        private async Task ProcessInBatches(IEnumerable<ChartModal> records, DateTime defaultStartDate, int batchSize)
        {
            var recordsBatch = records.ToList();
            int totalRecords = recordsBatch.Count;
            for (int i = 0; i < totalRecords; i += batchSize)
            {
                var batch = recordsBatch.Skip(i).Take(batchSize);
                List<Task> batchTasks = new List<Task>();

                foreach (ChartModal chart in batch)
                {
                    Task chartTask = ChartTask(chart, defaultStartDate);
                    batchTasks.Add(chartTask);
                    _symbolSet.Add(chart.Symbol);
                }

                await Task.WhenAll(batchTasks);  // Run the batch of tasks in parallel
            }
        }

        // Helper method to increment progress smoothly to the target
        private async Task IncrementProgressTo(int targetProgress)
        {
            while (progress < targetProgress)
            {
                progress++;  // Increment progress by 1%
                StateHasChanged();  // Update the UI
                await Task.Delay(50);  // Small delay to make the animation smooth
            }
        }

        // UpdateProgress now uses IncrementProgressTo to increment the progress smoothly
        private async Task UpdateProgress(int completedTasks, int totalTasks)
        {
            int targetProgress = completedTasks * 100 / totalTasks;
            await IncrementProgressTo(targetProgress);  // Smoothly increment to the new target progress
            if (completedTasks < totalTasks)
            {
                await Task.Delay(250); // Reduces frequent UI updates
            }
        }

        public void Dispose()
        {
            ellipsisTimer?.Dispose();  // Clean up the timer
        }
    }
}
