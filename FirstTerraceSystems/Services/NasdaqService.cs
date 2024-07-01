using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
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
        public async Task<IEnumerable<SymbolicData>?> NasdaqGetDataAsync(DateTime startDatetime, string symbol)
        {
            string jsonData = JsonSerializer.Serialize(new { start_datetime = startDatetime.ToString("yyyy-MM-ddTHH:ss"), symbol = symbol });
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
                    return await JsonSerializer.DeserializeAsync<IEnumerable<SymbolicData>>(responseStream);
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

                using (Stream responseStream = await response.Content.ReadAsStreamAsync())
                {
                    return await JsonSerializer.DeserializeAsync<IEnumerable<NasdaqTicker>>(responseStream, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
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
