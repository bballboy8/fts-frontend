using System.Text.Json.Serialization;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Models
{
    public class ChartModal
    {
        [JsonPropertyName("id")]
        public string? ChartId { get; set; }
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = null!;
        public object? UpdatedMinExtreme { get; set; }
        public object? UpdatedMaxExtreme { get; set; }
        public int ChartOrderIndx { get; set; }
        public bool IsVisible { get; set; }

        [JsonIgnore]
        public IJSRuntime? JSRuntime { get; set; }
    }

    public class DataPoint
    {
        public long PrimaryKey { get; set; }
        public long X { get; set; } 
        //public DateTime X { get; set; } 
        public double Y { get; set; }
        public string? Color { get; set; }
    }
}