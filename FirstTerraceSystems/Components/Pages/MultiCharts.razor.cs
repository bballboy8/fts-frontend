using System.Diagnostics;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using Serilog;

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
        }

        private async Task UpdateAndRenderChartsAsync()
        {
            DateTime defaultStartDate = DateTime.Now.AddDays(-3);

            //Parallel.ForEach(ChartService.InitialChartSymbols.Where(a => a.IsVisible), async chart =>
            //{
            //    var symbolic = SymbolicRepository.GetLastRecordBySymbol(chart.Symbol);
            //    DateTime startDate = symbolic?.Date ?? defaultStartDate;
            //    var symbolicDatas = await NasdaqService.NasdaqGetDataAsync(startDate, chart.Symbol);

            //    if (symbolicDatas != null && symbolicDatas.Any())
            //    {
            //        SymbolicRepository.InsertMarketFeedDataFromApi(chart.Symbol, symbolicDatas);
            //    }

            //    symbolicDatas = await SymbolicRepository.GetChartDataBySymbol(chart.Symbol);
            //    await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", chart.Symbol, symbolicDatas);
            //});

            Logger.LogInformation("Starting InitialChartSymbols");

            var tasks = ChartService.InitialChartSymbols.Where(a => a.IsVisible).Select(async chart =>
            {
                try
                {

                    var symbolic = SymbolicRepository.GetLastRecordBySymbol(chart.Symbol);
                    DateTime startDate = symbolic?.Date ?? defaultStartDate;

                    Logger.LogInformation($"Starting API call for symbol: {chart.Symbol}");

                    var symbolicDatas = await NasdaqService.NasdaqGetDataAsync(startDate, chart.Symbol);

                    Logger.LogInformation($"Got Response from API for symbol: {chart.Symbol}");

                    if (symbolicDatas != null && symbolicDatas.Any())
                    {
                        Logger.LogInformation($"Adding Last Historical Data to SQL Lite for symbol: {chart.Symbol}");
                        SymbolicRepository.InsertMarketFeedDataFromApi(chart.Symbol, symbolicDatas);
                        Logger.LogInformation($"Added Historical Data to SQL Lite for symbol: {chart.Symbol}");
                    }

                    Logger.LogInformation($"Getting  3day Historical Data to SQL Lite for symbol: {chart.Symbol}");
                    var symbolics = await SymbolicRepository.GetChartDataBySymbol(chart.Symbol);
                    Logger.LogInformation($"Got  3day Historical Data to SQL Lite for symbol: {chart.Symbol}");
 
                    await JSRuntime.InvokeVoidAsync("setDataToChartBySymbol", chart.Symbol, symbolics);
                    Logger.LogInformation($"Chart Rander To Screen: {chart.Symbol}");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error updating chart data for symbol {chart.Symbol}: {ex.Message}");

                    Logger.LogError($"For : {chart.Symbol} : {ex.Message}");
                }
            });

            await Task.WhenAll(tasks);
            Logger.LogInformation($"End InitialChartSymbols");
        }

        private async Task InitializedDataBaseAsync()
        {
            if (!TickerRepository.IsTickerTableExists())
            {
                Logger.LogInformation($"Starting API call for GetTickers");
                var tickers = await NasdaqService.NasdaqGetTickersAsync();
                Logger.LogInformation($"Got Response from API GetTickers");
                TickerRepository.InsertRecords(tickers);
                Logger.LogInformation($"Inserted To  SQLite DB");
            }
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                await JSRuntime.InvokeVoidAsync("ChatAppInterop.setDotNetReference", _dotNetMualtiChatsRef);
                await JSRuntime.InvokeVoidAsync("loadDashboard", ChartService.InitialChartLayout, ChartService.InitialChartSymbols);
                await UpdateAndRenderChartsAsync();

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

            var symbolics = await SymbolicRepository.GetChartDataBySymbol(symbol);
            var data = await HistoricalDataService.ProcessHistoricalNasdaqMarketFeedAsync(symbol);
            return symbolics;

            //if (DatabaseService.IsTableExists($"symbol_{symbol}"))
            //{
            //}
            //else
            //{
            //    return data.OrderBy(mf => mf.Date);
            //}
        }

        [JSInvokable]
        public static async Task<object?> DragedChartWindow(IJSObjectReference jsObject, bool isMaximizeClicked, object chartId, object minPoint, object maxPoint, string symbol, IEnumerable<DataPoint> dataPoints)
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
