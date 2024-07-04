using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using Microsoft.Extensions.Logging;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class Loading
    {
        private int progress = 0;

        protected override async Task OnInitializedAsync()
        {

            Task tickerTask = TickerTask();

            List<Task> tasks = [tickerTask];

            DateTime defaultStartDate = DateTime.Now.GetPastBusinessDay(3);

            foreach (ChartModal chart in ChartService.InitialChartSymbols.Where(a => a.IsVisible))
            {
                Task chartTask = ChartTask(chart, defaultStartDate);
                tasks.Add(chartTask);
            }

            int intCompletedTasks = 0, totlalTasks = tasks.Count;

            while (tasks.Any())
            {
                Task completedTask = await Task.WhenAny(tasks);
                intCompletedTasks++;
                UpdateProgress(intCompletedTasks, totlalTasks);
                tasks.Remove(completedTask);
            }

            await Task.Delay(1000);

            WindowsSerivce.UnlockWindowResize();

            NavigationManager.NavigateTo("/multi-charts");
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
                    marketFeeds = null;
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"For : {chart.Symbol} ");
            }
        }

        private void UpdateProgress(int completedTasks, int totalTasks)
        {
            progress = (completedTasks * 100) / totalTasks;
            StateHasChanged();
        }
    }
}

