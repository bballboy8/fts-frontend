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
        //public SymbolicData(List<string> headers, object[] row)
        //{
        //    TrackingID = row[headers.IndexOf("trackingID")].ToString();
        //    MsgType = row[headers.IndexOf("msgType")].ToString();
        //    Symbol = row[headers.IndexOf("symbol")].ToString();
        //    Price = (double.TryParse(row[headers.IndexOf("price")].ToString(), out double price) ? price : 0.0) / 10000;

        //    TimeStamp = row[headers.IndexOf("date")].ToString();            
        //    if (DateTime.TryParseExact(TimeStamp, "yyyy-MM-dd HH:mm:ss.ffffff", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
        //    {
        //        Date = dateTime;                
        //        TimeStamp = dateTime.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");
        //    }
        //}


        public SymbolicData(Dictionary<string, int> headers, object[] row)
        {
            TrackingID = row[headers["trackingID"]].ToString();
            MsgType = row[headers["msgType"]].ToString();
            Symbol = row[headers["symbol"]].ToString();

#if DEBUG
            Price = double.TryParse(row[headers["price"]].ToString(), out double price) ? price : 0.0;
            //Price = (double.TryParse(row[headers["price"]].ToString(), out double price) ? price : 0.0) / 10000;
#else
            Price = (double.TryParse(row[headers["price"]].ToString(), out double price) ? price : 0.0) / 10000;
#endif

            TimeStamp = row[headers["date"]].ToString();
            if (DateTime.TryParseExact(TimeStamp, "yyyy-MM-dd HH:mm:ss.ffffff", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
            {
                Date = dateTime;
                TimeStamp = dateTime.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");
            }
        }

        [PrimaryKey, AutoIncrement]
        public long Id { get; set; }
        
        [JsonPropertyName("trackingid")]
        public string? TrackingID { get; set; }
        
        [JsonPropertyName("date")]
        public DateTime Date { get; set; }
        
        [JsonPropertyName("msgtype")]
        public string? MsgType { get; set; }

        [Indexed(Name = $"IX_{nameof(SymbolicData)}_{nameof(Symbol)}")]
        [JsonPropertyName("symbol")]
        public string? Symbol { get; set; }
        
        [JsonPropertyName("price")]
        public double Price { get; set; }
        
        public string? TimeStamp { get; set; }

        public void ApplyTransformations()
        {
            TimeStamp = Date.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");
            Price /= 10000;
        }
    }
}
