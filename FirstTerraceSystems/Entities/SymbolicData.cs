using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using SQLite;

namespace FirstTerraceSystems.Entities
{
    public class SymbolicData
    {
        public SymbolicData() { }
        public SymbolicData(List<string> headers, object[] row)
        {
            TrackingID = row[headers.IndexOf("trackingID")].ToString();
            MsgType = row[headers.IndexOf("msgType")].ToString();
            Symbol = row[headers.IndexOf("symbol")].ToString();
            Price = (double.TryParse(row[headers.IndexOf("price")].ToString(), out double price) ? price : 0.0) / 10000;

            string? dateString = row[headers.IndexOf("date")].ToString();
            
            if (DateTime.TryParseExact(dateString, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
            {
                if (long.TryParse(TrackingID, out long trackingIdValue))
                {
                    Date = dateTime.AddMilliseconds(trackingIdValue / 1000000);
                }
                else
                {
                    Date = dateTime;
                }
            }

            /*TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            
            DateTime easternTime = TimeZoneInfo.ConvertTimeFromUtc(Date, easternZone);*/

            TimeStamp = Date.ToString("yyyy-MM-ddTHH:mm:ss.fff");
        }


        [PrimaryKey, AutoIncrement]
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
        public string? TimeStamp { get; set; }
    }
}
