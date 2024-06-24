using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Models
{
    public class NasdaqResponse
    {
        [JsonPropertyName("headers")]
        public List<string> Headers { get; set; } = [];
        [JsonPropertyName("data")]
        public object[][] Data { get; set; } = [];
    }
}
