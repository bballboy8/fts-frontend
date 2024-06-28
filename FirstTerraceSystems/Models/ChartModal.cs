using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Models
{
    public class ChartModal
    {
        [JsonPropertyName("id")]
        public string? ChartId { get; set; }
        [JsonPropertyName("symbol")]
        public string? Symbol { get; set; }
        public object? UpdatedMinExtreme { get; set; }
        public object? UpdatedMaxExtreme { get; set; }
        public int ChartOrderIndx { get; set; }

        [JsonIgnore]
        public IJSRuntime? JSRuntime { get; set; }
    }

    public class LastDataPoint
    {
        public long PrimaryKey { get; set; }
        //public long X { get; set; } 
        public DateTime X { get; set; } 
        public double Y { get; set; }
        public string? Color { get; set; }
    }
}