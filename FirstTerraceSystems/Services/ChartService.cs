using System.Text.Json;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Services
{
    public class ChartService
    {
        private const string PKey_ChartSymbols = "ChartSymbols";
        private const string PKey_SavedChartLayout = "SavedChartLayout";

        public int InitialChartLayout { get; private set; } = 5;
        public List<ChartModal> InitialChartSymbols { get; private set; } = new List<ChartModal>
        {
            new ChartModal { ChartOrderIndx = 1, ChartId = "chart-1", Symbol = "AAPL" , IsVisible = true},
            new ChartModal { ChartOrderIndx = 2, ChartId = "chart-2", Symbol = "GOOGL" , IsVisible = true},
            new ChartModal { ChartOrderIndx = 3, ChartId = "chart-3", Symbol = "MSFT" , IsVisible = true},
            new ChartModal { ChartOrderIndx = 4, ChartId = "chart-4", Symbol = "TSLA" , IsVisible = true},
            new ChartModal { ChartOrderIndx = 5, ChartId = "chart-5", Symbol = "AMD" , IsVisible = true},
            new ChartModal { ChartOrderIndx = 6, ChartId = "chart-6", Symbol = "AMZN" , IsVisible = false},
            new ChartModal { ChartOrderIndx = 7, ChartId = "chart-7", Symbol = "META" , IsVisible = false},
            new ChartModal { ChartOrderIndx = 8, ChartId = "chart-8", Symbol = "GOOG" , IsVisible = false}
        };

        public void LoadChartSettings()
        {
            ClearAll();
            string savedSymbolsJson = Preferences.Get(PKey_ChartSymbols, string.Empty);
            InitialChartLayout = Preferences.Get(PKey_SavedChartLayout, 5);

            if (!string.IsNullOrEmpty(savedSymbolsJson))
            {
                var savedSymbols = JsonSerializer.Deserialize<List<ChartModal>>(savedSymbolsJson);
                InitialChartSymbols.ForEach(existingSymbol =>
                {
                    var matchingSymbol = savedSymbols!.Find(s => s.ChartId == existingSymbol.ChartId);
                    existingSymbol.Symbol = matchingSymbol?.Symbol ?? existingSymbol.Symbol;
                    existingSymbol.IsVisible = matchingSymbol?.IsVisible ?? existingSymbol.IsVisible;
                });
            }
        }

        public void SaveChartLayout()
        {
            var json = JsonSerializer.Serialize(InitialChartSymbols);
            Preferences.Set(PKey_ChartSymbols, json);
            Preferences.Set(PKey_SavedChartLayout, InitialChartLayout);
        }

        public void UpdateSymbol(string id, string newSymbol)
        {
            var symbol = InitialChartSymbols.Find(s => s.ChartId == id);
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
