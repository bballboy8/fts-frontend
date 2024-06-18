using SQLite;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
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
        public object Headers { get; set; }
        [JsonPropertyName("data")]
        public object[][] Data { get; set; }
    }

    public class NasdaqSymbolicData
    {

        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        public string Data { get; set; }
    }

    public class SymbolicData
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }
        [JsonPropertyName("trackingID")]
        public string Tracking { get; set; }
        [JsonPropertyName("date")]
        public DateTime Date { get; set; }
        [JsonPropertyName("msgType")]
        public string Type { get; set; }
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; }
        [JsonPropertyName("price")]
        public double Price { get; set; }
    }
}
