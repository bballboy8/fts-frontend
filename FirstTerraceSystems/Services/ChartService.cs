using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FirstTerraceSystems.Models;

namespace FirstTerraceSystems.Services
{
    internal class ChartService
    {

        private const string PreferencesKey = "ChartSymbols";

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

        public void Load()
        {
            var savedSymbolsJson = Preferences.Get(PreferencesKey, string.Empty);
            if (!string.IsNullOrEmpty(savedSymbolsJson))
            {
                var savedSymbols = JsonSerializer.Deserialize<List<ChartModal>>(savedSymbolsJson);
                if (savedSymbols != null)
                {
                    foreach (var symbol in savedSymbols)
                    {
                        var existingSymbol = InitialChartSymbols.Find(s => s.ChartId == symbol.ChartId);
                        if (existingSymbol != null)
                        {
                            existingSymbol.Symbol = symbol.Symbol;
                        }
                    }
                }
            }
        }

        public void Save()
        {
            var json = JsonSerializer.Serialize(InitialChartSymbols);
            Preferences.Set(PreferencesKey, json);
        }

        public void UpdateSymbol(string id, string newSymbol)
        {
            var symbol = InitialChartSymbols.Find(s => s.ChartId == id);
            if (symbol != null)
            {
                symbol.Symbol = newSymbol;
            }
        }
    }
}
