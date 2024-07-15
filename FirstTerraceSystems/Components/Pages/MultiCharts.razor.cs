﻿using System;
using System.Text.Json;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using Microsoft.VisualBasic;

namespace FirstTerraceSystems.Components.Pages
{
    public partial class MultiCharts
    {
        private const int MarketFeedChunkSize = 5000;
        private DotNetObjectReference<MultiCharts>? _dotNetMualtiChatsRef;
    Dictionary<string, List<MarketFeed>> datasets = new Dictionary<string, List<MarketFeed>>();
    Dictionary<string, double> Ranges = new Dictionary<string, double>();
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
                Logger.LogInformation($"Connected WebSocketClient");
                WebSocketClient.ActionRealDataReceived += OnRealDataReceived;
                WebSocketClient.ActionReferenceChart += RefreshCharts;
                Logger.LogInformation($"Listening WebSocketClient");
                await WebSocketClient.ListenAsync();
                Logger.LogInformation($"WebSocketClient Close");
            }
        }

        private async Task UpdateAndRenderChartsAsync()
        {
            DateTime defaultStartDate = DateTime.Now.GetPastBusinessDay(3);
      DateTime defaultdbStartDate = DateTime.Now.AddMinutes(-30);
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

            IEnumerable<Task>? tasks = ChartService.InitialChartSymbols.Where(a => a.IsVisible).Select(async chart =>
            {
                try
                {

                    MarketFeed? lastMarketFeed = MarketFeedRepository.GetLastRecordBySymbol(chart.Symbol);
                    DateTime startDate = lastMarketFeed?.Date ?? defaultStartDate;

                    Logger.LogInformation($"Starting API call for symbol: {chart.Symbol}");
                    IEnumerable<MarketFeed>? marketFeeds = await NasdaqService.NasdaqGetDataAsync(startDate, chart.Symbol).ConfigureAwait(false);
                Logger.LogInformation($"Got Response from API for symbol: {chart.Symbol}");

                    if (marketFeeds != null && marketFeeds.Any())
                    {
                        Logger.LogInformation($"Adding Historical Data to SQL Lite for symbol: {chart.Symbol}");
                       
                        MarketFeedRepository.InsertMarketFeedDataFromApi(chart.Symbol, marketFeeds); 
                        Logger.LogInformation($"Added Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");
                        marketFeeds = null;
                    }

                    Logger.LogInformation($"Getting 3day Historical Data to SQL Lite for symbol: {chart.Symbol}");
                    marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(chart.Symbol, defaultStartDate).ConfigureAwait(false);
                    Logger.LogInformation($"Got 3day Historical Data to SQL Lite for symbol: {chart.Symbol} total: {marketFeeds.Count()}");

                    try
                    {
                        Logger.LogInformation($"Passing Data To Chart: {chart.Symbol}");
                        await SendChartDataInChunks(chart.Symbol, marketFeeds) ;
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
            });

            await Task.WhenAll(tasks).ConfigureAwait(false);
            Logger.LogInformation($"End InitialChartSymbols");
        }

    private List<MarketFeed> FilterData(List<MarketFeed> data, int numPoints)
    {
      var filteredData = data;


      if (numPoints > 0 && numPoints < filteredData.Count)
      {
        var step = Math.Max(1, filteredData.Count / numPoints);
        return filteredData.Where((_, index) => index % step == 0).Take(numPoints).ToList();
      }

      return filteredData;
    }

    private async Task SendChartDataInChunks(string symbol, IEnumerable<MarketFeed> marketFeeds)
    {
      datasets[symbol] = marketFeeds.ToList();
      
      var chunks = FilterData(marketFeeds.ToList(),500).Chunk(MarketFeedChunkSize); 

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
      filtered = FilterData(filtered, 500);
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
            await MarketFeedRepository.InsertLiveMarketFeedDataFromSocket(response).ConfigureAwait(false);
    }

        private async Task RefreshCharts()
        {
            await JSRuntime.InvokeVoidAsync("refreshCharts");
        }

    private async Task UpdateChartWithUpdatedPoints(string symbol, IEnumerable<MarketFeed> UpdatedFeeds)
    {
      List<MarketFeed> filtered = datasets[symbol];
      if (Ranges.ContainsKey(symbol) && Ranges[symbol] != 0)
      {
        var RangeDate = DateTime.UtcNow.AddMilliseconds(-Ranges[symbol]);
        DateTime eastern = TimeZoneInfo
    .ConvertTimeFromUtc(
      RangeDate,
      TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));
         filtered = datasets[symbol].Where((x) => x.Date >= eastern).ToList();
      }
        filtered = FilterData(filtered, 500);
      filtered = filtered.Concat(UpdatedFeeds).ToList();
      datasets[symbol] = datasets[symbol].Concat(UpdatedFeeds).ToList();
      await JSRuntime.InvokeVoidAsync("setNewDataToChartBySymbol",symbol,filtered);
    
    }

        [JSInvokable]
        public async Task<IEnumerable<MarketFeed>?> GetChartDataBySymbol(string symbol, DataPoint? lastPoint)
        {
            if (lastPoint == null)
            {

                IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3)).ConfigureAwait(false);
                //await SendChartDataInChunks(symbol, marketFeeds);

                return marketFeeds;
            }
            else
            {
                IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, lastPoint.PrimaryKey).ConfigureAwait(false);
        
        UpdateChartWithUpdatedPoints(symbol,marketFeeds);
        return marketFeeds;
            }
        }

        [JSInvokable]
        public void SymbolChanged(string chartId, string symbol)
        {
            ChartService.UpdateSymbol(chartId, symbol);
        }

        [JSInvokable]
        public async Task RefreshChartBySymbol(string symbol)
        {
            IEnumerable<MarketFeed>? marketFeeds = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3)).ConfigureAwait(false);
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

            IEnumerable<MarketFeed>? symbolics = await MarketFeedRepository.GetChartDataBySymbol(symbol, DateTime.Now.GetPastBusinessDay(3)).ConfigureAwait(false);
            IEnumerable<MarketFeed>? data = await HistoricalDataService.ProcessHistoricalNasdaqMarketFeedAsync(symbol).ConfigureAwait(false);
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
            ChartWindowPage? chartWindow = new ChartWindowPage(jsObject, chartId, minPoint, maxPoint, symbol, dataPoints);
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
