using SQLite;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Linq;
using System.Reflection.PortableExecutable;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Entities.Nasdaq
{
    public class EquitiesBarModal
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }
        [JsonPropertyName("t")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("o")]
        public float Open { get; set; }

        [JsonPropertyName("h")]
        public float High { get; set; }

        [JsonPropertyName("l")]
        public float Low { get; set; }

        [JsonPropertyName("c")]
        public float Close { get; set; }

        [JsonPropertyName("v")]
        public int Volume { get; set; }
    }

    public class NasdaqData
    {
        [JsonPropertyName("headers")]
        public List<string> Headers { get; set; } = [];
        [JsonPropertyName("data")]
        public object[][] Data { get; set; } = [];
    }

    //public class NasdaqSymbolicData
    //{

    //    [PrimaryKey, AutoIncrement]
    //    public int Id { get; set; }

    //    public string Data { get; set; }
    //}

    public class SymbolicData
    {
        /*public SymbolicData() { 
        }
        public SymbolicData(List<string> headers, object[] row)
        {
            *//*TrackingID = long.Parse(row[headers.IndexOf("trackingID")].ToString());
            Date = row[headers.IndexOf("date")].ToString();
            MsgType = row[headers.IndexOf("msgType")].ToString();
            Symbol = row[headers.IndexOf("symbol")].ToString();
            Price = decimal.Parse(row[headers.IndexOf("price")].ToString());*//*


            var dt = DateTime.ParseExact(Date.ToShortDateString(), "yyyy-MM-dd", CultureInfo.InvariantCulture);            
            dt = dt.AddMilliseconds(long.Parse(TrackingID) / 1000000);
            TimeStamp = dt.ToString("yyyy-MM-ddTHH:mm:ss.fff");
            //2024-06-18T09:30:00.000
        }*/

        public SymbolicData() { }
        public SymbolicData(List<string> headers, object[] row)
        {
            TrackingID = row[headers.IndexOf("trackingID")].ToString();
            var date =  row[headers.IndexOf("date")].ToString();
            MsgType = row[headers.IndexOf("msgType")].ToString();
            Symbol = row[headers.IndexOf("symbol")].ToString();
            Price = double.Parse(row[headers.IndexOf("price")].ToString());

            //var dt = DateTime.ParseExact(Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var dt = DateTime.ParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            dt = dt.AddMilliseconds(long.Parse(TrackingID) / 1000000);

            // Convert to Eastern Time
            TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            DateTime easternTime = TimeZoneInfo.ConvertTimeFromUtc(dt, easternZone);

            TimeStamp = easternTime.ToString("yyyy-MM-ddTHH:mm:ss.fff");
            Price = Price / 100;
        }


        [PrimaryKey, AutoIncrement]
        public long Id { get; set; }
        [JsonPropertyName("trackingid")]
        public string TrackingID { get; set; }
        [JsonPropertyName("date")]
        public DateTime Date { get; set; }
        [JsonPropertyName("msgtype")]
        public string MsgType { get; set; }
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; }
        [JsonPropertyName("price")]
        public double Price { get; set; }
        public string TimeStamp { get; set; }
    }

    public class SymbolicSocketData
    {
        public SymbolicSocketData() { }
        public SymbolicSocketData(List<string> headers, object[] row)
        {
            TrackingID = long.Parse(row[headers.IndexOf("trackingID")].ToString());
            Date = row[headers.IndexOf("date")].ToString();
            MsgType = row[headers.IndexOf("msgType")].ToString();
            Symbol = row[headers.IndexOf("symbol")].ToString();
            Price = decimal.Parse(row[headers.IndexOf("price")].ToString());


            var dt = DateTime.ParseExact(Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            dt = dt.AddMilliseconds(TrackingID / 1000000);
            TimeStamp = dt.ToString("yyyy-MM-ddTHH:mm:ss.fff");
            //2024-06-18T09:30:00.000
        }
        [PrimaryKey, AutoIncrement]
        public long Id { get; set; }
        public long TrackingID { get; set; }

        public string Date { get; set; }
        public string MsgType { get; set; }
        public string Symbol { get; set; }
        public decimal Price { get; set; }
        public string TimeStamp { get; set; }
    }
}
