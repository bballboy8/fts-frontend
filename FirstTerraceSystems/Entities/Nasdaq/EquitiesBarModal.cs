using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Entities.Nasdaq
{
    public class EquitiesBarModal
    {
        [JsonPropertyName("trackingid")]
        public string? TrackingId { get; set; }

        [JsonPropertyName("date")]
        public DateTime DateT { get; set; }

        [JsonPropertyName("msgtype")]
        public string? MsgType { get; set; }

        [JsonPropertyName("symbol")]
        public string? Symbol { get; set; }

        [JsonPropertyName("price")]
        public float Price { get; set; }
    }
}
