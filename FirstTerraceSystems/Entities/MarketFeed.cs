using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using FirstTerraceSystems.Features;

namespace FirstTerraceSystems.Entities
{
    //yyyy-MM-dd HH:mm:ss.ffffff
    //2024-06-28T12:34:01.000535
    //Price / 10000

    public class MarketFeed
    {
        public MarketFeed() { }

        public MarketFeed(List<string> headers, object[] data)
        {
            TrackingID = data[headers.IndexOf("trackingID")].ToString();
            MsgType = data[headers.IndexOf("msgType")].ToString();
            Symbol = data[headers.IndexOf("symbol")].ToString();
            if (double.TryParse(data[headers.IndexOf("price")].ToString(), out double price))
            {
                Price = price;
            }
            if (DateTime.TryParseExact(data[headers.IndexOf("date")].ToString(), AppSettings.DFormat_MarketFeedForSocket, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
            {
                Date = dateTime;
            }
        }


        [JsonPropertyName("id")]
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
