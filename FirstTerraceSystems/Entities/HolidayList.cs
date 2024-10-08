using System.Text.Json.Serialization;
//Created by Maulik Shah/IPath
namespace FirstTerraceSystems.Entities
{
    public class HolidayList
    {
        [JsonPropertyName("year")]
        public int year { get; set; }
        [JsonPropertyName("holiday_name")]
        public string? holiday_name { get; set; }

        [JsonPropertyName("date")]
        public string? date { get; set; }

        [JsonPropertyName("date_time")]
        public string? date_time { get; set; }
    }
}
