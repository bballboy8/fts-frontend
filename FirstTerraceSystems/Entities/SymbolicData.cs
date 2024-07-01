using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using FirstTerraceSystems.Features;

namespace FirstTerraceSystems.Entities
{
    //yyyy-MM-dd HH:mm:ss.ffffff
    //2024-06-28T12:34:01.000535

    public class SymbolicData
    {
        public SymbolicData() { }

        public SymbolicData(Dictionary<string, int> headers, JsonElement element)
        {
            TrackingID = element[headers["trackingID"]].GetString();
            MsgType = element[headers["msgType"]].GetString();
            Symbol = element[headers["symbol"]].GetString();
            Price = element[headers["price"]].GetDouble() / 10000;
            Date = element[headers["date"]].GetDateTime("yyyy-MM-dd HH:mm:ss.ffffff");
        }

        public long Id { get; set; }

        [JsonPropertyName("trackingid")]
        public string? TrackingID { get; set; }

        [JsonPropertyName("date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("msgtype")]
        public string? MsgType { get; set; }

        [JsonPropertyName("symbol")]
        public string? Symbol { get; set; }

        [JsonPropertyName("price")]
        public double Price { get; set; }
    }
}
