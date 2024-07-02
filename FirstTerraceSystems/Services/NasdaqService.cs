using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FirstTerraceSystems.Services
{
    public class NasdaqService
    {
        private readonly HttpClient _client;

        public NasdaqService(HttpClient client)
        {
            _client = client;
        }

        //NasdaqMarketFeed
        public async Task<List<SymbolicData>?> NasdaqGetDataAsync(DateTime startDatetime, string symbol)
        {
            string jsonData = System.Text.Json.JsonSerializer.Serialize(new { start_datetime = startDatetime.ToString("yyyy-MM-ddTHH:ss"), symbol = symbol });
            HttpRequestMessage request = new(HttpMethod.Post, "/nasdaq/get_data")
            {
                Content = new StringContent(jsonData, Encoding.UTF8, "application/json")
            };
            try
            {

                HttpResponseMessage response = await _client.SendAsync(request);

                response.EnsureSuccessStatusCode();

                using (Stream responseStream = await response.Content.ReadAsStreamAsync())
                {
                    var serializer = new Newtonsoft.Json.JsonSerializer();
                    using var streamReader = new StreamReader(responseStream);
                    using var textReader = new JsonTextReader(streamReader);
                    return serializer.Deserialize<List<SymbolicData>>(textReader);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public async Task<IEnumerable<NasdaqTicker>?> NasdaqGetTickersAsync()
        {
            HttpRequestMessage request = new(HttpMethod.Get, "/nasdaq/get_tickers");
            try
            {
                HttpResponseMessage response = await _client.SendAsync(request);

                response.EnsureSuccessStatusCode();

                var serializer = new Newtonsoft.Json.JsonSerializer();

                using (Stream responseStream = await response.Content.ReadAsStreamAsync())
                {
                    using var streamReader = new StreamReader(responseStream);
                    using var textReader = new JsonTextReader(streamReader);
                    return serializer.Deserialize<IEnumerable<NasdaqTicker>>(textReader);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }
    }
}
