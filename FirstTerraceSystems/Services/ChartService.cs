using System.Data;
using System.Text.Json;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Repositories;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Services
{
    public class ChartService
    {
        public NasdaqService nasdaqService { get; }
        private readonly TickerRepository _tickerRepository;
        private const string PKey_ChartSymbols = "ChartSymbols";
        private const string PKey_SavedChartLayout = "SavedChartLayout";

        public ChartService(TickerRepository tickerRepository)
        {
            var client = new HttpClient()
            {
                BaseAddress = new Uri(ApiEndpoints.RestAPIUri),
                Timeout = TimeSpan.FromSeconds(3600)
            };
            nasdaqService = new NasdaqService(client);
            _tickerRepository = tickerRepository;
        }

        public int InitialChartLayout { get; private set; } = 5;
        public List<ChartModal> InitialChartSymbols { get; private set; }
      

        public async Task ChartModals()
        {   
            List<ChartModal> chartModals = new List<ChartModal>();
            try
            {
                IEnumerable<NasdaqTicker>? data = await nasdaqService.NasdaqGetTickersAsync();
                var tasks = data.Select(async (chart, index) =>
                {
                    int adjustedIndex = (int)index + 1;
                    var chartModal = new ChartModal
                    {
                        ChartOrderIndx = adjustedIndex,
                        ChartId = "chart-" + adjustedIndex,
                        Symbol = chart.Symbol,
                        IsVisible = adjustedIndex <= InitialChartLayout
                    };

                    // Ensure thread-safe addition to the list
                    lock (chartModals)
                    {
                        chartModals.Add(chartModal);
                    }
                });

                // Await all tasks to complete
                await Task.WhenAll(tasks);

                // Assign the populated list to the property
                InitialChartSymbols = chartModals;
            }
            catch (Exception)
            {

                IEnumerable<NasdaqTicker> data = await _tickerRepository.GetTicker();
                var tasks = data.Select(async (chart, index) =>
                {
                    int adjustedIndex = (int)index + 1;
                    var chartModal = new ChartModal
                    {
                        ChartOrderIndx = adjustedIndex,
                        ChartId = "chart-" + adjustedIndex,
                        Symbol = chart.Symbol,
                        IsVisible = adjustedIndex <= InitialChartLayout
                    };

                    // Ensure thread-safe addition to the list
                    lock (chartModals)
                    {
                        chartModals.Add(chartModal);
                    }
                });

                // Await all tasks to complete
                await Task.WhenAll(tasks);

                // Assign the populated list to the property
                InitialChartSymbols = chartModals;
            }
        }

        public void LoadChartSettings()
        {
            string savedSymbolsJson = Preferences.Get(PKey_ChartSymbols, string.Empty);
            InitialChartLayout = Preferences.Get(PKey_SavedChartLayout, 5);

            if (!string.IsNullOrEmpty(savedSymbolsJson))
            {
                List<ChartModal>? savedSymbols = JsonSerializer.Deserialize<List<ChartModal>>(savedSymbolsJson);
                InitialChartSymbols.ForEach(existingSymbol =>
                {
                    ChartModal? matchingSymbol = savedSymbols!.Find(s => s.ChartId == existingSymbol.ChartId);
                    existingSymbol.Symbol = matchingSymbol?.Symbol ?? existingSymbol.Symbol;
                    existingSymbol.IsVisible = matchingSymbol?.IsVisible ?? existingSymbol.IsVisible;
                });
            }
        }

        public void SaveChartLayout()
        {
            string? json = JsonSerializer.Serialize(InitialChartSymbols);
            Preferences.Set(PKey_ChartSymbols, json);
            Preferences.Set(PKey_SavedChartLayout, InitialChartLayout);
        }

        public void UpdateSymbol(string id, string newSymbol)
        {
            ChartModal? symbol = InitialChartSymbols.Find(s => s.ChartId == id);
            if (symbol != null)
            {
                symbol.Symbol = newSymbol;
            }
        }

        public void UpdateChartLayout(int numberOfLayout)
        {
            if (numberOfLayout > InitialChartSymbols.Count) return;

            InitialChartSymbols.ForEach(modal =>
            {
                modal.IsVisible = modal.ChartOrderIndx <= numberOfLayout;
            });
            InitialChartLayout = numberOfLayout;
        }




        public void ClearAll()
        {
            Preferences.Clear();
        }
    }
}
