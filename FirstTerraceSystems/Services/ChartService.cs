using System.Text.Json;
using FirstTerraceSystems.Features;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Repositories;

namespace FirstTerraceSystems.Services
{
    public class ChartService
    {
        public NasdaqService nasdaqService { get; }
        private const string PKey_ChartSymbols = "ChartSymbols";
        private const string PKey_SavedChartLayout = "SavedChartLayout";

        public ChartService()
        {
            var client = new HttpClient()
            {
                BaseAddress = new Uri(ApiEndpoints.RestAPIUri)
            };
            nasdaqService = new NasdaqService(client);
        }

        public int InitialChartLayout { get; private set; } = 5;
        public List<ChartModal> InitialChartSymbols { get; private set; }
        //= new List<ChartModal>
        //{              
        //    new ChartModal { ChartOrderIndx = 1, ChartId = "chart-1", Symbol = "AAPL" , IsVisible = true},
        //    new ChartModal { ChartOrderIndx = 2, ChartId = "chart-2", Symbol = "GOOGL" , IsVisible = true},
        //    new ChartModal { ChartOrderIndx = 3, ChartId = "chart-3", Symbol = "MSFT", IsVisible = true },
        //    new ChartModal { ChartOrderIndx = 4, ChartId = "chart-4", Symbol = "TSLA", IsVisible = true },
        //    new ChartModal { ChartOrderIndx = 5, ChartId = "chart-5", Symbol = "AMD", IsVisible = true },
        //    new ChartModal { ChartOrderIndx = 6, ChartId = "chart-6", Symbol = "AMZN", IsVisible = false },
        //    new ChartModal { ChartOrderIndx = 7, ChartId = "chart-7", Symbol = "META", IsVisible = false },
        //    new ChartModal { ChartOrderIndx = 8, ChartId = "chart-8", Symbol = "GOOG", IsVisible = false }
        //};

        public async Task ChartModals()
        {   
            List<ChartModal> chartModals = new List<ChartModal>();
            IEnumerable<NasdaqTicker> data = await nasdaqService.NasdaqGetTickersAsync();

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
